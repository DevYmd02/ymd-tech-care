import api from '@/core/api/api';
import { USE_MOCK } from '@/core/api/api';
import type { VQListParams, VQListResponse, VQCreateData, VQListItem } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

const ENDPOINTS = {
  list: '/vq',
  create: '/vq',
  update: '/vq',
  detail: (id: number) => `/vq/${id}`,
};

export const VQService = {
  getList: async (params?: VQListParams): Promise<VQListResponse> => {
    logger.info('[VQService] Fetching VQ List', params);
    const response = await api.get<VQListResponse>(ENDPOINTS.list, { params });

    // 🎯 HYBRID FALLBACK: Apply Client-Side Filtering when using Real API
    if (!USE_MOCK && params) {
      const allItems = extractArrayFromResponse<VQListItem>(response);
      const filterParams: Record<string, string | number | boolean | undefined | null> = {};
      if (params.quotation_no) filterParams.quotation_no = params.quotation_no;
      if (params.vendor_name) filterParams.vendor_name = params.vendor_name;
      if (params.rfq_no) filterParams.rfq_no = params.rfq_no;
      if (params.pr_no) filterParams.pr_no = params.pr_no;
      if (params.status && params.status !== 'ALL') filterParams.status = params.status;
      if (params.date_from) filterParams.date_from = params.date_from;
      if (params.date_to) filterParams.date_to = params.date_to;
      if (params.page) filterParams.page = params.page;
      if (params.limit) filterParams.limit = params.limit;
      if (params.sort) filterParams.sort = params.sort;

      return applyClientFilters<VQListItem>(allItems, filterParams, {
        searchableFields: ['quotation_no', 'vendor_name', 'rfq_no', 'pr_no'],
        dateField: 'quotation_date',
      });
    }

    // 🎯 HYBRID PAGINATION: Always apply client-side slicing even for mock responses
    const allItems = extractArrayFromResponse<VQListItem>(response);
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return applyClientPagination<VQListItem>(allItems, page, limit);
  },

  getVQsByRfqId: async (rfqId: number): Promise<VQListResponse> => {
    logger.info(`[VQService] Fetching VQs for RFQ ID: ${rfqId}`);
    return await api.get<VQListResponse>(ENDPOINTS.list, { params: { rfq_id: rfqId } });
  },

  getById: async (id: number): Promise<VQListItem> => {
    logger.info(`[VQService] Fetching VQ Detail ${id}`);
    return await api.get<VQListItem>(`${ENDPOINTS.list}/${id}`);
  },

  create: async (data: VQCreateData): Promise<SuccessResponse> => {
    logger.info('[VQService] Creating VQ');
    return await api.post<SuccessResponse>(ENDPOINTS.create, data);
  },

  // TODO: Check if backend requires a specific endpoint like POST /api/qt/{id}/close-bidding instead of a generic PATCH update, as closing bids often triggers vendor notifications.
  update: async (id: number, data: Partial<VQListItem>): Promise<SuccessResponse> => {
    logger.info(`[VQService] Updating VQ ${id}`, data);
    return await api.patch<SuccessResponse>(`${ENDPOINTS.update}/${id}`, data);
  },

  submit: async (id: number): Promise<SuccessResponse> => {
    logger.info(`[VQService] Submitting VQ ${id}`);
    return await api.post<SuccessResponse>(`${ENDPOINTS.list}/${id}/submit`, {});
  },

  cancel: async (id: number): Promise<SuccessResponse> => {
    logger.info(`[VQService] Cancelling VQ ${id}`);
    return await api.post<SuccessResponse>(`${ENDPOINTS.list}/${id}/cancel`, {});
  }
};

export type { VQListParams, VQListResponse, VQCreateData };