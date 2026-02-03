import api, { USE_MOCK } from '@/services/core/api';
import type {
  VendorMaster,
  VendorListResponse,
  VendorCreateRequest,
  VendorResponse,
  VendorDropdownItem,
} from '@/types/vendor-types';
import { logger } from '@/utils/logger';
import { 
  MOCK_VENDORS, 
  getVendorById as mockGetById,
  getActiveVendors as mockGetActive
} from '@/__mocks__/vendorMocks';

export const VendorService = {
  getList: async (): Promise<VendorListResponse> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Vendor List');
       return {
         data: MOCK_VENDORS,
         total: MOCK_VENDORS.length,
         page: 1,
         limit: 100
       };
    }
    try {
      const response = await api.get('/vendors');
      
      let vendors: VendorMaster[] = [];
      let total = 0;

      if (Array.isArray(response.data)) {
        vendors = response.data;
        total = vendors.length;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        vendors = response.data.data;
        total = response.data.total || vendors.length;
      } else if (response.data?.vendors && Array.isArray(response.data.vendors)) {
        vendors = response.data.vendors;
        total = vendors.length;
      } else if (response.data && typeof response.data === 'object' && response.data.vendor_id) {
        vendors = [response.data];
        total = 1;
      }

      return {
        data: vendors,
        total: total,
        page: 1,
        limit: total,
      };
    } catch (error) {
      logger.error('[VendorService] getList error:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };
    }
  },

  getById: async (vendorId: string): Promise<VendorMaster | null> => {
    if (USE_MOCK) {
      const mockVendor = mockGetById(vendorId);
      if (mockVendor) {
        logger.info(`🎭 [Mock Mode] Serving Vendor Detail: ${vendorId}`);
        return mockVendor;
      }
      return null;
    }
    try {
      const response = await api.get<VendorMaster>(`/vendors/${vendorId}`);
      return response.data;
    } catch (error) {
      logger.error('[VendorService] getById error:', error);
      return null;
    }
  },

  getByTaxId: async (taxId: string): Promise<VendorMaster | null> => {
    try {
      const response = await api.get<VendorMaster>(`/vendors/by-tax-id/${taxId}`);
      return response.data;
    } catch (error) {
      logger.error('[VendorService] getByTaxId error:', error);
      return null;
    }
  },

  getDropdown: async (): Promise<VendorDropdownItem[]> => {
    if (USE_MOCK) {
      logger.info('🎭 [Mock Mode] Serving Vendor Dropdown');
      return mockGetActive().map((v: VendorMaster) => ({
        vendor_id: v.vendor_id,
        vendor_code: v.vendor_code,
        vendor_name: v.vendor_name
      }));
    }
    try {
      const response = await api.get<VendorDropdownItem[]>('/vendors/dropdown');
      return response.data;
    } catch (error) {
      logger.error('[VendorService] getDropdown error:', error);
      return [];
    }
  },

  create: async (data: VendorCreateRequest): Promise<VendorResponse> => {
    try {
      const response = await api.post<VendorResponse>('/vendors', data);
      return response.data;
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      logger.error('[VendorService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้าง Vendor' };
    }
  },

  update: async (vendorId: string, data: Partial<VendorCreateRequest>): Promise<VendorResponse> => {
    try {
      const response = await api.put<VendorResponse>(`/vendors/${vendorId}`, data);
      return response.data;
    } catch (error) {
      logger.error('[VendorService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดต Vendor' };
    }
  },

  delete: async (vendorId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.delete(`/vendors/${vendorId}`);
      return { success: true };
    } catch (error) {
      logger.error('[VendorService] delete error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการลบ Vendor' };
    }
  },

  block: async (vendorId: string, remark?: string): Promise<VendorResponse> => {
    try {
      const response = await api.post<VendorResponse>(`/vendors/${vendorId}/block`, { remark });
      return response.data;
    } catch (error) {
      logger.error('[VendorService] block error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการ Block Vendor' };
    }
  },

  unblock: async (vendorId: string): Promise<VendorResponse> => {
    try {
      const response = await api.post<VendorResponse>(`/vendors/${vendorId}/unblock`);
      return response.data;
    } catch (error) {
      logger.error('[VendorService] unblock error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการ Unblock Vendor' };
    }
  },

  setOnHold: async (vendorId: string, onHold: boolean): Promise<VendorResponse> => {
    try {
      const response = await api.post<VendorResponse>(`/vendors/${vendorId}/hold`, { on_hold: onHold });
      return response.data;
    } catch (error) {
      logger.error('[VendorService] setOnHold error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ Hold' };
    }
  },

  search: async (query: string): Promise<VendorMaster[]> => {
    if (USE_MOCK) {
       const lowerQuery = query.toLowerCase();
       return MOCK_VENDORS.filter((v: VendorMaster) => 
          v.vendor_name.toLowerCase().includes(lowerQuery) || 
          v.vendor_code.toLowerCase().includes(lowerQuery)
       );
    }
    try {
      const response = await api.get<VendorMaster[]>('/vendors/search', { params: { q: query } });
      return response.data;
    } catch (error) {
      logger.error('[VendorService] search error:', error);
      return [];
    }
  }
};
