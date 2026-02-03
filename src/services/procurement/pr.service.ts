import api, { USE_MOCK } from '@/services/core/api';
import type {
  PRListParams,
  PRListResponse,
  ConvertPRRequest,
  PRHeader, 
  PRFormData, 
  CreatePRPayload 
} from '@/types/pr-types';

export type { PRListParams, PRListResponse, ConvertPRRequest };
import { logger } from '@/utils/logger';
import { MOCK_PRS } from '@/__mocks__/procurementMocks';

const ENDPOINTS = {
  list: '/pr',
  detail: (id: string) => `/pr/${id}`,
  submit: (id: string) => `/pr/${id}/submit`,
  approve: (id: string) => `/pr/${id}/approve`,
  cancel: (id: string) => `/pr/${id}/cancel`,
  convert: (id: string) => `/pr/${id}/convert`,
  attachments: (id: string) => `/pr/${id}/attachments`,
  attachment: (id: string, attachmentId: string) => `/pr/${id}/attachments/${attachmentId}`,
};

export const PRService = {
  getList: async (params?: PRListParams): Promise<PRListResponse> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving PR List');
       return {
         data: MOCK_PRS,
         total: MOCK_PRS.length,
         page: 1,
         limit: 100
       };
    }
    try {
      const response = await api.get<PRListResponse>(ENDPOINTS.list, { params });
      return response.data;
    } catch (error) {
      logger.error('[PRService] getList error:', error);
      return {
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }
  },

  getById: async (prId: string): Promise<PRHeader | null> => {
    try {
      const response = await api.get<PRHeader>(ENDPOINTS.detail(prId));
      return response.data;
    } catch (error) {
      logger.error('[PRService] getById error:', error);
      return null;
    }
  },

  create: async (payload: CreatePRPayload): Promise<PRHeader | null> => {
    try {
        // Map CreatePRPayload to API Payload (likely PRFormData structure)
        const apiPayload = {
          request_date: payload.pr_date,
          cost_center_id: payload.department_id || '',
          project_id: payload.project_id,
          requester_name: payload.requester_name,
          required_date: payload.required_date || '',
          purpose: payload.remark || '',
          
          // Additional Fields
          delivery_date: payload.delivery_date,
          credit_days: payload.credit_days,
          vendor_quote_no: payload.vendor_quote_no,
          shipping_method: payload.shipping_method,
          remarks: payload.remark,
          preferred_vendor_id: payload.preferred_vendor_id,
          vendor_name: payload.vendor_name,
          
          // Map Lines
          lines: payload.items.map(item => ({
            item_id: item.item_id || '', 
            item_code: item.item_code,
            item_name: item.item_name,
            quantity: item.qty,
            uom: item.uom,
            est_unit_price: item.price,
            est_amount: (item.qty || 0) * (item.price || 0),
            needed_date: item.needed_date || payload.required_date || '',
            remark: item.remark || ''
          }))
        };
  
        const response = await api.post<PRHeader>(ENDPOINTS.list, apiPayload);
        return response.data;
    } catch (error) {
      logger.error('[PRService] create error:', error);
      return null;
    }
  },

  update: async (prId: string, data: Partial<PRFormData>): Promise<PRHeader | null> => {
    try {
      const response = await api.put<PRHeader>(ENDPOINTS.detail(prId), data);
      return response.data;
    } catch (error) {
      logger.error('[PRService] update error:', error);
      return null;
    }
  },

  delete: async (prId: string): Promise<boolean> => {
    try {
      await api.delete(ENDPOINTS.detail(prId));
      return true;
    } catch (error) {
      logger.error('[PRService] delete error:', error);
      return false;
    }
  },

  submit: async (prId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(ENDPOINTS.submit(prId));
      return response.data;
    } catch (error) {
      logger.error('[PRService] submit error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการส่งอนุมัติ' };
    }
  },

  approve: async (prId: string): Promise<boolean> => {
    try {
      await api.post(ENDPOINTS.approve(prId), { action: 'APPROVE' });
      return true;
    } catch (error) {
      logger.error('[PRService] approve error:', error);
      return false;
    }
  },

  cancel: async (prId: string, remark?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(ENDPOINTS.cancel(prId), { remark });
      return response.data;
    } catch (error) {
      logger.error('[PRService] cancel error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการยกเลิก' };
    }
  },

  convert: async (request: ConvertPRRequest): Promise<{ success: boolean; document_id?: string; document_no?: string }> => {
    try {
      const response = await api.post<{ success: boolean; document_id?: string; document_no?: string }>(
        ENDPOINTS.convert(request.pr_id),
        { convert_to: request.convert_to, line_ids: request.line_ids }
      );
      return response.data;
    } catch (error) {
      logger.error('[PRService] convert error:', error);
      return { success: false };
    }
  },

  uploadAttachment: async (prId: string, file: File): Promise<{ success: boolean; attachment_id?: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post<{ success: boolean; attachment_id?: string }>(
        ENDPOINTS.attachments(prId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      logger.error('[PRService] uploadAttachment error:', error);
      return { success: false };
    }
  },

  deleteAttachment: async (prId: string, attachmentId: string): Promise<boolean> => {
    try {
      await api.delete(ENDPOINTS.attachment(prId, attachmentId));
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
  
        if (response.data && response.data.length > 0) {
          const latestPR = response.data[0];
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
