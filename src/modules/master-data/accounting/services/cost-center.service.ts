/**
 * @file cost-center.service.ts
 * @description Simplified Cost Center Service
 */

import api, { USE_MOCK } from '@/core/api/api';
import type { CostCenter } from '@/modules/master-data/types/master-data-types';
import { logger } from '@/shared/utils/logger';
import { mockCostCenters } from '@/modules/master-data/mocks/masterDataMocks';

export const CostCenterService = {
  getList: async (): Promise<CostCenter[]> => {
    if (USE_MOCK) {
       return mockCostCenters;
    }
    try {
      const response = await api.get<CostCenter[]>('/cost-centers');
      return response;
    } catch (error) {
      logger.error('[CostCenterService] getList error:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<CostCenter | null> => {
    try {
      const response = await api.get<CostCenter>(`/cost-centers/${id}`);
      return response;
    } catch (error) {
      logger.error('[CostCenterService] getById error:', error);
      return null;
    }
  }
};
