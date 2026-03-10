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
      type ExpectedResponse = CostCenter[] | { items?: CostCenter[]; data?: CostCenter[] };
      const response = await api.get<ExpectedResponse>('/cost-centers');
      
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        if ('items' in response && Array.isArray(response.items)) {
          return response.items;
        }
        if ('data' in response && Array.isArray(response.data)) {
           return response.data;
        }
      }
      
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    } catch (error) {
      logger.error('[CostCenterService] getList error:', error);
      return [];
    }
  },

  getById: async (id: number): Promise<CostCenter | null> => {
    if (USE_MOCK) {
      return mockCostCenters.find(cc => cc.cost_center_id === id) || null;
    }
    try {
      const response = await api.get<CostCenter>(`/cost-centers/${id}`);
      return response;
    } catch (error) {
      logger.error('[CostCenterService] getById error:', error);
      return null;
    }
  },

  create: async (data: Partial<CostCenter>): Promise<{ success: boolean; message?: string }> => {
    if (USE_MOCK) {
       logger.info('[CostCenterService] Mock Create:', data);
       return { success: true };
    }
    try {
      await api.post('/cost-centers', data);
      return { success: true };
    } catch (error) {
      logger.error('[CostCenterService] create error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  update: async (id: number, data: Partial<CostCenter>): Promise<{ success: boolean; message?: string }> => {
    if (USE_MOCK) {
       logger.info('[CostCenterService] Mock Update:', id, data);
       return { success: true };
    }
    try {
      await api.patch(`/cost-centers/${id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[CostCenterService] update error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  toggleStatus: async (id: number, currentStatus: boolean): Promise<{ success: boolean; message?: string }> => {
    if (USE_MOCK) {
       const cc = mockCostCenters.find(c => c.cost_center_id === id);
       if (cc) cc.is_active = !currentStatus;
       return { success: true };
    }
    try {
      await api.patch(`/cost-centers/${id}/status`, { is_active: !currentStatus });
      return { success: true };
    } catch (error) {
      logger.error('[CostCenterService] toggleStatus error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};
