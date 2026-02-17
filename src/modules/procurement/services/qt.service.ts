import api from '@/core/api/api';
import type { QTListParams, QTListResponse, QTCreateData } from '@/modules/procurement/types/qt-types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/qt',
  create: '/qt',
};

export const QTService = {
  getList: async (params?: QTListParams): Promise<QTListResponse> => {
    logger.info('[QTService] Fetching QT List', params);
    return await api.get<QTListResponse>(ENDPOINTS.list, { params });
  },

  create: async (data: QTCreateData): Promise<SuccessResponse> => {
    logger.info('[QTService] Creating QT');
    return await api.post<SuccessResponse>(ENDPOINTS.create, data);
  }
};

export type { QTListParams, QTListResponse, QTCreateData };
