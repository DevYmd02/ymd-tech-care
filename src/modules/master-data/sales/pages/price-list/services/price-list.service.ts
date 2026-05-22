/**
 * @file PriceListService.ts
 * @description Service for managing Price List Master Data
 */

import api from '@/core/api/api';
import type { PriceListMaster, PriceListFormData,PriceListItemFormData } from '../types/price-list.types';
import { logger } from '@/shared/utils';

export const PriceListService = {
  /**
   * Fetch all price lists
   */
  getList: (params?: Record<string, string | number | boolean>) => 
    api.get<PriceListMaster[]>('/price-list', { params }),

  /**
   * Fetch a single price list by ID including items
   */
  get: (id: string) => 
    api.get<PriceListMaster>(`/price-list/${id}`),

  /**
   * Helper to clean up payload before sending to API
   * Matches the exact structure confirmed by the user's screenshots
   */
  _sanitizePayload: (data: PriceListFormData) => {
    const sanitized = {
      price_list_no: data.priceListNo,
      price_list_name: data.priceListName,
      price_list_date: new Date(data.priceListDate).toISOString(), // Use ISO string as seen in screenshot
      remark: data.remark || "",
      begin_date: data.beginDate ? new Date(data.beginDate).toISOString() : null,
      end_date: data.endDate ? new Date(data.endDate).toISOString() : null,
      branch_id: Number(data.branchId) || 0,
      customer_group_id: Number(data.customerGroupId) || 0,
      customer_id: Number(data.customerId) || 0,
      is_active: data.isActive,
      emp_dept_id: Number(data.empDeptId) || 0,
      permit_emp_id: Number(data.permitEmpId) || 0,
      save_emp_id: Number(data.saveEmpId) || 0,
      // price_list_flag: data.priceListFlag === '+' ? 'A' : data.priceListFlag === '-' ? 'S' : null,
      price_list_lines: (data.items || []).map((item: PriceListItemFormData) => ({
        remarks: item.remark || "",
        item_id: Number(item.itemId),
        item_brand_id: Number(item.itemBrandId || 0),
        item_uom_id: Number(item.itemUomId),
        unit_price: Number(item.unitPrice),
        line_discount_rate: String(item.lineDiscount).replace('%', '') || "0"
      }))
    };

    logger.debug('📦 Final Sanitized Payload:', sanitized);
    return sanitized;
  },

  /**
   * Create a new price list
   */
  create: async (data: PriceListFormData): Promise<{ success: boolean; data?: PriceListMaster; message?: string }> => {
    try {
      const payload = PriceListService._sanitizePayload(data);
      const response = await api.post<PriceListMaster>('/price-list', payload);
      return { success: true, data: response };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('❌ Create Error:', axiosError.response?.data || axiosError.message);
      return { success: false, message: axiosError.response?.data?.message || 'สร้างไม่สำเร็จ' };
    }
  },

  /**
   * Update an existing price list
   */
  update: async (id: string, data: PriceListFormData): Promise<{ success: boolean; data?: PriceListMaster; message?: string }> => {
    try {
      const payload = PriceListService._sanitizePayload(data);
      // Explicitly remove price_list_flag if it exists to match PATCH expectation
      if ('price_list_flag' in payload) {
          delete (payload as { price_list_flag?: string }).price_list_flag;
      }
      logger.debug('📡 PATCH Payload to Backend:', payload);
      const response = await api.patch<PriceListMaster>(`/price-list/${id}`, payload);
      return { success: true, data: response };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      logger.error('❌ Update Error:', axiosError.response?.data || axiosError.message);
      return { success: false, message: axiosError.response?.data?.message || 'บันทึกไม่สำเร็จ' };
    }
  },

  /**
   * Approve a price list
   */
  approve: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // Use the standard update endpoint to change only the approve_status
      await api.patch(`/price-list/${id}`, { approve_status: 'APPROVED' });
      return { success: true };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'อนุมัติไม่สำเร็จ' };
    }
  },

  /**
   * Delete a price list
   */
  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/price-list/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
