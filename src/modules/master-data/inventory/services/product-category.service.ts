import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockProductCategories } from '@/modules/master-data/mocks/masterDataMocks';
import type { ProductCategoryListItem } from '@/modules/master-data/types/master-data-types';
import type { ListResponse } from '@/shared/types/common-api.types';
import type { SuccessResponse } from '@/shared/types/api-response.types';

export const ProductCategoryService = {
  getAll: async (): Promise<ListResponse<ProductCategoryListItem>> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Product Category List');
       return {
           items: mockProductCategories,
           total: mockProductCategories.length,
           page: 1,
           limit: 10
       };
    }
    try {
      const response = await api.get<ListResponse<ProductCategoryListItem>>('/product-categories');
      if (Array.isArray(response)) {
          return { items: response as ProductCategoryListItem[], total: response.length, page: 1, limit: 10 };
      }
      return response;
    } catch (error) {
      logger.error('[ProductCategoryService] getAll error:', error);
      return { items: [], total: 0 };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(`/product-categories/${id}`);
      return true;
    } catch (error) {
      logger.error('[ProductCategoryService] delete error:', error);
      return false;
    }
  }
};
