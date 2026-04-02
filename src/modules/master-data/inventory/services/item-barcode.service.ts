import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockItemBarcodes } from '@/modules/master-data/mocks/masterDataMocks';
import type { ItemBarcodeListItem, ItemBarcodeCreateRequest, ItemBarcodeUpdateRequest, ItemBarcode } from '@/modules/master-data/types/master-data-types';
import type { ListResponse } from '@/shared/types/common-api.types';
import type { SuccessResponse } from '@/shared/types/api-response.types';

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
      const response = await api.get<any>('/item-barcode', { params });
      
      let rawItems: any[] = [];
      if (Array.isArray(response)) {
          rawItems = response;
      } else if (response && response.items) {
          rawItems = response.items;
      } else if (response && response.data) {
          rawItems = response.data;
      }

      // Map DB fields to our frontend format (ItemBarcodeListItem)
      const items: ItemBarcodeListItem[] = rawItems.map((b: any) => ({
          id: b.id || b.item_barcode_id || b.barcode_id, // Primary ID for table rows
          barcode_id: b.item_barcode_id || b.barcode_id || b.id,
          item_id: b.item_id,
          item_code: b.item_code || '',
          item_name: b.item_name || '',
          barcode: b.barcode || b.item_barcode_code,
          unit_id: b.uom_id || b.unit_id,
          unit_name: b.unit_name || '',
          is_primary: b.is_primary || b.is_default || false,
          is_active: b.is_active ?? true,
          created_at: b.created_at || new Date().toISOString()
      }));

      return { items, total: items.length, page: 1, limit: items.length };
    } catch (error) {
      logger.error('[ItemBarcodeService] getAll error (trying /item-barcode):', error);
      return { items: [], total: 0 };
    }
  },

  getById: async (id: number): Promise<ItemBarcode | null> => {
      try {
          const response = await api.get<any>(`/item-barcode/${id}`);
          return {
              item_barcode_id: response.item_barcode_id || response.barcode_id || response.id,
              item_id: response.item_id,
              barcode: response.barcode || response.item_barcode_code,
              uom_id: response.uom_id || response.unit_id,
              is_primary: response.is_primary || response.is_default || false,
              is_active: response.is_active ?? true,
              item_code: response.item_code || '',
              item_name: response.item_name || '',
              unit_name: response.unit_name || '',
              created_at: response.created_at || new Date().toISOString(),
              updated_at: response.updated_at || new Date().toISOString()
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

