import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import { type ItemLot, type ItemLotFormData } from '../types/item-lot-types';

/**
 * @file item-lot.service.ts
 * @description Service for managing Item Lots (Batch control)
 */
export const ItemLotService = {
  /**
   * Fetch all lots for a specific item
   */
  getList: async (itemId: number): Promise<ItemLot[]> => {
    if (USE_MOCK) {
      logger.info('🎭 [Mock Mode] Serving Item Lots for:', itemId);
      return [];
    }
    try {
      // Use the standard /item-lot endpoint with item_id parameter
      const response = await api.get<ItemLot[] | { items: ItemLot[], total: number }>('/item-lot', { 
        params: { item_id: itemId, limit: 1000 } 
      });
      
      // Standardize response: handle both raw array and { items, total } wrapper
      const rawItems = Array.isArray(response) ? response : (response?.items || []);
      
      // Client-side Safety Filter: In case the backend ignores the item_id parameter
      // and returns all lots, we filter here to ensure UI integrity.
      const filteredItems = rawItems.filter(item => {
        const r = (item as unknown) as Record<string, unknown>;
        const recordItemId = item.item_id || r['item_id'];
        return String(recordItemId) === String(itemId);
      });

      // Normalize filtered items to ensure it follows the ItemLot interface
      return filteredItems.map(item => {
        const r = (item as unknown) as Record<string, unknown>;
        return {
          ...item,
          lot_id: item.lot_id || (r['id'] as number) || (r['lot_no_id'] as number) || 0,
          lot_no: item.lot_no || (r['lot_no_code'] as string) || (r['code'] as string) || '',
          supplier_name: item.supplier_name || (r['supplier_vendor'] as Record<string, unknown>)?.vendor_name as string || '',
          qty_stock: Number(item.qty_stock || r['balance_qty'] || 0),
          qty_reserved: Number(item.qty_reserved || r['reserve_qty'] || 0),
          qty_available: Number(item.qty_available || r['available_qty'] || 0),
        } as ItemLot;
      });
    } catch (error) {
      logger.error('[ItemLotService] getList error:', error);
      return [];
    }
  },

  /**
   * Create or Update a Lot
   */
  upsert: async (data: ItemLotFormData): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      if (data.lot_id) {
        await api.patch(`/item-lot/${data.lot_id}`, data);
      } else {
        await api.post(`/item-lot`, data);
      }
      return true;
    } catch (error) {
      logger.error('[ItemLotService] upsert error:', error);
      throw error;
    }
  },

  /**
   * Delete a Lot
   */
  delete: async (lotId: number): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete(`/item-lot/${lotId}`);
      return true;
    } catch (error) {
      logger.error('[ItemLotService] delete error:', error);
      return false;
    }
  }
};