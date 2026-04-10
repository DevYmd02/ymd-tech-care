/**
 * @file PriceLevelService.ts
 * @description Service for managing Price Level Master Data
 */

import api from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import type { 
  PriceLevel, 
  PriceLevelFormData 
} from '../types/price-level.types';

export const PriceLevelService = {
  /**
   * Fetch all price levels
   */
  getList: async (params?: Record<string, string | number | boolean>) => {
    const response = await api.get<PriceLevel[]>('/multi-price-item', { params });
    return response;
  },

  /**
   * Fetch a single price level by ID
   */
  get: (id: string | number) => 
    api.get<PriceLevel>(`/multi-price-item/${id}`),

  /**
   * Helper to sanitize payload for the backend
   */
  _sanitizePayload: (data: PriceLevelFormData) => {
    return {
      item_id: Number(data.itemId),
      uom_id: Number(data.uomId),
      item_from_qty: data.itemFromQty !== null && data.itemFromQty !== undefined ? Number(data.itemFromQty) : null,
      item_to_qty: data.itemToQty !== null && data.itemToQty !== undefined ? Number(data.itemToQty) : null,
      item_price1: data.itemPrice1 !== null && data.itemPrice1 !== undefined ? Number(data.itemPrice1) : null,
      item_price2: data.itemPrice2 !== null && data.itemPrice2 !== undefined ? Number(data.itemPrice2) : null,
      item_price3: data.itemPrice3 !== null && data.itemPrice3 !== undefined ? Number(data.itemPrice3) : null,
      item_price4: data.itemPrice4 !== null && data.itemPrice4 !== undefined ? Number(data.itemPrice4) : null,
      item_price5: data.itemPrice5 !== null && data.itemPrice5 !== undefined ? Number(data.itemPrice5) : null,
      item_price6: data.itemPrice6 !== null && data.itemPrice6 !== undefined ? Number(data.itemPrice6) : null,
      item_price7: data.itemPrice7 !== null && data.itemPrice7 !== undefined ? Number(data.itemPrice7) : null,
      item_price8: data.itemPrice8 !== null && data.itemPrice8 !== undefined ? Number(data.itemPrice8) : null,
      item_price9: data.itemPrice9 !== null && data.itemPrice9 !== undefined ? Number(data.itemPrice9) : null,
      item_price10: data.itemPrice10 !== null && data.itemPrice10 !== undefined ? Number(data.itemPrice10) : null,
    };
  },

  /**
   * Create a new price level
   */
  create: async (data: PriceLevelFormData): Promise<{ success: boolean; data?: PriceLevel; message?: string }> => {
    try {
      const payload = PriceLevelService._sanitizePayload(data);
      logger.info('📦 POST /multi-price-item payload:', payload);
      const response = await api.post<PriceLevel>('/multi-price-item', payload);
      return { success: true, data: response };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('❌ Create Error:', axiosError.response?.data || axiosError.message);
      return { success: false, message: axiosError.response?.data?.message || 'สร้างไม่สำเร็จ' };
    }
  },

  /**
   * Update an existing price level
   */
  update: async (id: string | number, data: PriceLevelFormData): Promise<{ success: boolean; data?: PriceLevel; message?: string }> => {
    try {
      const payload = PriceLevelService._sanitizePayload(data);
      logger.info(`📡 PATCH /multi-price-item/${id} payload:`, payload);
      const response = await api.patch<PriceLevel>(`/multi-price-item/${id}`, payload);
      return { success: true, data: response };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('❌ Update Error:', axiosError.response?.data || axiosError.message);
      return { success: false, message: axiosError.response?.data?.message || 'บันทึกไม่สำเร็จ' };
    }
  },

  /**
   * Delete a price level
   */
  delete: async (id: string | number): Promise<boolean> => {
    try {
      await api.delete(`/multi-price-item/${id}`);
      return true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('❌ Delete Error:', axiosError.response?.data || axiosError.message);
      return false;
    }
  },
};
