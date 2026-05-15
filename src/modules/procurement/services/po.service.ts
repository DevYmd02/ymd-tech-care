import api from '@/core/api/api';
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
import { QCService } from './qc.service';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import type { PRWaitingForQC } from '@/modules/procurement/types/pr-types';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';

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
    'line_no', 'status', 'required_receipt_type', 'description',
    'item_code', 'item_name', 'uom_name', 'code'
];

// 🚀 Singleton Cache for QC Data to optimize 100+ concurrent user performance
let qcMapCache: Record<string, string> = {};
let lastQcFetchTime = 0;
const QC_CACHE_TTL = 30 * 1000; // 30 seconds cache for list view consistency

export const POService = {
    /**
     * Fetch PO List with full data hydration (Vendors, PRs, QCs).
     * Applies normalization layer for status consistency.
     */
    getList: async (params?: POListParams, config?: AxiosRequestConfig): Promise<POListResponse> => {
        logger.info('[POService] Fetching PO List', params);

        const apiParams = { ...(params || {}) };
        
        if (apiParams.status === 'PENDING_APPROVAL') {
            (apiParams as unknown as Record<string, unknown>).status = 'PENDING';
        }

        const response = await api.get<POListResponse>(ENDPOINTS.list, { ...config, params: apiParams });
        const rawItems = extractArrayFromResponse<POListItem>(response);
        
        logger.debug(`[POService] RAW BACKEND RESULT: total=${response.total}, items_returned=${rawItems.length}`);

        // 🚀 EFFICIENCY STRATEGY: Optimized for 100+ Concurrent Users
        // 1. Identify missing data that ISN'T already in the list or global cache
        // 🚀 BATCH HYDRATION: Fetch missing Vendor/PR names in parallel efficiently
        // We use the MasterData cache to avoid redundant calls
        const missingVendorIds = Array.from(new Set(
            rawItems
                .map(i => normalizeId(i.vendor_id))
                .filter(id => id && !masterDataCache.getVendorName(id))
        )) as string[];

        const missingPrIds = Array.from(new Set(
            rawItems
                .map(i => normalizeId(i.pr_id))
                .filter(id => id && !masterDataCache.getPRNo(id))
        )) as string[];

        // 🧠 Optimization: If more than 5 vendors are missing, fetch the whole list (it's often faster than 5+ individual calls)
        if (missingVendorIds.length > 5) {
            try {
                const vendorsRes = await VendorService.getList(config);
                (vendorsRes.items || []).forEach(v => {
                    masterDataCache.setVendor(v.vendor_id, v.vendor_name);
                });
                missingVendorIds.length = 0;
            } catch (err) {
                logger.warn('[POService] Failed to batch fetch vendors, falling back to individual calls', err);
            }
        }

        const hasMissingQcNos = rawItems.some(i => !i.qc_no && (i.qc_id || (i as unknown as Record<string, unknown>).qc_id_ref));
        const now = Date.now();
        const shouldFetchQc = hasMissingQcNos && (now - lastQcFetchTime > QC_CACHE_TTL);

        // Parallel execution for missing pieces
        await Promise.all([
            ...missingVendorIds.map(id => 
                VendorService.getById(Number(id), config).then(v => {
                    if (v) masterDataCache.setVendor(v.vendor_id, v.vendor_name);
                })
            ),
            ...missingPrIds.map(id => 
                PRService.getDetail(Number(id), config).then(p => {
                    if (p) masterDataCache.setPR(p.pr_id, p.pr_no);
                })
            ),
            (async () => {
                if (!shouldFetchQc) return;
                try {
                    const qcRes = await api.get<Record<string, unknown>>('/qc/qc-all', { params: { limit: 1000 }, signal: config?.signal });
                    const qcs = extractArrayFromResponse<Record<string, unknown>>(qcRes);
                    
                    const newMap: Record<string, string> = {};
                    qcs.forEach(qc => {
                        const id = String(qc.qc_id || qc.qc_header_id || qc.id || '');
                        const no = String(qc.qc_no || qc.qc_number || '');
                        const prNo = String(qc.pr_no || '').trim().toUpperCase();
                        
                        if (id) newMap[id] = no;
                        if (prNo && prNo !== '-' && prNo !== 'UNDEFINED') newMap[`PR_${prNo}`] = no;
                    });
                    
                    qcMapCache = newMap;
                    lastQcFetchTime = now;
                    logger.debug(`[POService] Refreshed QC Map Cache with ${qcs.length} items`);
                } catch (e) {
                    logger.error('[POService] QC Hydration failed', e);
                }
            })()
        ]);

        // 4. Final Mapping with efficient lookup
        const allItems = rawItems.map((item) => {
            const bName = masterDataCache.getBranchName(item.branch_id);
            const rawItem = item as unknown as Record<string, unknown>;
            const vId = normalizeId(item.vendor_id);
            const prId = normalizeId(item.pr_id || (item as unknown as Record<string, unknown>).pr_id_ref);
            const qcId = normalizeId(item.qc_id || (item as unknown as Record<string, unknown>).qc_id_ref);
            
            // 🎯 Priority: Already in Item -> Global Cache
            const vName = item.vendor_name || masterDataCache.getVendorName(vId) || '';
            const prNoStr = (item.pr_no || masterDataCache.getPRNo(prId) || String(rawItem.pr_no_ref || '')).trim().toUpperCase();
            
            // 🎯 Lookup QC from persistent cache
            const qcNoStr = item.qc_no || qcMapCache[qcId] || qcMapCache[`PR_${prNoStr}`] || String(rawItem.qc_no_ref || '');

            return {
                ...item,
                po_id: Number(normalizeId(item.po_id || item.po_header_id || rawItem.id)),
                po_date: normalizeDate(item.po_date),
                status: normalizePOStatus(item.status),
                branch_name: bName || String(rawItem.branch_name || ''),
                vendor_name: vName,
                pr_no: prNoStr && prNoStr !== '1' ? prNoStr : '',
                qc_no: qcNoStr && qcNoStr !== '1' ? qcNoStr : '',
            } as unknown as POListItem;
        });

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

        // 🎯 [Performance] Optimized Line Hydration (Parallel + Unique IDs)
        const lines = mappedItem.po_lines || (mappedItem as unknown as Record<string, unknown>).poLines;
        if (Array.isArray(lines)) {
            const rawLines = lines as Record<string, unknown>[];
            
            // 1. Extract Unique Item IDs
            const uniqueItemIds = Array.from(new Set(rawLines.map(l => Number(l.item_id)).filter(id => !isNaN(id) && id > 0)));

            // 2. Fetch Item Details in Batch (Optimized for 100+ Concurrent Users)
            // 🚀 SUCCESS: Replaced N+1 parallel calls with a single batched list call
            let itemResults: ItemListItem[] = [];
            if (uniqueItemIds.length > 0) {
                const itemResponse = await ItemMasterService.getAll({ 
                    ids: uniqueItemIds.join(','), 
                    limit: uniqueItemIds.length 
                }, config);
                itemResults = itemResponse.items || [];
            }
            
            // 3. Create Lookup Map
            const itemLookup = new Map(itemResults.map(item => [Number(item.item_id), item]));

            // 4. Map Lines efficiently
            mappedItem.po_lines = rawLines.map((l) => {
                const itemObj = (l.item || {}) as Record<string, unknown>;
                const lineObj = l as unknown as Record<string, unknown>;
                const itemId = Number(l.item_id || lineObj.product_id || itemObj.item_id || itemObj.product_id || itemObj.id || 0);
                const item = itemId ? itemLookup.get(itemId) : null;
                
                const rawItemCode = String(
                    l.item_code || lineObj.itemCode || lineObj.code || 
                    itemObj.item_code || itemObj.itemCode || itemObj.code || 
                    lineObj.sku || lineObj.part_no || ''
                ).trim();

                // 🚀 EXHAUSTIVE NAME DETECTION
                const rawItemName = String(
                    l.item_name || 
                    lineObj.itemName ||
                    lineObj.name ||
                    itemObj.item_name || 
                    itemObj.itemName ||
                    itemObj.name || 
                    l.description || 
                    l.remark || 
                    lineObj.item_id_name ||
                    ''
                ).trim();

                const finalItemCode = (rawItemCode === '-' || rawItemCode === 'undefined' || rawItemCode === 'null' || !rawItemCode) ? '' : rawItemCode;
                const finalItemName = (rawItemName === '-' || rawItemName === 'undefined' || rawItemName === 'null' || !rawItemName) ? '' : rawItemName;

                if (item) {
                    return {
                        ...l,
                        item_id: itemId,
                        item_code: item.item_code || finalItemCode || (item as unknown as Record<string, unknown>).code as string || (itemId > 0 ? `ID: ${itemId}` : ''),
                        item_name: item.item_name || finalItemName || (item as unknown as Record<string, unknown>).name as string || '',
                        uom_name: item.uom_name || String(lineObj.uom_name || ''),
                    };
                }
                
                return {
                    ...l,
                    item_id: itemId,
                    item_code: finalItemCode || (itemId > 0 ? `ID: ${itemId}` : ''),
                    item_name: finalItemName,
                };
            }) as unknown as import('@/modules/procurement/types').POLine[];
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

    create: async (data: CreatePOPayload, config?: AxiosRequestConfig): Promise<POListItem> => {
        logger.info('[POService] Creating PO');
        CreatePOSchema.parse(data);
        const sanitized = POService.sanitizeData(data as unknown as Record<string, unknown>);
        return await api.post<POListItem>(ENDPOINTS.create, sanitized, config);
    },

    update: async (id: number, data: Partial<CreatePOPayload>, config?: AxiosRequestConfig): Promise<POListItem> => {
        logger.info(`[POService] Updating PO: ${id}`);
        const sanitized = POService.sanitizeData(data as unknown as Record<string, unknown>);
        return await api.patch<POListItem>(ENDPOINTS.detail(id), sanitized, config);
    },

    issue: async (id: number, remark?: string, config?: AxiosRequestConfig): Promise<SuccessResponse> => {
        logger.info(`[POService] Issuing PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.issue(id), { remark }, config);
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

