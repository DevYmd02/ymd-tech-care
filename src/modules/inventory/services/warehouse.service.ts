import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockWarehouses } from '@/modules/master-data/mocks/masterDataMocks';
import type { WarehouseListItem } from '@/modules/master-data/types/master-data-types';

export const WarehouseService = {
  getList: async (): Promise<WarehouseListItem[]> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Warehouse List');
       return mockWarehouses;
    }
    try {
      const response = await api.get<WarehouseListItem[]>('/warehouses');
      return response.data;
    } catch (error) {
      logger.error('[WarehouseService] getList error:', error);
      return [];
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete(`/warehouses/${id}`);
      return true;
    } catch (error) {
      logger.error('[WarehouseService] delete error:', error);
      return false;
    }
  }
};
