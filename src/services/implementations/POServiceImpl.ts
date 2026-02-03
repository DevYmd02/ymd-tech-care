/**
 * @file POServiceImpl.ts
 * @description Real API implementation for Purchase Order (PO) Service
 */

import api from '../api';
import type { IPOService } from '../interfaces/IPOService';
import type { POListParams, POListResponse, CreatePOPayload } from '@project-types/po-types';

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

  async getById(id: string): Promise<import("../../types/po-types").POListItem | null> {
      try {
          const response = await api.get(`/purchase-orders/${id}`);
          return response.data;
      } catch (error) {
          logger.error('[POServiceImpl] getById error:', error);
          return null;
      }
  }

  async create(data: CreatePOPayload): Promise<void> {
      await api.post('/purchase-orders', data);
  }
}
