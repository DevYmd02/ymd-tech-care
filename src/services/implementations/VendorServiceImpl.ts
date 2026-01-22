/**
 * @file VendorServiceImpl.ts
 * @description Real API implementation for Vendor Service
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
      const response = await api.get<VendorListResponse>('/vendors', { params });
      return response.data;
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
      return response.data;
    } catch (error) {
      logger.error('[VendorServiceImpl] getById error:', error);
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
      const response = await api.post<VendorResponse>('/vendors', data);
      return response.data;
    } catch (error) {
      logger.error('[VendorServiceImpl] create error:', error);
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
}
