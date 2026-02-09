import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockUnits } from '@/modules/master-data/mocks/masterDataMocks';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';
import type { ListResponse } from '@/shared/types/common-api.types';
import type { SuccessResponse } from '@/shared/types/api-response.types';

export const UnitService = {
  getAll: async (): Promise<ListResponse<UnitListItem>> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Unit List');
       return {
           items: mockUnits,
           total: mockUnits.length,
           page: 1,
           limit: 10
       };
    }
    try {
      // Use Generic Pattern
      const response = await api.get<ListResponse<UnitListItem>>('/units');
      // Legacy array check
      if (Array.isArray(response)) {
          return { items: response as UnitListItem[], total: response.length, page: 1, limit: 10 };
      }
      return response;
    } catch (error) {
      logger.error('[UnitService] getAll error:', error);
      return { items: [], total: 0 };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(`/units/${id}`);
      return true;
    } catch (error) {
      logger.error('[UnitService] delete error:', error);
      return false;
    }
  }
};
