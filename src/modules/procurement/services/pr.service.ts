import api from '@/core/api/api';
import { USE_MOCK } from '@/core/api/api';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { VendorListResponse, VendorListItem } from '@/modules/master-data/vendor/types/vendor-types';
import type {
  PRListParams,
  PRListResponse,
  ConvertPRRequest,
  PRHeader,
  PRHeaderExtended,
  CreatePRPayload,
  PRStatus,
} from '@/modules/procurement/types';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

export type PRUpdatePayload = Partial<CreatePRPayload> & { status?: PRStatus };

export type { PRListParams, PRListResponse, ConvertPRRequest };
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/pr',
  detail: (id: number) => `/pr/${id}`,
  pending: (id: number) => `/pr/${id}/pending`, // 🎯 Precise Pending endpoint
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
const KNOWN_DTO_FIELDS = new Set([
  'pr_no', 'pr_date', 'need_by_date', 'requester_user_id', 'branch_id',
  'project_id', 'cost_center_id', 'preferred_vendor_id', // 🎯 FIX: Added for explicit recognition
  'pr_tax_code_id', 'remark', 'status',
  'pr_base_currency_code', 'pr_quote_currency_code',
  'pr_exchange_rate', 'pr_exchange_rate_date',
  'pr_discount_raw', 'payment_term_days', 'credit_days',
  'vendor_quote_no', 'shipping_method', 'lines',
  'requester_name', 'delivery_date',  
  'version' // 🎯 Backend expects version for Optimistic Concurrency Control
]);

// NOTE: 'remark' is NOT allowed on lines per backend DTO (whitelist: true + forbidNonWhitelisted: true)
const KNOWN_LINE_DTO_FIELDS = new Set([
  'line', 'item_id', 'qty', 'est_unit_price', 'uom_id',
  'line_discount_raw', 'line_no', 'description', 'warehouse_id',
  'location', 'required_receipt_type'
]);

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒 INTERNAL SPEED CACHE (Phase 1 Optimization)
// ═══════════════════════════════════════════════════════════════════════════════
let cachedVendors: VendorListResponse | null = null;
let lastVendorFetchTime = 0;
const VENDOR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const PRService = {
  getList: async (params?: PRListParams): Promise<PRListResponse> => {
    logger.info('[PRService] Fetching PR List', params);

    // 1. Prepare API Params (Optionally omit offending filters if working around backend)
    const apiParams = { ...params };
    const needsClientFilter = params?.vendor_code || params?.vendor_name;

    // 🎯 WORKAROUND: Don't let backend filter by vendor if we intend to filter client-side
    // because backend logic is likely flawed (missing join).
    if (needsClientFilter && !USE_MOCK) {
        logger.debug('🚀 [PRService] Overriding backend filter for vendor search, will filter client-side.');
        delete apiParams.vendor_code;
        delete apiParams.vendor_name;
    }

    const response = await api.get<PRListResponse>(ENDPOINTS.list, { params: apiParams });

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

        // 🎯 Client-Side Vendor Hydration for filtering
        let hydratedItems = [...allItems];
        try {
            const now = Date.now();
            if (!cachedVendors || (now - lastVendorFetchTime > VENDOR_CACHE_TTL)) {
                logger.debug('🚀 [PRService] Cache miss for Vendors inside list fetcher, syncing...');
                cachedVendors = await VendorService.getList();
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
                    const foundVendor = Object.values(vendorMap).find((v: any) => v.vendor_code === vendorCode);
                    if (foundVendor) {
                        vendorName = foundVendor.vendor_name || '';
                    }
                }

                return {
                    ...item,
                    vendor_code: vendorCode,
                    vendor_name: vendorName
                };
            });

            if (params?.vendor_code) filterParams.vendor_code = params.vendor_code;
            if (params?.vendor_name) filterParams.vendor_name = params.vendor_name;

        } catch (err) {
            logger.error('[PRService] Failed to hydrate vendors for filtering:', err);
        }

        return applyClientFilters<PRHeader>(hydratedItems, filterParams, {
            searchableFields: ['pr_no', 'requester_name', 'purpose'],
            dateField: 'need_by_date',
            backendTotal: response.total
        });
    }

    // ⚡ PHASE 2: Server-Side Pagination & Filtering (Real API)
    if (!USE_MOCK) {
        // Hydrate data with vendor info for display even if not filtering
        let hydratedItems = [...allItems];
        try {
            const now = Date.now();
            if (!cachedVendors || (now - lastVendorFetchTime > VENDOR_CACHE_TTL)) {
                cachedVendors = await VendorService.getList();
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
                const vendorName = vendorFromId?.vendor_name || item.vendor_name || '';

                return {
                    ...item,
                    vendor_code: vendorCode,
                    vendor_name: vendorName
                };
            });
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
    return applyClientPagination<PRHeader>(allItems, page, limit, response.total);
  },

  getDetail: async (id: number): Promise<PRHeaderExtended> => {
    logger.info(`[PRService] Fetching PR Detail: ${id}`);
    const response = await api.get<unknown>(ENDPOINTS.detail(id));
    
    // 🔍 DIAGNOSTIC: Log the raw response structure to identify unwrap issues
    logger.debug('[PRService.getDetail] RAW response keys:', Object.keys(response as object || {}));
    logger.debug('[PRService.getDetail] RAW response (first 500 chars):', JSON.stringify(response).slice(0, 500));
    
    const raw = response as Record<string, unknown>;

    // ─── Shape 1: Already unwrapped by interceptor → { pr_id, pr_no, ... } ─────
    if (raw && 'pr_id' in raw) {
      const result = raw as unknown as PRHeaderExtended;
      logger.debug('[PRService.getDetail] Shape 1 (direct): pr_no=', result.pr_no, 'lines=', result.lines?.length ?? 0);
      return result;
    }
    
    // ─── Shape 2: Single envelope { data: { pr_id, pr_no, ... } } ───────────────
    if (raw && 'data' in raw && raw.data && typeof raw.data === 'object') {
      const inner = raw.data as Record<string, unknown>;
      if ('pr_id' in inner) {
        const result = inner as unknown as PRHeaderExtended;
        logger.debug('[PRService.getDetail] Shape 2 (data envelope): pr_no=', result.pr_no, 'lines=', result.lines?.length ?? 0);
        return result;
      }
      
      // ─── Shape 3: Double envelope { data: { data: { pr_id, ... } } } ───────── 
      if ('data' in inner && inner.data && typeof inner.data === 'object') {
        const deepInner = inner.data as Record<string, unknown>;
        if ('pr_id' in deepInner) {
          const result = deepInner as unknown as PRHeaderExtended;
          logger.debug('[PRService.getDetail] Shape 3 (double envelope): pr_no=', result.pr_no, 'lines=', result.lines?.length ?? 0);
          return result;
        }
      }
    }

    // ─── Shape 4: { header: { pr_id, pr_no, ... }, lines: [...] } ────────────────
    // ✅ CONFIRMED: Real NestJS backend returns this shape (seen in browser log)
    if (raw && 'header' in raw && raw.header && typeof raw.header === 'object') {
      const header = raw.header as Record<string, unknown>;
      if ('pr_id' in header) {
        const result = {
          ...header,
          // Merge lines from the top-level `lines` key into the PRHeader
          lines: Array.isArray(raw.lines) ? raw.lines : [],
        } as unknown as PRHeaderExtended;
        logger.debug('[PRService.getDetail] Shape 4 (header+lines): pr_no=', result.pr_no, 'lines=', result.lines?.length ?? 0);
        return result;
      }
    }

    // ─── Fallback: Return as-is and let TS handle it ─────────────────────────────
    logger.warn('[PRService.getDetail] Could not determine response shape — using raw as PRHeader');
    return raw as unknown as PRHeaderExtended;
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
    const unknownHeaderFields = Object.keys(payload).filter(k => !KNOWN_DTO_FIELDS.has(k));
    if (unknownHeaderFields.length > 0) {
      logger.error('🚨 [PRService] PAYLOAD CONTAINS UNKNOWN HEADER FIELDS — will cause 400:', unknownHeaderFields);
    }

    // Check line items for unknown fields too
    if (payload.lines?.[0]) {
      const unknownLineFields = Object.keys(payload.lines[0]).filter(k => !KNOWN_LINE_DTO_FIELDS.has(k));
      if (unknownLineFields.length > 0) {
        logger.error('🚨 [PRService] LINE ITEMS CONTAIN UNKNOWN FIELDS — will cause 400:', unknownLineFields);
      }
    }
    
    try {
      const response = await api.post<PRHeader>(ENDPOINTS.list, payload);
      logger.info('✅ [PRService] PR Created Successfully!', {
        pr_id: response.pr_id,
        pr_no: response.pr_no,
      });
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
    
    // ─── Forbidden field leak detector for updates too ───────────────────
    const unknownFields = Object.keys(payload).filter(k => !KNOWN_DTO_FIELDS.has(k));
    if (unknownFields.length > 0) {
      logger.error('🚨 [PRService] UPDATE PAYLOAD CONTAINS UNKNOWN FIELDS:', unknownFields);
    }

    try {
      const response = await api.patch<PRHeader>(ENDPOINTS.detail(id), payload);
      logger.info('✅ [PRService] PR Updated Successfully!', { pr_id: id });
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
    // CRITICAL: Call the /pending endpoint with NO BODY
    return await api.patch(ENDPOINTS.pending(id));
  },

  // 2. Approve PR (Pending -> Approved)
  async approvePR(id: number) {
    // CRITICAL: Call the /approve endpoint with NO BODY
    return await api.patch(ENDPOINTS.approve(id));
  },

  // 3. Reject PR (Pending -> Rejected)
  async rejectPR(id: number) {
    // CRITICAL: Call the /reject endpoint with NO BODY
    return await api.patch(ENDPOINTS.reject(id));
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
