import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockProductCategories } from '@/modules/master-data/mocks/masterDataMocks';
import type { SuccessResponse, PaginatedListResponse } from '@/shared/types/api-response.types';
import type { ProductCategoryListItem, ProductCategoryCreateRequest, ProductCategoryUpdateRequest } from '@/modules/master-data/types/master-data-types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

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
      const response = await api.get<PaginatedListResponse<ProductCategoryListItem>>('/product-categories', { params });
      if (Array.isArray(response)) {
          return { items: response as ProductCategoryListItem[], total: response.length, page: 1, limit: response.length || 10 };
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
      return await api.get<ProductCategoryListItem>(`/product-categories/${id}`);
    } catch (error) {
      logger.error('[ProductCategoryService] get error:', error);
      return null;
    }
  },

  create: async (data: ProductCategoryCreateRequest): Promise<{ success: boolean; data?: ProductCategoryListItem; message?: string }> => {
    if (USE_MOCK) {
        return { success: true, message: 'Mock Create Success' };
    }
    try {
      return await api.post<{ success: boolean; data?: ProductCategoryListItem; message?: string }>('/product-categories', data);
    } catch (error) {
      logger.error('[ProductCategoryService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างข้อมูล' };
    }
  },

  update: async (id: number, data: Partial<ProductCategoryUpdateRequest>): Promise<{ success: boolean; data?: ProductCategoryListItem; message?: string }> => {
    if (USE_MOCK) {
        return { success: true, message: 'Mock Update Success' };
    }
    try {
      return await api.put<{ success: boolean; data?: ProductCategoryListItem; message?: string }>(`/product-categories/${id}`, data);
    } catch (error) {
      logger.error('[ProductCategoryService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการแก้ใขข้อมูล' };
    }
  },

  delete: async (id: number): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(`/product-categories/${id}`);
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
      return await api.patch<{ success: boolean; message?: string }>(`/product-categories/${id}/status`, { is_active: isActive });
    } catch (error) {
      logger.error('[ProductCategoryService] toggleStatus error:', error);
      return { success: false, message: 'ไม่สามารถเปลี่ยนสถานะได้' };
    }
  }
};
