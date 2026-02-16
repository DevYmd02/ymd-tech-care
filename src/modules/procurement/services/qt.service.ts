/**
 * @file qt.service.ts
 * @description Simplified QT Service
 */

import api, { USE_MOCK } from '@/core/api/api';
import type { QTListParams, QTListResponse, QTCreateData, QTListItem } from '@/modules/procurement/types/qt-types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/qt',
  create: '/qt',
};

// Removed: const IS_DEV = import.meta.env.DEV;
// Removed: const USE_MOCK = IS_DEV; // Force mock in dev for now

export const QTService = {
  getList: async (params?: QTListParams): Promise<QTListResponse> => {
    try {
      if (USE_MOCK) {
        const { MOCK_QTS } = await import('../mocks/procurementMocks');
        let filtered = [...MOCK_QTS];

        if (params) {
          if (params.quotation_no) {
            filtered = filtered.filter(item => 
              item.quotation_no.toLowerCase().includes(params.quotation_no!.toLowerCase())
            );
          }
          if (params.vendor_name) {
            filtered = filtered.filter(item => 
              item.vendor_name?.toLowerCase().includes(params.vendor_name!.toLowerCase())
            );
          }
          if (params.rfq_no) {
            filtered = filtered.filter(item => 
              item.rfq_no?.toLowerCase().includes(params.rfq_no!.toLowerCase())
            );
          }
          if (params.status && params.status !== 'ALL') {
            filtered = filtered.filter(item => item.status === params.status);
          }
          if (params.date_from) {
            const fromDate = new Date(params.date_from).getTime();
            filtered = filtered.filter(item => new Date(item.quotation_date).getTime() >= fromDate);
          }
          if (params.date_to) {
            const toDate = new Date(params.date_to).getTime();
            filtered = filtered.filter(item => new Date(item.quotation_date).getTime() <= toDate);
          }

          if (params.sort) {
            const [field, order] = params.sort.split(':') as [keyof QTListItem, 'asc' | 'desc'];
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
        const limit = params?.limit || 10;
        const total = filtered.length;
        const data = filtered.slice((page - 1) * limit, page * limit);

        return { data, total, page, limit };
      }

      return await api.get<QTListResponse>(ENDPOINTS.list, { params });
    } catch (error) {
      logger.error('[QTService] getList error:', error);
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  },

  create: async (data: QTCreateData): Promise<void> => {
    try {
      await api.post<SuccessResponse>(ENDPOINTS.create, data);
    } catch (error) {
      logger.error('[QTService] create error:', error);
    }
  }
};

export type { QTListParams, QTListResponse, QTCreateData };
