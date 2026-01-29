/**
 * @file PRServiceImpl.ts
 * @description Real API implementation for PR Service
 */

import api from '../api';
import type {
  IPRService,
  PRListParams,
  PRListResponse,
  ConvertPRRequest,
} from '../interfaces/IPRService';
import type { PRHeader, PRFormData } from '../../types/pr-types';
import { logger } from '../../utils/logger';

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

export class PRServiceImpl implements IPRService {
  async getList(params?: PRListParams): Promise<PRListResponse> {
    try {
      const response = await api.get<PRListResponse>(ENDPOINTS.list, { params });
      return response.data;
    } catch (error) {
      logger.error('[PRServiceImpl] getList error:', error);
      return {
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }
  }

  async getById(prId: string): Promise<PRHeader | null> {
    try {
      const response = await api.get<PRHeader>(ENDPOINTS.detail(prId));
      return response.data;
    } catch (error) {
      logger.error('[PRServiceImpl] getById error:', error);
      return null;
    }
  }

  async create(data: PRFormData): Promise<PRHeader | null> {
    try {
      const response = await api.post<PRHeader>(ENDPOINTS.list, data);
      return response.data;
    } catch (error) {
      logger.error('[PRServiceImpl] create error:', error);
      return null;
    }
  }

  async update(prId: string, data: Partial<PRFormData>): Promise<PRHeader | null> {
    try {
      const response = await api.put<PRHeader>(ENDPOINTS.detail(prId), data);
      return response.data;
    } catch (error) {
      logger.error('[PRServiceImpl] update error:', error);
      return null;
    }
  }

  async delete(prId: string): Promise<boolean> {
    try {
      await api.delete(ENDPOINTS.detail(prId));
      return true;
    } catch (error) {
      logger.error('[PRServiceImpl] delete error:', error);
      return false;
    }
  }

  async submit(prId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post<{ success: boolean; message: string }>(ENDPOINTS.submit(prId));
      return response.data;
    } catch (error) {
      logger.error('[PRServiceImpl] submit error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการส่งอนุมัติ' };
    }
  }

  async approve(prId: string): Promise<boolean> {
    try {
      await api.post(ENDPOINTS.approve(prId), { action: 'APPROVE' });
      return true;
    } catch (error) {
      logger.error('[PRServiceImpl] approve error:', error);
      return false;
    }
  }

  async cancel(prId: string, remark?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post<{ success: boolean; message: string }>(ENDPOINTS.cancel(prId), { remark });
      return response.data;
    } catch (error) {
      logger.error('[PRServiceImpl] cancel error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการยกเลิก' };
    }
  }

  async convert(request: ConvertPRRequest): Promise<{ success: boolean; document_id?: string; document_no?: string }> {
    try {
      const response = await api.post<{ success: boolean; document_id?: string; document_no?: string }>(
        ENDPOINTS.convert(request.pr_id),
        { convert_to: request.convert_to, line_ids: request.line_ids }
      );
      return response.data;
    } catch (error) {
      logger.error('[PRServiceImpl] convert error:', error);
      return { success: false };
    }
  }

  async uploadAttachment(prId: string, file: File): Promise<{ success: boolean; attachment_id?: string }> {
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
      logger.error('[PRServiceImpl] uploadAttachment error:', error);
      return { success: false };
    }
  }

  async deleteAttachment(prId: string, attachmentId: string): Promise<boolean> {
    try {
      await api.delete(ENDPOINTS.attachment(prId, attachmentId));
      return true;
    } catch (error) {
      logger.error('[PRServiceImpl] deleteAttachment error:', error);
      return false;
    }
  }
  async generateNextDocumentNo(): Promise<string> {
    try {
      // Attempt to get the latest PR to determine the next number
      // This relies on the API supporting sorting. If not, this might need adjustment.
      const response = await this.getList({ page: 1, limit: 1, sort: 'pr_no:desc' });
      
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
      
      // Default if no PRs found for this month or API fails to return matching data
      return `${prefix}0001`;

    } catch (error) {
      logger.error('[PRServiceImpl] generateNextDocumentNo error:', error);
      // Fallback in case of error
      const now = new Date();
      return `PR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-0001`;
    }
  }
}
