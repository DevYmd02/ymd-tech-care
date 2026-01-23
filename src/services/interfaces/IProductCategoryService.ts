/**
 * @file IProductCategoryService.ts
 * @description Interface for Product Category Service - defines standard methods for both Mock and Real implementations
 */

import type { ProductCategoryListItem } from '../../types/master-data-types';

export interface ProductCategoryCreateRequest {
  category_code: string;
  category_name: string;
  category_name_en?: string;
  is_active?: boolean;
}

export interface ProductCategoryUpdateRequest extends Partial<ProductCategoryCreateRequest> {
  category_id: string;
}

export interface IProductCategoryService {
  getList(): Promise<ProductCategoryListItem[]>;
  getById(id: string): Promise<ProductCategoryListItem | null>;
  create(data: ProductCategoryCreateRequest): Promise<{ success: boolean; message?: string }>;
  update(data: ProductCategoryUpdateRequest): Promise<{ success: boolean; message?: string }>;
  delete(id: string): Promise<boolean>;
}
