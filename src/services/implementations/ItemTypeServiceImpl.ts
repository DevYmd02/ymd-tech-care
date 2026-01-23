/**
 * @file ItemTypeServiceImpl.ts
 * @description Real API implementation for Item Type Service
 */

import api from '../api';
import type { IItemTypeService, ItemTypeCreateRequest, ItemTypeUpdateRequest } from '../interfaces/IItemTypeService';
import type { ItemTypeListItem } from '../../types/master-data-types';
import { logger } from '../../utils/logger';

export class ItemTypeServiceImpl implements IItemTypeService {
  async getList(): Promise<ItemTypeListItem[]> {
    try {
      const response = await api.get<ItemTypeListItem[]>('/item-types');
      return response.data;
    } catch (error) {
      logger.error('[ItemTypeServiceImpl] getList error:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<ItemTypeListItem | null> {
    try {
      const response = await api.get<ItemTypeListItem>(`/item-types/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[ItemTypeServiceImpl] getById error:', error);
      throw error;
    }
  }

  async create(data: ItemTypeCreateRequest): Promise<{ success: boolean; message?: string }> {
    try {
      await api.post('/item-types', data);
      return { success: true };
    } catch (error) {
      logger.error('[ItemTypeServiceImpl] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างประเภทสินค้า' };
    }
  }

  async update(data: ItemTypeUpdateRequest): Promise<{ success: boolean; message?: string }> {
    try {
      await api.put(`/item-types/${data.item_type_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[ItemTypeServiceImpl] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทประเภทสินค้า' };
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/item-types/${id}`);
      return true;
    } catch (error) {
      logger.error('[ItemTypeServiceImpl] delete error:', error);
      return false;
    }
  }
}
