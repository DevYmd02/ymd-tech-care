/**
 * @file productCategoryService.ts
 * @description Service สำหรับจัดการข้อมูล Product Category (หมวดหมู่สินค้า)
 * 
 * @note รองรับทั้ง Mock Data และ Real API
 */

import api, { USE_MOCK } from './api';
import { mockProductCategories } from '../__mocks__/masterDataMocks';
import type { ProductCategoryListItem } from '../types/master-data-types';
import { logger } from '../utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface ProductCategoryCreateRequest {
  category_code: string;
  category_name: string;
  category_name_en?: string;
  is_active?: boolean;
}

export interface ProductCategoryUpdateRequest extends Partial<ProductCategoryCreateRequest> {
  category_id: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export const productCategoryService = {
  /**
   * ดึงรายการหมวดหมู่สินค้าทั้งหมด
   */
  async getList(): Promise<ProductCategoryListItem[]> {
    if (USE_MOCK) {
      logger.log('[productCategoryService] Using MOCK data');
      return mockProductCategories;
    }

    try {
      const response = await api.get<ProductCategoryListItem[]>('/product-categories');
      return response.data;
    } catch (error) {
      logger.error('[productCategoryService] getList error:', error);
      throw error;
    }
  },

  /**
   * ดึงข้อมูลหมวดหมู่ตาม ID
   */
  async getById(id: string): Promise<ProductCategoryListItem | null> {
    if (USE_MOCK) {
      return mockProductCategories.find(c => c.category_id === id) || null;
    }

    try {
      const response = await api.get<ProductCategoryListItem>(`/product-categories/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[productCategoryService] getById error:', error);
      throw error;
    }
  },

  /**
   * สร้างหมวดหมู่ใหม่
   */
  async create(data: ProductCategoryCreateRequest): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK) {
      logger.log('[productCategoryService] Mock create:', data);
      return { success: true, message: 'Created (mock)' };
    }

    try {
      await api.post('/product-categories', data);
      return { success: true };
    } catch (error) {
      logger.error('[productCategoryService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' };
    }
  },

  /**
   * อัพเดทข้อมูลหมวดหมู่
   */
  async update(data: ProductCategoryUpdateRequest): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK) {
      logger.log('[productCategoryService] Mock update:', data);
      return { success: true, message: 'Updated (mock)' };
    }

    try {
      await api.put(`/product-categories/${data.category_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[productCategoryService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทหมวดหมู่' };
    }
  },

  /**
   * ลบหมวดหมู่
   */
  async delete(id: string): Promise<boolean> {
    if (USE_MOCK) {
      logger.log('[productCategoryService] Mock delete:', id);
      return true;
    }

    try {
      await api.delete(`/product-categories/${id}`);
      return true;
    } catch (error) {
      logger.error('[productCategoryService] delete error:', error);
      return false;
    }
  },
};

export default productCategoryService;
