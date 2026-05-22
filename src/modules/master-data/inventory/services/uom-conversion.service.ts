import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils';
import { mockUOMConversions } from '@/modules/master-data/mocks/masterDataMocks';
import type { UOMConversionListItem, UOMConversionCreateRequest, UOMConversionUpdateRequest } from '@/modules/master-data/types/master-data-types';
import type { ListResponse, SuccessResponse, ListParams } from '@/shared/types/api.types';

interface RawUOMConversion {
  item_uom_id: number;
  item_id: number;
  from_uom_id: number;
  to_uom_id: number;
  factor: string | number;
  is_purchase_uom: boolean;
  is_active: boolean;
  item?: { item_code: string; item_name: string } | null;
  from_uom?: { uom_name?: string; uom_code?: string; uom_nameeng?: string; uom_name_en?: string } | null;
  to_uom?: { uom_name?: string; uom_code?: string; uom_nameeng?: string; uom_name_en?: string } | null;
  created_at: string;
}

interface RawListResponse {
  items?: RawUOMConversion[];
  total?: number;
  page?: number;
  limit?: number;
}

export const UOMConversionService = {
  getAll: async (params?: ListParams): Promise<ListResponse<UOMConversionListItem>> => {
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
      const response = await api.get<RawListResponse | RawUOMConversion[]>('/item-uom', { params });
      
      const rawItems = Array.isArray(response) 
        ? response 
        : (response?.items || []);
      
      const items: UOMConversionListItem[] = rawItems.map((item: RawUOMConversion) => ({
          id: item.item_uom_id,
          conversion_id: item.item_uom_id,
          item_id: item.item_id,
          item_code: item.item?.item_code || '',
          item_name: item.item?.item_name || '',
          from_unit_id: item.from_uom_id,
          from_unit_name: item.from_uom?.uom_name || item.from_uom?.uom_code || '',
          from_unit_name_en: item.from_uom?.uom_nameeng || item.from_uom?.uom_name_en || item.from_uom?.uom_code || '',
          to_unit_id: item.to_uom_id,
          to_unit_name: item.to_uom?.uom_name || item.to_uom?.uom_code || '',
          to_unit_name_en: item.to_uom?.uom_nameeng || item.to_uom?.uom_name_en || item.to_uom?.uom_code || '',
          conversion_factor: Number(item.factor || 0),
          is_purchase_unit: !!item.is_purchase_uom,
          is_active: !!item.is_active,
          created_at: item.created_at || ''
      }));

      const listResponse = response as RawListResponse;

      return { 
          items, 
          total: listResponse?.total || items.length, 
          page: listResponse?.page || 1, 
          limit: listResponse?.limit || 10 
      };
    } catch (error) {
      logger.error('[UOMConversionService] getAll error:', error);
      return { items: [], total: 0 };
    }
  },

  getById: async (id: number): Promise<UOMConversionListItem | null> => {
    if (USE_MOCK) {
        return mockUOMConversions.find(c => c.conversion_id === id) || null;
    }
    try {
        const item = await api.get<RawUOMConversion>(`/item-uom/${id}`);
        if (!item) return null;
        
        return {
            id: item.item_uom_id,
            conversion_id: item.item_uom_id,
            item_id: item.item_id,
            item_code: item.item?.item_code || '',
            item_name: item.item?.item_name || '',
            from_unit_id: item.from_uom_id,
            from_unit_name: item.from_uom?.uom_name || item.from_uom?.uom_code || '',
            from_unit_name_en: item.from_uom?.uom_nameeng || item.from_uom?.uom_name_en || item.from_uom?.uom_code || '',
            to_unit_id: item.to_uom_id,
            to_unit_name: item.to_uom?.uom_name || item.to_uom?.uom_code || '',
            to_unit_name_en: item.to_uom?.uom_nameeng || item.to_uom?.uom_name_en || item.to_uom?.uom_code || '',
            conversion_factor: Number(item.factor || 0),
            is_purchase_unit: !!item.is_purchase_uom,
            is_active: !!item.is_active,
            created_at: item.created_at || ''
        };
    } catch (error) {
        logger.error('[UOMConversionService] getById error:', error);
        return null;
    }
  },

  getByItemId: async (itemId: number): Promise<ListResponse<UOMConversionListItem>> => {
    if (USE_MOCK) {
       const filtered = mockUOMConversions.filter(c => c.item_id === itemId);
       return {
           items: filtered,
           total: filtered.length,
           page: 1,
           limit: 100
       };
    }
    try {
      const response = await api.get<RawUOMConversion[] | { items?: RawUOMConversion[] }>(`/item-uom/item/${itemId}`);
      const rawItems = Array.isArray(response) 
        ? response 
        : (response && 'items' in response && Array.isArray(response.items) ? response.items : []);
      
      const items: UOMConversionListItem[] = rawItems.map((item: RawUOMConversion) => ({
          id: item.item_uom_id,
          conversion_id: item.item_uom_id,
          item_id: item.item_id,
          item_code: item.item?.item_code || '',
          item_name: item.item?.item_name || '',
          from_unit_id: item.from_uom_id,
          from_unit_name: item.from_uom?.uom_name || item.from_uom?.uom_code || '',
          from_unit_name_en: item.from_uom?.uom_nameeng || item.from_uom?.uom_name_en || item.from_uom?.uom_code || '',
          to_unit_id: item.to_uom_id,
          to_unit_name: item.to_uom?.uom_name || item.to_uom?.uom_code || '',
          to_unit_name_en: item.to_uom?.uom_nameeng || item.to_uom?.uom_name_en || item.to_uom?.uom_code || '',
          conversion_factor: Number(item.factor || 0),
          is_purchase_unit: !!item.is_purchase_uom,
          is_active: !!item.is_active,
          created_at: item.created_at || ''
      }));
      return { items, total: items.length, page: 1, limit: items.length };
    } catch (error) {
      logger.error('[UOMConversionService] getByItemId error:', error);
      return { items: [], total: 0 };
    }
  },

  create: async (data: UOMConversionCreateRequest): Promise<SuccessResponse> => {
    if (USE_MOCK) return { success: true };
    try {
      const response = await api.post<Record<string, unknown>>('/item-uom', data);
      const isSuccess = response && typeof response === 'object' && response.success !== false;
      return { 
        success: isSuccess, 
        message: response?.message,
        data: response 
      } as SuccessResponse;
    } catch (error) {
      logger.error('[UOMConversionService] create error:', error);
      throw error;
    }
  },

  update: async (id: number, data: UOMConversionUpdateRequest): Promise<SuccessResponse> => {
    if (USE_MOCK) return { success: true };
    try {
      const response = await api.patch<Record<string, unknown>>(`/item-uom/${id}`, data);
      const isSuccess = response && typeof response === 'object' && response.success !== false;
      return { 
        success: isSuccess, 
        message: response?.message,
        data: response 
      } as SuccessResponse;
    } catch (error) {
      logger.error('[UOMConversionService] update error:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(`/item-uom/${id}`);
      return true;
    } catch (error) {
      logger.error('[UOMConversionService] delete error:', error);
      return false;
    }
  }
};
