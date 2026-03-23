import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockItems } from '@/modules/master-data/mocks/masterDataMocks';
import type { ItemListItem, ItemMasterFormData, ItemMaster } from '@/modules/master-data/types/master-data-types';
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
    unit_id: Number(raw.unit_id || raw.uom_id || raw.base_uom_id || raw.purchasing_unit_id || raw.purchase_uom_id || 0),
    unit_name: String(raw.unit_name || raw.uom_name || raw.base_uom_name || raw.purchasing_unit_name || ''),
    uom_id: Number(raw.uom_id || raw.unit_id || raw.base_uom_id || raw.purchasing_unit_id || raw.purchase_uom_id || 0),
    uom_name: String(raw.uom_name || raw.unit_name || raw.base_uom_name || raw.purchasing_unit_name || ''),
    purchasing_unit_id: raw.purchasing_unit_id ? Number(raw.purchasing_unit_id) : undefined,
    purchasing_unit_name: raw.purchasing_unit_name ? String(raw.purchasing_unit_name) : undefined,
    is_active: Boolean(raw.is_active ?? true),
    created_at: String(raw.created_at || new Date().toISOString()),
    // Spread remaining optional fields safely if needed, or map explicitly
    description: raw.description ? String(raw.description) : undefined,
    warehouse: raw.warehouse ? String(raw.warehouse) : undefined,
    location: raw.location ? String(raw.location) : undefined,
    preferred_vendor_id: raw.preferred_vendor_id ? Number(raw.preferred_vendor_id) : undefined,

    // 📝 Dynamic Response Fields for Master Data Lists (Mapping fix)
    base_uom_name: raw.base_uom_name ? String(raw.base_uom_name) : undefined,
    item_category_name: raw.item_category_name ? String(raw.item_category_name) : raw.category_name ? String(raw.category_name) : undefined,
    item_brand_name: raw.item_brand_name ? String(raw.item_brand_name) : undefined,
    item_type_name: raw.item_type_name ? String(raw.item_type_name) : undefined,
    item_group_name: raw.item_group_name ? String(raw.item_group_name) : undefined,
    item_class_name: raw.item_class_name ? String(raw.item_class_name) : undefined,
    item_grade_name: raw.item_grade_name ? String(raw.item_grade_name) : undefined,
    item_size_name: raw.item_size_name ? String(raw.item_size_name) : undefined,
    item_color_name: raw.item_color_name ? String(raw.item_color_name) : undefined,
    item_pattern_name: raw.item_pattern_name ? String(raw.item_pattern_name) : undefined,
  };
}

/**
 * Maps raw backend item fields to full ItemMaster fields for hydrate forms cautiously.
 */
function mapItemDetailFields(raw: Record<string, unknown>): ItemMaster {
  return {
    item_id: Number(raw.item_id || raw.id || 0),
    item_code: String(raw.item_code || ''),
    item_name: String(raw.item_name || ''),
    item_name_en: raw.item_name_en ? String(raw.item_name_en) : undefined,
    marketing_name: raw.marketing_name ? String(raw.marketing_name) : undefined,
    billing_name: raw.billing_name ? String(raw.billing_name) : undefined,
    description: raw.description ? String(raw.description) : undefined,
    warehouse: raw.warehouse ? String(raw.warehouse) : undefined,
    location: raw.location ? String(raw.location) : undefined,
    standard_cost: raw.standard_cost ? Number(raw.standard_cost) : undefined,
    barcode: raw.barcode ? String(raw.barcode) : undefined,
    category_id: raw.category_id ? Number(raw.category_id) : undefined,
    category_name: String(raw.category_name || ''),
    item_type_id: raw.item_type_id ? Number(raw.item_type_id) : undefined,
    item_type_code: raw.item_type_code ? String(raw.item_type_code) : undefined,
    item_type_name: raw.item_type_name ? String(raw.item_type_name) : undefined,
    unit_id: raw.unit_id ? Number(raw.unit_id) : undefined,
    unit_name: String(raw.unit_name || ''),
    purchasing_unit_id: raw.purchasing_unit_id ? Number(raw.purchasing_unit_id) : undefined,
    purchasing_unit_name: raw.purchasing_unit_name ? String(raw.purchasing_unit_name) : undefined,
    sales_unit_id: raw.sales_unit_id ? Number(raw.sales_unit_id) : undefined,
    sales_unit_name: raw.sales_unit_name ? String(raw.sales_unit_name) : undefined,
    tax_code: raw.tax_code ? String(raw.tax_code) : undefined,
    is_active: Boolean(raw.is_active ?? true),
    is_on_hold: raw.is_on_hold !== undefined ? Boolean(raw.is_on_hold) : undefined,
    is_buddy: raw.is_buddy !== undefined ? Boolean(raw.is_buddy) : undefined,

    // 📝 Additional fields for form hydration
    base_uom_id: raw.base_uom_id ? Number(raw.base_uom_id) : undefined,
    purchase_uom_id: raw.purchase_uom_id ? Number(raw.purchase_uom_id) : undefined,
    sale_uom_id: raw.sale_uom_id ? Number(raw.sale_uom_id) : undefined,
    tax_code_id: raw.tax_code_id ? Number(raw.tax_code_id) : undefined,
    tax_rate: raw.tax_rate ? Number(raw.tax_rate) : undefined,
    is_batch_control: raw.is_batch_control !== undefined ? Boolean(raw.is_batch_control) : undefined,
    is_expiry_control: raw.is_expiry_control !== undefined ? Boolean(raw.is_expiry_control) : undefined,
    is_serial_control: raw.is_serial_control !== undefined ? Boolean(raw.is_serial_control) : undefined,
    shelf_life_days: raw.shelf_life_days !== undefined ? Number(raw.shelf_life_days) : undefined,
    default_issue_policy: raw.default_issue_policy ? String(raw.default_issue_policy) : undefined,
    lot_tracking_level: raw.lot_tracking_level ? String(raw.lot_tracking_level) : undefined,
    serial_tracking_level: raw.serial_tracking_level ? String(raw.serial_tracking_level) : undefined,
    costing_method: raw.costing_method ? String(raw.costing_method) : undefined,
    discount_amount: raw.discount_amount ? String(raw.discount_amount) : undefined,
    barcode_default: raw.barcode_default ? String(raw.barcode_default) : undefined,
    item_brand_id: raw.item_brand_id ? Number(raw.item_brand_id) : undefined,
    item_pattern_id: raw.item_pattern_id ? Number(raw.item_pattern_id) : undefined,
    item_design_id: raw.item_design_id ? Number(raw.item_design_id) : undefined,
    item_class_id: raw.item_class_id ? Number(raw.item_class_id) : undefined,
    item_size_id: raw.item_size_id ? Number(raw.item_size_id) : undefined,
    item_color_id: raw.item_color_id ? Number(raw.item_color_id) : undefined,
    item_group_id: raw.item_group_id ? Number(raw.item_group_id) : undefined,
    item_group_code: raw.item_group_code ? String(raw.item_group_code) : undefined,
    item_grade_id: raw.item_grade_id ? Number(raw.item_grade_id) : undefined,
    item_grade_code: raw.item_grade_code ? String(raw.item_grade_code) : undefined,
    item_category_id: raw.item_category_id ? Number(raw.item_category_id) : undefined,
    item_category_code: raw.item_category_code ? String(raw.item_category_code) : undefined,

    created_at: String(raw.created_at || new Date().toISOString()),
    updated_at: String(raw.updated_at || new Date().toISOString())
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
        total: Array.isArray(response) ? itemsArray.length : (response.total ?? response.count ?? itemsArray.length),
        page: Array.isArray(response) ? 1 : (response.page ?? 1),
        limit: Array.isArray(response) ? itemsArray.length : (response.limit ?? itemsArray.length)
      };
    } catch (error) {
      logger.error('[ItemMasterService] getAll error:', error);
      return { items: [], total: 0 };
    }
  },

  getById: async (id: number): Promise<ItemMaster | null> => {
    if (USE_MOCK) {
      const item = mockItems.find(i => i.item_id === id);
      // Map to full detail safe defaults
      return item ? mapItemDetailFields(item as unknown as Record<string, unknown>) : null;
    }
    try {
      const raw = await api.get<Record<string, unknown>>(`/item-master/${id}`);
      if (!raw) return null;
      return mapItemDetailFields(raw);
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

        item_type_id: data.item_type_id ? Number(data.item_type_id) : null,
        item_group_id: data.item_group_id ? Number(data.item_group_id) : null,
        item_category_id: data.item_category_id ? Number(data.item_category_id) : null,

        base_uom_id: Number(data.base_uom_id),
        sale_uom_id: data.sale_uom_id ? Number(data.sale_uom_id) : null,

        tax_code_id: data.tax_code_id ? Number(data.tax_code_id) : null,
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
      throw error;
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

        item_type_id: data.item_type_id ? Number(data.item_type_id) : null,
        item_group_id: data.item_group_id ? Number(data.item_group_id) : null,
        item_category_id: data.item_category_id ? Number(data.item_category_id) : null,

        base_uom_id: Number(data.base_uom_id),
        sale_uom_id: data.sale_uom_id ? Number(data.sale_uom_id) : null,

        tax_code_id: data.tax_code_id ? Number(data.tax_code_id) : null,
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
      throw error;
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
