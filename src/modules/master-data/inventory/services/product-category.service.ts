import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockProductCategories } from '@/modules/master-data/mocks/masterDataMocks';
import type { SuccessResponse, PaginatedListResponse } from '@/shared/types/api-response.types';
import type { ProductCategoryListItem, ProductCategoryCreateRequest, ProductCategoryUpdateRequest } from '@/modules/master-data/types/master-data-types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

function mapToProductCategory(item: any): ProductCategoryListItem {
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
  getAll: async (params?: Partial<TableFilters>): Promise<PaginatedListResponse<ProductCategoryListItem>> => {
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
      // Adjust API path if needed based on your backend request URL provided: /api/item-category
      // Assuming base URL handles /api, we use /item-category
      const response = await api.get<any>('/item-category', { params });

      const rawItems = Array.isArray(response) ? response : (response.items || response.data || []);
      const items = rawItems.map(mapToProductCategory);

      // Return manually constructed PaginatedListResponse
      if (Array.isArray(rawItems)) {
        return { items, total: items.length, page: 1, limit: items.length || 10 };
      }
      return response;
    } catch (error) {
      logger.error('[ProductCategoryService] getAll error:', error);
      return { items: [], total: 0, page: 1, limit: 10 };
    }
  },

  get: async (id: number): Promise<ProductCategoryListItem | null> => {
    if (USE_MOCK) return mockProductCategories.find(c => c.category_id === id) || null;
    try {
      const response = await api.get<any>(`/item-category/${id}`);
      if (!response) return null;

      // Handle wrapped response or direct object
      const rawItem = response.data || response;
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
