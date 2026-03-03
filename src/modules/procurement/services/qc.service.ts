import api from '@/core/api/api';
import type { QCListParams, QCListResponse, QCCreateData } from '@/modules/procurement/schemas/qc-schemas';
import type { QCListItem } from '@/modules/procurement/schemas/qc-schemas';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list:    '/qc',
  detail:  (id: string) => `/qc/${id}`,
  create:  '/qc',
  compare: (id: string) => `/qc/compare/${id}`,
  cancel:  (id: string) => `/qc/${id}/cancel`,
};

export const QCService = {
  getList: async (params?: QCListParams): Promise<QCListResponse> => {
    logger.info('[QCService] Fetching QC List', params);
    return await api.get<QCListResponse>(ENDPOINTS.list, { params });
  },

  getById: async (id: string): Promise<QCListItem> => {
    logger.info(`[QCService] Fetching QC Detail: ${id}`);
    return await api.get<QCListItem>(ENDPOINTS.detail(id));
  },

  create: async (data: QCCreateData): Promise<{ qc_id: string }> => {
    logger.info('[QCService] Creating QC');
    return await api.post<{ qc_id: string }>(ENDPOINTS.create, data);
  },

  compare: async (id: string): Promise<{ success: boolean }> => {
    logger.info(`[QCService] Triggering Price Comparison for ${id}`);
    return await api.post<{ success: boolean }>(ENDPOINTS.compare(id));
  },

  cancel: async (id: string): Promise<SuccessResponse> => {
    logger.info(`[QCService] Cancelling QC: ${id}`);
    return await api.post<SuccessResponse>(ENDPOINTS.cancel(id));
  },
};

export type { QCListParams, QCListResponse, QCCreateData };

