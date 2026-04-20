/**
 * @file aq.service.ts
 * @description API service for Sales Quotation Approval (AQ)
 * @pattern Mirrors av.service.ts from Procurement domain
 */

import api from '@/core/api/api';
import type { ApproveQuotationPayload } from '../types/quotation-approve.types';

// API Endpoint constants
const ENDPOINTS = {
  pendingSQs: '/sale-quotation-approval/pending-approval',
  sqDetail: (id: string | number) => `/sale-quotation/${id}`,
  approvalList: '/sale-quotation-approval',
  approvalDetail: (id: number) => `/sale-quotation-approval/${id}`,
  updateSQ: (id: string | number) => `/sale-quotation/${id}`,
} as const;

export const AQService = {
  /**
   * ดึง SQ ที่สถานะ PENDING (รอการอนุมัติ) โดยใช้ endpoint เฉพาะ
   */
  getPendingSQs: async (): Promise<unknown[]> => {
    const res = await api.get<unknown>(ENDPOINTS.pendingSQs, {
      params: { limit: 1000, page: 1 },
    });
    // Normalize: handle { data: [...] } or array directly
    if (Array.isArray(res)) return res;
    const r = res as Record<string, unknown>;
    if (r && Array.isArray(r.data)) return r.data as unknown[];
    return [];
  },

  /**
   * ดึงรายละเอียด SQ รายตัว (เพื่อ clone ข้อมูลเข้า form)
   */
  getSQById: async (sqId: string | number): Promise<unknown> => {
    return await api.get<unknown>(ENDPOINTS.sqDetail(sqId));
  },

  /**
   * ดึงรายการ AQ ทั้งหมด (ประวัติการอนุมัติ)
   */
  getApprovalList: async (params?: Record<string, unknown>): Promise<unknown> => {
    return await api.get<unknown>(ENDPOINTS.approvalList, { params });
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
   * อัปเดตสถานะ SQ หลังอนุมัติ/ปฏิเสธ
   */
  updateSQStatus: async (sqId: string | number, status: string): Promise<unknown> => {
    return await api.patch<unknown>(ENDPOINTS.updateSQ(sqId), { status, sq_status: status });
  },
};
