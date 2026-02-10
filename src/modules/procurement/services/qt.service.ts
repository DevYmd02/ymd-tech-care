/**
 * @file qt.service.ts
 * @description Simplified QT Service
 */

import api from '@/core/api/api';
import type { QTListParams, QTListResponse, QTCreateData } from '@/modules/procurement/types/qt-types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/qt',
  create: '/qt',
};

export const QTService = {
  getList: async (params?: QTListParams): Promise<QTListResponse> => {
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
