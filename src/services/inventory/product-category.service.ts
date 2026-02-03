/**
 * @file product-category.service.ts
 * @description Simplified Product Category Service
 */

import api, { USE_MOCK } from '@/services/core/api';
import type { 
  ProductCategoryListItem,
  ProductCategoryCreateRequest,
  ProductCategoryUpdateRequest
} from '@/types/master-data-types';
import { logger } from '@/utils/logger';
import { mockProductCategories } from '@/__mocks__/masterDataMocks';

export const ProductCategoryService = {
  getList: async (): Promise<ProductCategoryListItem[]> => {
    if (USE_MOCK) {
       return mockProductCategories;
    }
    try {
      const response = await api.get<ProductCategoryListItem[]>('/product-category');
      return response.data;
    } catch (error) {
      logger.error('[ProductCategoryService] getList error:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<ProductCategoryListItem | null> => {
    try {
      const response = await api.get<ProductCategoryListItem>(`/product-category/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[ProductCategoryService] getById error:', error);
      throw error;
    }
  },

  create: async (data: ProductCategoryCreateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.post('/product-category', data);
      return { success: true };
    } catch (error) {
      logger.error('[ProductCategoryService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' };
    }
  },

  update: async (data: ProductCategoryUpdateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.put(`/product-category/${data.category_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[ProductCategoryService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทหมวดหมู่' };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/product-category/${id}`);
      return true;
    } catch (error) {
      logger.error('[ProductCategoryService] delete error:', error);
      return false;
    }
  }
};
