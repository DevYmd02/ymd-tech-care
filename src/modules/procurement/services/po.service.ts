/**
 * @file po.service.ts
 * @description Simplified Purchase Order (PO) Service
 */

import api from '@/core/api/api';
import type { POListParams, POListResponse, CreatePOPayload, POListItem } from '@/modules/procurement/types/po-types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/purchase-orders',
  detail: (id: string) => `/purchase-orders/${id}`,
  create: '/purchase-orders',
};

export const POService = {
  getList: async (params?: POListParams): Promise<POListResponse> => {
    try {
      return await api.get<POListResponse>(ENDPOINTS.list, { params });
    } catch (error) {
      logger.error('[POService] getList error:', error);
      return {
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }
  },

  getById: async (id: string): Promise<POListItem | null> => {
      try {
          return await api.get<POListItem>(ENDPOINTS.detail(id));
      } catch (error) {
          logger.error('[POService] getById error:', error);
          return null;
      }
  },

  create: async (data: CreatePOPayload): Promise<void> => {
      await api.post<SuccessResponse>(ENDPOINTS.create, data);
  },

  approve: async (id: string, remark?: string): Promise<void> => {
      // POST /purchase-orders/:id/approve
      await api.post<SuccessResponse>(`${ENDPOINTS.list}/${id}/approve`, { remark });
  },

  reject: async (id: string, remark?: string): Promise<void> => {
       // POST /purchase-orders/:id/reject
      await api.post<SuccessResponse>(`${ENDPOINTS.list}/${id}/reject`, { remark });
  }
};