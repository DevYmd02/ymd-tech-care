import api from '@/core/api/api';
import { USE_MOCK } from '@/core/api/api';
import type { QCListParams, QCListResponse, CreateQCPayload, SubmitQCWinnerData, IReadyForPOPR } from '@/modules/procurement/schemas/qc-schemas';
import type { QCListItem } from '@/modules/procurement/schemas/qc-schemas';
import type { RFQHeader } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';

import type { SuccessResponse } from '@/shared/types/api-response.types';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

const ENDPOINTS = {
  list:    '/qc/qc-all',
  create:  '/qc/create',
  detail:  (id: number) => `/qc/${id}`,
  compare: (id: number) => `/qc/compare/${id}`,
  cancel:  (id: number) => `/qc/cancel/${id}`,
};

/**
 * 🧹 Helper to clean params before API call
 * Removes undefined, null, and empty strings
 * Uses 'object' to accommodate interfaces like QCListParams without index signatures
 */
export const cleanParams = (params: object = {}): Record<string, string | number | boolean> => {
  const entries = Object.entries(params);
  const filtered = entries.filter(([, value]) => value !== undefined && value !== null && value !== '');
  
  const cleaned = Object.fromEntries(filtered) as Record<string, string | number | boolean>;

  // Ensure defaults for pagination
  if (!cleaned.page) cleaned.page = 1;
  if (!cleaned.limit) cleaned.limit = 20;

  return cleaned;
};

export const QCService = {
  getList: async (params?: QCListParams): Promise<QCListResponse> => {
    logger.info('[QCService] Fetching QC List', params);
    
    // 🧹 Clean Parameters to prevent "undefined" in URL
    const cleanedParams = cleanParams(params || {});
    const response = await api.get<QCListResponse>(ENDPOINTS.list, { params: cleanedParams });

    // ⚡ PHASE 2: Server-Side Pagination & Filtering (Real API)
    if (!USE_MOCK) {
      return response;
    }

    // 🎯 HYBRID FALLBACK: Apply Client-Side Filtering when using Mock Data
    if (params) {
      const allItems = extractArrayFromResponse<QCListItem>(response);
      const filterParams: Record<string, string | number | boolean | undefined | null> = {};
      if (params.qc_no) filterParams.qc_no = params.qc_no;
      if (params.pr_no) filterParams.pr_no = params.pr_no;
      if (params.rfq_no) filterParams.rfq_no = params.rfq_no;
      if (params.status) filterParams.status = params.status;
      if (params.date_from) filterParams.date_from = params.date_from;
      if (params.date_to) filterParams.date_to = params.date_to;
      if (params.page) filterParams.page = params.page;
      if (params.limit) filterParams.limit = params.limit;
      if (params.sort) filterParams.sort = params.sort;

      return applyClientFilters<QCListItem>(allItems, filterParams, {
        searchableFields: ['qc_no', 'pr_no', 'lowest_bidder_name'],
        dateField: 'created_at',
        backendTotal: response.total,
      });
    }

    // 🎯 HYBRID PAGINATION: Always apply client-side slicing even for mock responses
    const allItems = extractArrayFromResponse<QCListItem>(response);
    const page = 1;
    const limit = 20;
    return applyClientPagination<QCListItem>(allItems, page, limit, response.total);
  },

  getById: async (id: number): Promise<QCListItem> => {
    logger.info(`[QCService] Fetching QC Detail: ${id}`);
    return await api.get<QCListItem>(ENDPOINTS.detail(id));
  },

  getReadyForPO: async (): Promise<IReadyForPOPR[]> => {
    logger.info('[QCService] Fetching PRs waiting for QC (Ready for PO)');
    return await api.get<IReadyForPOPR[]>('/po/pr/waiting-for-qc');
  },

  getWaitingForQC: async (): Promise<RFQHeader[]> => {
    logger.info('[QCService] Fetching RFQs waiting for QC (Limit: 1000)');
    const response = await api.get<{ data: RFQHeader[] }>('/qc/rfq/waiting-for-qc', { 
      params: { limit: 1000 } 
    });

    const items = extractArrayFromResponse<RFQHeader>(response);
    logger.debug(`[QCService] Found ${items.length} items waiting for QC`);
    return items;
  },

  getVQsWaitingForQC: async (rfqId: number): Promise<any[]> => {
    logger.info(`[QCService] Fetching VQs for RFQ ID waiting for QC: ${rfqId}`);
    const response = await api.get<any>(`/qc/vendor/${rfqId}/waiting-for-qc`);
    logger.debug("[QCService] getVQsWaitingForQC response received");
    return extractArrayFromResponse<any>(response);
  },






  create: async (data: CreateQCPayload): Promise<{ qc_id: number }> => {
    logger.info('[QCService] Creating QC with 5-field payload', data);
    return await api.post<{ qc_id: number }>(ENDPOINTS.create, data);
  },

  compare: async (id: number): Promise<{ success: boolean }> => {
    logger.info(`[QCService] Triggering Price Comparison for ${id}`);
    return await api.post<{ success: boolean }>(ENDPOINTS.compare(id), {});
  },

  submitWinner: async (id: number, data: SubmitQCWinnerData): Promise<{ qc_id: number }> => {
    logger.info(`[QCService] Submitting Winner for QC: ${id}`, data);
    return await api.post<{ qc_id: number }>(`/qc/submit-winner/${id}`, data);
  },

  cancel: async (id: number): Promise<SuccessResponse> => {
    logger.info(`[QCService] Cancelling QC: ${id}`);
    return await api.post<SuccessResponse>(ENDPOINTS.cancel(id), {});
  },
};

export type { QCListParams, QCListResponse, CreateQCPayload as QCCreateData };

