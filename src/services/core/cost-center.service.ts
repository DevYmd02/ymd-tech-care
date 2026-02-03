/**
 * @file cost-center.service.ts
 * @description Simplified Cost Center Service
 */

import api, { USE_MOCK } from '@/services/core/api';
import type { CostCenter } from '@/types/master-data-types';
import { logger } from '@/utils/logger';
import { mockCostCenters } from '@/__mocks__/masterDataMocks';

export const CostCenterService = {
  getList: async (): Promise<CostCenter[]> => {
    if (USE_MOCK) {
       return mockCostCenters;
    }
    try {
      const response = await api.get<CostCenter[]>('/cost-centers');
      return response.data;
    } catch (error) {
      logger.error('[CostCenterService] getList error:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<CostCenter | null> => {
    try {
      const response = await api.get<CostCenter>(`/cost-centers/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[CostCenterService] getById error:', error);
      return null;
    }
  }
};
