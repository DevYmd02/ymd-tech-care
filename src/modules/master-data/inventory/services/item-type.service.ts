import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockItemTypes } from '@/modules/master-data/mocks/masterDataMocks';
import type { ItemTypeListItem, ItemTypeCreateRequest } from '@/modules/master-data/types/master-data-types';
import type { ListResponse } from '@/shared/types/common-api.types';
import type { SuccessResponse } from '@/shared/types/api-response.types';

export const ItemTypeService = {

  getAll: async (): Promise<ListResponse<ItemTypeListItem>> => {
    if (USE_MOCK) {
      logger.info('🎭 [Mock Mode] Serving Item Type List');
      return {
        items: mockItemTypes,
        total: mockItemTypes.length,
        page: 1,
        limit: 10
      };
    }

    try {
      const response = await api.get<ListResponse<ItemTypeListItem>>('/item-type');

      if (Array.isArray(response)) {
        return {
          items: response as ItemTypeListItem[],
          total: response.length,
          page: 1,
          limit: 10
        };
      }

      return response;
    } catch (error) {
      logger.error('[ItemTypeService] getAll error:', error);
      return { items: [], total: 0 };
    }
  },

  // ⭐ CREATE
 // item-type.service.ts

create: async (data: ItemTypeCreateRequest): Promise<SuccessResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Create Item Type', data);
        return { success: true };
    }

    try {
        await api.post('/item-type', data); // ✅ ไม่ต้อง type response จาก backend
        return { success: true };           // ✅ normalize เอง
    } catch (error) {
        logger.error('[ItemTypeService] create error:', error);
        throw error;
    }
},

update: async (id: string, data: ItemTypeCreateRequest): Promise<SuccessResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Update Item Type', id, data);
        return { success: true };
    }

    try {
        await api.put(`/item-type/${id}`, data); // ✅ ไม่ต้อง type response
        return { success: true };                // ✅ normalize เอง
    } catch (error) {
        logger.error('[ItemTypeService] update error:', error);
        throw error;
    }
},

  delete: async (id: number): Promise<boolean> => {
    if (USE_MOCK) return true;

    try {
      await api.delete<SuccessResponse>(`/item-types/${id}`);
      return true;
    } catch (error) {
      logger.error('[ItemTypeService] delete error:', error);
      return false;
    }
  }

};