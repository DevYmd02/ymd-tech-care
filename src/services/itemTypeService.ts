/**
 * @file itemTypeService.ts
 * @description Service สำหรับจัดการข้อมูล Item Type (ประเภทสินค้า)
 * 
 * @note รองรับทั้ง Mock Data และ Real API
 */

import api, { USE_MOCK } from './api';
import { mockItemTypes } from '../__mocks__/masterDataMocks';
import type { ItemTypeListItem } from '../types/master-data-types';
import { logger } from '../utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface ItemTypeCreateRequest {
  item_type_code: string;
  item_type_name: string;
  item_type_name_en?: string;
  is_active?: boolean;
}

export interface ItemTypeUpdateRequest extends Partial<ItemTypeCreateRequest> {
  item_type_id: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export const itemTypeService = {
  /**
   * ดึงรายการประเภทสินค้าทั้งหมด
   */
  async getList(): Promise<ItemTypeListItem[]> {
    if (USE_MOCK) {
      logger.log('[itemTypeService] Using MOCK data');
      return mockItemTypes;
    }

    try {
      const response = await api.get<ItemTypeListItem[]>('/item-types');
      return response.data;
    } catch (error) {
      logger.error('[itemTypeService] getList error:', error);
      throw error;
    }
  },

  /**
   * ดึงข้อมูลประเภทสินค้าตาม ID
   */
  async getById(id: string): Promise<ItemTypeListItem | null> {
    if (USE_MOCK) {
      return mockItemTypes.find(t => t.item_type_id === id) || null;
    }

    try {
      const response = await api.get<ItemTypeListItem>(`/item-types/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[itemTypeService] getById error:', error);
      throw error;
    }
  },

  /**
   * สร้างประเภทสินค้าใหม่
   */
  async create(data: ItemTypeCreateRequest): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK) {
      logger.log('[itemTypeService] Mock create:', data);
      return { success: true, message: 'Created (mock)' };
    }

    try {
      await api.post('/item-types', data);
      return { success: true };
    } catch (error) {
      logger.error('[itemTypeService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างประเภทสินค้า' };
    }
  },

  /**
   * อัพเดทข้อมูลประเภทสินค้า
   */
  async update(data: ItemTypeUpdateRequest): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK) {
      logger.log('[itemTypeService] Mock update:', data);
      return { success: true, message: 'Updated (mock)' };
    }

    try {
      await api.put(`/item-types/${data.item_type_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[itemTypeService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทประเภทสินค้า' };
    }
  },

  /**
   * ลบประเภทสินค้า
   */
  async delete(id: string): Promise<boolean> {
    if (USE_MOCK) {
      logger.log('[itemTypeService] Mock delete:', id);
      return true;
    }

    try {
      await api.delete(`/item-types/${id}`);
      return true;
    } catch (error) {
      logger.error('[itemTypeService] delete error:', error);
      return false;
    }
  },
};

export default itemTypeService;
