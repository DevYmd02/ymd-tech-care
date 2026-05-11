import api, { USE_MOCK } from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import { logger } from '@/shared/utils';
import { mockProductCategories } from '@/modules/master-data/mocks/masterDataMocks';
import type { SuccessResponse, PaginatedListResponse } from '@/shared/types/api.types';
import type { ProductCategoryListItem, ProductCategoryCreateRequest, ProductCategoryUpdateRequest } from '@/modules/master-data/types/master-data-types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

import { normalizeListResponse, unwrapResponseData } from '@/shared/utils/apiUtils';

interface BackendProductCategory {
  item_category_id?: number;
  category_id?: number;
  item_category_code?: string;
  category_code?: string;
  item_category_name?: string;
  category_name?: string;
  item_category_nameeng?: string;
  category_name_en?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface ProductCategoryFilters extends Partial<TableFilters> {
  category_code?: string;
  category_name?: string;
  item_category_code?: string;
  item_category_name?: string;
}


function mapToProductCategory(item: BackendProductCategory): ProductCategoryListItem {
  return {
    id: item.item_category_id || item.category_id,
    category_id: item.item_category_id || item.category_id,
    category_code: item.item_category_code || item.category_code,
    category_name: item.item_category_name || item.category_name,
    category_name_en: item.item_category_nameeng || item.category_name_en || '',
    is_active: item.is_active ?? true,
    created_at: item.created_at || new Date().toISOString(),
  } as ProductCategoryListItem;
}

export const ProductCategoryService = {
  getAll: async (params?: ProductCategoryFilters, config?: AxiosRequestConfig): Promise<PaginatedListResponse<ProductCategoryListItem>> => {
    if (USE_MOCK) {
      logger.info('🎭 [Mock Mode] Serving Product Category List');
      return {
        items: mockProductCategories,
        total: mockProductCategories.length,
        page: 1,
        limit: 100
      };
    }
    try {
      const response = await api.get<unknown>('/item-category', { ...config, params });
      const normalized = normalizeListResponse<BackendProductCategory>(response);
      
      return { 
        items: normalized.items.map(mapToProductCategory), 
        total: Number(normalized.total), 
        page: Number(normalized.page), 
        limit: Number(normalized.limit) 
      };
    } catch (error) {
      logger.error('[ProductCategoryService] getAll error:', error);
      return { items: [], total: 0, page: 1, limit: 10 };
    }
  },

  get: async (id: number, config?: AxiosRequestConfig): Promise<ProductCategoryListItem | null> => {
    if (USE_MOCK) return mockProductCategories.find(c => c.category_id === id) || null;
    try {
      const response = await api.get<unknown>(`/item-category/${id}`, config);
      const rawItem = unwrapResponseData<BackendProductCategory>(response);
      
      if (!rawItem) return null;
      return mapToProductCategory(rawItem);
    } catch (error) {
      logger.error('[ProductCategoryService] get error:', error);
      return null;
    }
  },

  create: async (data: ProductCategoryCreateRequest): Promise<{ success: boolean; message?: string }> => {
    if (USE_MOCK) return { success: true, message: 'Mock Create Success' };

    try {
      await api.post('/item-category', {
        item_category_code: data.category_code,
        item_category_name: data.category_name,
        item_category_nameeng: data.category_name_en,
        is_active: data.is_active
      });
      return { success: true }; // ✅ normalize เอง
    } catch (error) {
      logger.error('[ProductCategoryService] create error:', error);
      throw error; // ✅던ให้ onError จัดการ ไม่ return false
    }
  },

  update: async (id: number, data: Partial<ProductCategoryUpdateRequest>): Promise<{ success: boolean; message?: string }> => {
    if (USE_MOCK) return { success: true, message: 'Mock Update Success' };

    try {
      await api.patch(`/item-category/${id}`, {
        item_category_code: data.category_code,
        item_category_name: data.category_name,
        item_category_nameeng: data.category_name_en,
        is_active: data.is_active
      });
      return { success: true }; // ✅ normalize เอง
    } catch (error) {
      logger.error('[ProductCategoryService] update error:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(`/item-category/${id}`);
      return true;
    } catch (error) {
      logger.error('[ProductCategoryService] delete error:', error);
      return false;
    }
  },

  toggleStatus: async (id: number, isActive: boolean): Promise<{ success: boolean; message?: string }> => {
    if (USE_MOCK) {
      const category = mockProductCategories.find(c => c.category_id === id);
      if (category) category.is_active = isActive;
      return { success: true, message: 'Mock Status Toggle Success' };
    }
    try {
      return await api.patch<{ success: boolean; message?: string }>(`/item-category/${id}/status`, { is_active: isActive });
    } catch (error) {
      logger.error('[ProductCategoryService] toggleStatus error:', error);
      return { success: false, message: 'ไม่สามารถเปลี่ยนสถานะได้' };
    }
  }
};
