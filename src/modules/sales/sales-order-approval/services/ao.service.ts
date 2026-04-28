/**
 * @file ao.service.ts
 * @description API service for Sales Order Approval (AO)
 * @pattern Mirrors aq.service.ts from Sales domain
 */

import api from '@core/api/api';
import type { ApproveSalesOrderPayload } from '../types/sales-order-approval.types';
import { SalesOrderService } from '@sales/sales-order/services/sales-order.service';
import { extractArrayFromResponse } from '@utils/clientFilterUtils';

// API Endpoint constants
const ENDPOINTS = {
  pendingSOs: '/sale-order-approval/pending-approval',
  soDetail: (id: string | number) => `/sale-order/${id}`,
  approvalList: '/sale-order-approval',
  approvalDetail: (id: number) => `/sale-order-approval/${id}`,
  updateSO: (id: string | number) => `/sale-order/${id}`,
} as const;

export const AOService = {
  /**
   * ดึง SO ที่สถานะ SUBMITTED หรือ PENDING (รอการอนุมัติ) โดยใช้ endpoint เฉพาะ
   */
  getPendingSOs: async (): Promise<unknown[]> => {
    const res = await api.get<unknown>(ENDPOINTS.pendingSOs, {
      params: { limit: 1000, page: 1 },
    });
    return extractArrayFromResponse<unknown>(res as object);
  },

  /**
   * ดึงรายการ SO ทั้งหมดที่มีสถานะ PENDING/SUBMITTED (Source of Truth Fallback)
   */
  getAllPendingSOsFallback: async (): Promise<unknown[]> => {
    // Assuming SUBMITTED is the status before APPROVED
    const res = await SalesOrderService.getList({
      status: 'SUBMITTED',
      limit: 1000,
      page: 1,
    });
    return res.data || [];
  },

  /**
   * ดึงรายละเอียด SO รายตัว (เพื่อ clone ข้อมูลเข้า form)
   */
  getSOById: async (soId: string | number): Promise<unknown> => {
    return await SalesOrderService.getById(String(soId));
  },

  /**
   * ดึงรายการ AO ทั้งหมด (ประวัติการอนุมัติ)
   */
  getApprovalList: async (params?: Record<string, unknown>): Promise<unknown> => {
    const res = await api.get<unknown>(ENDPOINTS.approvalList, { params });
    return res;
  },

  /**
   * ดึง AO รายตัว
   */
  getApprovalById: async (aoId: number): Promise<unknown> => {
    return await api.get<unknown>(ENDPOINTS.approvalDetail(aoId));
  },

  /**
   * สร้าง AO ใหม่ (อนุมัติ / ปฏิเสธ)
   */
  createApproval: async (payload: ApproveSalesOrderPayload): Promise<unknown> => {
    return await api.post<unknown>(ENDPOINTS.approvalList, payload);
  },

  /**
   * อัปเดตสถานะ SO หลังอนุมัติ/ปฏิเสธ
   */
  updateSOStatus: async (soId: string | number, status: string): Promise<unknown> => {
    return await api.patch<unknown>(ENDPOINTS.updateSO(soId), { status, so_status: status });
  },
};
