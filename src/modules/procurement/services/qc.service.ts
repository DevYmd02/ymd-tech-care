/**
 * @file qc.service.ts
 * @description Simplified QC Service
 */

import api, { USE_MOCK } from '@/core/api/api';
import type { QCListParams, QCListResponse, QCCreateData } from '@/modules/procurement/types/qc-types';
import { logger } from '@/shared/utils/logger';
import { MOCK_QCS } from '@/modules/procurement/mocks/procurementMocks';

const ENDPOINTS = {
  list: '/qc',
  create: '/qc',
};

export const QCService = {
  getList: async (params?: QCListParams): Promise<QCListResponse> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving QC List');
       
       let filtered = MOCK_QCS;
       if (params?.status && params.status !== 'ALL') {
           filtered = filtered.filter(qc => qc.status === params.status);
       }

       const sortParam = params?.sort || 'created_at:desc';
       const [sortKey, sortDir] = sortParam.split(':');
       
       const sorted = [...filtered].sort((a, b) => {
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
      const response = await api.get<QCListResponse>(ENDPOINTS.list, { params });
      return response;
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
        qc_id: response.qc_id,
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
