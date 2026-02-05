import api, { USE_MOCK } from '@/core/api/api';
import type { RFQHeader, RFQListResponse, RFQCreateData, RFQFilterCriteria } from '@/modules/procurement/types/rfq-types';
import { logger } from '@/shared/utils/logger';
import { MOCK_RFQS } from '@/modules/procurement/mocks/procurementMocks';

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
       return {
         data: MOCK_RFQS,
         total: MOCK_RFQS.length,
         page: 1,
         limit: 100
       };
    }
    try {
      const response = await api.get<RFQListResponse>(ENDPOINTS.list, { params });
      return response.data;
    } catch (error) {
      logger.error('[RFQService] getList error:', error);
      return {
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }
  },

  getById: async (id: string): Promise<RFQHeader | null> => {
    try {
      const response = await api.get<{ data: RFQHeader }>(ENDPOINTS.detail(id));
      return response.data.data;
    } catch (error) {
      logger.error('[RFQService] getById error:', error);
      throw error;
    }
  },

  create: async (data: RFQCreateData): Promise<{ success: boolean; data?: RFQHeader; message?: string }> => {
    try {
      const response = await api.post<{ data: RFQHeader }>(ENDPOINTS.create, data);
      return { success: true, data: response.data.data };
    } catch (error) {
      logger.error('[RFQService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้าง RFQ' };
    }
  },

  update: async (id: string, data: Partial<RFQCreateData>): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.put(ENDPOINTS.detail(id), data);
      return { success: true };
    } catch (error) {
      logger.error('[RFQService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดท RFQ' };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(ENDPOINTS.detail(id));
      return true;
    } catch (error) {
      logger.error('[RFQService] delete error:', error);
      return false;
    }
  },

  sendToVendors: async (rfqId: string, vendorIds: string[]): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.post(ENDPOINTS.sendToVendors(rfqId), { vendor_ids: vendorIds });
      return { success: true };
    } catch (error) {
      logger.error('[RFQService] sendToVendors error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการส่ง RFQ' };
    }
  }
};
