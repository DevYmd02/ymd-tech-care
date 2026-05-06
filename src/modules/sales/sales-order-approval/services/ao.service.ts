import api from '@core/api/api';
import type { ApproveSalesOrderPayload, AOListItem } from '../types/sales-order-approval.types';
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
  return (obj.so_header || obj.so || obj.sale_order || obj.sale_order_header || obj.saleOrder || obj.soHeader) as Record<string, unknown> | undefined;
};

/**
 * แปลงข้อมูล Raw จาก API ให้เป็นรูปแบบ AOListItem ที่ UI พร้อมใช้งาน
 */
const mapToAOListItem = (
  obj: Record<string, unknown>, 
  isHistory: boolean, 
  index: number,
  customerMap?: Map<string | number, string>,
  soNoMap?: Map<string | number, string>
): AOListItem => {
  const soObj = getSoHeader(obj);
  const rawSoId = obj.so_id || obj.id || obj.sale_order_id;
  const soId = typeof rawSoId === 'object' ? String((rawSoId as Record<string, unknown>)?.id || 0) : String(rawSoId || 0);
  
  // ดึงเลขที่ SO (ลำดับความสำคัญ: จาก Map Join > จากตัวแปรตรงๆ > จากอ็อบเจกต์ซ้อน > Fallback)
  const soNo = soNoMap?.get(soId) || String(
    obj['so_no'] || 
    obj['soNo'] || 
    soObj?.so_no || 
    (soId && soId !== '0' ? `SO-${soId}` : '')
  );

  const aoNo = String(obj['so_approval_no'] || obj['soApprovalNo'] || obj['ao_no'] || '');

  const soDate = String(obj.so_date || obj.sale_order_date || obj.ao_date || obj.created_at || '').split('T')[0];
  const cid = String(obj.customer_id || soObj?.customer_id || '');
  const rawCustomerName = String(
    obj.customer_name || 
    obj.customer_name_th || 
    obj.customer_name_en || 
    soObj?.customer_name || 
    soObj?.customer_name_th || 
    soObj?.customer_name_en || 
    ''
  );
  
  const customerName = (customerMap?.get(cid)) || (rawCustomerName.includes('Customer ID:') ? '' : rawCustomerName);
  const customerCode = String(obj.customer_code || soObj?.customer_code || '');
  
  const displayQuoteAmount = Number(
    obj.quote_total_amount || 
    obj.base_total_amount || 
    obj.total_amount || 
    soObj?.total_amount || 
    soObj?.quote_total_amount || 
    soObj?.base_total_amount || 
    0
  );
  const status = String(obj.status || (isHistory ? 'APPROVED' : 'PENDING')).toUpperCase();

  const isRejected = status === 'REJECTED';
  const finalQuoteAmount = isRejected ? 0 : displayQuoteAmount;
  const finalBaseAmount = isRejected ? 0 : Number(obj.base_total_amount || (finalQuoteAmount * Number(obj.exchange_rate || 1)));

  return {
    row_key: `${isHistory ? 'ao' : 'pending'}-${obj.ao_id || obj.so_approval_id || obj.id || soId || index}`,
    ao_id: Number(obj.ao_id || obj.so_approval_id || obj.id || 0),
    ao_no: aoNo,
    ao_date: String(obj.ao_date || obj.so_approval_date || '').split('T')[0],
    so_id: soId,
    so_no: soNo,
    so_date: soDate,
    customer_name: customerName,
    customer_code: customerCode,
    status,
    approval_emp_name: String(obj.approval_emp_name || obj.approved_by || ''),
    quote_total_amount: finalQuoteAmount,
    total_amount: finalQuoteAmount,
    base_total_amount: finalBaseAmount,
    currency: String(obj.currency || obj.quote_currency_code || obj.currency_code || soObj?.currency || 'THB'),
    raw: obj,
  } satisfies AOListItem;
};

export const AOService = {
  getPendingSOs: async (customerMap?: Map<string | number, string>, soNoMap?: Map<string | number, string>): Promise<AOListItem[]> => {
    const res = await api.get<unknown>(ENDPOINTS.pendingSOs, {
      params: { limit: 1000, page: 1 },
    });
    const items = extractArrayFromResponse<Record<string, unknown>>(res as object);
    return items.map((item, i) => mapToAOListItem(item, false, i, customerMap, soNoMap));
  },

  getApprovalList: async (params?: Record<string, unknown>, customerMap?: Map<string | number, string>, soNoMap?: Map<string | number, string>): Promise<AOListItem[]> => {
    const res = await api.get<unknown>(ENDPOINTS.approvalList, { 
      params: { limit: 1000, page: 1, ...params } 
    });
    const items = extractArrayFromResponse<Record<string, unknown>>(res as object);
    return items.map((item, i) => mapToAOListItem(item, true, i, customerMap, soNoMap));
  },

  getSOById: async (id: string | number) => {
    const res = await api.get<unknown>(ENDPOINTS.soDetail(id));
    return res as Record<string, unknown>;
  },

  createApproval: async (payload: ApproveSalesOrderPayload) => {
    return await api.post(ENDPOINTS.approvalList, payload);
  },

  getApprovalById: async (id: number) => {
    return await api.get(ENDPOINTS.approvalDetail(id));
  },

  updateSOStatus: async (id: string | number, status: string) => {
    return await api.patch(ENDPOINTS.updateSO(id), { status });
  }
};
