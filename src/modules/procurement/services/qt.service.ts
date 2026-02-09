/**
 * @file qt.service.ts
 * @description Simplified QT Service
 */

import api, { USE_MOCK } from '@/core/api/api';
import type { QTListParams, QTListResponse, QTCreateData } from '@/modules/procurement/types/qt-types';
import { logger } from '@/shared/utils/logger';
import { MOCK_QTS } from '@/modules/procurement/mocks/procurementMocks';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/qt',
  create: '/qt',
};

export const QTService = {
  getList: async (params?: QTListParams): Promise<QTListResponse> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving QT List');

       const sortParam = params?.sort || 'quotation_date:desc';
       const [sortKey, sortDir] = sortParam.split(':');
       
       const sorted = [...MOCK_QTS].sort((a, b) => {
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
      return await api.get<QTListResponse>(ENDPOINTS.list, { params });
    } catch (error) {
      logger.error('[QTService] getList error:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };
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
