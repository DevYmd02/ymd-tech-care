/**
 * @file qc.service.ts
 * @description Simplified QC Service
 */

import api, { USE_MOCK } from '@/services/core/api';
import type { QCListParams, QCListResponse, QCCreateData } from '@/types/qc-types';
import { logger } from '@/utils/logger';
import { MOCK_QCS } from '@/__mocks__/procurementMocks';

const ENDPOINTS = {
  list: '/qc',
  create: '/qc',
};

export const QCService = {
  getList: async (params?: QCListParams): Promise<QCListResponse> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving QC List');
       return {
         data: MOCK_QCS,
         total: MOCK_QCS.length,
         page: 1,
         limit: 100
       };
    }
    try {
      const response = await api.get<QCListResponse>(ENDPOINTS.list, { params });
      return response.data;
    } catch (error) {
      logger.error('[QCService] getList error:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };
    }
  },

  create: async (data: QCCreateData): Promise<{ success: boolean; qc_id?: string; message?: string }> => {
    try {
      const response = await api.post<{ qc_id: string }>(ENDPOINTS.create, data);
      return {
        success: true,
        qc_id: response.data.qc_id,
        message: 'บันทึกใบเปรียบเทียบราคาสำเร็จ',
      };
    } catch (error) {
      logger.error('[QCService] create error:', error);
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการบันทึก',
      };
    }
  }
};

export type { QCListParams, QCListResponse, QCCreateData };
