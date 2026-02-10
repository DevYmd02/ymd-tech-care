import api from '@/core/api/api';
import type { RFQHeader, RFQListResponse, RFQCreateData, RFQFilterCriteria } from '@/modules/procurement/types/rfq-types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/rfq',
  detail: (id: string) => `/rfq/${id}`,
  create: '/rfq',
  sendToVendors: (id: string) => `/rfq/${id}/send`,
};

export const RFQService = {
  getList: async (params?: RFQFilterCriteria): Promise<RFQListResponse> => {
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
