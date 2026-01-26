/**
 * @file POServiceImpl.ts
 * @description Real API implementation for Purchase Order (PO) Service
 */

import api from '../api';
import type { IPOService } from '../interfaces/IPOService';
import type { POListParams, POListResponse } from '../../types/po-types';

export class POServiceImpl implements IPOService {
  async getList(params?: POListParams): Promise<POListResponse> {
    const response = await api.get<POListResponse>('/purchase-orders', { params });
    return response.data;
  }
}
