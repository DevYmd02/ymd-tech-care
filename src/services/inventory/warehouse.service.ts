/**
 * @file warehouse.service.ts
 * @description Simplified Warehouse Service
 */

import api, { USE_MOCK } from '@/services/core/api';
import type { 
  WarehouseListItem,
  WarehouseCreateRequest,
  WarehouseUpdateRequest
} from '@/types/master-data-types';
import { logger } from '@/utils/logger';
import { mockWarehouses } from '@/__mocks__/masterDataMocks';

export const WarehouseService = {
  getList: async (): Promise<WarehouseListItem[]> => {
    if (USE_MOCK) {
       return mockWarehouses;
    }
    try {
      const response = await api.get<WarehouseListItem[]>('/warehouse');
      return response.data;
    } catch (error) {
      logger.error('[WarehouseService] getList error:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<WarehouseListItem | null> => {
    try {
      const response = await api.get<WarehouseListItem>(`/warehouse/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[WarehouseService] getById error:', error);
      return null;
    }
  },

  create: async (data: WarehouseCreateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.post('/warehouse', data);
      return { success: true };
    } catch (error) {
      logger.error('[WarehouseService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างคลังสินค้า' };
    }
  },

  update: async (data: WarehouseUpdateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.put(`/warehouse/${data.warehouse_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[WarehouseService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทคลังสินค้า' };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/warehouse/${id}`);
      return true;
    } catch (error) {
      logger.error('[WarehouseService] delete error:', error);
      return false;
    }
  }
};
