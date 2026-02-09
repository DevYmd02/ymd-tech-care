import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockWarehouses } from '@/modules/master-data/mocks/masterDataMocks';
import type { WarehouseListItem } from '@/modules/master-data/types/master-data-types';
import type { ListResponse } from '@/shared/types/common-api.types';
import type { SuccessResponse } from '@/shared/types/api-response.types';

export const WarehouseService = {
  getAll: async (): Promise<ListResponse<WarehouseListItem>> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Warehouse List');
       return {
           items: mockWarehouses,
           total: mockWarehouses.length,
           page: 1,
           limit: 10
       };
    }
    try {
      // Use Generic Pattern
      const response = await api.get<ListResponse<WarehouseListItem>>('/warehouses');
      // Legacy array check
      if (Array.isArray(response)) {
          return { items: response as WarehouseListItem[], total: response.length, page: 1, limit: 10 };
      }
      return response;
    } catch (error) {
      logger.error('[WarehouseService] getAll error:', error);
      return { items: [], total: 0 };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(`/warehouses/${id}`);
      return true;
    } catch (error) {
      logger.error('[WarehouseService] delete error:', error);
      return false;
    }
  }
};
