import api, { USE_MOCK } from '@/core/api/api';
import type { RFQHeader, RFQListResponse, RFQCreateData, RFQFilterCriteria } from '@/modules/procurement/types/rfq-types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';
import { MOCK_RFQS } from '../mocks/procurementMocks';

const ENDPOINTS = {
  list: '/rfq',
  detail: (id: string) => `/rfq/${id}`,
  create: '/rfq',
  sendToVendors: (id: string) => `/rfq/${id}/send`,
};

// Removed: const IS_DEV = import.meta.env.DEV;
// Removed: const USE_MOCK = IS_DEV; // Force mock in dev for now

export const RFQService = {
  getList: async (params?: RFQFilterCriteria): Promise<RFQListResponse> => {
    try {
      if (USE_MOCK) {
        let filtered = [...MOCK_RFQS];

        if (params) {
          // 1. Text Search (Case Insensitive)
          if (params.rfq_no) {
            filtered = filtered.filter(item => 
              item.rfq_no.toLowerCase().includes(params.rfq_no!.toLowerCase())
            );
          }
          if (params.ref_pr_no) {
            filtered = filtered.filter(item => 
              item.pr_no?.toLowerCase().includes(params.ref_pr_no!.toLowerCase())
            );
          }
          if (params.creator_name) {
            filtered = filtered.filter(item => 
              item.created_by_name?.toLowerCase().includes(params.creator_name!.toLowerCase())
            );
          }

          // 2. Status
          if (params.status && params.status !== 'ALL') {
            filtered = filtered.filter(item => item.status === params.status);
          }

          // 3. Date Range
          if (params.date_from) {
            const fromDate = new Date(params.date_from).getTime();
            filtered = filtered.filter(item => new Date(item.rfq_date).getTime() >= fromDate);
          }
          if (params.date_to) {
            const toDate = new Date(params.date_to).getTime();
            filtered = filtered.filter(item => new Date(item.rfq_date).getTime() <= toDate);
          }

          // 4. Sorting
          if (params.sort) {
            const [field, order] = params.sort.split(':') as [keyof RFQHeader, 'asc' | 'desc'];
            filtered.sort((a, b) => {
              const valA = a[field] ?? '';
              const valB = b[field] ?? '';
              return order === 'desc' 
                ? (valB > valA ? 1 : -1)
                : (valA > valB ? 1 : -1);
            });
          }
        }

        // 5. Pagination
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const total = filtered.length;
        const data = filtered.slice((page - 1) * limit, page * limit);

        return { data, total, page, limit };
      }

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
