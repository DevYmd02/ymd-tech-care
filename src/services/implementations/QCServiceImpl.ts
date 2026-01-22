/**
 * @file QCServiceImpl.ts
 * @description Real API implementation for QC Service
 */

import api from '../api';
import type { IQCService, QCListParams, QCListResponse, QCCreateData } from '../interfaces/IQCService';
import { logger } from '../../utils/logger';

const ENDPOINTS = {
  list: '/qc',
  create: '/qc',
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

  async create(data: QCCreateData): Promise<{ success: boolean; qc_id?: string; message?: string }> {
    try {
      const response = await api.post<{ qc_id: string }>(ENDPOINTS.create, data);
      return {
        success: true,
        qc_id: response.data.qc_id,
        message: 'บันทึกใบเปรียบเทียบราคาสำเร็จ',
      };
    } catch (error) {
      logger.error('[QCServiceImpl] create error:', error);
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการบันทึก',
      };
    }
  }
}
