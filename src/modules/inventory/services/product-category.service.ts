import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockProductCategories } from '@/modules/master-data/mocks/masterDataMocks';
import type { ProductCategoryListItem } from '@/modules/master-data/types/master-data-types';

export const ProductCategoryService = {
  getList: async (): Promise<ProductCategoryListItem[]> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Product Category List');
       return mockProductCategories;
    }
    try {
      const response = await api.get<ProductCategoryListItem[]>('/product-categories');
      return response.data;
    } catch (error) {
      logger.error('[ProductCategoryService] getList error:', error);
      return [];
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete(`/product-categories/${id}`);
      return true;
    } catch (error) {
      logger.error('[ProductCategoryService] delete error:', error);
      return false;
    }
  }
};
