import api from '@/core/api/api';
import { USE_MOCK } from '@/core/api/api';
import type { QCListParams, QCListResponse, CreateQCPayload, SubmitQCWinnerData } from '@/modules/procurement/schemas/qc-schemas';
import type { QCListItem } from '@/modules/procurement/schemas/qc-schemas';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

const ENDPOINTS = {
  list:    '/qc',
  create:  '/qc',
  detail:  (id: number) => `/qc/${id}`,
  compare: (id: number) => `/qc/compare/${id}`,
  cancel:  (id: number) => `/qc/cancel/${id}`,
};

export const QCService = {
  getList: async (params?: QCListParams): Promise<QCListResponse> => {
    logger.info('[QCService] Fetching QC List', params);
    const response = await api.get<QCListResponse>(ENDPOINTS.list, { params });

    // 🎯 HYBRID FALLBACK: Apply Client-Side Filtering when using Real API
    if (!USE_MOCK && params) {
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
      });
    }

    // 🎯 HYBRID PAGINATION: Always apply client-side slicing even for mock responses
    const allItems = extractArrayFromResponse<QCListItem>(response);
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return applyClientPagination<QCListItem>(allItems, page, limit);
  },

  getById: async (id: number): Promise<QCListItem> => {
    logger.info(`[QCService] Fetching QC Detail: ${id}`);
    return await api.get<QCListItem>(ENDPOINTS.detail(id));
  },

  getReadyForPO: async (): Promise<QCListResponse> => {
    logger.info('[QCService] Fetching QCs ready for PO creation');
    return await api.get<QCListResponse>('/qc/ready-for-po');
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

