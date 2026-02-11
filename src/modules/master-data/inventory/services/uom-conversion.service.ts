import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockUOMConversions } from '@/modules/master-data/mocks/masterDataMocks';
import type { UOMConversionListItem } from '@/modules/master-data/types/master-data-types';
import type { ListResponse } from '@/shared/types/common-api.types';
import type { SuccessResponse } from '@/shared/types/api-response.types';

export const UOMConversionService = {
  getAll: async (): Promise<ListResponse<UOMConversionListItem>> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving UOM Conversion List');
       return {
           items: mockUOMConversions,
           total: mockUOMConversions.length,
           page: 1,
           limit: 10
       };
    }
    try {
      const response = await api.get<ListResponse<UOMConversionListItem>>('/uom-conversions');
      if (Array.isArray(response)) {
          return { items: response as UOMConversionListItem[], total: response.length, page: 1, limit: 10 };
      }
      return response;
    } catch (error) {
      logger.error('[UOMConversionService] getAll error:', error);
      return { items: [], total: 0 };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(`/uom-conversions/${id}`);
      return true;
    } catch (error) {
      logger.error('[UOMConversionService] delete error:', error);
      return false;
    }
  }
};
