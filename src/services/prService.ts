/**
 * @file prService.ts
 * @description Service สำหรับจัดการข้อมูล Purchase Requisition - ตาม Database Schema
 * @usage import { prService } from '@/services/prService';
 */

import { API_BASE_URL } from './api';
import type { 
  PRHeader, 
  PRFormData, 
  PRStatus, 
  ApprovalTask 
} from '../types/pr-types';

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
// PR SERVICE - API Calls
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
   * GET /api/pr
   */
  getList: async (params?: PRListParams): Promise<PRListResponse> => {
    // TODO: Implement actual API call with axios
    console.log('prService.getList called with:', params);
    console.log('API URL:', `${API_BASE_URL}/pr`);
    
    // Placeholder response
    return {
      data: [],
      total: 0,
      page: params?.page || 1,
      limit: params?.limit || 20,
    };
  },

  /**
   * ดึงรายละเอียด PR ตาม ID
   * GET /api/pr/:id
   */
  getById: async (prId: string): Promise<PRHeader | null> => {
    // TODO: Implement actual API call
    console.log('prService.getById called with:', prId);
    console.log('API URL:', `${API_BASE_URL}/pr/${prId}`);
    return null;
  },

  // ==================== WRITE OPERATIONS ====================

  /**
   * สร้าง PR ใหม่ (สถานะ DRAFT)
   * POST /api/pr
   */
  create: async (data: PRFormData): Promise<PRHeader | null> => {
    // TODO: Implement actual API call
    console.log('prService.create called with:', data);
    console.log('API URL:', `${API_BASE_URL}/pr`);
    return null;
  },

  /**
   * อัปเดต PR (เฉพาะ DRAFT)
   * PUT /api/pr/:id
   */
  update: async (prId: string, data: Partial<PRFormData>): Promise<PRHeader | null> => {
    // TODO: Implement actual API call
    console.log('prService.update called with:', prId, data);
    console.log('API URL:', `${API_BASE_URL}/pr/${prId}`);
    return null;
  },

  /**
   * ลบ PR (เฉพาะ DRAFT)
   * DELETE /api/pr/:id
   */
  delete: async (prId: string): Promise<boolean> => {
    // TODO: Implement actual API call
    console.log('prService.delete called with:', prId);
    console.log('API URL:', `${API_BASE_URL}/pr/${prId}`);
    return false;
  },

  // ==================== WORKFLOW OPERATIONS ====================

  /**
   * ส่ง PR เพื่อขออนุมัติ (DRAFT → SUBMITTED → สร้าง approval_task)
   * POST /api/pr/:id/submit
   */
  submit: async (prId: string): Promise<{ success: boolean; message: string }> => {
    // TODO: Implement actual API call
    console.log('prService.submit called with:', prId);
    console.log('API URL:', `${API_BASE_URL}/pr/${prId}/submit`);
    return { success: false, message: 'Not implemented' };
  },

  /**
   * อนุมัติ/ปฏิเสธ PR
   * POST /api/pr/:id/approve
   */
  approve: async (request: ApprovalRequest): Promise<ApprovalResponse> => {
    // TODO: Implement actual API call
    console.log('prService.approve called with:', request);
    console.log('API URL:', `${API_BASE_URL}/pr/${request.pr_id}/approve`);
    return { success: false, message: 'Not implemented' };
  },

  /**
   * ยกเลิก PR
   * POST /api/pr/:id/cancel
   */
  cancel: async (prId: string, remark?: string): Promise<{ success: boolean; message: string }> => {
    // TODO: Implement actual API call
    console.log('prService.cancel called with:', prId, remark);
    console.log('API URL:', `${API_BASE_URL}/pr/${prId}/cancel`);
    return { success: false, message: 'Not implemented' };
  },

  /**
   * แปลง PR เป็น RFQ หรือ PO
   * POST /api/pr/:id/convert
   */
  convert: async (request: ConvertPRRequest): Promise<{ success: boolean; document_id?: string; document_no?: string }> => {
    // TODO: Implement actual API call
    console.log('prService.convert called with:', request);
    console.log('API URL:', `${API_BASE_URL}/pr/${request.pr_id}/convert`);
    return { success: false };
  },

  // ==================== ATTACHMENT OPERATIONS ====================

  /**
   * อัปโหลดไฟล์แนบ
   * POST /api/pr/:id/attachments
   */
  uploadAttachment: async (prId: string, file: File): Promise<{ success: boolean; attachment_id?: string }> => {
    // TODO: Implement actual API call with FormData
    console.log('prService.uploadAttachment called with:', prId, file.name);
    console.log('API URL:', `${API_BASE_URL}/pr/${prId}/attachments`);
    return { success: false };
  },

  /**
   * ลบไฟล์แนบ
   * DELETE /api/pr/:id/attachments/:attachmentId
   */
  deleteAttachment: async (prId: string, attachmentId: string): Promise<boolean> => {
    // TODO: Implement actual API call
    console.log('prService.deleteAttachment called with:', prId, attachmentId);
    console.log('API URL:', `${API_BASE_URL}/pr/${prId}/attachments/${attachmentId}`);
    return false;
  },

};

// ====================================================================================
// LEGACY EXPORTS - สำหรับ Backward Compatibility
// ====================================================================================

/** @deprecated ใช้ PRHeader แทน */
export type { PRDetail, PRListItem, PRItem } from '../types/pr-types';
