import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockUnits } from '@/modules/master-data/mocks/masterDataMocks';
import type { UnitListItem, UnitCreateRequest, UnitUpdateRequest } from '@/modules/master-data/types/master-data-types';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

export const UnitService = {
  getAll: async (params?: Partial<TableFilters>): Promise<PaginatedListResponse<UnitListItem>> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Unit List');
       return {
           items: mockUnits,
           total: mockUnits.length,
           page: 1,
           limit: 100
       };
    }
    try {
      const response = await api.get<PaginatedListResponse<UnitListItem>>('/units', { params });
      return response;
    } catch (error) {
      logger.error('[UnitService] getAll error:', error);
      return { items: [], total: 0, page: 1, limit: 10 };
    }
  },

  get: async (id: string): Promise<UnitListItem | null> => {
    if (USE_MOCK) return mockUnits.find(u => u.unit_id === id) || null;
    try {
      return await api.get<UnitListItem>(`/units/${id}`);
    } catch (error) {
      logger.error('[UnitService] get error:', error);
      return null;
    }
  },

  create: async (data: UnitCreateRequest): Promise<{ success: boolean; data?: UnitListItem; message?: string }> => {
    if (USE_MOCK) {
        return { success: true, message: 'Mock Create Success' };
    }
    try {
      return await api.post<{ success: boolean; data?: UnitListItem; message?: string }>('/units', data);
    } catch (error) {
      logger.error('[UnitService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างข้อมูล' };
    }
  },

  update: async (id: string, data: Partial<UnitUpdateRequest>): Promise<{ success: boolean; data?: UnitListItem; message?: string }> => {
    if (USE_MOCK) {
        return { success: true, message: 'Mock Update Success' };
    }
    try {
      return await api.put<{ success: boolean; data?: UnitListItem; message?: string }>(`/units/${id}`, data);
    } catch (error) {
      logger.error('[UnitService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการแก้ใขข้อมูล' };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<boolean>(`/units/${id}`);
      return true;
    } catch (error) {
      logger.error('[UnitService] delete error:', error);
      return false;
    }
  }
};
