/**
 * @file po.service.ts
 * @description Simplified Purchase Order (PO) Service
 */

import api, { USE_MOCK } from '@/core/api/api';
import type { POListParams, POListResponse, CreatePOPayload, POListItem } from '@/modules/procurement/types/po-types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/purchase-orders',
  detail: (id: string) => `/purchase-orders/${id}`,
  create: '/purchase-orders',
};

// Removed: const IS_DEV = import.meta.env.DEV;
// Removed: const USE_MOCK = IS_DEV; // Force mock in dev for now

export const POService = {
  getList: async (params?: POListParams): Promise<POListResponse> => {
    try {
      if (USE_MOCK) {
        const { MOCK_POS } = await import('../mocks/procurementMocks');
        let filtered = [...MOCK_POS];

        if (params) {
          if (params.po_no) {
            filtered = filtered.filter(item => 
              item.po_no.toLowerCase().includes(params.po_no!.toLowerCase())
            );
          }
          if (params.pr_no) {
            filtered = filtered.filter(item => 
              (item.pr_no || '').toLowerCase().includes(params.pr_no!.toLowerCase())
            );
          }
          if (params.vendor_name) {
            filtered = filtered.filter(item => 
              (item.vendor_name || '').toLowerCase().includes(params.vendor_name!.toLowerCase())
            );
          }
          if (params.status && params.status !== 'ALL') {
            filtered = filtered.filter(item => item.status === params.status);
          }
          if (params.date_from) {
            const fromDate = new Date(params.date_from).getTime();
            filtered = filtered.filter(item => new Date(item.po_date).getTime() >= fromDate);
          }
          if (params.date_to) {
            const toDate = new Date(params.date_to).getTime();
            filtered = filtered.filter(item => new Date(item.po_date).getTime() <= toDate);
          }

          if (params.sort) {
            const [field, order] = params.sort.split(':') as [keyof POListItem, 'asc' | 'desc'];
            filtered.sort((a, b) => {
              const valA = a[field];
              const valB = b[field];
              if (valA === valB) return 0;
              if (valA === null || valA === undefined) return 1;
              if (valB === null || valB === undefined) return -1;
              
              const comparison = (valA > valB) ? 1 : -1;
              return order === 'desc' ? -comparison : comparison;
            });
          }
        }

        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const total = filtered.length;
        const data = filtered.slice((page - 1) * limit, page * limit);

        return { data, total, page, limit };
      }

      return await api.get<POListResponse>(ENDPOINTS.list, { params });
    } catch (error) {
      logger.error('[POService] getList error:', error);
      return { data: [], total: 0, page: params?.page || 1, limit: params?.limit || 20 };
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