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
        let filtered = MOCK_POS;
        if (params?.status && params.status !== 'ALL') {
            filtered = filtered.filter(po => po.status === params.status);
        }

        // Sorting
        const sortParam = params?.sort || 'po_date:desc';
        const [sortKey, sortDir] = sortParam.split(':');
        
        const sorted = [...filtered].sort((a, b) => {
            const valA = a[sortKey as keyof typeof a];
            const valB = b[sortKey as keyof typeof b];
            
            if (valA === valB) return 0;
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;
            
            const multiplier = sortDir === 'asc' ? 1 : -1;
            
            if (typeof valA === 'string' && typeof valB === 'string') {
                return valA.localeCompare(valB) * multiplier;
            }
            
            return (valA < valB ? -1 : 1) * multiplier;
        });

        return {
            data: sorted,
            total: sorted.length,
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
