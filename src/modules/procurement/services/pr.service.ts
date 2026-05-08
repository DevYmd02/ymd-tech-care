import api from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import { USE_MOCK } from '@/core/api/api';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { VendorListResponse, VendorListItem } from '@/modules/master-data/vendor/types/vendor-types';
import type { ApprovalListResponse } from '@/modules/procurement/types/av-types';
import { sanitizePayload, cleanPayload } from '@/shared/utils/payload.utils';
import { masterDataCache } from '@/shared/utils/master-data-cache';
import type {
  PRListParams,
  PRListResponse,
  ConvertPRRequest,
  PRHeader,
  PRHeaderExtended,
  CreatePRPayload,
  PRStatus,
  PRLine,
} from '@/modules/procurement/types';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';
import { unwrapResponseData, extractLinesArray } from '@/shared/utils/apiUtils';

export type PRUpdatePayload = Partial<CreatePRPayload> & { status?: PRStatus };

export type { PRListParams, PRListResponse, ConvertPRRequest };
import { logger } from '@/shared/utils';
import type { SuccessResponse } from '@/shared/types/api.types';

const ENDPOINTS = {
  list: '/pr',
  detail: (id: number) => `/pr/${id}`,
  pending: (id: number) => `/pr/${id}/pending`, // 🎯 Restore 'pending' endpoint
  approve: (id: number) => `/pr/${id}/approve`,
  cancel: (id: number) => `/pr/${id}/cancel`,
  reject: (id: number) => `/pr/${id}/reject`,
  convert: (id: number) => `/pr/${id}/convert`,
  attachments: (id: number) => `/pr/${id}/attachments`,
  attachment: (id: number, attachmentId: string) => `/pr/${id}/attachments/${attachmentId}`,
  generateNo: '/pr/generate-no',
};

// ═══════════════════════════════════════════════════════════════════════════════
// Known DTO fields — used for leak detection before sending to backend
// ═══════════════════════════════════════════════════════════════════════════════
const KNOWN_DTO_FIELDS = [
  'pr_no', 'pr_date', 'need_by_date', 'requester_user_id', 'branch_id',
  'project_id', 'cost_center_id', 'preferred_vendor_id',
  'pr_tax_code_id', 'remark', 'status',
  'pr_base_currency_code', 'pr_quote_currency_code',
  'pr_exchange_rate', 'pr_exchange_rate_date',
  'pr_discount_raw', 'payment_term_days', 'credit_days',
  'vendor_quote_no', 'shipping_method', 'lines',
  'requester_name', 'delivery_date',  
  'version'
];

// NOTE: 'remark' is NOT allowed on lines per backend DTO
const KNOWN_LINE_DTO_FIELDS = [
  'pr_line_id', 'id',
  'line', 'item_id', 'qty', 'est_unit_price', 'uom_id',
  'line_discount_raw', 'line_no', 'description', 'warehouse_id',
  'location', 'required_receipt_type'
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 INTERNAL SPEED CACHE (Phase 1 Optimization)
// ═══════════════════════════════════════════════════════════════════════════════
let cachedVendors: VendorListResponse | null = null;
let lastVendorFetchTime = 0;
const VENDOR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// 🎯 AV STATUS CACHE: Cache pr_id → effective status from AV approval records
let cachedAVStatusMap: Map<number, { status: string; av_no?: string }> | null = null;
let lastAVStatusFetchTime = 0;
const AV_STATUS_CACHE_TTL = 30 * 1000; // 30 seconds (shorter TTL to catch recent approvals)

/**
 * Fetches all AV approval records and builds a pr_id → effective status map.
 * PRs that have been processed (PARTIAL/APPROVED/REJECTED) in the AV module
 * will have their status overridden here, since the PR header table may lag
 * behind (e.g., still showing PENDING after a partial approval).
 */
async function buildAVStatusMap(config?: AxiosRequestConfig): Promise<Map<number, { status: string; av_no?: string }>> {
  const now = Date.now();
  if (cachedAVStatusMap && (now - lastAVStatusFetchTime < AV_STATUS_CACHE_TTL)) {
    return cachedAVStatusMap as Map<number, { status: string; av_no?: string }>;
  }
  try {
    const avRes: ApprovalListResponse = await api.get<ApprovalListResponse>('/pr-approval', { ...config, params: { limit: 1000, page: 1 } });
    const tempMap = new Map<number, { status: string; id: number; no?: string }>();
    const records = avRes?.data || [];
    for (const rec of records) {
      const prId = Number(rec.pr_id);
      if (!isNaN(prId) && rec.status) {
        // 🎯 LATEST WINS: If multiple records exist, we keep the one with the highest approval_id
        const existingId = tempMap.get(prId)?.id || 0;
        if (Number(rec.approval_id) >= existingId) {
          tempMap.set(prId, { 
            status: rec.status.toUpperCase(), 
            id: Number(rec.approval_id),
            no: rec.approval_no 
          });
        }
      }
    }
    
    const finalMap = new Map<number, { status: string; av_no?: string }>();
    tempMap.forEach((value, key) => finalMap.set(key, { status: value.status, av_no: value.no }));

    cachedAVStatusMap = finalMap;
    lastAVStatusFetchTime = now;
    logger.debug(`🔍 [PRService] AV Status Map built: ${finalMap.size} entries (prioritized latest IDs)`);
    return finalMap;
  } catch (err) {
    logger.warn('[PRService] Failed to fetch AV status map (non-critical):', err);
    return new Map();
  }
}

/**
 * Force clear the AV status cache (to be called after updates/submissions)
 */
export function clearPRServiceAVCache() {
  cachedAVStatusMap = null;
  lastAVStatusFetchTime = 0;
  logger.debug('🧹 [PRService] AV Status Cache Cleared');
}

/**
 * Overlays the AV-derived status onto an array of PR items.
 * If a PR has an AV record, its status comes from the AV table (PARTIAL/APPROVED/REJECTED).
 * PRs with no AV record keep their original status from the PR header table.
 */
function overlayAVStatus(items: PRHeader[], avStatusMap: Map<number, { status: string; av_no?: string }>): PRHeader[] {
  if (avStatusMap.size === 0) return items;
  return items.map(item => {
    const prId = Number(item.pr_id);
    const avData = !isNaN(prId) ? avStatusMap.get(prId) : undefined;
    
    if (avData) {
      const avStatus = avData.status;
      const avNo = avData.av_no;

      // 🛡️ Always attach AV No if we found it, even if status is same
      const newItem = { ...item };
      if (avNo) newItem.av_no = avNo;

      // 🛡️ Only override status if the current Header status is 'PENDING' (case-insensitive)
      const currentStatus = (item.status || '').toUpperCase();
      if (avStatus && avStatus !== currentStatus) {
        if (currentStatus === 'PENDING') {
          logger.info(`[PRService] 🔄 Syncing PENDING PR ${item.pr_no} status → ${avStatus} (from AV record)`);
          newItem.status = avStatus as PRHeader['status'];
        } else {
          logger.debug(`[PRService] ⏭️ Skipping AV status override for PR ${item.pr_no} (Header is already ${item.status}, skipping AV ${avStatus})`);
        }
      }
      return newItem;
    }
    return item;
  });
}

/**
 * Deduplicates PR items by pr_id to prevent UI key collisions and rendering bugs.
 */
function deduplicatePRs(items: PRHeader[]): PRHeader[] {
    const seen = new Set<number>();
    return items.filter(item => {
        const id = Number(item.pr_id);
        if (isNaN(id) || seen.has(id)) {
            if (!isNaN(id)) logger.warn(`[PRService] 🛑 Removing duplicate PR record: ID=${id}, No=${item.pr_no}`);
            return false;
        }
        seen.add(id);
        return true;
    });
}

export const PRService = {
  clearAVCache: clearPRServiceAVCache,
  getList: async (params?: PRListParams, config?: AxiosRequestConfig): Promise<PRListResponse> => {
    logger.info('[PRService] Fetching PR List', params);

    // 1. Prepare API Params
    const apiParams = { ...params };
    const needsClientFilter = !!(params?.pr_no || params?.vendor_code || params?.vendor_name || params?.status || params?.date_start || params?.date_end || params?.q);

    // 🎯 WORKAROUND: Strip all filterable params before sending to backend when client-side filtering
    // is active. The backend may not support PARTIAL/custom statuses or join-based vendor filtering,
    // so we fetch ALL items from the backend and apply filters client-side to prevent 0-result issues.
    if (needsClientFilter && !USE_MOCK) {
        logger.debug('🚀 [PRService] Hybrid Fallback Triggered: Increasing search window to 500 items.');
        
        // 🎯 SEARCH WINDOW OPTIMIZATION:
        // We fetch a larger chunk (500 items) from the backend starting from page 1,
        // then apply all filters client-side. This ensures we find the records the user
        // is looking for even if they are buried under hundreds of unfiltered items.
        apiParams.limit = 500;
        apiParams.page = 1;

        delete apiParams.vendor_code;
        delete apiParams.vendor_name;
        delete apiParams.status;
        delete apiParams.pr_no;
        delete apiParams.date_start;
        delete apiParams.date_end;
        delete apiParams.q;
    }

    const response = await api.get<PRListResponse>(ENDPOINTS.list, { ...config, params: apiParams });

    // 2. Hydrate Items (Same for BOTH mock and real API)
    const allItems = extractArrayFromResponse<PRHeader>(response as PRListResponse | PRHeader[]);
    
    // Check if hydration or filtering is needed
    if (needsClientFilter || USE_MOCK) {
        const filterParams: Record<string, string | number | boolean | undefined | null> = {};
        if (params?.pr_no) filterParams.pr_no = params.pr_no;
        if (params?.requester_name) filterParams.requester_name = params.requester_name;
        if (params?.status && params.status !== 'ALL') filterParams.status = params.status;
        if (params?.department) filterParams.department = params.department;
        if (params?.cost_center_id) filterParams.cost_center_id = params.cost_center_id;
        if (params?.date_start) filterParams.date_start = params.date_start;
        if (params?.date_end) filterParams.date_end = params.date_end;
        if (params?.page) filterParams.page = params.page;
        if (params?.limit) filterParams.limit = params.limit;
        if (params?.sort) filterParams.sort = params.sort;
        if (params?.q) filterParams.q = params.q;

        // 🎯 1. Client-Side Vendor Hydration for filtering
        let hydratedItems = [...allItems];
        try {
            const now = Date.now();
            if (!cachedVendors || (now - lastVendorFetchTime > VENDOR_CACHE_TTL)) {
                logger.debug('🚀 [PRService] Cache miss for Vendors inside list fetcher, syncing...');
                cachedVendors = await VendorService.getList(config);
                lastVendorFetchTime = now;
            }
            const vendorsRes = cachedVendors;
            const vendorMap: Record<number, { vendor_code?: string; vendor_name?: string }> = {};
            (vendorsRes.items || []).forEach((v: VendorListItem) => {
                const id = v.vendor_id || v.id;
                if (id) {
                    vendorMap[Number(id)] = {
                        vendor_code: v.vendor_code,
                        vendor_name: v.vendor_name
                    };
                }
            });

            hydratedItems = allItems.map(item => {
                const vId = item.preferred_vendor_id || item.vendor_id;
                const vendorFromId = vId ? vendorMap[Number(vId)] : undefined;
                
                const vendorCode = vendorFromId?.vendor_code || item.vendor_quote_no || '';
                let vendorName = vendorFromId?.vendor_name || item.vendor_name || '';

                // Look up by vendorCode if name is missing
                if (!vendorName && vendorCode) {
                    const foundVendor = Object.values(vendorMap).find(v => v.vendor_code === vendorCode);
                    if (foundVendor) {
                        vendorName = foundVendor.vendor_name || '';
                    }
                }

                return {
                    ...item,
                    vendor_code: vendorCode,
                    vendor_name: vendorName,
                    branch_name: (masterDataCache.getBranchName(item.branch_id) || '') as string,
                    requester_name: (item.requester_name || masterDataCache.getEmployeeName(item.requester_user_id) || '') as string
                };
            });

            if (params?.vendor_code) filterParams.vendor_code = params.vendor_code;
            if (params?.vendor_name) filterParams.vendor_name = params.vendor_name;

        } catch (err) {
            logger.error('[PRService] Failed to hydrate vendors for filtering:', err);
        }

        // 🎯 2. AV STATUS HYDRATION: Overlay correct status from AV approval records
        // IMPORTANT: This MUST happen BEFORE filtering to ensure correctly transitioned statuses
        // (like PARTIAL or APPROVED) are properly captured by the filter logic.
        try {
            if (!USE_MOCK) {
                const avStatusMap = await buildAVStatusMap(config);
                hydratedItems = overlayAVStatus(hydratedItems, avStatusMap);
                logger.debug(`🚀 [PRService] AV Status Overlay completed for ${hydratedItems.length} items`);
            }
        } catch (err) {
            logger.warn('[PRService] AV status hydration failed (non-critical):', err);
        }

        // 🎯 3. FINAL DEDUPLICATION & FILTERING
        const uniqueItems = deduplicatePRs(hydratedItems);

        return applyClientFilters<PRHeader>(uniqueItems, filterParams, {
            searchableFields: ['pr_no', 'requester_name', 'purpose'],
            dateField: 'need_by_date',
            backendTotal: response.total,
            exactMatchFields: ['status']
        });
    }

    // ⚡ PHASE 2: Server-Side Pagination & Filtering (Real API)
    if (!USE_MOCK) {
        // 🎯 Deduplicate raw response first
        let hydratedItems = deduplicatePRs(allItems);
        
        try {
            const now = Date.now();
            if (!cachedVendors || (now - lastVendorFetchTime > VENDOR_CACHE_TTL)) {
                cachedVendors = await VendorService.getList(config);
                lastVendorFetchTime = now;
            }
            const vendorsRes = cachedVendors;
            const vendorMap: Record<number, { vendor_code?: string; vendor_name?: string }> = {};
            (vendorsRes.items || []).forEach((v: VendorListItem) => {
                const id = v.vendor_id || v.id;
                if (id) {
                    vendorMap[Number(id)] = {
                        vendor_code: v.vendor_code,
                        vendor_name: v.vendor_name
                    };
                }
            });

            hydratedItems = hydratedItems.map(item => {
                const vId = item.preferred_vendor_id || item.vendor_id;
                const vendorFromId = vId ? vendorMap[Number(vId)] : undefined;
                
                const vendorCode = vendorFromId?.vendor_code || item.vendor_quote_no || '';
                const vendorName = vendorFromId?.vendor_name || item.vendor_name || '';

                return {
                    ...item,
                    vendor_code: vendorCode,
                    vendor_name: vendorName
                };
            });

            // 🎯 AV STATUS HYDRATION: Overlay correct status from AV approval records
            try {
                const avStatusMap = await buildAVStatusMap(config);
                hydratedItems = overlayAVStatus(hydratedItems, avStatusMap);
            } catch (err) {
                logger.warn('[PRService] AV status hydration failed (non-critical):', err);
            }
        } catch (err) {
             logger.debug('Hydration failed during fallback', err);
        }

        return {
            ...response,
            data: hydratedItems
        };
    }

    // 🎯 HYBRID PAGINATION: Always apply client-side slicing even for mock responses
    // This ensures the table only shows items for the current page
    const page = 1;
    const limit = 20;
    const uniqueItems = deduplicatePRs(allItems);
    return applyClientPagination<PRHeader>(uniqueItems, page, limit, response.total);
  },

  getDetail: async (id: number, config?: AxiosRequestConfig): Promise<PRHeaderExtended> => {
    logger.info(`[PRService] Fetching PR Detail: ${id}`);
    const response = await api.get<unknown>(ENDPOINTS.detail(id), config);
    
    // 🎯 Use centralized utilities to handle inconsistent backend shapes
    const data = unwrapResponseData<PRHeaderExtended>(response);
    const lines = extractLinesArray<PRLine>(response);

    // Merge lines into the header object as expected by UI
    let finalResult: PRHeaderExtended = {
        ...data,
        lines: lines.length > 0 ? lines : (data.lines || []),
        branch_name: (masterDataCache.getBranchName(data.branch_id) || '') as string,
        requester_name: (data.requester_name || masterDataCache.getEmployeeName(data.requester_user_id) || '') as string
    };

    logger.debug('[PRService.getDetail] Hydrated: pr_no=', finalResult.pr_no, 'lines=', finalResult.lines?.length ?? 0);


    // 🎯 AV STATUS HYDRATION (Detail): Overlay correct status from AV module
    if (!USE_MOCK) {
        try {
            const avStatusMap = await buildAVStatusMap(config);
            const hydrated = overlayAVStatus([finalResult as unknown as PRHeader], avStatusMap);
            finalResult = hydrated[0] as unknown as PRHeaderExtended;
        } catch (err) {
            logger.warn('[PRService.getDetail] AV status hydration failed:', err);
        }
    }

    return finalResult;
  },

  /**
   * Helper to sanitize data using whitelist
   */
  sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    // Sanitize Lines first
    if (Array.isArray(data.lines)) {
      data.lines = data.lines.map(line => 
        sanitizePayload(line, KNOWN_LINE_DTO_FIELDS)
      );
    }
    
    // Sanitize Header
    return cleanPayload(sanitizePayload(data, KNOWN_DTO_FIELDS)) as Record<string, unknown>;
  },


  create: async (payload: CreatePRPayload): Promise<PRHeader> => {
    // ═══════════════════════════════════════════════════════════════════════
    // 📦 PRService.create — Golden Payload Diagnostic Suite
    // ═══════════════════════════════════════════════════════════════════════
    logger.info('📦 [PRService] Creating PR — Golden Payload');
    logger.debug('🔧 [PRService] WIRE-READY JSON:', JSON.stringify(payload, null, 2));
    
    // ─── FK ID Audit: Log foreign keys with types ────────────────────────
    logger.info('🔑 [PRService] FK ID AUDIT:', {
      requester_user_id: `${payload.requester_user_id} (${typeof payload.requester_user_id})`,
      branch_id: `${payload.branch_id} (${typeof payload.branch_id})`,
      pr_tax_code_id: payload.pr_tax_code_id ? `${payload.pr_tax_code_id} (${typeof payload.pr_tax_code_id})` : '(not sent)',
      project_id: payload.project_id ? `${payload.project_id} (${typeof payload.project_id})` : '(not sent)',
    });
    
    // ─── Field inventory ─────────────────────────────────────────────────
    logger.info('🔎 [PRService] FIELD INVENTORY:', {
      field_count: Object.keys(payload).length,
      fields_sent: Object.keys(payload),
      line_count: payload.lines?.length,
      line_fields: payload.lines?.[0] ? Object.keys(payload.lines[0]) : '(no lines)',
    });

    // ─── Forbidden field leak detector ───────────────────────────────────
    const unknownHeaderFields = Object.keys(payload).filter(k => !KNOWN_DTO_FIELDS.includes(k));
    if (unknownHeaderFields.length > 0) {
      logger.error('🚨 [PRService] PAYLOAD CONTAINS UNKNOWN HEADER FIELDS — will cause 400:', unknownHeaderFields);
    }

    // Check line items for unknown fields too
    if (payload.lines?.[0]) {
      const unknownLineFields = Object.keys(payload.lines[0]).filter(k => !KNOWN_LINE_DTO_FIELDS.includes(k));
      if (unknownLineFields.length > 0) {
        logger.error('🚨 [PRService] LINE ITEMS CONTAIN UNKNOWN FIELDS — will cause 400:', unknownLineFields);
      }
    }
    
    const sanitizedPayload = PRService.sanitizeData(payload as unknown as Record<string, unknown>);
    
    try {
      const response = await api.post<PRHeader>(ENDPOINTS.list, sanitizedPayload);
      logger.info('✅ [PRService] PR Created Successfully!', {
        pr_id: response.pr_id,
        pr_no: response.pr_no,
      });
      clearPRServiceAVCache();
      return response;
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: unknown; status?: number; headers?: unknown } };
      const backendResponse = axiosErr.response?.data;
      const statusCode = axiosErr.response?.status;
      
      // ═══════════════════════════════════════════════════════════════════
      // 🔴 FULL ERROR DIAGNOSTIC — Log BOTH the error AND the payload
      // so we can see exactly what we sent when a 500 occurs.
      // ═══════════════════════════════════════════════════════════════════
      logger.error('💥 [PRService] Backend Rejected PR Creation', {
        statusCode,
        backendResponse,
        fullErrorBody: JSON.stringify(backendResponse, null, 2),
      });

      // On 500: Log the ENTIRE payload we sent so we can diagnose DB-level issues
      if (statusCode === 500 || !statusCode) {
        logger.error('🔴 [PRService] 500 ERROR — Full payload that caused the crash:', {
          sentPayload: JSON.stringify(payload, null, 2),
          payloadFieldTypes: Object.fromEntries(
            Object.entries(payload).map(([k, v]) => [
              k,
              `${typeof v}${Array.isArray(v) ? `[${v.length}]` : v === null ? ' (null)' : ''}`,
            ])
          ),
          lineDetails: payload.lines?.map((line, i) => ({
            line: i + 1,
            ...Object.fromEntries(
              Object.entries(line).map(([k, v]) => [k, `${v} (${typeof v})`])
            ),
          })),
        });
      }

      // On 400: Log which fields the backend rejected
      if (statusCode === 400) {
        const msgArray = (backendResponse as { message?: string | string[] } | undefined)?.message;
        logger.error('🟡 [PRService] 400 VALIDATION ERROR — Backend rejected these fields:', {
          validationErrors: msgArray,
          sentFields: Object.keys(payload),
          sentLineFields: payload.lines?.[0] ? Object.keys(payload.lines[0]) : [],
        });
      }
      
      const rawMsg =
        (backendResponse as { message?: string | string[] } | undefined)?.message ||
        (backendResponse as { error?: string } | undefined)?.error ||
        (error as Error).message;
      throw new Error(Array.isArray(rawMsg) ? rawMsg.join(', ') : String(rawMsg));
    }
  },

  update: async (id: number, payload: PRUpdatePayload): Promise<PRHeader> => {
    logger.info(`[PRService] Updating PR: ${id}`);
    logger.debug('🔧 [PRService] UPDATE WIRE-READY JSON:', JSON.stringify(payload, null, 2));
    
    // ─── Forbidden field leak detector ───────────────────────────────────
    const unknownFields = Object.keys(payload).filter(k => !KNOWN_DTO_FIELDS.includes(k));
    if (unknownFields.length > 0) {
      logger.error('🚨 [PRService] UPDATE PAYLOAD CONTAINS UNKNOWN FIELDS:', unknownFields);
    }

    const sanitizedPayload = PRService.sanitizeData(payload as unknown as Record<string, unknown>);

    try {
      const response = await api.patch<PRHeader>(ENDPOINTS.detail(id), sanitizedPayload);
      logger.info('✅ [PRService] PR Updated Successfully!', { pr_id: id });
      clearPRServiceAVCache();
      return response;
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: unknown; status?: number; headers?: unknown } };
      const backendResponse = axiosErr.response?.data;
      const statusCode = axiosErr.response?.status;

      logger.error('💥 [PRService] Backend Rejected PR Update', {
        statusCode,
        backendResponse,
        fullErrorBody: JSON.stringify(backendResponse, null, 2),
      });

      // On 500: Log the ENTIRE payload for diagnosis
      if (statusCode === 500 || !statusCode) {
        logger.error('🔴 [PRService] 500 ERROR on UPDATE — Full payload:', {
          sentPayload: JSON.stringify(payload, null, 2),
        });
      }

      const rawMsg =
        (backendResponse as { message?: string | string[] } | undefined)?.message ||
        (backendResponse as { error?: string } | undefined)?.error ||
        (error as Error).message;
      throw new Error(Array.isArray(rawMsg) ? rawMsg.join(', ') : String(rawMsg));
    }
  },

  delete: async (id: number): Promise<SuccessResponse> => {
    logger.info(`[PRService] Deleting PR: ${id}`);
    const response = await api.delete<SuccessResponse>(ENDPOINTS.detail(id));
    return response;
  },

  // 1. Submit for Approval (Draft -> Pending)
  async processDirectApproval(id: number) {
    // 🎯 Restore PATCH /pending which was working
    return await api.patch(ENDPOINTS.pending(id));
  },

  // 2. Approve PR (Pending -> Approved)
  async approvePR(id: number) {
    // 🎯 Use POST for actions
    return await api.post(ENDPOINTS.approve(id));
  },

  // 3. Reject PR (Pending -> Rejected)
  async rejectPR(id: number, reason?: string) {
    // 🎯 Use POST and pass reason if provided. 
    // We send both 'reason' and 'remarks'/'reject_reason' to handle inconsistent backend DTOs.
    return await api.post(ENDPOINTS.reject(id), { 
      reason,
      remarks: reason,
      reject_reason: reason
    });
  },

  cancel: async (id: number): Promise<SuccessResponse> => {
    logger.info(`[PRService] Cancelling PR: ${id}`);
    const response = await api.patch<SuccessResponse>(ENDPOINTS.cancel(id), {});
    return response;
  },

  convert: async (id: number, request: ConvertPRRequest): Promise<SuccessResponse> => {
    logger.info(`[PRService] Converting PR: ${id}`);
    const response = await api.post<SuccessResponse>(ENDPOINTS.convert(id), request);
    return response;
  },

  uploadAttachment: async (id: number, file: File): Promise<SuccessResponse> => {
    logger.info(`[PRService] Uploading attachment for PR: ${id}`);
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<SuccessResponse>(ENDPOINTS.attachments(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  },

  deleteAttachment: async (id: number, attachmentId: string): Promise<SuccessResponse> => {
    logger.info(`[PRService] Deleting attachment ${attachmentId} for PR: ${id}`);
    const response = await api.delete<SuccessResponse>(ENDPOINTS.attachment(id, attachmentId));
    return response;
  },

  generateNextDocumentNo: async (): Promise<{ document_no: string }> => {
    logger.info('[PRService] Generating next document number');
    const response = await api.get<{ document_no: string }>(ENDPOINTS.generateNo);
    return response;
  },

};
