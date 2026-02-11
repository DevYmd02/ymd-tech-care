import api from '@/core/api/api';
import type {
  PRListParams,
  PRListResponse,
  ConvertPRRequest,
  PRHeader, 
  PRFormData, 
  CreatePRPayload,
} from '@/modules/procurement/types/pr-types';

export type { PRListParams, PRListResponse, ConvertPRRequest };
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';

const ENDPOINTS = {
  list: '/pr',
  detail: (id: string) => `/pr/${id}`,
  submit: (id: string) => `/pr/${id}/submit`,
  approve: (id: string) => `/pr/${id}/approve`,
  cancel: (id: string) => `/pr/${id}/cancel`,
  reject: (id: string) => `/pr/${id}/reject`,
  convert: (id: string) => `/pr/${id}/convert`,
  attachments: (id: string) => `/pr/${id}/attachments`,
  attachment: (id: string, attachmentId: string) => `/pr/${id}/attachments/${attachmentId}`,
};

export const PRService = {
  getList: async (params?: PRListParams): Promise<PRListResponse> => {
    try {
      // Map Semantic Params -> Backend Params
      const apiParams = {
        ...params,
        q: params?.pr_no,
        created_by: params?.requester_name,
        pr_no: undefined,
        requester_name: undefined
      };
      
      return await api.get<PRListResponse>(ENDPOINTS.list, { params: apiParams });
    } catch (error) {
      logger.error('[PRService] getList error:', error);
      return {
        items: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }
  },

  getById: async (prId: string): Promise<PRHeader | null> => {
    try {
      return await api.get<PRHeader>(ENDPOINTS.detail(prId));
    } catch (error) {
      logger.error('[PRService] getById error:', error);
      return null;
    }
  },

  create: async (payload: CreatePRPayload): Promise<PRHeader | null> => {
    const totalEstAmount = payload.items.reduce((sum, item) => sum + (item.qty * item.price), 0);

    const apiPayload = {
        pr_no: '', 
        pr_date: payload.pr_date,
        request_date: payload.pr_date,
        branch_id: Number(payload.branch_id) || 1,
        warehouse_id: Number(payload.warehouse_id) || 1,
        requester_user_id: Number(payload.requester_user_id) || 1,
        cost_center_id: payload.department_id ? String(payload.department_id) : '1',
        project_id: payload.project_id ? Number(payload.project_id) : undefined,
        remark: payload.remark || '',
        status: 'PENDING',
        currency_code: 'THB',
        exchange_rate: 1,
        total_est_amount: totalEstAmount,
        total_amount: totalEstAmount,
        payment_term_days: payload.payment_term_days || 30,
        requester_name: payload.requester_name,
        required_date: payload.required_date || '',
        purpose: payload.remark || '', 
        delivery_date: payload.delivery_date,
        credit_days: payload.credit_days,
        vendor_quote_no: payload.vendor_quote_no,
        shipping_method: payload.shipping_method,
        preferred_vendor: payload.vendor_name,
        lines: payload.items.map((item, index) => ({
          line_no: index + 1,
          item_id: Number(item.item_id) || undefined,
          item_code: item.item_code,
          description: item.item_name,
          qty: item.qty,
          uom_id: Number(item.uom_id) || 1,
          est_unit_price: item.price,
          total_price: item.qty * item.price,
          cost_center_id: payload.department_id ? String(payload.department_id) : '1',
          project_id: payload.project_id ? Number(payload.project_id) : 0, 
          needed_date: item.needed_date || payload.required_date || new Date().toISOString(),
          remark: item.remark || ''
        }))
    };

    try {
        return await api.post<PRHeader>(ENDPOINTS.list, apiPayload);
    } catch (error) {
      logger.error('[PRService] create error:', error);
      return null;
    }
  },

  update: async (prId: string, data: Partial<PRFormData>): Promise<PRHeader | null> => {
    try {
      return await api.put<PRHeader>(ENDPOINTS.detail(prId), data);
    } catch (error) {
      logger.error('[PRService] update error:', error);
      return null;
    }
  },

  delete: async (prId: string): Promise<boolean> => {
    try {
      await api.delete<SuccessResponse>(ENDPOINTS.detail(prId));
      return true;
    } catch (error) {
      logger.error('[PRService] delete error:', error);
      return false;
    }
  },

  submit: async (prId: string): Promise<{ success: boolean; message: string; pr_no?: string }> => {
    try {
      return await api.post<{ success: boolean; message: string; pr_no?: string }>(ENDPOINTS.submit(prId));
    } catch (error) {
      logger.error('[PRService] submit error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการส่งอนุมัติ' };
    }
  },

  approve: async (prId: string): Promise<boolean> => {
    try {
      await api.post<SuccessResponse>(ENDPOINTS.approve(prId), { action: 'APPROVE' });
      return true;
    } catch (error) {
      logger.error('[PRService] approve error:', error);
      return false;
    }
  },

  cancel: async (prId: string, remark?: string): Promise<{ success: boolean; message: string }> => {
    try {
      return await api.post<{ success: boolean; message: string }>(ENDPOINTS.cancel(prId), { remark });
    } catch (error) {
      logger.error('[PRService] cancel error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการยกเลิก' };
    }
  },

  convert: async (request: ConvertPRRequest): Promise<{ success: boolean; document_id?: string; document_no?: string }> => {
    try {
      return await api.post<{ success: boolean; document_id?: string; document_no?: string }>(
        ENDPOINTS.convert(request.pr_id),
        { convert_to: request.convert_to, line_ids: request.line_ids }
      );
    } catch (error) {
      logger.error('[PRService] convert error:', error);
      return { success: false };
    }
  },

  uploadAttachment: async (prId: string, file: File): Promise<{ success: boolean; attachment_id?: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      return await api.post<{ success: boolean; attachment_id?: string }>(
        ENDPOINTS.attachments(prId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    } catch (error) {
      logger.error('[PRService] uploadAttachment error:', error);
      return { success: false };
    }
  },

  reject: async (prId: string, reason: string): Promise<void> => {
    try {
      await api.post<SuccessResponse>(ENDPOINTS.reject(prId), { action: 'REJECT', reason });
    } catch (error) {
      console.error('Error rejecting PR:', error);
      throw error;
    }
  },

  deleteAttachment: async (prId: string, attachmentId: string): Promise<boolean> => {
    try {
      await api.delete<SuccessResponse>(ENDPOINTS.attachment(prId, attachmentId));
      return true;
    } catch (error) {
      logger.error('[PRService] deleteAttachment error:', error);
      return false;
    }
  },
  
  generateNextDocumentNo: async (): Promise<string> => {
    try {
        const response = await PRService.getList({ page: 1, limit: 1, sort: 'pr_no:desc' });
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `PR-${year}${month}-`;
  
        if (response.items && response.items.length > 0) {
          const latestPR = response.items[0];
          if (latestPR.pr_no && latestPR.pr_no.startsWith(prefix)) {
             const parts = latestPR.pr_no.split('-');
             if (parts.length === 3) {
               const sequence = parseInt(parts[2], 10);
               if (!isNaN(sequence)) {
                 return `${prefix}${String(sequence + 1).padStart(4, '0')}`;
               }
             }
          }
        }
        
        return `${prefix}0001`;
  
      } catch (error) {
        logger.error('[PRService] generateNextDocumentNo error:', error);
        const now = new Date();
        return `PR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-0001`;
      }
  }
};
