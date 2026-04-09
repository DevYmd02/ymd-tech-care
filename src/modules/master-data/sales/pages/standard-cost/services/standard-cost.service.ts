/**
 * @file standard-cost.service.ts
 * @description Service for managing Standard Cost Master Data
 */

import api from '@/core/api/api';
import type { 
  StandardCostHeader, 
  StandardCostFormData 
} from '../types/standard-cost.types';

export const StandardCostService = {
  /**
   * Fetch all standard cost records
   */
  getList: (params?: Record<string, string | number | boolean>) => 
    api.get<StandardCostHeader[]>('/standard-cost', { params }),

  /**
   * Fetch a single standard cost record by ID (including lines)
   */
  get: (id: number) => 
    api.get<StandardCostHeader>(`/standard-cost/${id}`),

  /**
   * Create a new standard cost record
   */
  create: async (data: StandardCostFormData): Promise<{ success: boolean; data?: StandardCostHeader; message?: string }> => {
    try {
      const payload = {
        cost_code: data.costCode,
        cost_name: data.costName,
        start_date: data.startDate,
        expire_date: data.expireDate,
        remarks: data.remarks,
        is_active: data.isActive,
        item_brand_id: data.itemBrandId,
        item_id: data.itemId,
        permit_emp_id: data.permitEmpId,
        save_emp_id: data.saveEmpId,
        docu_date: data.docuDate,
        lines: data.lines.map(line => ({
          item_id: line.itemId,
          uom_id: line.uomId,
          standard_buy_price: line.standardBuyPrice,
          standard_cost: line.standardCost,
          remarks: line.remarks
        }))
      };
      
      const response = await api.post<StandardCostHeader>('/standard-cost', payload);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'สร้างไม่สำเร็จ' };
    }
  },

  /**
   * Update an existing standard cost record
   */
  update: async (id: number, data: StandardCostFormData): Promise<{ success: boolean; data?: StandardCostHeader; message?: string }> => {
    try {
      const payload = {
        cost_code: data.costCode,
        cost_name: data.costName,
        start_date: data.startDate,
        expire_date: data.expireDate,
        remarks: data.remarks,
        is_active: data.isActive,
        item_brand_id: data.itemBrandId,
        item_id: data.itemId,
        permit_emp_id: data.permitEmpId,
        save_emp_id: data.saveEmpId,
        docu_date: data.docuDate,
        lines: data.lines.map(line => ({
          cost_line_id: line.costLineId,
          item_id: line.itemId,
          uom_id: line.uomId,
          standard_buy_price: line.standardBuyPrice,
          standard_cost: line.standardCost,
          remarks: line.remarks
        }))
      };

      const response = await api.put<StandardCostHeader>(`/standard-cost/${id}`, payload);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'บันทึกไม่สำเร็จ' };
    }
  },

  /**
   * Delete a standard cost record
   */
  delete: async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/standard-cost/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
