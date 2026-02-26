import api from '@/core/api/api';
import type { VQListParams, VQListResponse, VQCreateData, VQListItem } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/vq',
  create: '/vq',
  update: '/vq', // Base endpoint for updates
};

export const VQService = {
  getList: async (params?: VQListParams): Promise<VQListResponse> => {
    logger.info('[VQService] Fetching VQ List', params);
    return await api.get<VQListResponse>(ENDPOINTS.list, { params });
  },

  getById: async (id: string): Promise<VQListItem> => {
    logger.info(`[VQService] Fetching VQ Detail ${id}`);
    return await api.get<VQListItem>(`${ENDPOINTS.list}/${id}`);
  },

  create: async (data: VQCreateData): Promise<SuccessResponse> => {
    logger.info('[VQService] Creating VQ');
    return await api.post<SuccessResponse>(ENDPOINTS.create, data);
  },

  // TODO: Check if backend requires a specific endpoint like POST /api/qt/{id}/close-bidding instead of a generic PATCH update, as closing bids often triggers vendor notifications.
  update: async (id: string, data: Partial<VQListItem>): Promise<SuccessResponse> => {
    logger.info(`[VQService] Updating VQ ${id}`, data);
    return await api.patch<SuccessResponse>(`${ENDPOINTS.update}/${id}`, data);
  }
};

export type { VQListParams, VQListResponse, VQCreateData };
