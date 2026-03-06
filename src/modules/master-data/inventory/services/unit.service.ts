import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockUnits } from '@/modules/master-data/mocks/masterDataMocks';
import type { UnitListItem, UnitCreateRequest, UnitUpdateRequest } from '@/modules/master-data/types/master-data-types';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

/**
 * Maps raw backend UOM fields (uom_*) to frontend UnitListItem fields (unit_*).
 * Uses safe fallbacks so both backend and mock data work correctly.
 */
function mapUomToUnit(uom: Record<string, unknown>): UnitListItem {
  return {
    ...(uom as unknown as UnitListItem),
    // Map backend → frontend field names with safe fallbacks
    unit_id: (uom.unit_id as string) || String(uom.uom_id || ''),
    unit_code: (uom.unit_code as string) || (uom.uom_code as string) || '',
    unit_name: (uom.unit_name as string) || (uom.uom_name as string) || '',
    unit_name_en: (uom.unit_name_en as string) || (uom.uom_nameeng as string) || '',
    is_active: (uom.is_active as boolean) ?? true,
    created_at: (uom.created_at as string) || new Date().toISOString(),
  };
}

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
      type UomResponse = UnitListItem[] | { data?: UnitListItem[]; items?: UnitListItem[] };
      const response = await api.get<UomResponse>('/uom', { params });
      
      let uomArray: UnitListItem[] = [];
      if (Array.isArray(response)) {
        uomArray = response;
      } else if (response && 'data' in response && Array.isArray(response.data)) {
        uomArray = response.data;
      } else if (response && 'items' in response && Array.isArray(response.items)) {
         uomArray = response.items;
      }

      // Map backend uom_* fields → frontend unit_* fields
      const mappedArray = uomArray.map((item) => mapUomToUnit(item as unknown as Record<string, unknown>));

      return {
        items: mappedArray,
        total: mappedArray.length,
        page: 1,
        limit: mappedArray.length || 10
      };
    } catch (error) {
      logger.error('[UnitService] getAll error:', error);
      return { items: [], total: 0, page: 1, limit: 10 };
    }
  },

  get: async (id: string): Promise<UnitListItem | null> => {
    if (USE_MOCK) return mockUnits.find(u => u.unit_id === id) || null;
    try {
      const raw = await api.get<UnitListItem>(`/uom/${id}`);
      if (!raw) return null;
      // Map backend uom_* fields → frontend unit_* fields
      return mapUomToUnit(raw as unknown as Record<string, unknown>);
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
      return await api.post<{ success: boolean; data?: UnitListItem; message?: string }>('/uom', data);
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
      return await api.put<{ success: boolean; data?: UnitListItem; message?: string }>(`/uom/${id}`, data);
    } catch (error) {
      logger.error('[UnitService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการแก้ใขข้อมูล' };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<boolean>(`/uom/${id}`);
      return true;
    } catch (error) {
      logger.error('[UnitService] delete error:', error);
      return false;
    }
  },

  toggleStatus: async (id: string, isActive: boolean): Promise<{ success: boolean; message?: string }> => {
    if (USE_MOCK) {
      const unit = mockUnits.find(u => u.unit_id === id);
      if (unit) unit.is_active = isActive;
      return { success: true, message: 'Mock Status Toggle Success' };
    }
    try {
      return await api.patch<{ success: boolean; message?: string }>(`/uom/${id}/status`, { is_active: isActive });
    } catch (error) {
      logger.error('[UnitService] toggleStatus error:', error);
      return { success: false, message: 'ไม่สามารถเปลี่ยนสถานะได้' };
    }
  }
};
