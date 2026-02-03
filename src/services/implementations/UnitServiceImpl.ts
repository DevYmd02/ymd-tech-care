/**
 * @file UnitServiceImpl.ts
 * @description Real API implementation for Unit Service
 */

import api from '../api';
import type { IUnitService, UnitCreateRequest, UnitUpdateRequest } from '../interfaces/IUnitService';
import type { UnitListItem } from '../../types/master-data-types';
import { logger } from '../../utils/logger';

export class UnitServiceImpl implements IUnitService {
  async getList(): Promise<UnitListItem[]> {
    try {
      const response = await api.get<UnitListItem[]>('/unit');
      return response.data;
    } catch (error) {
      logger.error('[UnitServiceImpl] getList error:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<UnitListItem | null> {
    try {
      const response = await api.get<UnitListItem>(`/unit/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[UnitServiceImpl] getById error:', error);
      throw error;
    }
  }

  async create(data: UnitCreateRequest): Promise<{ success: boolean; message?: string }> {
    try {
      await api.post('/unit', data);
      return { success: true };
    } catch (error) {
      logger.error('[UnitServiceImpl] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างหน่วยนับ' };
    }
  }

  async update(data: UnitUpdateRequest): Promise<{ success: boolean; message?: string }> {
    try {
      await api.put(`/unit/${data.unit_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[UnitServiceImpl] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทหน่วยนับ' };
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/unit/${id}`);
      return true;
    } catch (error) {
      logger.error('[UnitServiceImpl] delete error:', error);
      return false;
    }
  }
}
