import api from '@/core/api/api';
import { USE_MOCK } from '@/core/api/api';
import type { POListParams, POListResponse, POListItem } from '@/modules/procurement/types';
import { CreatePOSchema } from '@/modules/procurement/schemas/po-schemas';
import type { CreatePOPayload } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { PRService } from './pr.service';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { QCService } from './qc.service';

// ---------------------------------------------------------------------------
// NOTE on Zod Boundary Design (per Architect's guidance):
//   • Request  side: CreatePOSchema.parse(data) — throws ZodError before the
//     HTTP call if the payload is malformed. Prevents dirty data reaching API.
//   • Response side: safeParse() used as a WARNING LOGGER ONLY.
//     The original typed return value is always returned unchanged so that UI
//     components receive exactly the shape they TypeScript-expect.
// ---------------------------------------------------------------------------

const ENDPOINTS = {
    list:     '/po',
    detail:   (id: number) => `/po/${id}`,
    create:   '/po',
    issue:    (id: number) => `/po/${id}/issue`,
    approve:  (id: number) => `/po/${id}/approve`,
    reject:   (id: number) => `/po/${id}/reject`,
    complete: (id: number) => `/po/${id}/complete`,
    pending:  (id: number) => `/po/${id}/pending`,
};

export const POService = {
    getList: async (params?: POListParams): Promise<POListResponse> => {
        logger.info('[POService] Fetching PO List', params);
        const response = await api.get<POListResponse>(ENDPOINTS.list, { params });

        // 🎯 DATA NORMALIZATION: Guarantee po_id is set inside mapped UI item
        const rawItems = extractArrayFromResponse<POListItem>(response);

        // 1. Hydrate Vendors (Batch All)
        const vendorMap: Record<number, string> = {};
        try {
            const vendorsRes = await VendorService.getList();
            const vendors = Array.isArray(vendorsRes) ? vendorsRes : vendorsRes.items || [];
            vendors.forEach((v) => {
                const vendorObj = v as Record<string, unknown>;
                const id = (vendorObj.vendor_id || vendorObj.id) as number;
                const name = vendorObj.vendor_name as string;
                if (id && name) vendorMap[id] = name;
            });
        } catch (err) {
            logger.debug('[POService] Vendor hydration error', err);
        }

        // 2. Hydrate PRs and QCs (Async Batch Page Items)
        const allItems = await Promise.all(rawItems.map(async (item) => {
            const mappedItem = {
                ...item,
                po_id: item.po_id ?? (item as unknown as { po_header_id?: number }).po_header_id as number,
                vendor_name: item.vendor_name || vendorMap[item.vendor_id] || undefined
            };

            // Inflate pr_no
            if (mappedItem.pr_id && !mappedItem.pr_no) {
                try {
                    const pr = await PRService.getDetail(mappedItem.pr_id);
                    if (pr?.pr_no) mappedItem.pr_no = pr.pr_no;
                } catch (err) {
                    logger.debug(`[POService] Failed to inflate pr_no for PR ${mappedItem.pr_id}`, err);
                }
            }

            // Inflate qc_no
            const qcId = mappedItem.qc_id || (mappedItem as Record<string, unknown>).qc_header_id as number | undefined;
            if (qcId && !mappedItem.qc_no) {
                try {
                    const qc = await QCService.getById(qcId);
                    if (qc?.qc_no) mappedItem.qc_no = qc.qc_no;
                } catch (err) {
                    logger.debug(`[POService] Failed to inflate qc_no for QC ${qcId}`, err);
                }
            }

            // 🌟 BACKUP LOOKUP: Deduce qc_no using inflated pr_no
            if (!mappedItem.qc_no && mappedItem.pr_no) {
                try {
                    const qcsRes = await QCService.getList({ pr_no: mappedItem.pr_no });
                    let qcs: import('@/modules/procurement/schemas/qc-schemas').QCListItem[] = [];
                    
                    if (Array.isArray(qcsRes)) {
                        qcs = qcsRes;
                    } else {
                        const qcsResObj = qcsRes as unknown as Record<string, unknown>;
                        if (qcsResObj && 'data' in qcsResObj && Array.isArray(qcsResObj.data)) {
                            qcs = qcsResObj.data as import('@/modules/procurement/schemas/qc-schemas').QCListItem[];
                        }
                    }

                    const approvedQc = qcs.find((q) => q.status === 'COMPLETED');
                    if (approvedQc?.qc_no) {
                        mappedItem.qc_no = approvedQc.qc_no;
                        if (approvedQc.qc_id) mappedItem.qc_id = approvedQc.qc_id;
                    }
                } catch (err) {
                    logger.debug(`[POService] Backup QC lookup failed for PR ${mappedItem.pr_no}`, err);
                }
            }

            return mappedItem;
        }));

        // ⚡ PHASE 2: Server-Side Pagination & Filtering (Real API)
        if (!USE_MOCK) {
            const responseObj = response as unknown as Record<string, unknown>;
            const total = typeof responseObj?.total === 'number' ? responseObj.total : allItems.length;
            return {
                ...response,
                total: total,
                page: typeof responseObj?.page === 'number' ? responseObj.page : (params?.page ?? 1),
                limit: typeof responseObj?.limit === 'number' ? responseObj.limit : (params?.limit ?? 20),
                totalPages: typeof responseObj?.totalPages === 'number' ? responseObj.totalPages : Math.ceil(total / (params?.limit ?? 20)),
                data: allItems
            };
        }

        // 🎯 HYBRID FALLBACK: Apply Client-Side Filtering when using Mock Data
        if (params) {
            const filterParams: Record<string, string | number | boolean | undefined | null> = {};
            if (params.po_no) filterParams.po_no = params.po_no;
            if (params.pr_no) filterParams.pr_no = params.pr_no;
            if (params.vendor_name) filterParams.vendor_name = params.vendor_name;
            if (params.status && params.status !== 'ALL') filterParams.status = params.status;
            if (params.date_from) filterParams.date_from = params.date_from;
            if (params.date_to) filterParams.date_to = params.date_to;
            if (params.page) filterParams.page = params.page;
            if (params.limit) filterParams.limit = params.limit;
            if (params.sort) filterParams.sort = params.sort;

            return applyClientFilters<POListItem>(allItems, filterParams, {
                searchableFields: ['po_no', 'vendor_name', 'qc_no', 'pr_no'],
                dateField: 'po_date',
                backendTotal: response.total
            });
        }

        const page = 1;
        const limit = 20;
        return applyClientPagination<POListItem>(allItems, page, limit, response.total);
    },

    getById: async (id: number): Promise<POListItem> => {
        logger.info(`[POService] Fetching PO Detail: ${id}`);
        const res = await api.get<POListItem>(ENDPOINTS.detail(id));
        const mappedItem = {
            ...res,
            po_id: res.po_id ?? (res as unknown as { po_header_id?: number }).po_header_id as number
        };

        // 1. Hydrate Vendor Name
        if (mappedItem.vendor_id && !mappedItem.vendor_name) {
            try {
                const vendorRes = await VendorService.getById(mappedItem.vendor_id);
                if (vendorRes?.vendor_name) {
                    mappedItem.vendor_name = vendorRes.vendor_name;
                }
            } catch (error) {
                logger.error('[POService] Hydrate Vendor failed during getById:', error);
            }
        }

        // 2. Hydrate PR Reference (and delivery_date)
        if (mappedItem.pr_id) {
            try {
                const prDetail = await PRService.getDetail(mappedItem.pr_id);
                if (prDetail?.pr_no && !mappedItem.pr_no) {
                    mappedItem.pr_no = prDetail.pr_no;
                }
                // 📅 Fallback delivery_date from PR if PO is missing it
                if (!(mappedItem as any).delivery_date && prDetail?.delivery_date) {
                    (mappedItem as any).delivery_date = prDetail.delivery_date;
                }
            } catch (error) {
                logger.error('[POService] Hydrate PR failed during getById:', error);
            }
        }

        // 3. Hydrate QC Reference (If qc_id/qc_header_id exists)
        const qcId = mappedItem.qc_id || (mappedItem as any).qc_header_id as number | undefined;
        if (qcId && !mappedItem.qc_no) {
            try {
                const qcDetail = await QCService.getById(qcId);
                if (qcDetail?.qc_no) {
                    mappedItem.qc_no = qcDetail.qc_no;
                }
            } catch (error) {
                logger.error('[POService] Hydrate QC failed during getById:', error);
            }
        }

        // 4. Backup QC lookup using pr_no (Backup relationship chain)
        if (!mappedItem.qc_no && mappedItem.pr_no) {
            try {
                const qcsRes = await QCService.getList({ pr_no: mappedItem.pr_no });
                let qcs: any[] = [];
                if (Array.isArray(qcsRes)) {
                    qcs = qcsRes;
                } else if (qcsRes && typeof qcsRes === 'object' && Array.isArray((qcsRes as any).data)) {
                    qcs = (qcsRes as any).data;
                }
                
                // 🎯 Strictly match by pr_no to ensure correct PO-PR-QC relationship mapping
                const matchingQc = qcs.find((q: any) => q.pr_no === mappedItem.pr_no);
                if (matchingQc?.qc_no) {
                    mappedItem.qc_no = matchingQc.qc_no;
                }
            } catch (error) {
                logger.error('[POService] Backup QC hydration failed during getById:', error);
            }
        }

        // 5. Hydrate Line Items for accurate Item Code/Name display
        const linesKey = (mappedItem as any).poLines ? 'poLines' : 'po_lines';
        const lines = (mappedItem as any)[linesKey];

        if (lines && Array.isArray(lines)) {
            (mappedItem as any)[linesKey] = await Promise.all(
                lines.map(async (line: any) => {
                    if (line.item_id && (!line.item_code || !line.item_name)) {
                        try {
                            const item = await ItemMasterService.getById(line.item_id);
                            if (item) {
                                return {
                                    ...line,
                                    item_code: item.item_code || line.item_code || '',
                                    item_name: item.item_name || line.item_name || '',
                                };
                            }
                        } catch (e) {
                            logger.error(`[POService] Failed to hydrate item ${line.item_id}`, e);
                        }
                    }
                    return line;
                })
            );
        }

        return mappedItem;
    },

    /**
     * Creates a new PO.
     * Validates payload against CreatePOSchema BEFORE sending — throws ZodError
     * on bad input (missing qc_id / vendor_id etc.) so the UI error handler fires.
     * Return type stays `POListItem` exactly as before.
     */
    create: async (data: CreatePOPayload): Promise<POListItem> => {
        logger.info('[POService] Creating PO — validating payload…');
        // 🛡️ Request boundary: throws if required FKs are missing
        CreatePOSchema.parse(data);
        logger.info('[POService] Payload valid — posting to API');
        return await api.post<POListItem>(ENDPOINTS.create, data);
    },

    /** Transition: DRAFT → ISSUED (send PO to vendor) */
    issue: async (id: number, remark?: string): Promise<SuccessResponse> => {
        logger.info(`[POService] Issuing PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.issue(id), { remark });
    },

    /** Transition: DRAFT → PENDING_APPROVAL (send PO for approval) */
    submit: async (id: number): Promise<SuccessResponse> => {
        logger.info(`[POService] Submitting PO: ${id}`);
        // 🎯 GOLD PATTERN: PATCH with EMPTY BODY {}
        return await api.patch<SuccessResponse>(ENDPOINTS.pending(id), {});
    },

    /** Transition: ISSUED → APPROVED (internal approval) */
    approve: async (id: number): Promise<SuccessResponse> => {
        logger.info(`[POService] Approving PO: ${id}`);
        // 🎯 FIX: Send EMPTY BODY {} to avoid 400 Bad Request (consistent with PR module)
        return await api.post<SuccessResponse>(ENDPOINTS.approve(id), {});
    },

    /** Transition: ANY → CANCELLED */
    reject: async (id: number, remark?: string): Promise<SuccessResponse> => {
        logger.info(`[POService] Rejecting/Cancelling PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.reject(id), { remark });
    },

    /** Transition: APPROVED → COMPLETED (goods fully received via GRN) */
    complete: async (id: number): Promise<SuccessResponse> => {
        logger.info(`[POService] Completing PO: ${id}`);
        return await api.post<SuccessResponse>(ENDPOINTS.complete(id));
    },
};
