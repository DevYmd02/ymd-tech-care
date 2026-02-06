import api, { USE_MOCK } from '@/core/api/api';
import type {
  PRListParams,
  PRListResponse,
  ConvertPRRequest,
  PRHeader, 
  PRFormData, 
  CreatePRPayload,
  PRLine 
} from '@/modules/procurement/types/pr-types';

export type { PRListParams, PRListResponse, ConvertPRRequest };
import { logger } from '@/shared/utils/logger';
import { MOCK_PRS } from '@/modules/procurement/mocks/procurementMocks';
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

// 1. Persistent Mock Store
let localPRData = [...MOCK_PRS];

export const PRService = {
  getList: async (params?: PRListParams): Promise<PRListResponse> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving PR List', params);
       
       let filtered = [...localPRData];

       // 1. Filter by Keyword (PR No)
       if (params?.pr_no) {
         const keyword = params.pr_no.toLowerCase();
         filtered = filtered.filter(p => p.pr_no.toLowerCase().includes(keyword));
       }

       // 2. Filter by Requester
       if (params?.requester_name) {
         const keyword = params.requester_name.toLowerCase();
         filtered = filtered.filter(p => p.requester_name.toLowerCase().includes(keyword));
       }

       // 3. Filter by Department (Cost Center)
       if (params?.department) {
         const keyword = params.department.toLowerCase();
         filtered = filtered.filter(p => p.cost_center_id.toLowerCase().includes(keyword));
       }

       // 4. Filter by Status
       if (params?.status && params.status !== 'ALL') {
          filtered = filtered.filter(p => p.status === params.status);
       }

       // 5. Filter by Date Range
       if (params?.date_from) {
         filtered = filtered.filter(p => p.request_date >= (params.date_from as string));
       }
       if (params?.date_to) {
         filtered = filtered.filter(p => p.request_date <= (params.date_to as string));
       }

       // 6. Pagination
       const sorted = filtered.sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
       const page = params?.page || 1;
       const limit = params?.limit || 20;
       const startIndex = (page - 1) * limit;
       const paginatedData = sorted.slice(startIndex, startIndex + limit);

       return {
         items: paginatedData,
         total: filtered.length,
         page,
         limit
       };
    }
    try {
      // Map Semantic Params -> Backend Params
      // pr_no -> q
      // requester_name -> created_by
      const apiParams = {
        ...params,
        q: params?.pr_no,
        created_by: params?.requester_name,
        // Remove mapped original keys if backend doesn't support them
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
    if (USE_MOCK) {
        const found = localPRData.find(p => p.pr_id === prId);
        return found || null;
    }
    try {
      return await api.get<PRHeader>(ENDPOINTS.detail(prId));
    } catch (error) {
      logger.error('[PRService] getById error:', error);
      return null;
    }
  },

  create: async (payload: CreatePRPayload): Promise<PRHeader | null> => {
    // Schema Alignment (Both Mock & Real)
    const totalEstAmount = payload.items.reduce((sum, item) => sum + (item.qty * item.price), 0);

    const apiPayload = {
        // Header Mapping
        pr_no: '', // Let backend generate or frontend if needed
        pr_date: payload.pr_date, // DateTime
        request_date: payload.pr_date, // Alias if needed
        branch_id: Number(payload.branch_id) || 1,
        warehouse_id: Number(payload.warehouse_id) || 1,
        requester_user_id: Number(payload.requester_user_id) || 1,
        
        cost_center_id: payload.department_id ? String(payload.department_id) : '1', // Backend might expect String if it's a code
        project_id: payload.project_id ? Number(payload.project_id) : undefined,
        
        remark: payload.remark || '',
        status: 'PENDING',
        currency_code: 'THB',
        exchange_rate: 1,
        total_est_amount: totalEstAmount,
        total_amount: totalEstAmount, // Alias
        payment_term_days: payload.payment_term_days || 30,

        // Additional Fields (Keep for UI even if backend doesn't fully use all)
        requester_name: payload.requester_name,
        required_date: payload.required_date || '',
        purpose: payload.remark || '', 
        delivery_date: payload.delivery_date,
        credit_days: payload.credit_days, // Legacy support
        vendor_quote_no: payload.vendor_quote_no,
        shipping_method: payload.shipping_method,
        preferred_vendor: payload.vendor_name, // Map vendor_name -> preferred_vendor string
        
        // Map Lines with full PRLine structure
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

    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Creating New PR', apiPayload);

        const now = new Date().toISOString();
        const newId = `PR-${new Date().getTime()}`;
        const prNo = apiPayload.pr_no || `PR-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${String(localPRData.length + 1).padStart(4,'0')}`;

        // Build PRLine[] with all required fields
        const prLines: PRLine[] = apiPayload.lines.map((line, idx) => ({
          pr_line_id: `PRL-${newId}-${idx + 1}`,
          pr_id: newId,
          line_no: line.line_no,
          item_id: String(line.item_id || ''),
          item_code: line.item_code,
          item_name: line.description,
          quantity: line.qty,
          uom: String(line.uom_id),
          est_unit_price: line.est_unit_price,
          est_amount: line.total_price,
          needed_date: line.needed_date,
          remark: line.remark
        }));

        // Build PRHeader with all required fields
        const newPR: PRHeader = {
          pr_id: newId,
          pr_no: prNo,
          branch_id: String(apiPayload.branch_id),
          requester_user_id: String(apiPayload.requester_user_id),
          requester_name: apiPayload.requester_name || 'Admin',
          request_date: apiPayload.request_date,
          required_date: apiPayload.required_date || now.split('T')[0],
          cost_center_id: apiPayload.cost_center_id,
          project_id: apiPayload.project_id ? String(apiPayload.project_id) : undefined,
          purpose: apiPayload.purpose || '',
          status: 'PENDING',
          currency_code: apiPayload.currency_code,
          total_amount: totalEstAmount,
          attachment_count: 0,
          created_at: now,
          updated_at: now,
          created_by_user_id: String(apiPayload.requester_user_id),
          updated_by_user_id: String(apiPayload.requester_user_id),
          delivery_date: apiPayload.delivery_date,
          credit_days: apiPayload.credit_days,
          vendor_quote_no: apiPayload.vendor_quote_no,
          shipping_method: apiPayload.shipping_method,
          vendor_name: apiPayload.preferred_vendor,
          lines: prLines
        };

        localPRData.unshift(newPR);
        return newPR;
    }

    try {
        return await api.post<PRHeader>(ENDPOINTS.list, apiPayload);
    } catch (error) {
      logger.error('[PRService] create error:', error);
      return null;
    }
  },

  update: async (prId: string, data: Partial<PRFormData>): Promise<PRHeader | null> => {
    if (USE_MOCK) {
        const index = localPRData.findIndex(p => p.pr_id === prId);
        if (index !== -1) {
            const updated = { ...localPRData[index], ...data } as PRHeader;
            localPRData[index] = updated;
            return updated;
        }
        return null;
    }
    try {
      return await api.put<PRHeader>(ENDPOINTS.detail(prId), data);
    } catch (error) {
      logger.error('[PRService] update error:', error);
      return null;
    }
  },

  delete: async (prId: string): Promise<boolean> => {
    if (USE_MOCK) {
        const initialLength = localPRData.length;
        localPRData = localPRData.filter(p => p.pr_id !== prId);
        return localPRData.length < initialLength;
    }
    try {
      await api.delete<SuccessResponse>(ENDPOINTS.detail(prId));
      return true;
    } catch (error) {
      logger.error('[PRService] delete error:', error);
      return false;
    }
  },

  submit: async (prId: string): Promise<{ success: boolean; message: string }> => {
    if (USE_MOCK) {
        const index = localPRData.findIndex(p => p.pr_id === prId);
        if (index !== -1) {
            localPRData[index].status = 'PENDING'; // Assuming Submit -> Pending Approval
            return { success: true, message: 'Submitted successfully' };
        }
        return { success: false, message: 'PR Not Found' };
    }
    try {
      return await api.post<{ success: boolean; message: string }>(ENDPOINTS.submit(prId));
    } catch (error) {
      logger.error('[PRService] submit error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการส่งอนุมัติ' };
    }
  },

  approve: async (prId: string): Promise<boolean> => {
    if (USE_MOCK) {
        const index = localPRData.findIndex(p => p.pr_id === prId);
        if (index !== -1) {
            localPRData[index].status = 'APPROVED';
            return true;
        }
        return false;
    }
    try {
      await api.post<SuccessResponse>(ENDPOINTS.approve(prId), { action: 'APPROVE' });
      return true;
    } catch (error) {
      logger.error('[PRService] approve error:', error);
      return false;
    }
  },

  cancel: async (prId: string, remark?: string): Promise<{ success: boolean; message: string }> => {
    if (USE_MOCK) {
        const index = localPRData.findIndex(p => p.pr_id === prId);
        if (index !== -1) {
            localPRData[index].status = 'CANCELLED';
            return { success: true, message: 'Cancelled' };
        }
        return { success: false, message: 'PR Not Found' };
    }
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
    if (USE_MOCK) return;
    try {
      await api.post<SuccessResponse>(ENDPOINTS.reject(prId), { action: 'REJECT', reason });
    } catch (error) {
      console.error('Error rejecting PR:', error);
      throw error;
    }
  },

  deleteAttachment: async (prId: string, attachmentId: string): Promise<boolean> => {
    if (USE_MOCK) {
        const initialLength = localPRData.length;
        localPRData = localPRData.filter(p => p.pr_id !== prId);
        return localPRData.length < initialLength;
    }
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
