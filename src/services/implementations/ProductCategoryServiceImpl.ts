/**
 * @file ProductCategoryServiceImpl.ts
 * @description Real API implementation for Product Category Service
 */

import api from '../api';
import type { IProductCategoryService, ProductCategoryCreateRequest, ProductCategoryUpdateRequest } from '../interfaces/IProductCategoryService';
import type { ProductCategoryListItem } from '@project-types/master-data-types';
import { logger } from '@utils/logger';

export class ProductCategoryServiceImpl implements IProductCategoryService {
  async getList(): Promise<ProductCategoryListItem[]> {
    try {
      const response = await api.get<ProductCategoryListItem[]>('/product-category');
      return response.data;
    } catch (error) {
      logger.error('[ProductCategoryServiceImpl] getList error:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<ProductCategoryListItem | null> {
    try {
      const response = await api.get<ProductCategoryListItem>(`/product-category/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[ProductCategoryServiceImpl] getById error:', error);
      throw error;
    }
  }

  async create(data: ProductCategoryCreateRequest): Promise<{ success: boolean; message?: string }> {
    try {
      await api.post('/product-category', data);
      return { success: true };
    } catch (error) {
      logger.error('[ProductCategoryServiceImpl] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่' };
    }
  }

  async update(data: ProductCategoryUpdateRequest): Promise<{ success: boolean; message?: string }> {
    try {
      await api.put(`/product-category/${data.category_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[ProductCategoryServiceImpl] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทหมวดหมู่' };
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await api.delete(`/product-category/${id}`);
      return true;
    } catch (error) {
      logger.error('[ProductCategoryServiceImpl] delete error:', error);
      return false;
    }
  }
}
