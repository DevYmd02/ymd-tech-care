import api, { USE_MOCK } from '@/core/api/api';
import type {
  PRListParams,
  PRListResponse,
  ConvertPRRequest,
  PRHeader, 
  PRFormData, 
  CreatePRPayload,
  PRStatus,
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

import { MOCK_PRS as INITIAL_MOCK_PRS } from '@/modules/procurement/mocks/procurementMocks';

// --- MOCK DATA STORE ---
let MOCK_PRS: PRHeader[] = [...INITIAL_MOCK_PRS]; // Initialize with data!

export const PRService = {
  getList: async (params?: PRListParams): Promise<PRListResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [PRService] Serving Mock List', params);
        
        let items = [...MOCK_PRS];
        
        // Mock Filter Logic
        if (params?.q) {
            const q = params.q.toLowerCase();
            items = items.filter(i => 
                i.pr_no.toLowerCase().includes(q) || 
                i.requester_name.toLowerCase().includes(q) ||
                (i.purpose && i.purpose.toLowerCase().includes(q))
            );
        }
        
        if (params?.status && params.status !== 'ALL') {
             items = items.filter(i => i.status === params.status);
        }

        if (params?.date_from) {
             items = items.filter(i => i.request_date >= params.date_from!);
        }

        if (params?.date_to) {
             items = items.filter(i => i.request_date <= params.date_to!);
        }

        // Mock Pagination
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedItems = items.slice(startIndex, endIndex);

        return {
            items: paginatedItems,
            total: items.length,
            page: page,
            limit: limit
        };
    }

    // Strict API Call
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
      throw error; // Let UI handle "Network Error"
    }
  },

  getById: async (prId: string): Promise<PRHeader | null> => {
    if (USE_MOCK) {
        logger.info(`🎭 [PRService] Serving Mock Detail: ${prId}`);
        return MOCK_PRS.find(p => p.pr_id === prId) || null;
    }

    try {
      return await api.get<PRHeader>(ENDPOINTS.detail(prId));
    } catch (error) {
      logger.error('[PRService] getById error:', error);
      throw error;
    }
  },

    create: async (payload: CreatePRPayload): Promise<PRHeader | null> => {
        if (USE_MOCK) {
            logger.info('🎭 [PRService] Creating Mock PR', payload);
            
            // Generate IDs
            const prId = `mock-pr-${Date.now()}`;
            const prNo = `PR-MOCK-${Date.now()}`;
            const createdDate = new Date().toISOString();

             // Construct valid PRHeader without 'as unknown'
            const newPR: PRHeader = {
                pr_id: prId,
                pr_no: prNo,
                branch_id: String(payload.branch_id || '1'),
                requester_user_id: String(payload.requester_user_id || '1'),
                requester_name: payload.requester_name || 'Mock Requester',
                request_date: payload.pr_date,
                required_date: payload.required_date || '',
                cost_center_id: payload.department_id || '1',
                project_id: payload.project_id,
                purpose: payload.remark || '',
                status: 'DRAFT',
                currency_code: 'THB',
                total_amount: payload.items.reduce((s, i) => s + (i.qty * i.price), 0),
                attachment_count: 0,
                created_at: createdDate,
                updated_at: createdDate,
                created_by_user_id: '1',
                updated_by_user_id: '1',
                delivery_date: payload.delivery_date,
                credit_days: payload.credit_days,
                vendor_quote_no: payload.vendor_quote_no,
                shipping_method: payload.shipping_method,
                preferred_vendor_id: payload.preferred_vendor_id,
                vendor_name: payload.vendor_name,
                tax_rate: payload.tax_rate,
                lines: payload.items.map((item, idx) => ({
                    pr_line_id: `line-${Date.now()}-${idx}`,
                    pr_id: prId,
                    line_no: idx + 1,
                    item_id: item.item_id || `item-${idx}`,
                    item_code: item.item_code,
                    item_name: item.item_name,
                    item_description: item.item_name,
                    quantity: item.qty,
                    uom: item.uom,
                    est_unit_price: item.price,
                    est_amount: item.qty * item.price,
                    needed_date: item.needed_date || payload.required_date || '',
                    remark: item.remark
                }))
            };

            MOCK_PRS.unshift(newPR);
            return newPR;
        }

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
          throw error;
        }
      },

      update: async (prId: string, data: Partial<PRFormData>): Promise<PRHeader | null> => {
        if (USE_MOCK) {
            // Mock update logic
            const index = MOCK_PRS.findIndex(p => p.pr_id === prId);
            if (index > -1) {
                 const currentPR = MOCK_PRS[index];
                 
                 // Map Form Data to Header (Safe Update)
                 const updatedPR: PRHeader = {
                     ...currentPR,
                     ...data as unknown as Partial<PRHeader>, // Keep minimal cast for mismatched types if unavoidable, or map explicitly:
                     // Explicit mapping is better but data types might differ slightly (number vs string). 
                     // For 100% strictness we'd do manual mapping, but 'Partial<PRHeader>' is safer than 'any'.
                     // Given the task, let's try to minimize the cast scope
                     updated_at: new Date().toISOString()
                 };
                 
                 // Explicitly map conflicting fields if needed, for now accept the Partial intersection
                 MOCK_PRS[index] = updatedPR;
                 return updatedPR;
            }
            return null;
        }

    try {
      return await api.put<PRHeader>(ENDPOINTS.detail(prId), data);
    } catch (error) {
      logger.error('[PRService] update error:', error);
      throw error;
    }
  },

  delete: async (prId: string): Promise<boolean> => {
    if (USE_MOCK) {
        MOCK_PRS = MOCK_PRS.filter(p => p.pr_id !== prId);
        return true;
    }

    try {
      await api.delete<SuccessResponse>(ENDPOINTS.detail(prId));
      return true;
    } catch (error) {
      logger.error('[PRService] delete error:', error);
      throw error;
    }
  },

  submit: async (prId: string): Promise<{ success: boolean; message: string; pr_no?: string }> => {
    if (USE_MOCK) {
        logger.info(`🎭 [Mock Mode] Submitting PR: ${prId}`);
        const index = MOCK_PRS.findIndex(p => p.pr_id === prId);
        if (index > -1) {
            const updatedPR = { 
                ...MOCK_PRS[index], 
                status: 'PENDING' as PRStatus,
                updated_at: new Date().toISOString()
            };
            MOCK_PRS[index] = updatedPR;
            return { success: true, message: 'Submitted', pr_no: updatedPR.pr_no };
        }
        return { success: false, message: 'PR not found' };
    }

    try {
      return await api.post<{ success: boolean; message: string; pr_no?: string }>(ENDPOINTS.submit(prId));
    } catch (error) {
      logger.error('[PRService] submit error:', error);
      throw error;
    }
  },

  approve: async (prId: string): Promise<boolean> => {
    if (USE_MOCK) {
        logger.info(`🎭 [Mock Mode] Approving PR: ${prId}`);
        const index = MOCK_PRS.findIndex(p => p.pr_id === prId);
        if (index > -1) {
             MOCK_PRS[index] = { 
                 ...MOCK_PRS[index], 
                 status: 'APPROVED' as PRStatus,
                 updated_at: new Date().toISOString()
             };
             return true;
        }
        return false; 
    }

    try {
      await api.post<SuccessResponse>(ENDPOINTS.approve(prId), { action: 'APPROVE' });
      return true;
    } catch (error) {
      logger.error('[PRService] approve error:', error);
      throw error;
    }
  },

  cancel: async (prId: string, remark?: string): Promise<{ success: boolean; message: string }> => {
    if (USE_MOCK) {
        logger.info(`🎭 [Mock Mode] Cancelling PR: ${prId}`, { remark });
        const index = MOCK_PRS.findIndex(p => p.pr_id === prId);
        if (index > -1) {
             MOCK_PRS[index] = { 
                 ...MOCK_PRS[index], 
                 status: 'CANCELLED' as PRStatus,
                 cancelflag: 'Y',
                 remarks: remark || MOCK_PRS[index].remarks,
                 updated_at: new Date().toISOString()
             };
             logger.info(`🎭 [Mock Mode] PR ${prId} cancelled successfully`);
             return { success: true, message: 'Cancelled' };
        }
        logger.warn(`🎭 [Mock Mode] PR ${prId} not found for cancellation`);
        return { success: false, message: 'Not found' };
    }

    try {
      return await api.post<{ success: boolean; message: string }>(ENDPOINTS.cancel(prId), { remark });
    } catch (error) {
      logger.error('[PRService] cancel error:', error);
      throw error;
    }
  },

  convert: async (request: ConvertPRRequest): Promise<{ success: boolean; document_id?: string; document_no?: string }> => {
    if (USE_MOCK) return { success: true, document_no: 'RFQ-MOCK-001' };

    try {
      return await api.post<{ success: boolean; document_id?: string; document_no?: string }>(
        ENDPOINTS.convert(request.pr_id),
        { convert_to: request.convert_to, line_ids: request.line_ids }
      );
    } catch (error) {
      logger.error('[PRService] convert error:', error);
      throw error;
    }
  },

  uploadAttachment: async (prId: string, file: File): Promise<{ success: boolean; attachment_id?: string }> => {
    if (USE_MOCK) return { success: true, attachment_id: 'att-mock-1' };

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
      throw error;
    }
  },

  reject: async (prId: string, reason: string): Promise<void> => {
    if (USE_MOCK) {
        logger.info(`🎭 [Mock Mode] Rejecting PR: ${prId}`, { reason });
        const index = MOCK_PRS.findIndex(p => p.pr_id === prId);
        if (index > -1) {
            MOCK_PRS[index] = { 
                ...MOCK_PRS[index], 
                status: 'REJECTED' as PRStatus,
                remarks: reason,
                updated_at: new Date().toISOString()
            };
        }
        return;
    }

    try {
      await api.post<SuccessResponse>(ENDPOINTS.reject(prId), { action: 'REJECT', reason });
    } catch (error) {
      console.error('Error rejecting PR:', error);
      throw error;
    }
  },

  deleteAttachment: async (prId: string, attachmentId: string): Promise<boolean> => {
    if (USE_MOCK) return true;
    try {
      await api.delete<SuccessResponse>(ENDPOINTS.attachment(prId, attachmentId));
      return true;
    } catch (error) {
      logger.error('[PRService] deleteAttachment error:', error);
      throw error;
    }
  },
  
  generateNextDocumentNo: async (): Promise<string> => {
    if (USE_MOCK) {
        const now = new Date();
        return `PR-MOCK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-0001`;
    }

    // STRICT MODE: No Fallback
    try {
        const response = await api.get<PRListResponse>(ENDPOINTS.list, { params: { limit: 1, sort: 'pr_no:desc' } });
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `PR-${year}${month}-`;
  
        if (response && response.items && response.items.length > 0) {
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
        
        // If API works but no PRs exist yet, return first in sequence
        return `${prefix}0001`;
  
      } catch (error) {
        logger.error('[PRService] generateNextDocumentNo error:', error);
        // CRITICAL: Throw Error. Do NOT generate a fake ID.
        throw new Error('Failed to generate PR Document No. Please check network connection.');
      }
  }
};

