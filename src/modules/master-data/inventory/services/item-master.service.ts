import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockItems } from '@/modules/master-data/mocks/masterDataMocks';
import type { ItemListItem, ItemMasterFormData } from '@/modules/master-data/types/master-data-types';
import type { ListResponse } from '@/shared/types/common-api.types';
import type { SuccessResponse } from '@/shared/types/api-response.types';

export const ItemMasterService = {
  getAll: async (): Promise<ListResponse<ItemListItem>> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Item List');
       return {
           items: mockItems,
           total: mockItems.length,
           page: 1,
           limit: 10
       };
    }
    try {
      const response = await api.get<ListResponse<ItemListItem>>('/items');
      if (Array.isArray(response)) {
          return { items: response as ItemListItem[], total: response.length, page: 1, limit: 10 };
      }
      return response;
    } catch (error) {
      logger.error('[ItemMasterService] getAll error:', error);
      return { items: [], total: 0 };
    }
  },

  getById: async (id: string): Promise<ItemListItem | null> => {
      if (USE_MOCK) {
          return mockItems.find(i => i.item_id === id) || null;
      }
      try {
          return await api.get<ItemListItem>(`/items/${id}`);
      } catch (error) {
          logger.error('[ItemMasterService] getById error:', error);
          return null;
      }
  },

  create: async (data: ItemMasterFormData): Promise<boolean> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Create Item:', data);
        return true; 
    }
    try {
        await api.post<SuccessResponse>('/items', data);
        return true;
    } catch (error) {
        logger.error('[ItemMasterService] create error:', error);
        return false;
    }
  },

  update: async (id: string, data: Partial<ItemMasterFormData>): Promise<boolean> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Update Item:', id, data);
        return true;
    }
    try {
        await api.put<SuccessResponse>(`/items/${id}`, data);
        return true;
    } catch (error) {
        logger.error('[ItemMasterService] update error:', error);
        return false;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(`/items/${id}`);
      return true;
    } catch (error) {
      logger.error('[ItemMasterService] delete error:', error);
      return false;
    }
  }
};
