/**
 * @file item-type.service.ts
 * @description Simplified Item Type Service
 */

import api, { USE_MOCK } from '@/services/core/api';
import type { 
  ItemTypeListItem,
  ItemTypeCreateRequest,
  ItemTypeUpdateRequest
} from '@/types/master-data-types';
import { logger } from '@/utils/logger';
import { mockItemTypes } from '@/__mocks__/masterDataMocks';

export const ItemTypeService = {
  getList: async (): Promise<ItemTypeListItem[]> => {
    if (USE_MOCK) {
       return mockItemTypes;
    }
    try {
      const response = await api.get<ItemTypeListItem[]>('/item-types');
      return response.data;
    } catch (error) {
      logger.error('[ItemTypeService] getList error:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<ItemTypeListItem | null> => {
    try {
      const response = await api.get<ItemTypeListItem>(`/item-types/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[ItemTypeService] getById error:', error);
      throw error;
    }
  },

  create: async (data: ItemTypeCreateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.post('/item-types', data);
      return { success: true };
    } catch (error) {
      logger.error('[ItemTypeService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างประเภทสินค้า' };
    }
  },

  update: async (data: ItemTypeUpdateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.put(`/item-types/${data.item_type_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[ItemTypeService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทประเภทสินค้า' };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/item-types/${id}`);
      return true;
    } catch (error) {
      logger.error('[ItemTypeService] delete error:', error);
      return false;
    }
  }
};
