import api from '@core/api/api';
import type { ApproveSalesOrderPayload, AOListItem } from '../types/sales-order-approval.types';
import { SalesOrderService } from '@sales/sales-order/services/sales-order.service';
import { extractArrayFromResponse } from '@utils/clientFilterUtils';

// API Endpoint constants
const ENDPOINTS = {
  pendingSOs: '/sale-order-approval/pending-approval',
  soDetail: (id: string | number) => `/sale-order/${id}`,
  approvalList: '/sale-order-approval',
  approvalDetail: (id: number) => `/sale-order-approval/${id}`,
  updateSO: (id: string | number) => `/sale-order/${id}`,
} as const;

/**
 * Helper สำหรับหา SO Header ในรูปแบบต่างๆ ที่ API อาจจะส่งมา
 */
const getSoHeader = (obj: Record<string, unknown>) => {
  return (obj.so_header || obj.so || obj.sale_order || obj.sale_order_header) as Record<string, unknown> | undefined;
};

/**
 * แปลงข้อมูล Raw จาก API ให้เป็นรูปแบบ AOListItem ที่ UI พร้อมใช้งาน
 */
const mapToAOListItem = (
  obj: Record<string, unknown>, 
  isHistory: boolean, 
  index: number,
  customerMap?: Map<string | number, string>
): AOListItem => {
  const soObj = getSoHeader(obj);
  const soId = String(obj.so_id || obj.id || obj.sale_order_id || 0);
  
  const soNo = String(
    obj.so_no || 
    obj.sale_order_no || 
    obj.ref_no || 
    obj.ref_so_no ||
    soObj?.so_no || 
    soObj?.code || 
    soObj?.no || 
    ''
  );

  const soDate = String(obj.so_date || obj.sale_order_date || soObj?.so_date || soObj?.date || obj.ao_date || obj.created_at || '').split('T')[0];
  const cid = String(obj.customer_id || soObj?.customer_id || soObj?.id_customer || '');
  const rawCustomerName = String(obj.customer_name || obj.customer_name_th || obj.customer_name_en || soObj?.customer_name || soObj?.customer_name_th || obj.cust_name || '');
  
  // ใช้ Customer Name จาก Map ถ้ามี ถ้าไม่มีใช้จาก Raw API
  const customerName = (customerMap?.get(cid)) || (rawCustomerName.includes('Customer ID:') ? '' : rawCustomerName);
  const customerCode = String(obj.customer_code || soObj?.customer_code || soObj?.code || obj.cust_code || '');
  
  const rawQuoteAmount = Number(obj.quote_total_amount || obj.base_total_amount || obj.total_amount || 0);
  const soTotalAmount = Number(soObj?.quote_total_amount || soObj?.base_total_amount || soObj?.total_amount || 0);
  
  const displayQuoteAmount = (soTotalAmount > 0) ? soTotalAmount : rawQuoteAmount;
  const status = String(obj.status || (isHistory ? 'APPROVED' : 'PENDING')).toUpperCase();

  const isRejected = status === 'REJECTED';
  const finalQuoteAmount = isRejected ? 0 : displayQuoteAmount;
  const finalBaseAmount = isRejected ? 0 : Number(obj.base_total_amount || soObj?.base_total_amount || (finalQuoteAmount * Number(obj.exchange_rate || 1)));

  return {
    row_key: `${isHistory ? 'ao' : 'pending'}-${obj.ao_id || obj.id || soId || index}`,
    ao_id: Number(obj.ao_id || obj.id || 0),
    ao_no: String(obj.ao_no || ''),
    ao_date: String(obj.ao_date || '').split('T')[0],
    so_id: soId,
    so_no: soNo,
    so_date: soDate,
    customer_name: customerName,
    customer_code: customerCode,
    status,
    approval_emp_name: String(obj.approval_emp_name || obj.approved_by || ''),
    quote_total_amount: finalQuoteAmount,
    base_total_amount: finalBaseAmount,
    currency: String(obj.currency || obj.quote_currency_code || obj.currency_code || 'THB'),
    raw: obj,
  } satisfies AOListItem;
};

export const AOService = {
  /**
   * ดึงรายการที่รออนุมัติ และ Map ให้อยู่ในรูปแบบ AOListItem
   */
  getPendingSOs: async (customerMap?: Map<string | number, string>): Promise<AOListItem[]> => {
    const res = await api.get<unknown>(ENDPOINTS.pendingSOs, {
      params: { limit: 1000, page: 1 },
    });
    const items = extractArrayFromResponse<Record<string, unknown>>(res as object);
    return items.map((item, i) => mapToAOListItem(item, false, i, customerMap));
  },

  /**
   * ดึงประวัติการอนุมัติ และ Map ให้อยู่ในรูปแบบ AOListItem
   */
  getApprovalList: async (params?: Record<string, unknown>, customerMap?: Map<string | number, string>): Promise<AOListItem[]> => {
    const res = await api.get<unknown>(ENDPOINTS.approvalList, { 
      params: { limit: 1000, page: 1, ...params } 
    });
    const items = extractArrayFromResponse<Record<string, unknown>>(res as object);
    return items.map((item, i) => mapToAOListItem(item, true, i, customerMap));
  },

  /**
   * ดึงรายละเอียด SO รายตัว
   */
  getSOById: async (soId: string | number): Promise<unknown> => {
    return await SalesOrderService.getById(String(soId));
  },

  /**
   * ดึง AO รายตัว
   */
  getApprovalById: async (aoId: number): Promise<unknown> => {
    return await api.get<unknown>(ENDPOINTS.approvalDetail(aoId));
  },

  /**
   * สร้าง AO ใหม่ (อนุมัติ / ปฏิเสธ)
   */
  createApproval: async (payload: ApproveSalesOrderPayload): Promise<unknown> => {
    return await api.post<unknown>(ENDPOINTS.approvalList, payload);
  },

  /**
   * อัปเดตสถานะ SO
   */
  updateSOStatus: async (soId: string | number, status: string): Promise<unknown> => {
    return await api.patch<unknown>(ENDPOINTS.updateSO(soId), { status, so_status: status });
  },
};
