/**
 * @file unitService.ts
 * @description Service สำหรับจัดการข้อมูล Unit of Measure (หน่วยนับ)
 * 
 * @note รองรับทั้ง Mock Data และ Real API
 */

import api, { USE_MOCK } from './api';
import { mockUnits } from '../__mocks__/masterDataMocks';
import type { UnitListItem } from '../types/master-data-types';
import { logger } from '../utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface UnitCreateRequest {
  unit_code: string;
  unit_name: string;
  unit_name_en?: string;
  is_active?: boolean;
}

export interface UnitUpdateRequest extends Partial<UnitCreateRequest> {
  unit_id: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export const unitService = {
  /**
   * ดึงรายการหน่วยนับทั้งหมด
   */
  async getList(): Promise<UnitListItem[]> {
    if (USE_MOCK) {
      logger.log('[unitService] Using MOCK data');
      return mockUnits;
    }

    try {
      const response = await api.get<UnitListItem[]>('/units');
      return response.data;
    } catch (error) {
      logger.error('[unitService] getList error:', error);
      throw error;
    }
  },

  /**
   * ดึงข้อมูลหน่วยนับตาม ID
   */
  async getById(id: string): Promise<UnitListItem | null> {
    if (USE_MOCK) {
      return mockUnits.find(u => u.unit_id === id) || null;
    }

    try {
      const response = await api.get<UnitListItem>(`/units/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[unitService] getById error:', error);
      throw error;
    }
  },

  /**
   * สร้างหน่วยนับใหม่
   */
  async create(data: UnitCreateRequest): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK) {
      logger.log('[unitService] Mock create:', data);
      return { success: true, message: 'Created (mock)' };
    }

    try {
      await api.post('/units', data);
      return { success: true };
    } catch (error) {
      logger.error('[unitService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างหน่วยนับ' };
    }
  },

  /**
   * อัพเดทข้อมูลหน่วยนับ
   */
  async update(data: UnitUpdateRequest): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK) {
      logger.log('[unitService] Mock update:', data);
      return { success: true, message: 'Updated (mock)' };
    }

    try {
      await api.put(`/units/${data.unit_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[unitService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทหน่วยนับ' };
    }
  },

  /**
   * ลบหน่วยนับ
   */
  async delete(id: string): Promise<boolean> {
    if (USE_MOCK) {
      logger.log('[unitService] Mock delete:', id);
      return true;
    }

    try {
      await api.delete(`/units/${id}`);
      return true;
    } catch (error) {
      logger.error('[unitService] delete error:', error);
      return false;
    }
  },
};

export default unitService;
