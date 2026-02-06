import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockUnits } from '@/modules/master-data/mocks/masterDataMocks';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';

export const UnitService = {
  getList: async (): Promise<UnitListItem[]> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Unit List');
       return mockUnits;
    }
    try {
      const response = await api.get<UnitListItem[]>('/units');
      return response.data;
    } catch (error) {
      logger.error('[UnitService] getList error:', error);
      return [];
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete(`/units/${id}`);
      return true;
    } catch (error) {
      logger.error('[UnitService] delete error:', error);
      return false;
    }
  }
};
