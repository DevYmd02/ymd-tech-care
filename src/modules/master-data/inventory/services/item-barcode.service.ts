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
      const response = await api.get<ListResponse<ItemBarcodeListItem>>('/item-barcodes', { params });
      if (Array.isArray(response)) {
          let items = response as ItemBarcodeListItem[];
          if (params?.item_id) {
              items = items.filter(i => i.item_id === params.item_id);
          }
          return { items, total: items.length, page: 1, limit: 10 };
      }
      return response;
    } catch (error) {
      logger.error('[ItemBarcodeService] getAll error:', error);
      return { items: [], total: 0 };
    }
  },

  getById: async (id: number): Promise<ItemBarcode | null> => {
      if (USE_MOCK) {
          const found = mockItemBarcodes.find(b => b.barcode_id === id);
          if (!found) return null;
          return {
              barcode_id: found.barcode_id,
              item_id: found.id, // Mock doesn't have item_id, mapping id as item_id for preview
              item_code: found.item_code,
              item_name: found.item_name,
              barcode: found.barcode,
              unit_name: found.unit_name,
              is_primary: found.is_primary,
              is_active: found.is_active,
              created_at: found.created_at,
              updated_at: found.created_at
          };
      }
      try {
          const response = await api.get<ItemBarcode>(`/item-barcodes/${id}`);
          return response;
      } catch (error) {
          logger.error('[ItemBarcodeService] getById error:', error);
          return null;
      }
  },

  create: async (data: ItemBarcodeCreateRequest): Promise<boolean> => {
      if (USE_MOCK) {
          logger.info('🎭 [Mock Mode] Create Item Barcode', data);
          return true;
      }
      try {
          await api.post<SuccessResponse>('/item-barcodes', data);
          return true;
      } catch (error) {
          logger.error('[ItemBarcodeService] create error:', error);
          return false;
      }
  },

  update: async (id: number, data: Partial<ItemBarcodeUpdateRequest>): Promise<boolean> => {
      if (USE_MOCK) {
          logger.info('🎭 [Mock Mode] Update Item Barcode', id, data);
          return true;
      }
      try {
          await api.patch<SuccessResponse>(`/item-barcodes/${id}`, data);
          return true;
      } catch (error) {
          logger.error('[ItemBarcodeService] update error:', error);
          return false;
      }
  },

  delete: async (id: number): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(`/item-barcodes/${id}`);
      return true;
    } catch (error) {
      logger.error('[ItemBarcodeService] delete error:', error);
      return false;
    }
  }
};

