/**
 * @file PriceLevelService.ts
 * @description Service for managing Price Level Master Data
 */

import api from '@/core/api/api';
import type { 
  PriceLevel, 
  PriceLevelFormData 
} from '../types/price-level.types';

export const PriceLevelService = {
  /**
   * Fetch all price levels
   */
  getList: (params?: Record<string, string | number | boolean>) => 
    api.get<PriceLevel[]>('/price-level', { params }),

  /**
   * Fetch a single price level by ID
   */
  get: (id: string) => 
    api.get<PriceLevel>(`/price-level/${id}`),

  /**
   * Create a new price level
   */
  create: async (data: PriceLevelFormData): Promise<{ success: boolean; data?: PriceLevel; message?: string }> => {
    try {
      const payload = {
        item_id: data.itemId,
        uom_id: data.uomId,
        item_from_qty: data.itemFromQty,
        item_to_qty: data.itemToQty,
        item_price1: data.itemPrice1,
        item_price2: data.itemPrice2,
        item_price3: data.itemPrice3,
        item_price4: data.itemPrice4,
        item_price5: data.itemPrice5,
        item_price6: data.itemPrice6,
        item_price7: data.itemPrice7,
        item_price8: data.itemPrice8,
        item_price9: data.itemPrice9,
        item_price10: data.itemPrice10,
        listno: data.listno,
        item_name: data.itemName,
        item_name_en: data.itemNameEn,
      };
      
      const response = await api.post<PriceLevel>('/price-level', payload);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'สร้างไม่สำเร็จ' };
    }
  },

  /**
   * Update an existing price level
   */
  update: async (id: string, data: PriceLevelFormData): Promise<{ success: boolean; data?: PriceLevel; message?: string }> => {
    try {
      const payload = {
        item_id: data.itemId,
        uom_id: data.uomId,
        item_from_qty: data.itemFromQty,
        item_to_qty: data.itemToQty,
        item_price1: data.itemPrice1,
        item_price2: data.itemPrice2,
        item_price3: data.itemPrice3,
        item_price4: data.itemPrice4,
        item_price5: data.itemPrice5,
        item_price6: data.itemPrice6,
        item_price7: data.itemPrice7,
        item_price8: data.itemPrice8,
        item_price9: data.itemPrice9,
        item_price10: data.itemPrice10,
        listno: data.listno,
        item_name: data.itemName,
        item_name_en: data.itemNameEn,
      };

      const response = await api.put<PriceLevel>(`/price-level/${id}`, payload);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'บันทึกไม่สำเร็จ' };
    }
  },

  /**
   * Delete a price level
   */
  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/price-level/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
