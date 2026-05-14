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
           // items do not have item_id in lists but mockItemBarcodes update previously did add it!
           // Let's check item_id mapping or product_id references
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
      // Reverting to /item-barcode as requested by user
      const response = await api.get<ItemBarcodeRawResponse[] | { items?: ItemBarcodeRawResponse[]; data?: ItemBarcodeRawResponse[] }>('/item-barcode', { params });
      
      let rawItems: ItemBarcodeRawResponse[] = [];
      if (Array.isArray(response)) {
          rawItems = response;
      } else if (response && 'items' in response && response.items) {
          rawItems = response.items;
      } else if (response && 'data' in response && response.data) {
          rawItems = response.data;
      }

      // Map DB fields to our frontend format (ItemBarcodeListItem)
      const items: ItemBarcodeListItem[] = rawItems.map((b: ItemBarcodeRawResponse) => ({
          id: Number(b.id || b.item_barcode_id || b.barcode_id || 0), // Primary ID for table rows
          barcode_id: Number(b.item_barcode_id || b.barcode_id || b.id || 0),
          item_id: Number(b.item_id || 0),
          item_code: String(b.item_code || ''),
          item_name: String(b.item_name || ''),
          barcode: String(b.barcode || b.item_barcode_code || ''),
          uom_id: Number(b.uom_id || b.uom_id || 0),
          uom_name: String(b.uom_name || ''),
          is_primary: Boolean(b.is_primary || b.is_default || false),
          is_active: Boolean(b.is_active ?? true),
          created_at: String(b.created_at || new Date().toISOString())
      }));

      return { items, total: items.length, page: 1, limit: items.length };
    } catch (error) {
      logger.error('[ItemBarcodeService] getAll error (trying /item-barcode):', error);
      return { items: [], total: 0 };
    }
  },

  getById: async (id: number): Promise<ItemBarcode | null> => {
      try {
          const response = await api.get<ItemBarcodeRawResponse>(`/item-barcode/${id}`);
          return {
              item_barcode_id: Number(response.item_barcode_id || response.barcode_id || response.id || 0),
              item_id: Number(response.item_id || 0),
              barcode: String(response.barcode || response.item_barcode_code || ''),
              uom_id: Number(response.uom_id || response.uom_id || 0),
              is_primary: Boolean(response.is_primary || response.is_default || false),
              is_active: Boolean(response.is_active ?? true),
              item_code: String(response.item_code || ''),
              item_name: String(response.item_name || ''),
              uom_name: String(response.uom_name || ''),
              created_at: String(response.created_at || new Date().toISOString()),
              updated_at: String(response.updated_at || new Date().toISOString())
          };
      } catch (error) {
          logger.error('[ItemBarcodeService] getById error:', error);
          return null;
      }
  },

  create: async (data: ItemBarcodeCreateRequest): Promise<boolean> => {
      try {
          await api.post<SuccessResponse>('/item-barcode', data);
          return true;
      } catch (error) {
          logger.error('[ItemBarcodeService] create error:', error);
          return false;
      }
  },

  update: async (id: number, data: Partial<ItemBarcodeUpdateRequest>): Promise<boolean> => {
      try {
          await api.patch<SuccessResponse>(`/item-barcode/${id}`, data);
          return true;
      } catch (error) {
          logger.error('[ItemBarcodeService] update error:', error);
          return false;
      }
  },

  delete: async (id: number): Promise<boolean> => {
    try {
      await api.delete<SuccessResponse>(`/item-barcode/${id}`);
      return true;
    } catch (error) {
      logger.error('[ItemBarcodeService] delete error:', error);
      return false;
    }
  }
};

