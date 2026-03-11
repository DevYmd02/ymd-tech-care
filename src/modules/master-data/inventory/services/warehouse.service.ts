import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockWarehouses } from '@/modules/master-data/mocks/masterDataMocks';
import type { WarehouseListItem, WarehouseMaster, WarehouseCreateRequest, WarehouseUpdateRequest, BackendWarehouse } from '@/modules/master-data/types/master-data-types';
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
      // Strictly typed Backend response (Flat Array)
      const data = await api.get<BackendWarehouse[]>('/warehouse');
      
      // Explicit mapping to UI-Ready format (Strictly Typed)
      const items: WarehouseListItem[] = (data || []).map(item => ({
          ...item,
          id: item.warehouse_id,
          is_active: true, // Default to true as it's missing from current API response
      }));
      
      return { 
          items, 
          total: items.length, 
          page: 1, 
          limit: 100 
      };
    } catch (error) {
      logger.error('[WarehouseService] getAll error:', error);
      return { items: [], total: 0 };
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

  getById: async (id: number): Promise<WarehouseMaster | null> => {
    if (USE_MOCK) {
        return mockWarehouses.find(w => w.warehouse_id === id) as WarehouseMaster || null;
    }
    try {
        const res = await api.get<{ data?: WarehouseMaster }>(`/warehouse/${id}`);
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
        return await api.post<SuccessResponse>('/warehouse', data);
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
        return await api.put<SuccessResponse>(`/warehouse/${data.warehouse_id}`, data);
    } catch (error) {
        logger.error('[WarehouseService] update error:', error);
        return { success: false, message: 'Failed to update warehouse' };
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
