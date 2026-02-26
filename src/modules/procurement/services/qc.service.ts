import api from '@/core/api/api';
import type { QCListParams, QCListResponse, QCCreateData } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';

const ENDPOINTS = {
  list: '/qc',
  create: '/qc',
  compare: '/qc/compare',
};

export const QCService = {
  getList: async (params?: QCListParams): Promise<QCListResponse> => {
    logger.info('[QCService] Fetching QC List', params);
    return await api.get<QCListResponse>(ENDPOINTS.list, { params });
  },

  create: async (data: QCCreateData): Promise<{ qc_id: string }> => {
    logger.info('[QCService] Creating QC');
    return await api.post<{ qc_id: string }>(ENDPOINTS.create, data);
  },

  compare: async (id: string): Promise<{ success: boolean }> => {
    logger.info(`[QCService] Triggering Price Comparison for ${id}`);
    return await api.post<{ success: boolean }>(`${ENDPOINTS.compare}/${id}`);
  }
};

export type { QCListParams, QCListResponse, QCCreateData };
