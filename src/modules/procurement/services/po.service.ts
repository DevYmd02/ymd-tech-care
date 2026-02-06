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
    // 1. Mock Mode Check
    if (import.meta.env.VITE_USE_MOCK === 'true') {
        const { MOCK_POS } = await import('@/modules/procurement/mocks/procurementMocks');
        logger.info('🎭 [Mock Mode] Serving PO List');
        
        // Simple Filtering (Optional but good for realism)
        let data = MOCK_POS;
        if (params?.status && params.status !== 'ALL') {
            data = data.filter(po => po.status === params.status);
        }

        return {
            data: data,
            total: data.length,
            page: 1,
            limit: 100
        };
    }

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
  }
};
