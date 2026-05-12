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

        // 🎯 SEARCH WINDOW OPTIMIZATION
        const apiParams = { ...(params || {}) };
        const needsHybridFallback = !!(params?.po_no || params?.vendor_name || params?.status || params?.date_from || params?.date_to || params?.poa_no || params?.pr_no);

        if (needsHybridFallback && !USE_MOCK) {
            logger.debug('🚀 [POService] Hybrid Fallback Triggered: Increasing search window to 500 items.');
            apiParams.limit = 500;
            apiParams.page = 1;
            
            if (apiParams.status === 'PENDING_APPROVAL') {
                (apiParams as unknown as Record<string, unknown>).status = 'PENDING';
            }
            
            delete apiParams.po_no;
            delete apiParams.vendor_name;
            delete apiParams.date_from;
            delete apiParams.date_to;
        }

        const response = await api.get<POListResponse>(ENDPOINTS.list, { ...config, params: apiParams });
        const rawItems = extractArrayFromResponse<POListItem>(response);
        
        logger.debug(`[POService] RAW BACKEND RESULT: total=${response.total}, items_returned=${rawItems.length}`);

        // 🚀 BATCH HYDRATION STRATEGY (Issue #2)
        // 1. Collect Unique IDs
        const vendorIds = new Set<number>();
        const prIds = new Set<number>();
        const qcIds = new Set<number>();

        rawItems.forEach(item => {
            if (item.vendor_id) vendorIds.add(item.vendor_id);
            if (item.pr_id && !item.pr_no) prIds.add(item.pr_id);
            const qcId = item.qc_id || (item as unknown as Record<string, unknown>).qc_header_id as number | undefined;
            if (qcId && !item.qc_no) qcIds.add(qcId);
        });

        // 2. Fetch in parallel (only if we have IDs)
        const [vendorsRes, prsRes] = await Promise.all([
            vendorIds.size > 0 ? VendorService.getList({ ...config, params: { ...config?.params, limit: 1000 } }) : Promise.resolve([]),
            prIds.size > 0 ? Promise.all(Array.from(prIds).map(id => PRService.getDetail(id, config).catch(() => null))) : Promise.resolve([])
        ]);

        // 3. Create Lookup Maps
        const vendorMap: Record<number, string> = {};
        const vendors = extractArrayFromResponse<Record<string, unknown>>(vendorsRes);
        vendors.forEach((v) => {
            const id = Number(v.vendor_id || v.id);
            if (id) vendorMap[id] = String(v.vendor_name || '');
        });

        const prMap: Record<number, string> = {};
        const prs = extractArrayFromResponse<Record<string, unknown>>(prsRes);
        prs.forEach(pr => {
            if (pr?.pr_id && pr.pr_no) prMap[Number(pr.pr_id)] = String(pr.pr_no);
        });

        // 4. Final Mapping with efficient lookup
        const allItems = await Promise.all(rawItems.map(async (item) => {
            const bName = masterDataCache.getBranchName(item.branch_id);
            const prNo = item.pr_no || (item.pr_id ? prMap[item.pr_id] : undefined);
            
            // Backup QC Lookup remains item-specific if needed, but we try to minimize it
            let qcNo = item.qc_no;
            if (!qcNo && prNo) {
                try {
                    // This is still a bit heavy, but it only triggers if qc_no is missing
                    const qcsRes = await QCService.getList({ pr_no: prNo }, config);
                    const qcs = extractArrayFromResponse<Record<string, unknown>>(qcsRes);
                    if (qcs.length > 0) qcNo = qcs[0].qc_no as string;
                } catch { /* ignore */ }
            }

            return {
                ...item,
                po_id: Number(normalizeId(item.po_id ?? (item as unknown as Record<string, unknown>).po_header_id)),
                vendor_name: item.vendor_name || vendorMap[item.vendor_id] || undefined,
                status: normalizePOStatus(item.status),
                pr_no: prNo,
                qc_no: qcNo,
                po_date: normalizeDate(item.po_date),
                branch_name: (typeof bName === 'string' ? bName : '') as string
            };
        }));

        const result = applyClientFilters<POListItem>(allItems, params as unknown as Record<string, string | number | boolean | undefined | null>, {
            searchableFields: ['po_no', 'vendor_name', 'qc_no', 'pr_no', 'poa_no'],
            dateField: 'po_date',
            backendTotal: response.total ?? allItems.length,
            exactMatchFields: ['status']
        });

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
            po_id: res.po_id ?? (res as unknown as Record<string, unknown>).po_header_id as number,
            status: normalizePOStatus(res.status),
            branch_name: (typeof bName === 'string' ? bName : '') as string,
            created_by_name: (res.created_by_name || (typeof eName === 'string' ? eName : '') || '') as string,
            exchange_rate: Number((res as unknown as Record<string, unknown>).exchange_rate || (res as unknown as Record<string, unknown>).exchangeRate || (res as unknown as Record<string, unknown>).quote_currency_rate || 1),
            quote_currency_code: String((res as unknown as Record<string, unknown>).quote_currency_code || res.currency_code || (res as unknown as Record<string, unknown>).quoteCurrencyCode || (res as unknown as Record<string, unknown>).currencyCode || 'THB'),
            base_currency_code: String((res as unknown as Record<string, unknown>).base_currency_code || (res as unknown as Record<string, unknown>).target_currency || (res as unknown as Record<string, unknown>).baseCurrencyCode || (res as unknown as Record<string, unknown>).targetCurrency || 'THB'),
        } as POListItem & { delivery_date?: string; winning_vq_id?: number };

        // Efficient Parallel Hydration for Detail
        const hydrationPromises = [];
        
        if (mappedItem.vendor_id && !mappedItem.vendor_name) {
            hydrationPromises.push(
                VendorService.getById(mappedItem.vendor_id, config)
                    .then(v => { if (v?.vendor_name) mappedItem.vendor_name = v.vendor_name; })
                    .catch(e => logger.error('[POService] Vendor hydration failed', e))
            );
        }

        if (mappedItem.pr_id) {
            hydrationPromises.push(
                PRService.getDetail(mappedItem.pr_id, config)
                    .then(prDetail => {
                        if (prDetail?.pr_no && !mappedItem.pr_no) mappedItem.pr_no = prDetail.pr_no;
                        if (!mappedItem.delivery_date && prDetail?.delivery_date) {
                            mappedItem.delivery_date = prDetail.delivery_date;
                        }
                        const pr = prDetail as unknown as Record<string, unknown>;
                        if (!mappedItem.payment_term_days && (pr['payment_term_days'] || pr['credit_days'])) {
                            mappedItem.payment_term_days = Number(pr['payment_term_days'] || pr['credit_days']);
                        }
                        if (!mappedItem.tax_code_id && (pr['tax_code_id'] || pr['pr_tax_code_id'])) {
                            mappedItem.tax_code_id = Number(pr['tax_code_id'] || pr['pr_tax_code_id']);
                        }
                    })
                    .catch(e => logger.error('[POService] PR hydration failed', e))
            );
        }

        await Promise.all(hydrationPromises);

        // Backup QC lookup
        if (!mappedItem.qc_no && mappedItem.pr_no) {
            try {
                const qcsRes = await QCService.getList({ pr_no: mappedItem.pr_no }, config);
                const qcs = extractArrayFromResponse<Record<string, unknown>>(qcsRes);
                if (qcs.length > 0) {
                    const activeQc = qcs.find(q => q.status === 'COMPLETED') || qcs.find(q => q.status === 'DRAFT') || qcs[0];
                    if (activeQc?.qc_no) {
                        mappedItem.qc_no = String(activeQc.qc_no);
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

        // Optimized Line Hydration (Parallel)
        const lines = mappedItem.po_lines || (mappedItem as unknown as Record<string, unknown>).poLines;
        if (Array.isArray(lines)) {
            mappedItem.po_lines = await Promise.all(
                (lines as Record<string, unknown>[]).map(async (l) => {
                    const needsHydration = l.item_id && (!l.item_code || l.item_code === '-' || !l.item_name || l.item_name === '-' || !l.unit_name || l.unit_name === '-');
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
            ) as unknown as import('@/modules/procurement/types').POLine[];
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
