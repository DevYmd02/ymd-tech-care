import api from '../api';
import type { IRFQService } from '../interfaces/IRFQService';
import type { RFQHeader, RFQListResponse, RFQCreateData, RFQFilterCriteria } from '../../types/rfq-types';
import { logger } from '../../utils/logger';

const ENDPOINTS = {
  list: '/rfq',
  detail: (id: string) => `/rfq/${id}`,
  create: '/rfq',
  sendToVendors: (id: string) => `/rfq/${id}/send`,
};

export class RFQServiceImpl implements IRFQService {
  
  async getList(params?: RFQFilterCriteria): Promise<RFQListResponse> {
    try {
      const response = await api.get<RFQListResponse>(ENDPOINTS.list, { params });
      return response.data;
    } catch (error) {
      logger.error('[RFQServiceImpl] getList error:', error);
      return {
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }
  }

  async getById(id: string): Promise<RFQHeader | null> {
    try {
      const response = await api.get<{ data: RFQHeader }>(ENDPOINTS.detail(id));
      return response.data.data;
    } catch (error) {
      logger.error('[RFQServiceImpl] getById error:', error);
      throw error;
    }
  }

  async create(data: RFQCreateData): Promise<{ success: boolean; data?: RFQHeader; message?: string }> {
    try {
      const response = await api.post<{ data: RFQHeader }>(ENDPOINTS.create, data);
      return { success: true, data: response.data.data };
    } catch (error) {
      logger.error('[RFQServiceImpl] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้าง RFQ' };
    }
  }

  async update(id: string, data: Partial<RFQCreateData>): Promise<{ success: boolean; message?: string }> {
    try {
      await api.put(ENDPOINTS.detail(id), data);
      return { success: true };
    } catch (error) {
      logger.error('[RFQServiceImpl] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดท RFQ' };
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(ENDPOINTS.detail(id));
      return true;
    } catch (error) {
      logger.error('[RFQServiceImpl] delete error:', error);
      return false;
    }
  }

  async sendToVendors(rfqId: string, vendorIds: string[]): Promise<{ success: boolean; message?: string }> {
    try {
      await api.post(ENDPOINTS.sendToVendors(rfqId), { vendor_ids: vendorIds });
      return { success: true };
    } catch (error) {
      logger.error('[RFQServiceImpl] sendToVendors error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการส่ง RFQ' };
    }
  }
}
