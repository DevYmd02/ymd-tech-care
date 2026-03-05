import api from '@/core/api/api';
import type {
  PRListParams,
  PRListResponse,
  ConvertPRRequest,
  PRHeader, 
  CreatePRPayload,
  PRStatus,
} from '@/modules/procurement/types';

export type PRUpdatePayload = Partial<CreatePRPayload> & { status?: PRStatus };

export type { PRListParams, PRListResponse, ConvertPRRequest };
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/pr',
  detail: (id: string) => `/pr/${id}`,
  submit: (id: string) => `/pr/${id}/submit`,
  approve: (id: string) => `/pr/${id}/approve`,
  cancel: (id: string) => `/pr/${id}/cancel`,
  reject: (id: string) => `/pr/${id}/reject`,
  convert: (id: string) => `/pr/${id}/convert`,
  attachments: (id: string) => `/pr/${id}/attachments`,
  attachment: (id: string, attachmentId: string) => `/pr/${id}/attachments/${attachmentId}`,
  generateNo: '/pr/generate-no',
};

// ═══════════════════════════════════════════════════════════════════════════════
// Known DTO fields — used for leak detection before sending to backend
// ═══════════════════════════════════════════════════════════════════════════════
const KNOWN_DTO_FIELDS = new Set([
  'pr_no', 'pr_date', 'need_by_date', 'requester_user_id', 'branch_id',
  'project_id', 'pr_tax_code_id', 'remark', 'status',
  'pr_base_currency_code', 'pr_quote_currency_code',
  'pr_exchange_rate', 'pr_exchange_rate_date',
  'pr_discount_raw', 'payment_term_days', 'credit_days',
  'vendor_quote_no', 'shipping_method', 'lines',
]);

const KNOWN_LINE_DTO_FIELDS = new Set([
  'line', 'item_id', 'qty', 'est_unit_price', 'uom_id',
  'line_discount_raw',
]);

export const PRService = {
  getList: async (params?: PRListParams): Promise<PRListResponse> => {
    logger.info('[PRService] Fetching PR List', params);
    const response = await api.get<PRListResponse>(ENDPOINTS.list, { params });
    return response;
  },

  getDetail: async (id: string): Promise<PRHeader> => {
    logger.info(`[PRService] Fetching PR Detail: ${id}`);
    const response = await api.get<PRHeader>(ENDPOINTS.detail(id));
    return response;
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

  update: async (id: string, payload: PRUpdatePayload): Promise<PRHeader> => {
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

  delete: async (id: string): Promise<SuccessResponse> => {
    logger.info(`[PRService] Deleting PR: ${id}`);
    const response = await api.delete<SuccessResponse>(ENDPOINTS.detail(id));
    return response;
  },

  submit: async (id: string): Promise<SuccessResponse & { pr_no?: string }> => {
    logger.info(`[PRService] Submitting PR: ${id}`);
    const response = await api.patch<SuccessResponse & { pr_no?: string }>(ENDPOINTS.submit(id));
    return response;
  },

  approve: async (id: string): Promise<SuccessResponse> => {
    logger.info(`[PRService] Approving PR: ${id}`);
    const response = await api.patch<SuccessResponse>(ENDPOINTS.approve(id));
    return response;
  },

  reject: async (id: string, reason: string): Promise<SuccessResponse> => {
    logger.info(`[PRService] Rejecting PR: ${id}`);
    const response = await api.patch<SuccessResponse>(ENDPOINTS.reject(id), { reason });
    return response;
  },

  cancel: async (id: string): Promise<SuccessResponse> => {
    logger.info(`[PRService] Cancelling PR: ${id}`);
    const response = await api.patch<SuccessResponse>(ENDPOINTS.cancel(id));
    return response;
  },

  convert: async (id: string, request: ConvertPRRequest): Promise<SuccessResponse> => {
    logger.info(`[PRService] Converting PR: ${id}`);
    const response = await api.post<SuccessResponse>(ENDPOINTS.convert(id), request);
    return response;
  },

  uploadAttachment: async (id: string, file: File): Promise<SuccessResponse> => {
    logger.info(`[PRService] Uploading attachment for PR: ${id}`);
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<SuccessResponse>(ENDPOINTS.attachments(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  },

  deleteAttachment: async (id: string, attachmentId: string): Promise<SuccessResponse> => {
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
