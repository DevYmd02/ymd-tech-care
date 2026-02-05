/**
 * @file qt.service.ts
 * @description Simplified QT Service
 */

import api, { USE_MOCK } from '@/core/api/api';
import type { QTListParams, QTListResponse, QTCreateData } from '@/modules/procurement/types/qt-types';
import { logger } from '@/shared/utils/logger';
import { MOCK_QTS } from '@/modules/procurement/mocks/procurementMocks';

const ENDPOINTS = {
  list: '/qt',
  create: '/qt',
};

export const QTService = {
  getList: async (params?: QTListParams): Promise<QTListResponse> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving QT List');
       return {
         data: MOCK_QTS,
         total: MOCK_QTS.length,
         page: 1,
         limit: 100
       };
    }
    try {
      const response = await api.get<QTListResponse>(ENDPOINTS.list, { params });
      return response.data;
    } catch (error) {
      logger.error('[QTService] getList error:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };
    }
  },

  create: async (data: QTCreateData): Promise<void> => {
    try {
      await api.post(ENDPOINTS.create, data);
    } catch (error) {
      logger.error('[QTService] create error:', error);
    }
  }
};

export type { QTListParams, QTListResponse, QTCreateData };
