/**
 * @file price-level-name.service.ts
 * @description Service for managing Price Level Name Lookup Master Data
 * @endpoint /price-level
 */

import api from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import { logger } from '@/shared/utils';
import type { PriceLevelName, PriceLevelNameFormData } from '../types/price-level-name.types';

export const PriceLevelNameService = {
  /**
   * Fetch all price level names
   */
  getList: async (config?: AxiosRequestConfig, params?: Record<string, string | number | boolean>) => {
    const response = await api.get<PriceLevelName[]>('/price-level', { ...config, params });
    return response;
  },

  /**
   * Fetch a single price level name by ID
   */
  get: (id: string | number, config?: AxiosRequestConfig) =>
    api.get<PriceLevelName>(`/price-level/${id}`, config),

  /**
   * Sanitize payload for backend
   */
  _sanitizePayload: (data: PriceLevelNameFormData) => {
    return {
      code: data.code.trim(),
      name: data.name.trim(),
      level_no: Number(data.levelNo),
    };
  },

  /**
   * Create a new price level name
   */
  create: async (data: PriceLevelNameFormData): Promise<{ success: boolean; data?: PriceLevelName; message?: string }> => {
    try {
      const payload = PriceLevelNameService._sanitizePayload(data);
      logger.info('📦 POST /price-level payload:', payload);
      const response = await api.post<PriceLevelName>('/price-level', payload);
      return { success: true, data: response };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('❌ Create Error:', axiosError.response?.data || axiosError.message);
      return { success: false, message: axiosError.response?.data?.message || 'สร้างไม่สำเร็จ' };
    }
  },

  /**
   * Update an existing price level name
   */
  update: async (id: string | number, data: PriceLevelNameFormData): Promise<{ success: boolean; data?: PriceLevelName; message?: string }> => {
    try {
      // Backend for update only accepts 'name'
      const payload = {
        name: data.name.trim(),
      };
      logger.info(`📡 PATCH /price-level/${id} payload:`, payload);
      const response = await api.patch<PriceLevelName>(`/price-level/${id}`, payload);
      return { success: true, data: response };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('❌ Update Error:', axiosError.response?.data || axiosError.message);
      return { success: false, message: axiosError.response?.data?.message || 'บันทึกไม่สำเร็จ' };
    }
  },

  /**
   * Delete a price level name
   */
  delete: async (id: string | number): Promise<boolean> => {
    try {
      await api.delete(`/price-level/${id}`);
      return true;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('❌ Delete Error:', axiosError.response?.data || axiosError.message);
      return false;
    }
  },
};
