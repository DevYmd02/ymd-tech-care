import api, { USE_MOCK } from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import type { POListParams, POListResponse, POListItem } from '@/modules/procurement/types';
import { CreatePOSchema, type POStatus } from '@/modules/procurement/schemas/po-schemas';
import type { CreatePOPayload } from '@/modules/procurement/types';
import { logger } from '@/shared/utils';
import { sanitizePayload, cleanPayload } from '@/shared/utils/payload.utils';
import { masterDataCache } from '@/shared/utils/master-data-cache';
import { 
    normalizeId, 
    normalizeDate
} from '@/shared/utils/data-mapping.utils';
import type { SuccessResponse } from '@/shared/types/api.types';
import { applyClientFilters, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { PRService } from './pr.service';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { QCService } from './qc.service';
import type { PRWaitingForQC } from '@/modules/procurement/types/pr-types';

/**
 * Helper: Status Normalization
 * Standardizes backend status variations to canonical frontend POStatus union.
 */
const normalizePOStatus = (status?: string): POStatus => {
    if (!status) return 'DRAFT';
    const s = status.toUpperCase();
    
    // Core Mapping Logic: Ensure all 'Waiting' or 'Pending' variations match UI label 'รออนุมัติ'
    if (
        s === 'PENDING' || 
        s === 'PENDING_APPROVAL' || 
        s === 'WAITING' || 
        s === 'WAITING_FOR_APPROVE' ||
        s === 'WAITING_APPROVAL' ||
        s === 'WAITING_FOR_APPROVAL' ||
        (s.includes('APPROV') && !s.includes('ED')) ||
        s.startsWith('PENDING_')
    ) {
        return 'PENDING_APPROVAL';
    }
    
    if (s === 'APPROVED') return 'APPROVED';
    if (s === 'REJECTED') return 'REJECTED';
    if (s === 'ISSUED') return 'ISSUED';
    if (s === 'COMPLETED') return 'COMPLETED';
    if (s === 'CANCELLED') return 'CANCELLED';
    
    return (status as POStatus) || 'DRAFT';
};

const ENDPOINTS = {
    list:     '/po',
    detail:   (id: number) => `/po/${id}`,
    create:   '/po',
    issue:    (id: number) => `/po/${id}/issue`,
    approve:  (id: number) => `/po/${id}/approve`,
    reject:   (id: number) => `/po/${id}/reject`,
    complete: (id: number) => `/po/${id}/complete`,
    pending:  (id: number) => `/po/${id}/pending`,
    waitingForQC: '/po/pr/waiting-for-qc',
};

/**
 * Whitelist for PO Header fields (DTO)
 */
const KNOWN_DTO_FIELDS = [
    'po_no', 'po_date', 'vendor_id', 'branch_id', 'status', 'remarks',
    'tax_code_id', 'currency_code', 'exchange_rate',
    'pr_id', 'qc_id', 'poa_no', 'po_lines',
    'base_currency_code', 'quote_currency_code', 'exchange_rate_date',
    'created_at', 'created_by', 'discount_expression', 'warehouse_id',
    'qc_no', 'pr_no', 'vendor_name'
];

/**
 * Whitelist for PO Line fields
 */
const KNOWN_LINE_DTO_FIELDS = [
    'po_line_id', 'item_id', 'qty', 'unit_price', 'uom_id',
    'discount_expression', 'note', 'pr_line_id', 'rfq_line_id',
    'line_no', 'status', 'required_receipt_type', 'description'
];

export const POService = {
    /**
     * Fetch PO List with full data hydration (Vendors, PRs, QCs).
     * Applies normalization layer for status consistency.
     */
    getList: async (params?: POListParams, config?: AxiosRequestConfig): Promise<POListResponse> => {
        logger.info('[POService] Fetching PO List', params);

        // 🎯 SEARCH WINDOW OPTIMIZATION (Hybrid Fallback)
        // If we are filtering by fields the backend might not consistently support,
        // we fetch a larger dataset (500 items) to ensure client-side filtering is effective.
        const apiParams = { ...(params || {}) };
        const needsHybridFallback = !!(params?.po_no || params?.vendor_name || params?.status || params?.date_from || params?.date_to || params?.poa_no || params?.pr_no);

        if (needsHybridFallback && !USE_MOCK) {
            logger.debug('🚀 [POService] Hybrid Fallback Triggered: Increasing search window to 500 items.');
            apiParams.limit = 500;
            apiParams.page = 1;
            
            // Map our canonical frontend status to what the backend expects for the API call
            if (apiParams.status === 'PENDING_APPROVAL') {
                (apiParams as unknown as Record<string, unknown>).status = 'PENDING';
            }
            
            // Strip other client-only filters
            delete apiParams.po_no;
            delete apiParams.vendor_name;
            delete apiParams.date_from;
            delete apiParams.date_to;
        }

        const response = await api.get<POListResponse>(ENDPOINTS.list, { ...config, params: apiParams });
        const rawItems = extractArrayFromResponse<POListItem>(response);
        
        logger.debug(`[POService] RAW BACKEND RESULT: total=${response.total}, items_returned=${rawItems.length}, api_status_used="${(apiParams as unknown as Record<string, unknown>).status || 'NONE'}"`);

        // 1. Hydrate Vendors
        const vendorMap: Record<number, string> = {};
        try {
            const vendorsRes = await VendorService.getList(config);
            const vendors = Array.isArray(vendorsRes) ? vendorsRes : vendorsRes.items || [];
            vendors.forEach((v) => {
                const vendorObj = v as unknown as Record<string, unknown>;
                const id = Number(vendorObj.vendor_id || vendorObj.id);
                const name = String(vendorObj.vendor_name || '');
                if (id && name) vendorMap[id] = name;
            });
        } catch (err) {
            logger.debug('[POService] Vendor hydration error', err);
        }

        // 2. Collect unique IDs for hydration
        const prIdsToFetch = new Set<number>();
        const qcIdsToFetch = new Set<number>();
        const prMap: Record<number, string> = {};
        const qcMap: Record<number, string> = {};

        rawItems.forEach(item => {
            if (item.pr_id && !item.pr_no) prIdsToFetch.add(item.pr_id);
            const qcId = item.qc_id || (item as unknown as Record<string, unknown>).qc_header_id as number | undefined;
            if (qcId && !item.qc_no) qcIdsToFetch.add(qcId);
        });

        // 3. Hydrate PRs and QCs in parallel (once per unique ID)
        await Promise.all([
            // Hydrate PRs
            ...Array.from(prIdsToFetch).map(async (id) => {
                try {
                    const pr = await PRService.getDetail(id, config);
                    if (pr?.pr_no) prMap[id] = pr.pr_no;
                } catch { /* ignore */ }
            })
            // ❌ Removed QCService.getById fetch to prevent 404 errors as endpoint is missing
        ]);

        // 4. Final Mapping with Backup QC Lookup
        const allItems = await Promise.all(rawItems.map(async (item) => {
            const bName = masterDataCache.getBranchName(item.branch_id);
            let qcNo = item.qc_no || (item.qc_id || (item as unknown as Record<string, unknown>).qc_header_id ? qcMap[item.qc_id || (item as unknown as Record<string, unknown>).qc_header_id as number] : undefined);
            
            // 🔎 Triple-Scan Backup: If still no QC No, try fetching via PR No
            const prNo = item.pr_no || (item.pr_id ? prMap[item.pr_id] : undefined);
            if (!qcNo && prNo) {
                try {
                    const qcsRes = await QCService.getList({ pr_no: prNo }, config);
                    const qcs = extractArrayFromResponse<Record<string, unknown>>(qcsRes);
                    if (qcs.length > 0) qcNo = qcs[0].qc_no as string;
                } catch { /* ignore */ }
            }

            const mappedItem = {
                ...item,
                po_id: Number(normalizeId(item.po_id ?? (item as unknown as Record<string, unknown>).po_header_id)),
                vendor_name: item.vendor_name || vendorMap[item.vendor_id] || undefined,
                status: normalizePOStatus(item.status),
                pr_no: prNo,
                qc_no: qcNo,
                po_date: normalizeDate(item.po_date),
                branch_name: (typeof bName === 'string' ? bName : '') as string
            };
            return mappedItem;
        }));

        // Client-side Filtering & Pagination Layer
        // We apply this for both Mock and Live data to ensure UI consistency 
        // especially when the backend may have different search/pagination behaviors.
        const result = applyClientFilters<POListItem>(allItems, params as unknown as Record<string, string | number | boolean | undefined | null>, {
            searchableFields: ['po_no', 'vendor_name', 'qc_no', 'pr_no', 'poa_no'],
            dateField: 'po_date',
            backendTotal: response.total ?? allItems.length,
            exactMatchFields: ['status']
        });

        // If not in Mock mode, we still trust the backend's total count if it's much larger than our items
        // but if we have filtering active, we use the client-side filtered count.
        const isFiltering = !!(params?.po_no || params?.vendor_name || params?.status || params?.date_from || params?.date_to);
        const total = isFiltering ? result.total : (response.total ?? allItems.length);
        
        return {
            ...result,
            total,
            totalPages: Math.ceil(total / (params?.limit ?? 20))
        };
    },

    getById: async (id: number, config?: AxiosRequestConfig): Promise<POListItem> => {
        logger.info(`[POService] Fetching PO Detail: ${id}`);
        const res = await api.get<POListItem>(ENDPOINTS.detail(id), config);
        const bName = masterDataCache.getBranchName(res.branch_id);
        const eName = masterDataCache.getEmployeeName(res.created_by);
        const mappedItem = {
            ...res,
            po_id: res.po_id ?? (res as unknown as { po_header_id?: number }).po_header_id as number,
            status: normalizePOStatus(res.status),
            branch_name: (typeof bName === 'string' ? bName : '') as string,
            created_by_name: (res.created_by_name || (typeof eName === 'string' ? eName : '') || '') as string,
            exchange_rate: Number((res as unknown as Record<string, unknown>).exchange_rate || (res as unknown as Record<string, unknown>).exchangeRate || (res as unknown as Record<string, unknown>).quote_currency_rate || 1),
            quote_currency_code: String((res as unknown as Record<string, unknown>).quote_currency_code || res.currency_code || (res as unknown as Record<string, unknown>).quoteCurrencyCode || (res as unknown as Record<string, unknown>).currencyCode || 'THB'),
            base_currency_code: String((res as unknown as Record<string, unknown>).base_currency_code || (res as unknown as Record<string, unknown>).target_currency || (res as unknown as Record<string, unknown>).baseCurrencyCode || (res as unknown as Record<string, unknown>).targetCurrency || 'THB'),
        };

        if (mappedItem.vendor_id && !mappedItem.vendor_name) {
            try {
                const vendorRes = await VendorService.getById(mappedItem.vendor_id, config);
                if (vendorRes?.vendor_name) mappedItem.vendor_name = vendorRes.vendor_name;
            } catch (error) {
                logger.error('[POService] Vendor hydration failed', error);
            }
        }

        if (mappedItem.pr_id) {
            const itemWithDelivery = mappedItem as unknown as { delivery_date?: string };
            try {
                const prDetail = await PRService.getDetail(mappedItem.pr_id, config);
                if (prDetail?.pr_no && !mappedItem.pr_no) mappedItem.pr_no = prDetail.pr_no;
                if (!itemWithDelivery.delivery_date && prDetail?.delivery_date) {
                    itemWithDelivery.delivery_date = prDetail.delivery_date;
                }
                // Hydrate missing payment terms and tax codes from PR
                const pr = prDetail as unknown as Record<string, unknown>;
                if (!mappedItem.payment_term_days && (pr['payment_term_days'] || pr['credit_days'])) {
                    mappedItem.payment_term_days = Number(pr['payment_term_days'] || pr['credit_days']);
                }
                if (!mappedItem.tax_code_id && (pr['tax_code_id'] || pr['pr_tax_code_id'])) {
                    mappedItem.tax_code_id = Number(pr['tax_code_id'] || pr['pr_tax_code_id']);
                }
            } catch (error) {
                logger.error('[POService] PR hydration failed', error);
            }
        }

        // ❌ Removed QCService.getById fetch to prevent 404 errors
        // Will rely on backup lookup below if needed

        // Backup QC lookup (if po record missing qc_id but has pr_no)
        if (!mappedItem.qc_no && mappedItem.pr_no) {
            try {
                const qcsRes = await QCService.getList({ pr_no: mappedItem.pr_no }, config);
                let qcs: Record<string, unknown>[] = [];
                
                if (Array.isArray(qcsRes)) {
                    qcs = qcsRes as Record<string, unknown>[];
                } else {
                    const qcsResObj = qcsRes as unknown as Record<string, unknown>;
                    if (qcsResObj && 'data' in qcsResObj && Array.isArray(qcsResObj.data)) {
                        qcs = qcsResObj.data as Record<string, unknown>[];
                    }
                }

                if (qcs.length > 0) {
                    // Try to find a completed/draft one, otherwise take the first available
                    const activeQc = qcs.find((q: Record<string, unknown>) => q.status === 'COMPLETED') || 
                                     qcs.find((q: Record<string, unknown>) => q.status === 'DRAFT') ||
                                     qcs[0];
                    if (activeQc?.qc_no) {
                        mappedItem.qc_no = activeQc.qc_no as string;
                        if (!mappedItem.qc_id && (activeQc.qc_id || activeQc.qc_header_id || activeQc.id)) {
                            mappedItem.qc_id = Number(activeQc.qc_id || activeQc.qc_header_id || activeQc.id);
                        }
                        const vqId = activeQc.winning_vq_id || activeQc.vq_header_id || activeQc.winning_vq_header_id;
                        if (vqId && !mappedItem.winning_vq_id) mappedItem.winning_vq_id = Number(vqId);
                    }
                }
            } catch (err) {
                logger.debug(`[POService] Backup QC lookup failed for PR ${mappedItem.pr_no}`, err);
            }
        }

        const itemWithLines = mappedItem as unknown as { poLines?: unknown[]; po_lines?: unknown[] };
        const linesKey = itemWithLines.poLines ? 'poLines' : 'po_lines';
        const lines = itemWithLines[linesKey];

        if (lines && Array.isArray(lines)) {
            itemWithLines[linesKey] = await Promise.all(
                lines.map(async (line: unknown) => {
                    const l = line as Record<string, unknown>;
                    // Robust check: hydrate if item_id is present and any core metadata is missing or a placeholder
                    const needsHydration = l.item_id && (
                        !l.item_code || l.item_code === '-' || 
                        !l.item_name || l.item_name === '-' || 
                        !l.unit_name || l.unit_name === '-'
                    );
                    
                    if (needsHydration) {
                        try {
                            const item = await ItemMasterService.getById(Number(l.item_id), config);
                            if (item) {
                                return {
                                    ...l,
                                    item_code: item.item_code || (l.item_code !== '-' ? l.item_code : ''),
                                    item_name: item.item_name || (l.item_name !== '-' ? l.item_name : ''),
                                    unit_name: item.unit_name || (l.unit_name !== '-' ? l.unit_name : ''),
                                };
                            }
                        } catch (e) {
                            logger.error(`[POService] Failed to hydrate item ${l.item_id}`, e);
                        }
                    }
                    return l;
                })
            );
            // 🎯 STANDARDIZATION: Ensure po_lines is the canonical key for all downstream consumers
            mappedItem.po_lines = itemWithLines[linesKey] as import('@/modules/procurement/types').POLine[];
        }

        return mappedItem;
    },

    /**
     * Helper to sanitize data using whitelist
     */
    sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
        if (Array.isArray(data.po_lines)) {
            data.po_lines = data.po_lines.map(line => 
                sanitizePayload(line, KNOWN_LINE_DTO_FIELDS)
            );
        }
        return cleanPayload(sanitizePayload(data, KNOWN_DTO_FIELDS)) as Record<string, unknown>;
    },

    create: async (data: CreatePOPayload): Promise<POListItem> => {
        logger.info('[POService] Creating PO');
        CreatePOSchema.parse(data);
        const sanitized = POService.sanitizeData(data as unknown as Record<string, unknown>);
        return await api.post<POListItem>(ENDPOINTS.create, sanitized);
    },

    update: async (id: number, data: Partial<CreatePOPayload>): Promise<POListItem> => {
        logger.info(`[POService] Updating PO: ${id}`);
        const sanitized = POService.sanitizeData(data as unknown as Record<string, unknown>);
        return await api.patch<POListItem>(ENDPOINTS.detail(id), sanitized);
    },

    issue: async (id: number, remark?: string): Promise<SuccessResponse> => {
        logger.info(`[POService] Issuing PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.issue(id), { remark });
    },

    submit: async (id: number): Promise<SuccessResponse> => {
        logger.info(`[POService] Submitting PO: ${id}`);
        return await api.patch<SuccessResponse>(ENDPOINTS.pending(id), {});
    },

    approve: async (id: number): Promise<SuccessResponse> => {
        logger.info(`[POService] Approving PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.approve(id), {});
    },

    reject: async (id: number, remark?: string): Promise<SuccessResponse> => {
        logger.info(`[POService] Rejecting PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.reject(id), { remark });
    },

    complete: async (id: number): Promise<SuccessResponse> => {
        logger.info(`[POService] Completing PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.complete(id));
    },

    getWaitingForQC: async (params?: { q?: string }, config?: AxiosRequestConfig): Promise<PRWaitingForQC[]> => {
        return await api.get<PRWaitingForQC[]>(ENDPOINTS.waitingForQC, { ...config, params });
    },
};
