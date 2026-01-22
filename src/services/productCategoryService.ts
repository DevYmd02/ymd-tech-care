/**
 * @file productCategoryService.ts
 * @description Service Entry Point for Product Category Module
 * Uses Factory Pattern to switch between Mock and Real API implementations
 */

import { USE_MOCK } from './api';
import type { IProductCategoryService } from './interfaces/IProductCategoryService';
import { MockProductCategoryService } from './implementations/MockProductCategoryService';
import { ProductCategoryServiceImpl } from './implementations/ProductCategoryServiceImpl';

const getProductCategoryService = (): IProductCategoryService => {
  if (USE_MOCK) {
    console.log('🔧 [ProductCategory Service] Using Mock Implementation');
    return new MockProductCategoryService();
  }
  console.log('🔧 [ProductCategory Service] Using Real API Implementation');
  return new ProductCategoryServiceImpl();
};

export const productCategoryService = getProductCategoryService();

export default productCategoryService;

export type { ProductCategoryCreateRequest, ProductCategoryUpdateRequest } from './interfaces/IProductCategoryService';
