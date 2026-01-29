/**
 * @file VendorServiceImpl.ts
 * @description Real API implementation for Vendor Service
 * @note Handles multiple backend response formats for compatibility
 */

import api from '../api';
import type { IVendorService } from '../interfaces/IVendorService';
import type {
  VendorMaster,
  VendorListParams,
  VendorListResponse,
  VendorCreateRequest,
  VendorResponse,
  VendorDropdownItem,
} from '../../types/vendor-types';
import { logger } from '../../utils/logger';

export class VendorServiceImpl implements IVendorService {
  async getList(params?: VendorListParams): Promise<VendorListResponse> {
    try {
      const response = await api.get('/vendors', { params });
      
      // Debug: Log raw response to understand backend format
      logger.log('[VendorServiceImpl] getList raw response:', response.data);

      // Handle multiple response formats:
      // 1. { data: [...], total, page, limit } - Standard paginated format
      // 2. [...] - Simple array
      // 3. { vendors: [...] } - Alternative format
      // 4. Single object (when only 1 vendor exists)

      let vendors: VendorMaster[] = [];
      let total = 0;

      if (Array.isArray(response.data)) {
        // Backend returns simple array
        vendors = response.data;
        total = vendors.length;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Standard paginated format: { data: [], total, page, limit }
        vendors = response.data.data;
        total = response.data.total || vendors.length;
      } else if (response.data?.vendors && Array.isArray(response.data.vendors)) {
        // Alternative format: { vendors: [] }
        vendors = response.data.vendors;
        total = vendors.length;
      } else if (response.data && typeof response.data === 'object' && response.data.vendor_id) {
        // Single vendor object returned
        vendors = [response.data];
        total = 1;
      }

      logger.log(`[VendorServiceImpl] getList parsed ${vendors.length} vendors`);

      return {
        data: vendors,
        total: total,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    } catch (error) {
      logger.error('[VendorServiceImpl] getList error:', error);
      return {
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }
  }

  async getById(vendorId: string): Promise<VendorMaster | null> {
    try {
      const response = await api.get<VendorMaster>(`/vendors/${vendorId}`);
      
      // Debug: Log raw response to see actual backend structure
      logger.log('[VendorServiceImpl] getById raw response:', response.data);
      logger.log('[VendorServiceImpl] getById addresses:', response.data?.addresses);
      logger.log('[VendorServiceImpl] getById contacts:', response.data?.contacts);
      logger.log('[VendorServiceImpl] getById bank_accounts:', response.data?.bank_accounts);
      
      return response.data;
    } catch (error) {
      logger.error('[VendorServiceImpl] getById error:', error);
      return null;
    }
  }

  async getByTaxId(taxId: string): Promise<VendorMaster | null> {
    try {
      const response = await api.get<VendorMaster>(`/vendors/by-tax-id/${taxId}`);
      return response.data;
    } catch (error) {
      logger.error('[VendorServiceImpl] getByTaxId error:', error);
      return null;
    }
  }

  async getDropdown(): Promise<VendorDropdownItem[]> {
    try {
      const response = await api.get<VendorDropdownItem[]>('/vendors/dropdown');
      return response.data;
    } catch (error) {
      logger.error('[VendorServiceImpl] getDropdown error:', error);
      return [];
    }
  }

    async create(data: VendorCreateRequest): Promise<VendorResponse> {
    try {
      logger.log('[VendorServiceImpl] create payload:', JSON.stringify(data, null, 2));
      const response = await api.post<VendorResponse>('/vendors', data);
      return response.data;
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      logger.error('[VendorServiceImpl] create error:', error);
      if (error.response?.data) {
          logger.error('[VendorServiceImpl] create error response data:', JSON.stringify(error.response.data, null, 2));
      }
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้าง Vendor' };
    }
  }

  async update(vendorId: string, data: Partial<VendorCreateRequest>): Promise<VendorResponse> {
    try {
      const response = await api.put<VendorResponse>(`/vendors/${vendorId}`, data);
      return response.data;
    } catch (error) {
      logger.error('[VendorServiceImpl] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดต Vendor' };
    }
  }

  async delete(vendorId: string): Promise<{ success: boolean; message?: string }> {
    try {
      await api.delete(`/vendors/${vendorId}`);
      return { success: true };
    } catch (error) {
      logger.error('[VendorServiceImpl] delete error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการลบ Vendor' };
    }
  }

  async block(vendorId: string, remark?: string): Promise<VendorResponse> {
    try {
      const response = await api.post<VendorResponse>(`/vendors/${vendorId}/block`, { remark });
      return response.data;
    } catch (error) {
      logger.error('[VendorServiceImpl] block error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการ Block Vendor' };
    }
  }

  async unblock(vendorId: string): Promise<VendorResponse> {
    try {
      const response = await api.post<VendorResponse>(`/vendors/${vendorId}/unblock`);
      return response.data;
    } catch (error) {
      logger.error('[VendorServiceImpl] unblock error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการ Unblock Vendor' };
    }
  }

  async setOnHold(vendorId: string, onHold: boolean): Promise<VendorResponse> {
    try {
      const response = await api.post<VendorResponse>(`/vendors/${vendorId}/hold`, { on_hold: onHold });
      return response.data;
    } catch (error) {
      logger.error('[VendorServiceImpl] setOnHold error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ Hold' };
    }
  }

  async search(query: string): Promise<VendorMaster[]> {
    try {
      const response = await api.get<VendorMaster[]>('/vendors/search', { params: { q: query } });
      return response.data;
    } catch (error) {
      logger.error('[VendorServiceImpl] search error:', error);
      return [];
    }
  }
}
