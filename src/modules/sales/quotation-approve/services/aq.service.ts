import api from '@core/api/api';
import type { ApproveQuotationPayload, AQListItem } from '../types/quotation-approve.types';
import { QuotationService } from '@sales/quotation/services/quotation.service';
import { extractArrayFromResponse } from '@utils/clientFilterUtils';

// API Endpoint constants
const ENDPOINTS = {
  pendingSQs: '/sale-quotation-approval/pending-approval',
  sqDetail: (id: string | number) => `/sale-quotation/${id}`,
  approvalList: '/sale-quotation-approval',
  approvalDetail: (id: number) => `/sale-quotation-approval/${id}`,
  updateSQ: (id: string | number) => `/sale-quotation/${id}`,
} as const;

/**
 * Helper สำหรับหา SQ Header ในรูปแบบต่างๆ ที่ API อาจจะส่งมา
 */
const getSqHeader = (obj: Record<string, unknown>) => {
  return (obj.sq_header || obj.sq || obj.sale_quotation || obj.quotation || obj.sale_quotation_header) as Record<string, unknown> | undefined;
};

/**
 * แปลงข้อมูล Raw จาก API ให้เป็นรูปแบบ AQListItem ที่ UI พร้อมใช้งาน
 */
const mapToAQListItem = (
  obj: Record<string, unknown>, 
  isHistory: boolean, 
  index: number,
  customerMap?: Map<string | number, string>
): AQListItem => {
  const sqObj = getSqHeader(obj);
  const sqId = Number(obj.sq_id || obj.id || obj.sale_quotation_id || obj.quotation_id || 0);
  
  const sqNo = String(
    obj.sq_no || 
    obj.sale_quotation_no || 
    obj.quotation_no || 
    obj.ref_no || 
    obj.ref_sq_no ||
    sqObj?.sq_no || 
    sqObj?.code || 
    sqObj?.no || 
    ''
  );

  const sqDate = String(obj.sq_date || obj.sale_quotation_date || sqObj?.sq_date || sqObj?.date || obj.aq_date || obj.created_at || '').split('T')[0];
  const cid = String(obj.customer_id || sqObj?.customer_id || sqObj?.id_customer || '');
  const rawCustomerName = String(obj.customer_name || obj.customer_name_th || obj.customer_name_en || sqObj?.customer_name || sqObj?.customer_name_th || obj.cust_name || '');
  
  const customerName = (customerMap?.get(cid)) || (rawCustomerName.includes('Customer ID:') ? '' : rawCustomerName);
  const customerCode = String(obj.customer_code || sqObj?.customer_code || sqObj?.code || obj.cust_code || '');
  
  const rawQuoteAmount = Number(obj.quote_total_amount || obj.base_total_amount || obj.total_amount || 0);
  const sqTotalAmount = Number(sqObj?.quote_total_amount || sqObj?.base_total_amount || sqObj?.total_amount || 0);
  
  const displayQuoteAmount = (sqTotalAmount > 0) ? sqTotalAmount : rawQuoteAmount;
  const status = String(obj.status || (isHistory ? 'APPROVED' : 'PENDING')).toUpperCase();

  const isRejected = status === 'REJECTED';
  const finalQuoteAmount = isRejected ? 0 : displayQuoteAmount;
  const finalBaseAmount = isRejected ? 0 : Number(obj.base_total_amount || sqObj?.base_total_amount || (finalQuoteAmount * Number(obj.exchange_rate || 1)));

  return {
    row_key: `${isHistory ? 'history' : 'pending'}-${obj.aq_id || obj.id || sqId || index}`,
    aq_id: Number(obj.aq_id || obj.id || 0),
    aq_no: String(obj.aq_no || ''),
    aq_date: String(obj.aq_date || '').split('T')[0],
    sq_id: sqId,
    sq_no: sqNo,
    sq_date: sqDate,
    customer_name: customerName,
    customer_code: customerCode,
    status,
    approval_emp_name: String(obj.approval_emp_name || obj.approved_by || ''),
    quote_total_amount: finalQuoteAmount,
    base_total_amount: finalBaseAmount,
    currency: String(obj.currency || obj.quote_currency_code || obj.currency_code || 'THB'),
    raw: obj,
  } satisfies AQListItem;
};

export const AQService = {
  /**
   * ดึงรายการที่รออนุมัติ
   */
  getPendingSQs: async (customerMap?: Map<string | number, string>): Promise<AQListItem[]> => {
    const res = await api.get<unknown>(ENDPOINTS.pendingSQs, {
      params: { limit: 1000, page: 1 },
    });
    const items = extractArrayFromResponse<Record<string, unknown>>(res as object);
    return items.map((item, i) => mapToAQListItem(item, false, i, customerMap));
  },

  /**
   * ดึงรายการ SQ ทั้งหมดที่มีสถานะ PENDING (Fallback Source)
   */
  getAllPendingSQsFallback: async (customerMap?: Map<string | number, string>): Promise<AQListItem[]> => {
    const res = await QuotationService.getList({
      status: 'PENDING',
      limit: 1000,
      page: 1,
    });
    const items = res.data || [];
    return items.map((item: Record<string, unknown>, i: number) => mapToAQListItem(item, false, i, customerMap));
  },

  /**
   * ดึงรายละเอียด SQ รายตัว
   */
  getSQById: async (sqId: string | number): Promise<unknown> => {
    return await QuotationService.getById(sqId);
  },

  /**
   * ดึงประวัติการอนุมัติ (AQ List)
   */
  getApprovalList: async (params?: Record<string, unknown>, customerMap?: Map<string | number, string>): Promise<AQListItem[]> => {
    const res = await api.get<unknown>(ENDPOINTS.approvalList, { 
      params: { limit: 1000, page: 1, ...params } 
    });
    const items = extractArrayFromResponse<Record<string, unknown>>(res as object);
    return items.map((item, i) => mapToAQListItem(item, true, i, customerMap));
  },

  /**
   * ดึง AQ รายตัว
   */
  getApprovalById: async (aqId: number): Promise<unknown> => {
    return await api.get<unknown>(ENDPOINTS.approvalDetail(aqId));
  },

  /**
   * สร้าง AQ ใหม่ (อนุมัติ / ปฏิเสธ)
   */
  createApproval: async (payload: ApproveQuotationPayload): Promise<unknown> => {
    return await api.post<unknown>(ENDPOINTS.approvalList, payload);
  },

  /**
   * อัปเดตสถานะ SQ
   */
  updateSQStatus: async (sqId: string | number, status: string): Promise<unknown> => {
    return await api.patch<unknown>(ENDPOINTS.updateSQ(sqId), { status, sq_status: status });
  },
};
