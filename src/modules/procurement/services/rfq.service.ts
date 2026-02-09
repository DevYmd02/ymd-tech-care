import api, { USE_MOCK } from '@/core/api/api';
import type { RFQHeader, RFQListResponse, RFQCreateData, RFQFilterCriteria } from '@/modules/procurement/types/rfq-types';
import { logger } from '@/shared/utils/logger';
import { MOCK_RFQS } from '@/modules/procurement/mocks/procurementMocks';

import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/rfq',
  detail: (id: string) => `/rfq/${id}`,
  create: '/rfq',
  sendToVendors: (id: string) => `/rfq/${id}/send`,
};

export const RFQService = {
  
  getList: async (params?: RFQFilterCriteria): Promise<RFQListResponse> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving RFQ List');
       
       const sortParam = params?.sort || 'rfq_date:desc';
       const [sortKey, sortDir] = sortParam.split(':');
       
       const sorted = [...MOCK_RFQS].sort((a, b) => {
         const valA = a[sortKey as keyof RFQHeader];
         const valB = b[sortKey as keyof RFQHeader];
         
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
      return await api.get<RFQListResponse>(ENDPOINTS.list, { params });
    } catch (error) {
      logger.error('[RFQService] getList error:', error);
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  },

  getById: async (id: string): Promise<RFQHeader | null> => {
    try {
      return await api.get<RFQHeader>(ENDPOINTS.detail(id));
    } catch (error) {
      logger.error('[RFQService] getById error:', error);
      return null;
    }
  },

  create: async (data: RFQCreateData): Promise<{ success: boolean; data?: RFQHeader; message?: string }> => {
    try {
      const response = await api.post<RFQHeader>(ENDPOINTS.create, data);
      return { success: true, data: response };
    } catch (error) {
      logger.error('[RFQService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้าง RFQ' };
    }
  },

  update: async (id: string, data: Partial<RFQCreateData>): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.put<SuccessResponse>(ENDPOINTS.detail(id), data);
      return { success: true };
    } catch (error) {
      logger.error('[RFQService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดท RFQ' };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) return true; // Added mock return for consistency
    try {
      await api.delete<SuccessResponse>(ENDPOINTS.detail(id));
      return true;
    } catch (error) {
      logger.error('[RFQService] delete error:', error);
      return false;
    }
  },

  sendToVendors: async (rfqId: string, vendorIds: string[]): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.post<SuccessResponse>(ENDPOINTS.sendToVendors(rfqId), { vendor_ids: vendorIds });
      return { success: true };
    } catch (error) {
      logger.error('[RFQService] sendToVendors error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการส่ง RFQ' };
    }
  }
};
