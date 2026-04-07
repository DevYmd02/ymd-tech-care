/**
 * @file area.service.ts
 * @description Service for managing Sales Area Master Data
 */

import api from '@/core/api/api';
import type { 
  SaleAreaMaster, 
  SaleAreaFormData 
} from '../types/area.types';

export const SaleAreaService = {
  /**
   * Fetch all sales areas
   */
  getList: (params?: Record<string, string | number | boolean>) => 
    api.get<SaleAreaMaster[]>('/employee-sale-area', { params }),

  /**
   * Fetch a single sales area by ID
   */
  get: (id: string) => 
    api.get<SaleAreaMaster>(`/employee-sale-area/${id}`),

  /**
   * Create a new sales area
   */
  create: async (data: SaleAreaFormData): Promise<{ success: boolean; data?: SaleAreaMaster; message?: string }> => {
    try {
      // Map form data to snake_case API payload
      const payload = {
        sale_area_code: data.saleAreaCode,
        sale_area_name: data.saleAreaName,
        sale_area_nameeng: data.saleAreaNameEng,
        is_active: data.isActive
      };
      const response = await api.post<SaleAreaMaster>('/employee-sale-area', payload);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'สร้างไม่สำเร็จ' };
    }
  },

  /**
   * Update an existing sales area
   */
  update: async (id: string, data: Partial<SaleAreaFormData>): Promise<{ success: boolean; data?: SaleAreaMaster; message?: string }> => {
    try {
      // Map form data to snake_case API payload
      const payload: Partial<Record<string, string | boolean>> = {};
      if (data.saleAreaCode !== undefined) payload.sale_area_code = data.saleAreaCode;
      if (data.saleAreaName !== undefined) payload.sale_area_name = data.saleAreaName;
      if (data.saleAreaNameEng !== undefined) payload.sale_area_nameeng = data.saleAreaNameEng;
      if (data.isActive !== undefined) payload.is_active = data.isActive;

      const response = await api.put<SaleAreaMaster>(`/employee-sale-area/${id}`, payload);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'บันทึกไม่สำเร็จ' };
    }
  },

  /**
   * Delete a sales area
   */
  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/employee-sale-area/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
