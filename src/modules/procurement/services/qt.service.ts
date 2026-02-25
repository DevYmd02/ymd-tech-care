import api from '@/core/api/api';
import type { QTListParams, QTListResponse, QTCreateData, QTListItem } from '@/modules/procurement/types/qt-types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/qt',
  create: '/qt',
  update: '/qt', // Base endpoint for updates
};

export const QTService = {
  getList: async (params?: QTListParams): Promise<QTListResponse> => {
    logger.info('[QTService] Fetching QT List', params);
    return await api.get<QTListResponse>(ENDPOINTS.list, { params });
  },

  create: async (data: QTCreateData): Promise<SuccessResponse> => {
    logger.info('[QTService] Creating QT');
    return await api.post<SuccessResponse>(ENDPOINTS.create, data);
  },

  // TODO: Check if backend requires a specific endpoint like POST /api/qt/{id}/close-bidding instead of a generic PATCH update, as closing bids often triggers vendor notifications.
  update: async (id: string, data: Partial<QTListItem>): Promise<SuccessResponse> => {
    logger.info(`[QTService] Updating QT ${id}`, data);
    return await api.patch<SuccessResponse>(`${ENDPOINTS.update}/${id}`, data);
  }
};

export type { QTListParams, QTListResponse, QTCreateData };
