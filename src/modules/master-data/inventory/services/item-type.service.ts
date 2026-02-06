import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockItemTypes } from '@/modules/master-data/mocks/masterDataMocks';
import type { ItemTypeListItem } from '@/modules/master-data/types/master-data-types';

export const ItemTypeService = {
  getList: async (): Promise<ItemTypeListItem[]> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Item Type List');
       return mockItemTypes;
    }
    try {
      const response = await api.get<ItemTypeListItem[]>('/item-types');
      return response.data;
    } catch (error) {
      logger.error('[ItemTypeService] getList error:', error);
      return [];
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete(`/item-types/${id}`);
      return true;
    } catch (error) {
      logger.error('[ItemTypeService] delete error:', error);
      return false;
    }
  }
};
