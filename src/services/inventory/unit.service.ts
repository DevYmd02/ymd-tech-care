/**
 * @file unit.service.ts
 * @description Simplified Unit Service
 */

import api, { USE_MOCK } from '@/services/core/api';
import type { 
  UnitListItem,
  UnitCreateRequest,
  UnitUpdateRequest
} from '@/types/master-data-types';
import { logger } from '@/utils/logger';
import { mockUnits } from '@/__mocks__/masterDataMocks';

export const UnitService = {
  getList: async (): Promise<UnitListItem[]> => {
    if (USE_MOCK) {
       return mockUnits;
    }
    try {
      const response = await api.get<UnitListItem[]>('/unit');
      return response.data;
    } catch (error) {
      logger.error('[UnitService] getList error:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<UnitListItem | null> => {
    try {
      const response = await api.get<UnitListItem>(`/unit/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[UnitService] getById error:', error);
      throw error;
    }
  },

  create: async (data: UnitCreateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.post('/unit', data);
      return { success: true };
    } catch (error) {
      logger.error('[UnitService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างหน่วยนับ' };
    }
  },

  update: async (data: UnitUpdateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.put(`/unit/${data.unit_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[UnitService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทหน่วยนับ' };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/unit/${id}`);
      return true;
    } catch (error) {
      logger.error('[UnitService] delete error:', error);
      return false;
    }
  }
};
