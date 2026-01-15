/**
 * @file prService.ts
 * @description Service สำหรับจัดการข้อมูล Purchase Requisition - เชื่อมต่อกับ Backend API
 * @usage import { prService } from '@/services/prService';
 */

import api from './api';
import type { 
  PRHeader, 
  PRFormData, 
  PRStatus, 
  ApprovalTask 
} from '../types/pr-types';
import { logger } from '../utils/logger';

// ====================================================================================
// TYPE DEFINITIONS - API Request/Response
// ====================================================================================

/** Parameters สำหรับ getList */
export interface PRListParams {
  status?: PRStatus | 'ALL';
  cost_center_id?: string;
  project_id?: string;
  requester_name?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

/** Response จาก getList */
export interface PRListResponse {
  data: PRHeader[];
  total: number;
  page: number;
  limit: number;
}

/** Request สำหรับ submit PR for approval */
export interface SubmitPRRequest {
  pr_id: string;
}

/** Request สำหรับ approve/reject PR */
export interface ApprovalRequest {
  pr_id: string;
  action: 'APPROVE' | 'REJECT';
  remark?: string;
}

/** Response จาก approval action */
export interface ApprovalResponse {
  success: boolean;
  message: string;
  approval_task?: ApprovalTask;
}

/** Request สำหรับ convert PR to RFQ/PO */
export interface ConvertPRRequest {
  pr_id: string;
  convert_to: 'RFQ' | 'PO';
  line_ids?: string[];  // ถ้าไม่ระบุ = convert ทั้งหมด
}

// ====================================================================================
// PR SERVICE - API Calls (ใช้ axios จริง)
// ====================================================================================

/**
 * PR Service - API calls สำหรับ Purchase Requisition
 * 
 * @example
 * // ดึงรายการ PR
 * const response = await prService.getList({ status: 'IN_APPROVAL' });
 * 
 * // สร้าง PR ใหม่
 * const newPR = await prService.create(formData);
 * 
 * // ส่ง PR เพื่ออนุมัติ
 * await prService.submit(prId);
 * 
 * // อนุมัติ PR
 * await prService.approve({ pr_id: prId, action: 'APPROVE', remark: 'OK' });
 */
export const prService = {

  // ==================== READ OPERATIONS ====================

  /**
   * ดึงรายการ PR ทั้งหมด
   * GET /pr
   */
  getList: async (params?: PRListParams): Promise<PRListResponse> => {
    try {
      const response = await api.get<PRListResponse>('/pr', { params });
      return response.data;
    } catch (error) {
      logger.error('prService.getList error:', error);
      // Return empty data on error (fallback)
      return {
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
      };
    }
  },

  /**
   * ดึงรายละเอียด PR ตาม ID
   * GET /pr/:id
   */
  getById: async (prId: string): Promise<PRHeader | null> => {
    try {
      const response = await api.get<PRHeader>(`/pr/${prId}`);
      return response.data;
    } catch (error) {
      logger.error('prService.getById error:', error);
      return null;
    }
  },

  // ==================== WRITE OPERATIONS ====================

  /**
   * สร้าง PR ใหม่ (สถานะ DRAFT)
   * POST /pr
   */
  create: async (data: PRFormData): Promise<PRHeader | null> => {
    try {
      const response = await api.post<PRHeader>('/pr', data);
      return response.data;
    } catch (error) {
      logger.error('prService.create error:', error);
      return null;
    }
  },

  /**
   * อัปเดต PR (เฉพาะ DRAFT)
   * PUT /pr/:id
   */
  update: async (prId: string, data: Partial<PRFormData>): Promise<PRHeader | null> => {
    try {
      const response = await api.put<PRHeader>(`/pr/${prId}`, data);
      return response.data;
    } catch (error) {
      logger.error('prService.update error:', error);
      return null;
    }
  },

  /**
   * ลบ PR (เฉพาะ DRAFT)
   * DELETE /pr/:id
   */
  delete: async (prId: string): Promise<boolean> => {
    try {
      await api.delete(`/pr/${prId}`);
      return true;
    } catch (error) {
      logger.error('prService.delete error:', error);
      return false;
    }
  },

  // ==================== WORKFLOW OPERATIONS ====================

  /**
   * ส่ง PR เพื่อขออนุมัติ (DRAFT → SUBMITTED → สร้าง approval_task)
   * POST /pr/:id/submit
   */
  submit: async (prId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(`/pr/${prId}/submit`);
      return response.data;
    } catch (error) {
      logger.error('prService.submit error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการส่งอนุมัติ' };
    }
  },

  /**
   * อนุมัติ/ปฏิเสธ PR
   * POST /pr/:id/approve
   */
  approve: async (request: ApprovalRequest): Promise<ApprovalResponse> => {
    try {
      const response = await api.post<ApprovalResponse>(`/pr/${request.pr_id}/approve`, {
        action: request.action,
        remark: request.remark,
      });
      return response.data;
    } catch (error) {
      logger.error('prService.approve error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอนุมัติ' };
    }
  },

  /**
   * ยกเลิก PR
   * POST /pr/:id/cancel
   */
  cancel: async (prId: string, remark?: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(`/pr/${prId}/cancel`, { remark });
      return response.data;
    } catch (error) {
      logger.error('prService.cancel error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการยกเลิก' };
    }
  },

  /**
   * แปลง PR เป็น RFQ หรือ PO
   * POST /pr/:id/convert
   */
  convert: async (request: ConvertPRRequest): Promise<{ success: boolean; document_id?: string; document_no?: string }> => {
    try {
      const response = await api.post<{ success: boolean; document_id?: string; document_no?: string }>(
        `/pr/${request.pr_id}/convert`,
        { convert_to: request.convert_to, line_ids: request.line_ids }
      );
      return response.data;
    } catch (error) {
      logger.error('prService.convert error:', error);
      return { success: false };
    }
  },

  // ==================== ATTACHMENT OPERATIONS ====================

  /**
   * อัปโหลดไฟล์แนบ
   * POST /pr/:id/attachments
   */
  uploadAttachment: async (prId: string, file: File): Promise<{ success: boolean; attachment_id?: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post<{ success: boolean; attachment_id?: string }>(
        `/pr/${prId}/attachments`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      logger.error('prService.uploadAttachment error:', error);
      return { success: false };
    }
  },

  /**
   * ลบไฟล์แนบ
   * DELETE /pr/:id/attachments/:attachmentId
   */
  deleteAttachment: async (prId: string, attachmentId: string): Promise<boolean> => {
    try {
      await api.delete(`/pr/${prId}/attachments/${attachmentId}`);
      return true;
    } catch (error) {
      logger.error('prService.deleteAttachment error:', error);
      return false;
    }
  },

};

// ====================================================================================
// LEGACY EXPORTS - สำหรับ Backward Compatibility
// ====================================================================================

/** @deprecated ใช้ PRHeader แทน */
export type { PRDetail, PRListItem, PRItem } from '../types/pr-types';
