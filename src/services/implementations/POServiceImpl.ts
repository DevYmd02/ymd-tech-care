/**
 * @file POServiceImpl.ts
 * @description Real API implementation for Purchase Order (PO) Service
 */

import api from '../api';
import type { IPOService } from '../interfaces/IPOService';
import type { POListParams, POListResponse } from '@project-types/po-types';

import { logger } from '@utils/logger';

export class POServiceImpl implements IPOService {
  async getList(params?: POListParams): Promise<POListResponse> {
    try {
      const response = await api.get<POListResponse>('/purchase-orders', { params });
      return response.data;
    } catch (error) {
      logger.error('[POServiceImpl] getList error:', error);
      return {
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }
  }
}
