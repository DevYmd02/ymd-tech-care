/**
 * @file WarehouseServiceImpl.ts
 * @description Real API implementation for Warehouse Service
 */

import api from '../api';
import type { IWarehouseService, WarehouseCreateRequest, WarehouseUpdateRequest } from '../interfaces/IWarehouseService';
import type { WarehouseListItem } from '../../types/master-data-types';
import { logger } from '../../utils/logger';

export class WarehouseServiceImpl implements IWarehouseService {
  async getList(): Promise<WarehouseListItem[]> {
    try {
      const response = await api.get<WarehouseListItem[]>('/warehouses');
      return response.data;
    } catch (error) {
      logger.error('[WarehouseServiceImpl] getList error:', error);
      return [];
    }
  }

  async getById(id: string): Promise<WarehouseListItem | null> {
    try {
      const response = await api.get<WarehouseListItem>(`/warehouses/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[WarehouseServiceImpl] getById error:', error);
      return null;
    }
  }

  async create(data: WarehouseCreateRequest): Promise<{ success: boolean; message?: string }> {
    try {
      await api.post('/warehouses', data);
      return { success: true };
    } catch (error) {
      logger.error('[WarehouseServiceImpl] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างคลังสินค้า' };
    }
  }

  async update(data: WarehouseUpdateRequest): Promise<{ success: boolean; message?: string }> {
    try {
      await api.put(`/warehouses/${data.warehouse_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[WarehouseServiceImpl] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทคลังสินค้า' };
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/warehouses/${id}`);
      return true;
    } catch (error) {
      logger.error('[WarehouseServiceImpl] delete error:', error);
      return false;
    }
  }
}
