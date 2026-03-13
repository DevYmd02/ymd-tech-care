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
function mapItemFields(raw: Record<string, unknown>): ItemListItem {
  return {
    ...(raw as unknown as ItemListItem),
    // Ensure unit_id is populated from backend uom_id or base_uom_id
    unit_id: (raw.unit_id as number) || Number(raw.uom_id || raw.base_uom_id || 0),
    unit_name: (raw.unit_name as string) || (raw.uom_name as string) || '',
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
      const itemsArray = rawArray.map((item) => mapItemFields(item as unknown as Record<string, unknown>));

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
      const raw = await api.get<ItemListItem>(`/item-master/${id}`);
      if (!raw) return null;
      // Map backend uom_id/uom_name → frontend unit_id/unit_name
      return mapItemFields(raw as unknown as Record<string, unknown>);
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
      const payload = {
        item_code: data.item_code,
        item_name: data.item_name,

        item_type_id: Number(data.item_type_id),
        item_group_id: Number(data.item_group_id),
        item_category_id: Number(data.item_category_id),

        base_uom_id: Number(data.base_uom_id),
        sale_uom_id: Number(data.sale_uom_id),

        tax_code_id: Number(data.tax_code_id),
        barcode_default: data.barcode_default || null,

        is_batch_control: Boolean(data.is_batch_control),
        is_expiry_control: Boolean(data.is_expiry_control),
        is_serial_control: Boolean(data.is_serial_control),

        standard_cost: Number(data.standard_cost) || 0,
        shelf_life_days: Number(data.shelf_life_days) || 0,

        default_issue_policy: data.default_issue_policy,
        lot_tracking_level: data.lot_tracking_level,
        serial_tracking_level: data.serial_tracking_level,

        is_active: Boolean(data.is_active),

        item_brand_id: data.item_brand_id ? Number(data.item_brand_id) : null,
        item_pattern_id: data.item_pattern_id ? Number(data.item_pattern_id) : null,
        item_design_id: data.item_design_id ? Number(data.item_design_id) : null,
        item_class_id: data.item_class_id ? Number(data.item_class_id) : null,
        item_size_id: data.item_size_id ? Number(data.item_size_id) : null,
        item_color_id: data.item_color_id ? Number(data.item_color_id) : null,
        item_grade_id: data.item_grade_id ? Number(data.item_grade_id) : null
      };
      await api.post<SuccessResponse>('/item-master', payload);
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
       const payload = {
        item_code: data.item_code,
        item_name: data.item_name,

        item_type_id: Number(data.item_type_id),
        item_group_id: Number(data.item_group_id),
        item_category_id: Number(data.item_category_id),

        base_uom_id: Number(data.base_uom_id),
        sale_uom_id: Number(data.sale_uom_id),

        tax_code_id: Number(data.tax_code_id),
        barcode_default: data.barcode_default || null,

        is_batch_control: Boolean(data.is_batch_control),
        is_expiry_control: Boolean(data.is_expiry_control),
        is_serial_control: Boolean(data.is_serial_control),

        standard_cost: Number(data.standard_cost) || 0,
        shelf_life_days: Number(data.shelf_life_days) || 0,

        default_issue_policy: data.default_issue_policy,
        lot_tracking_level: data.lot_tracking_level,
        serial_tracking_level: data.serial_tracking_level,

        is_active: Boolean(data.is_active),

        item_brand_id: data.item_brand_id ? Number(data.item_brand_id) : null,
        item_pattern_id: data.item_pattern_id ? Number(data.item_pattern_id) : null,
        item_design_id: data.item_design_id ? Number(data.item_design_id) : null,
        item_class_id: data.item_class_id ? Number(data.item_class_id) : null,
        item_size_id: data.item_size_id ? Number(data.item_size_id) : null,
        item_color_id: data.item_color_id ? Number(data.item_color_id) : null,
        item_grade_id: data.item_grade_id ? Number(data.item_grade_id) : null
      };
      await api.patch<SuccessResponse>(`/item-master/${id}`, payload);
      return true;
    } catch (error) {
      logger.error('[ItemMasterService] update error:', error);
      return false;
    }
  },

  delete: async (id: number): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(`/item-master/${id}`);
      return true;
    } catch (error) {
      logger.error('[ItemMasterService] delete error:', error);
      return false;
    }
  }
};
