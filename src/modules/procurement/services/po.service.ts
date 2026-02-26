import api from '@/core/api/api';
import type { POListParams, POListResponse, CreatePOPayload, POListItem } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/purchase-orders',
  detail: (id: string) => `/purchase-orders/${id}`,
  create: '/purchase-orders',
  approve: (id: string) => `/purchase-orders/${id}/approve`,
  reject: (id: string) => `/purchase-orders/${id}/reject`,
};

export const POService = {
  getList: async (params?: POListParams): Promise<POListResponse> => {
    logger.info('[POService] Fetching PO List', params);
    return await api.get<POListResponse>(ENDPOINTS.list, { params });
  },

  getById: async (id: string): Promise<POListItem> => {
    logger.info(`[POService] Fetching PO Detail: ${id}`);
    return await api.get<POListItem>(ENDPOINTS.detail(id));
  },

  create: async (data: CreatePOPayload): Promise<POListItem> => {
    logger.info('[POService] Creating PO');
    return await api.post<POListItem>(ENDPOINTS.create, data);
  },

  approve: async (id: string, remark?: string): Promise<SuccessResponse> => {
    logger.info(`[POService] Approving PO: ${id}`);
    return await api.post<SuccessResponse>(ENDPOINTS.approve(id), { remark });
  },

  reject: async (id: string, remark?: string): Promise<SuccessResponse> => {
    logger.info(`[POService] Rejecting PO: ${id}`);
    return await api.post<SuccessResponse>(ENDPOINTS.reject(id), { remark });
  }
};