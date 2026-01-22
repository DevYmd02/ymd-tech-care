/**
 * @file QCServiceImpl.ts
 * @description Real API implementation for QC Service
 */

import api from '../api';
import type { IQCService, QCListParams, QCListResponse } from '../interfaces/IQCService';
import { logger } from '../../utils/logger';

const ENDPOINTS = {
  list: '/qc',
};

export class QCServiceImpl implements IQCService {
  async getList(params?: QCListParams): Promise<QCListResponse> {
    try {
      const response = await api.get<QCListResponse>(ENDPOINTS.list, { params });
      return response.data;
    } catch (error) {
      logger.error('[QCServiceImpl] getList error:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };
    }
  }
}
