/**
 * @file warehouseService.ts
 * @description Service สำหรับจัดการข้อมูล Warehouse (คลังสินค้า)
 * 
 * @note รองรับทั้ง Mock Data และ Real API
 */

import api, { USE_MOCK } from './api';
import { mockWarehouses } from '../__mocks__/masterDataMocks';
import type { WarehouseListItem } from '../types/master-data-types';
import { logger } from '../utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface WarehouseCreateRequest {
  warehouse_code: string;
  warehouse_name: string;
  branch_id: string;
  address?: string;
  is_active?: boolean;
}

export interface WarehouseUpdateRequest extends Partial<WarehouseCreateRequest> {
  warehouse_id: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export const warehouseService = {
  /**
   * ดึงรายการคลังสินค้าทั้งหมด
   */
  async getList(): Promise<WarehouseListItem[]> {
    if (USE_MOCK) {
      logger.log('[warehouseService] Using MOCK data');
      return mockWarehouses;
    }

    try {
      const response = await api.get<WarehouseListItem[]>('/warehouses');
      return response.data;
    } catch (error) {
      logger.error('[warehouseService] getList error:', error);
      throw error;
    }
  },

  /**
   * ดึงข้อมูลคลังสินค้าตาม ID
   */
  async getById(id: string): Promise<WarehouseListItem | null> {
    if (USE_MOCK) {
      return mockWarehouses.find(w => w.warehouse_id === id) || null;
    }

    try {
      const response = await api.get<WarehouseListItem>(`/warehouses/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[warehouseService] getById error:', error);
      throw error;
    }
  },

  /**
   * สร้างคลังสินค้าใหม่
   */
  async create(data: WarehouseCreateRequest): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK) {
      logger.log('[warehouseService] Mock create:', data);
      return { success: true, message: 'Created (mock)' };
    }

    try {
      await api.post('/warehouses', data);
      return { success: true };
    } catch (error) {
      logger.error('[warehouseService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างคลังสินค้า' };
    }
  },

  /**
   * อัพเดทข้อมูลคลังสินค้า
   */
  async update(data: WarehouseUpdateRequest): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK) {
      logger.log('[warehouseService] Mock update:', data);
      return { success: true, message: 'Updated (mock)' };
    }

    try {
      await api.put(`/warehouses/${data.warehouse_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[warehouseService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทคลังสินค้า' };
    }
  },

  /**
   * ลบคลังสินค้า
   */
  async delete(id: string): Promise<boolean> {
    if (USE_MOCK) {
      logger.log('[warehouseService] Mock delete:', id);
      return true;
    }

    try {
      await api.delete(`/warehouses/${id}`);
      return true;
    } catch (error) {
      logger.error('[warehouseService] delete error:', error);
      return false;
    }
  },
};

export default warehouseService;
