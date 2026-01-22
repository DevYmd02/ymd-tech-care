/**
 * @file QTServiceImpl.ts
 * @description Real API implementation for QT Service
 */

import api from '../api';
import type { IQTService, QTListParams, QTListResponse, QTCreateData } from '../interfaces/IQTService';
import { logger } from '../../utils/logger';

const ENDPOINTS = {
  list: '/qt',
  create: '/qt',
};

export class QTServiceImpl implements IQTService {
  async getList(params?: QTListParams): Promise<QTListResponse> {
    try {
      const response = await api.get<QTListResponse>(ENDPOINTS.list, { params });
      return response.data;
    } catch (error) {
      logger.error('[QTServiceImpl] getList error:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };
    }
  }

  async create(data: QTCreateData): Promise<void> {
    try {
      await api.post(ENDPOINTS.create, data);
    } catch (error) {
      logger.error('[QTServiceImpl] create error:', error);
    }
  }
}
