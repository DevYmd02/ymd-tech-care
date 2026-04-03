/**
 * @file area.service.ts
 * @description Service for managing Sales Area Master Data
 */

import api from '@/core/api/api';
import type { 
  SaleAreaMaster, 
  SaleAreaFormData 
} from '@/modules/master-data/sales/types/area/area.types';

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
  create: (data: SaleAreaFormData) => {
    // Map form data to snake_case API payload
    const payload = {
      sale_area_code: data.saleAreaCode,
      sale_area_name: data.saleAreaName,
      sale_area_nameeng: data.saleAreaNameEng,
      is_active: data.isActive
    };
    return api.post<{ success: boolean; data?: SaleAreaMaster; message?: string }>('/employee-sale-area', payload);
  },

  /**
   * Update an existing sales area
   */
  update: (id: string, data: Partial<SaleAreaFormData>) => {
    // Map form data to snake_case API payload
    const payload: Partial<Record<string, string | boolean>> = {};
    if (data.saleAreaCode !== undefined) payload.sale_area_code = data.saleAreaCode;
    if (data.saleAreaName !== undefined) payload.sale_area_name = data.saleAreaName;
    if (data.saleAreaNameEng !== undefined) payload.sale_area_nameeng = data.saleAreaNameEng;
    if (data.isActive !== undefined) payload.is_active = data.isActive;

    return api.put<{ success: boolean; data?: SaleAreaMaster; message?: string }>(`/employee-sale-area/${id}`, payload);
  },

  /**
   * Delete a sales area
   */
  delete: (id: string) => 
    api.delete<boolean>(`/employee-sale-area/${id}`),
};
