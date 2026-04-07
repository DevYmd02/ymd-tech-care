/**
 * @file PriceListService.ts
 * @description Service for managing Price List Master Data
 */

import api from '@/core/api/api';
import type { 
  PriceListMaster, 
  PriceListFormData 
} from '../types/price-list.types';

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
   * Create a new price list
   */
  create: async (data: PriceListFormData): Promise<{ success: boolean; data?: PriceListMaster; message?: string }> => {
    try {
      const payload = {
        price_list_no: data.priceListNo,
        price_list_name: data.priceListName,
        price_list_date: data.priceListDate,
        is_active: data.isActive,
        begin_date: data.beginDate,
        end_date: data.endDate,
        branch_id: data.branchId,
        customer_group_id: data.customerGroupId,
        customer_id: data.customerId,
        emp_dept_id: data.empDeptId,
        item_brand_id: data.itemBrandId,
        item_id: data.itemId,
        permit_emp_id: data.permitEmpId,
        remark: data.remark,
        price_list_flag: data.priceListFlag,
        items: data.items.map(item => ({
          item_id: item.itemId,
          uom_id: item.uomId,
          unit_price: item.unitPrice,
          line_discount: item.lineDiscount,
          line_discount_amnt: item.lineDiscountAmnt,
          unit_price_net: item.unitPriceNet,
          remark: item.remark
        }))
      };
      
      const response = await api.post<PriceListMaster>('/price-list', payload);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'สร้างไม่สำเร็จ' };
    }
  },

  /**
   * Update an existing price list
   */
  update: async (id: string, data: PriceListFormData): Promise<{ success: boolean; data?: PriceListMaster; message?: string }> => {
    try {
      const payload = {
        price_list_no: data.priceListNo,
        price_list_name: data.priceListName,
        price_list_date: data.priceListDate,
        is_active: data.isActive,
        begin_date: data.beginDate,
        end_date: data.endDate,
        branch_id: data.branchId,
        customer_group_id: data.customerGroupId,
        customer_id: data.customerId,
        emp_dept_id: data.empDeptId,
        item_brand_id: data.itemBrandId,
        item_id: data.itemId,
        permit_emp_id: data.permitEmpId,
        remark: data.remark,
        price_list_flag: data.priceListFlag,
        items: data.items.map(item => ({
          price_list_item_id: item.priceListItemId,
          item_id: item.itemId,
          uom_id: item.uomId,
          unit_price: item.unitPrice,
          line_discount: item.lineDiscount,
          line_discount_amnt: item.lineDiscountAmnt,
          unit_price_net: item.unitPriceNet,
          remark: item.remark
        }))
      };

      const response = await api.put<PriceListMaster>(`/price-list/${id}`, payload);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'บันทึกไม่สำเร็จ' };
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
