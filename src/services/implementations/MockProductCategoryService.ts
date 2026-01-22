/**
 * @file MockProductCategoryService.ts
 * @description Mock implementation for Product Category Service
 */

import type { IProductCategoryService, ProductCategoryCreateRequest, ProductCategoryUpdateRequest } from '../interfaces/IProductCategoryService';
import { mockProductCategories } from '../../__mocks__/masterDataMocks';
import type { ProductCategoryListItem } from '../../types/master-data-types';
import { logger } from '../../utils/logger';

export class MockProductCategoryService implements IProductCategoryService {
  async getList(): Promise<ProductCategoryListItem[]> {
    logger.log('[MockProductCategoryService] getList');
    await this.delay(200);
    return mockProductCategories;
  }

  async getById(id: string): Promise<ProductCategoryListItem | null> {
    return mockProductCategories.find(c => c.category_id === id) || null;
  }

  async create(data: ProductCategoryCreateRequest): Promise<{ success: boolean; message?: string }> {
    logger.log('[MockProductCategoryService] create', data);
    await this.delay(200);
    return { success: true, message: 'Created (mock)' };
  }

  async update(data: ProductCategoryUpdateRequest): Promise<{ success: boolean; message?: string }> {
    logger.log('[MockProductCategoryService] update', data);
    await this.delay(200);
    return { success: true, message: 'Updated (mock)' };
  }

  async delete(id: string): Promise<boolean> {
    logger.log('[MockProductCategoryService] delete', id);
    await this.delay(150);
    return true;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
