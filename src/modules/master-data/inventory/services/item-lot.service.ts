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
      const response = await api.get<ItemLot[]>(`/item-master/${itemId}/lots`);
      return response || [];
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
