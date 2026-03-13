import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockItems } from '@/modules/master-data/mocks/masterDataMocks';
import type { ItemListItem, ItemMasterFormData } from '@/modules/master-data/types/master-data-types';
import type { ListResponse } from '@/shared/types/common-api.types';
import type { SuccessResponse } from '@/shared/types/api-response.types';

/**
 * Maps raw backend item fields to frontend ItemListItem fields.
 * Backend may return uom_id/uom_name/base_uom_id instead of unit_id/unit_name.
 */
/**
 * Maps raw backend item fields to frontend ItemListItem fields cautiously.
 */
function mapItemFields(raw: Partial<ItemListItem> & Record<string, unknown>): ItemListItem {
  // Extract fields with defaults to ensure ItemListItem compliance without 'as any'
  return {
    id: Number(raw.id || 0),
    item_id: Number(raw.item_id || raw.id || 0),
    item_code: String(raw.item_code || ''),
    item_name: String(raw.item_name || ''),
    item_name_en: raw.item_name_en ? String(raw.item_name_en) : undefined,
    standard_cost: raw.standard_cost ? Number(raw.standard_cost) : undefined,
    category_id: Number(raw.category_id || 0),
    category_name: String(raw.category_name || ''),
    unit_id: Number(raw.unit_id || raw.uom_id || raw.base_uom_id || 0),
    unit_name: String(raw.unit_name || raw.uom_name || ''),
    uom_id: Number(raw.uom_id || raw.unit_id || raw.base_uom_id || 0),
    uom_name: raw.uom_name ? String(raw.uom_name) : undefined,
    is_active: Boolean(raw.is_active ?? true),
    created_at: String(raw.created_at || new Date().toISOString()),
    // Spread remaining optional fields safely if needed, or map explicitly
    description: raw.description ? String(raw.description) : undefined,
    warehouse: raw.warehouse ? String(raw.warehouse) : undefined,
    location: raw.location ? String(raw.location) : undefined,
    preferred_vendor_id: raw.preferred_vendor_id ? Number(raw.preferred_vendor_id) : undefined,
  };
}

export const ItemMasterService = {
  getAll: async (params?: { q?: string; vendor_id?: string; limit?: number }): Promise<ListResponse<ItemListItem>> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Item List', params);
       let items = [...mockItems];
       
       if (params?.q) {
           const lowerQ = params.q.toLowerCase();
           items = items.filter(i => 
               i.item_code.toLowerCase().includes(lowerQ) || 
               i.item_name.toLowerCase().includes(lowerQ) ||
               (i.item_name_en?.toLowerCase() || '').includes(lowerQ)
           );
       }

        if (params?.vendor_id) {
            // Strict filtering: Only show items explicitly assigned to this vendor
            items = items.filter(i => i.preferred_vendor_id === params.vendor_id);
        }

       return {
           items: items.slice(0, params?.limit || 10), // Simulate pagination limit
           total: items.length,
           page: 1,
           limit: params?.limit || 10
       };
    }
    try {
      const response = await api.get<ItemListItem[] | {
          items?: ItemListItem[];
          data?: ItemListItem[];
          total?: number;
          count?: number;
          page?: number;
          pageSize?: number;
          limit?: number;
      }>('/item-master', { params });
      
      // Handle direct array from Axios (api.ts usually returns response.data directly)
      const rawArray = Array.isArray(response) ? response : (response.data || response.items || []);
      
      // Map backend uom_id/uom_name → frontend unit_id/unit_name
      const itemsArray = (rawArray as (Partial<ItemListItem> & Record<string, unknown>)[]).map((item) => mapItemFields(item));
      
      return {
          items: itemsArray,
          total: itemsArray.length,
          page: 1,
          limit: itemsArray.length || 10
      };
    } catch (error) {
      logger.error('[ItemMasterService] getAll error:', error);
      return { items: [], total: 0 };
    }
  },

  getById: async (id: number): Promise<ItemListItem | null> => {
      if (USE_MOCK) {
          return mockItems.find(i => i.item_id === id) || null;
      }
      try {
          const raw = await api.get<Record<string, unknown>>(`/items/${id}`);
          if (!raw) return null;
          // Map backend uom_id/uom_name → frontend unit_id/unit_name
          return mapItemFields(raw);
      } catch (error) {
          logger.error('[ItemMasterService] getById error:', error);
          return null;
      }
  },

  create: async (data: ItemMasterFormData): Promise<boolean> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Create Item:', data);
        return true; 
    }
    try {
        await api.post<SuccessResponse>('/items', data);
        return true;
    } catch (error) {
        logger.error('[ItemMasterService] create error:', error);
        return false;
    }
  },

  update: async (id: number, data: Partial<ItemMasterFormData>): Promise<boolean> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Update Item:', id, data);
        return true;
    }
    try {
        await api.put<SuccessResponse>(`/items/${id}`, data);
        return true;
    } catch (error) {
        logger.error('[ItemMasterService] update error:', error);
        return false;
    }
  },

  delete: async (id: number): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(`/items/${id}`);
      return true;
    } catch (error) {
      logger.error('[ItemMasterService] delete error:', error);
      return false;
    }
  }
};
