import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils';
import { mockItemBarcodes } from '@/modules/master-data/mocks/masterDataMocks';
import type { ItemBarcodeListItem, ItemBarcodeCreateRequest, ItemBarcodeUpdateRequest, ItemBarcode } from '@/modules/master-data/types/master-data-types';
import type { ListResponse } from '@/shared/types/api.types';
import type { SuccessResponse } from '@/shared/types/api.types';

interface ItemBarcodeRawResponse extends Record<string, unknown> {
    id?: number;
    item_barcode_id?: number;
    barcode_id?: number;
    item_id?: number;
    item_code?: string;
    item_name?: string;
    barcode?: string;
    item_barcode_code?: string;
    uom_id?: number;
    item_uom_id?: number;
    uom_name?: string;
    is_primary?: boolean;
    is_default?: boolean;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export const ItemBarcodeService = {
  getAll: async (params?: { item_id?: number; barcode?: string }): Promise<ListResponse<ItemBarcodeListItem>> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Item Barcode List', params);
       let items = mockItemBarcodes;
       if (params?.item_id) {
           items = items.filter(b => b.item_id === params.item_id);
       }
       return {
           items,
           total: items.length,
           page: 1,
           limit: 100
       };
    }
    try {
      const response = await api.get<ItemBarcodeRawResponse[] | { items?: ItemBarcodeRawResponse[]; data?: ItemBarcodeRawResponse[] }>('/item-barcodes', { params });
      
      let rawItems: ItemBarcodeRawResponse[] = [];
      if (Array.isArray(response)) {
          rawItems = response;
      } else if (response && 'items' in response && response.items) {
          rawItems = response.items;
      } else if (response && 'data' in response && response.data) {
          rawItems = response.data;
      }

      // Map DB fields to our frontend format (ItemBarcodeListItem)
      const items: ItemBarcodeListItem[] = rawItems.map((b: ItemBarcodeRawResponse) => {
          const itemObj = typeof b.item === 'object' && b.item ? (b.item as Record<string, unknown>) : null;
          const uomObj = typeof b.item_uom === 'object' && b.item_uom 
              ? (b.item_uom as Record<string, unknown>) 
              : (typeof b.uom === 'object' && b.uom ? (b.uom as Record<string, unknown>) : null);

          return {
              id: Number(b.id || b.item_barcode_id || b.barcode_id || 0), // Primary ID for table rows
              barcode_id: Number(b.item_barcode_id || b.barcode_id || b.id || 0),
              item_id: Number(b.item_id || itemObj?.item_id || itemObj?.id || 0),
              item_code: String(b.item_code || itemObj?.item_code || ''),
              item_name: String(b.item_name || itemObj?.item_name || ''),
              barcode: String(b.barcode || b.item_barcode_code || ''),
              uom_id: Number(b.item_uom_id || b.uom_id || uomObj?.uom_id || uomObj?.id || 0),
              uom_name: String(b.uom_name || uomObj?.uom_name || ''),
              is_primary: Boolean(b.is_primary || b.is_default || false),
              is_active: Boolean(b.is_active ?? true),
              created_at: String(b.created_at || new Date().toISOString())
          };
      });

      return { items, total: items.length, page: 1, limit: items.length };
    } catch (error) {
      logger.error('[ItemBarcodeService] getAll error (trying /item-barcodes):', error);
      return { items: [], total: 0 };
    }
  },

  getById: async (id: number): Promise<ItemBarcode | null> => {
      try {
          const response = await api.get<ItemBarcodeRawResponse>(`/item-barcodes/${id}`);
          const itemObj = typeof response.item === 'object' && response.item ? (response.item as Record<string, unknown>) : null;
          const uomObj = typeof response.item_uom === 'object' && response.item_uom 
              ? (response.item_uom as Record<string, unknown>) 
              : (typeof response.uom === 'object' && response.uom ? (response.uom as Record<string, unknown>) : null);

          return {
              item_barcode_id: Number(response.item_barcode_id || response.barcode_id || response.id || 0),
              item_id: Number(response.item_id || itemObj?.item_id || itemObj?.id || 0),
              barcode: String(response.barcode || response.item_barcode_code || ''),
              uom_id: Number(response.item_uom_id || response.uom_id || uomObj?.uom_id || uomObj?.id || 0),
              is_primary: Boolean(response.is_primary || response.is_default || false),
              is_active: Boolean(response.is_active ?? true),
              item_code: String(response.item_code || itemObj?.item_code || ''),
              item_name: String(response.item_name || itemObj?.item_name || ''),
              uom_name: String(response.uom_name || uomObj?.uom_name || ''),
              created_at: String(response.created_at || new Date().toISOString()),
              updated_at: String(response.updated_at || new Date().toISOString())
          };
      } catch (error) {
          logger.error('[ItemBarcodeService] getById error:', error);
          return null;
      }
  },

  create: async (data: ItemBarcodeCreateRequest, config?: { skipToast?: boolean }): Promise<boolean> => {
      try {
          const payload = {
              barcode: data.barcode,
              item_id: data.item_id,
              item_uom_id: data.item_uom_id ?? data.uom_id,
              is_primary: data.is_primary ?? data.is_default ?? false,
              is_active: data.is_active ?? true
          };
          await api.post<SuccessResponse>('/item-barcodes', payload, config);
          return true;
      } catch (error) {
          logger.error('[ItemBarcodeService] create error:', error);
          return false;
      }
  },

  update: async (id: number, data: Partial<ItemBarcodeUpdateRequest>, config?: { skipToast?: boolean }): Promise<boolean> => {
      try {
          const payload = {
              barcode: data.barcode,
              item_id: data.item_id,
              item_uom_id: data.item_uom_id ?? data.uom_id,
              is_primary: data.is_primary ?? data.is_default,
              is_active: data.is_active
          };
          await api.patch<SuccessResponse>(`/item-barcodes/${id}`, payload, config);
          return true;
      } catch (error) {
          logger.error('[ItemBarcodeService] update error:', error);
          return false;
      }
  },

  delete: async (id: number, config?: { skipToast?: boolean }): Promise<boolean> => {
    try {
      await api.delete<SuccessResponse>(`/item-barcodes/${id}`, config);
      return true;
    } catch (error) {
      logger.error('[ItemBarcodeService] delete error:', error);
      return false;
    }
  }
};

