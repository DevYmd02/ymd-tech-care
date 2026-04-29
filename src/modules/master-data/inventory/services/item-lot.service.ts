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
      // Use the specific endpoint for item lot balance summary as requested
      const response = await api.get<ItemLot[] | { items: ItemLot[], total: number }>(`/item-lot-balance/item/${itemId}`);
      
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
        // CRITICAL: For item-lot-balance, the primary key for PATCH/GET is the 'id' of the balance record.
        // We must prioritize 'id' over 'lot_id' (which is the master lot reference).
        
        // Extract supplier vendor ID from various possible locations
        const svId = item.supplier_vendor_id || 
                    r['supplier_vendor_id'] || 
                    (r['supplier_vendor'] as Record<string, unknown>)?.vendor_id || 
                    (r['supplier_vendor'] as Record<string, unknown>)?.id;

        return {
          ...item,
          // KEEP lot_id as the Master Lot ID for consistency across the app
          lot_id: Number(r['lot_id'] || item.lot_id || r['lot_no_id'] || 0),
          // ADD lot_balance_id as the specific ID for this stock record (used for PATCH)
          lot_balance_id: Number(r['lot_balance_id'] || r['id'] || 0),
          
          lot_no: item.lot_no || (r['lot_no_code'] as string) || (r['code'] as string) || '',
          supplier_vendor_id: svId ? Number(svId) : null,
          supplier_name: item.supplier_name || (r['supplier_vendor'] as Record<string, unknown>)?.vendor_name as string || '',
          qty_stock: Number(r['qty_on_hand'] || item.qty_stock || 0),
          qty_reserved: Number(r['qty_reserved'] || item.qty_reserved || 0),
          qty_available: Number(r['qty_available'] || item.qty_available || 0),
          qty_issued: Number(r['qty_issued'] || 0),
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
      // CLEAN PAYLOAD: Backend for /item-lot (Master Lot) rejects lot_id, warehouse_id, and location_id
      const { lot_id } = data;
      const cleanData = {
        lot_no: data.lot_no,
        status: data.status,
        note: data.note,
        item_id: Number(data.item_id),
        supplier_vendor_id: data.supplier_vendor_id ? Number(data.supplier_vendor_id) : null,
        mfg_date: data.mfg_date || null,
        expiry_date: data.expiry_date || null,
      };

      if (lot_id) {
        await api.patch(`/item-lot/${lot_id}`, cleanData);
      } else {
        await api.post(`/item-lot`, cleanData);
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
  },

  /**
   * Quick Stock Adjustment
   */
  quickAdjust: async (
    balanceId: number, 
    data: Record<string, unknown>
  ): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      // Calculate quantities
      const reserved = Number(data['qty_reserved'] || 0);
      const available = Number(data['qty_on_hand']) - reserved;

      // CLEAN WHITELIST ONLY: No ID, No extra fields.
      const payload = {
        lot_id: Number(data['lot_id']), // This is the Master Lot ID
        item_id: Number(data['item_id']),
        warehouse_id: Number(data['warehouse_id']),
        location_id: Number(data['location_id']),
        qty_on_hand: Number(data['qty_on_hand']),
        qty_reserved: reserved,
        qty_available: available,
        branch_id: 1, 
        supplier_vendor_id: null,
      };

      logger.info('[ItemLotService] PATCH to:', `/item-lot-balance/${balanceId}`);
      logger.info('[ItemLotService] Payload:', payload);

      await api.patch(`/item-lot-balance/${balanceId}`, payload);
      return true;
    } catch (error) {
      logger.error('[ItemLotService] quickAdjust error:', error);
      throw error;
    }
  }
}
;