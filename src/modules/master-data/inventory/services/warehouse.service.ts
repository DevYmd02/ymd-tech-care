import api, { USE_MOCK } from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import { logger } from '@/shared/utils';
import { mockWarehouses } from '@/modules/master-data/mocks/masterDataMocks';
import type { WarehouseListItem, WarehouseMaster, WarehouseCreateRequest, WarehouseUpdateRequest, BackendWarehouse } from '@/modules/master-data/types/master-data-types';
import type { ListResponse } from '@/shared/types/api.types';
import type { SuccessResponse } from '@/shared/types/api.types';

import { normalizeListResponse, unwrapResponseData } from '@/shared/utils/apiUtils';

export const WarehouseService = {
  getAll: async (params?: unknown, config?: AxiosRequestConfig): Promise<ListResponse<WarehouseListItem>> => {
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
      const response = await api.get<unknown>('/warehouse', { ...config, params });
      const normalized = normalizeListResponse<BackendWarehouse>(response);
      
      const items: WarehouseListItem[] = normalized.items.map(item => ({
          ...item,
          id: item.warehouse_id,
          is_active: true, // Default to true as it's missing from current API response
      }));
      
      return { 
          items, 
          total: normalized.total, 
          page: normalized.page, 
          limit: normalized.limit 
      };
    } catch (error) {
      logger.error('[WarehouseService] getAll error:', error);
      return { items: [], total: 0, page: 1, limit: 10 };
    }
  },

  delete: async (id: number): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(`/warehouse/${id}`);
      return true;
    } catch (error) {
      logger.error('[WarehouseService] delete error:', error);
      return false;
    }
  },

  getById: async (id: number, config?: AxiosRequestConfig): Promise<WarehouseMaster | null> => {
    if (USE_MOCK) {
        return mockWarehouses.find(w => w.warehouse_id === id) as WarehouseMaster || null;
    }
    try {
        const res = await api.get<unknown>(`/warehouse/${id}`, config);
        return unwrapResponseData<WarehouseMaster>(res);
    } catch (error) {
        logger.error('[WarehouseService] getById error:', error);
        return null;
    }
  },

  create: async (data: WarehouseCreateRequest): Promise<SuccessResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Create Warehouse', data);
        return { success: true, message: 'Created mock successfully' };
    }
    try {
        await api.post('/warehouse', data);
        return { success: true };
    } catch (error) {
        logger.error('[WarehouseService] create error:', error);
        const err = error as { response?: { data?: { message?: string, error?: string } }, message?: string };
        const backendMsg = err.response?.data?.message || err.response?.data?.error || err.message;
        return { success: false, message: backendMsg || 'Failed to create warehouse' };
    }
  },

  update: async (data: WarehouseUpdateRequest): Promise<SuccessResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Update Warehouse', data);
        return { success: true, message: 'Updated mock successfully' };
    }
    try {
        await api.patch(`/warehouse/${data.warehouse_id}`, data);
        return { success: true };
    } catch (error) {
        logger.error('[WarehouseService] update error:', error);
        const err = error as { response?: { data?: { message?: string, error?: string } }, message?: string };
        const backendMsg = err.response?.data?.message || err.response?.data?.error || err.message;
        return { success: false, message: backendMsg || 'Failed to update warehouse' };
    }
  },

  toggleStatus: async (id: number, isActive: boolean): Promise<SuccessResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Toggle Warehouse Status', id, isActive);
        return { success: true };
    }
    try {
        await api.patch(`/warehouse/${id}/status`, { is_active: isActive });
        return { success: true };
    } catch (error) {
        logger.error('[WarehouseService] toggleStatus error:', error);
        return { success: false, message: 'Failed to toggle warehouse status' };
    }
  }
};
