import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockWarehouses } from '@/modules/master-data/mocks/masterDataMocks';
import type { WarehouseListItem, WarehouseMaster, WarehouseCreateRequest, WarehouseUpdateRequest } from '@/modules/master-data/types/master-data-types';
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
  },

  getById: async (id: string): Promise<WarehouseMaster | null> => {
    if (USE_MOCK) {
        return mockWarehouses.find(w => w.warehouse_id === id) as WarehouseMaster || null;
    }
    try {
        const res = await api.get<{ data?: WarehouseMaster }>(`/warehouses/${id}`);
        return res.data || null;
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
        return await api.post<SuccessResponse>('/warehouses', data);
    } catch (error) {
        logger.error('[WarehouseService] create error:', error);
        return { success: false, message: 'Failed to create warehouse' };
    }
  },

  update: async (data: WarehouseUpdateRequest): Promise<SuccessResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Update Warehouse', data);
        return { success: true, message: 'Updated mock successfully' };
    }
    try {
        return await api.put<SuccessResponse>(`/warehouses/${data.warehouse_id}`, data);
    } catch (error) {
        logger.error('[WarehouseService] update error:', error);
        return { success: false, message: 'Failed to update warehouse' };
    }
  },

  toggleStatus: async (id: string, isActive: boolean): Promise<SuccessResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Toggle Warehouse Status', id, isActive);
        return { success: true };
    }
    try {
        await api.patch(`/warehouses/${id}/status`, { is_active: isActive });
        return { success: true };
    } catch (error) {
        logger.error('[WarehouseService] toggleStatus error:', error);
        return { success: false, message: 'Failed to toggle warehouse status' };
    }
  }
};
