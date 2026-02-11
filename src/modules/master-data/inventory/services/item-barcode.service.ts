import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { mockItemBarcodes } from '@/modules/master-data/mocks/masterDataMocks';
import type { ItemBarcodeListItem } from '@/modules/master-data/types/master-data-types';
import type { ListResponse } from '@/shared/types/common-api.types';
import type { SuccessResponse } from '@/shared/types/api-response.types';

export const ItemBarcodeService = {
  getAll: async (): Promise<ListResponse<ItemBarcodeListItem>> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Item Barcode List');
       return {
           items: mockItemBarcodes,
           total: mockItemBarcodes.length,
           page: 1,
           limit: 10
       };
    }
    try {
      const response = await api.get<ListResponse<ItemBarcodeListItem>>('/item-barcodes');
      if (Array.isArray(response)) {
          return { items: response as ItemBarcodeListItem[], total: response.length, page: 1, limit: 10 };
      }
      return response;
    } catch (error) {
      logger.error('[ItemBarcodeService] getAll error:', error);
      return { items: [], total: 0 };
    }
  },

  delete: async (id: string): Promise<boolean> => {
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
