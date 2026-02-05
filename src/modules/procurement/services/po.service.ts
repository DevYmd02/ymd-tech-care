/**
 * @file po.service.ts
 * @description Simplified Purchase Order (PO) Service
 */

import api from '@/core/api/api';
import type { POListParams, POListResponse, CreatePOPayload, POListItem } from '@/modules/procurement/types/po-types';
import { logger } from '@/shared/utils/logger';

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
        console.log('🎭 [Mock Mode] Serving PO List');
        
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
      const response = await api.get<POListResponse>(ENDPOINTS.list, { params });
      return response.data;
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
          const response = await api.get(ENDPOINTS.detail(id));
          return response.data;
      } catch (error) {
          logger.error('[POService] getById error:', error);
          return null;
      }
  },

  create: async (data: CreatePOPayload): Promise<void> => {
      await api.post(ENDPOINTS.create, data);
  }
};
