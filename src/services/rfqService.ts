/**
 * @file rfqService.ts
 * @description Service สำหรับ RFQ Module - เตรียมพร้อมเชื่อม Backend API
 */

import api from './api';
import { MOCK_RFQS } from '../__mocks__/rfqMocks';
import type { RFQHeader, RFQListResponse, RFQFormData } from '../types/rfq-types';

// ====================================================================================
// CONFIGURATION
// ====================================================================================

const USE_MOCK = true; // Toggle to false when backend is ready
const ENDPOINTS = {
  list: '/rfq',
  detail: (id: string) => `/rfq/${id}`,
  create: '/rfq',
  sendToVendors: (id: string) => `/rfq/${id}/send`,
};

// ====================================================================================
// RFQ SERVICE
// ====================================================================================

export const rfqService = {
  /**
   * ดึงรายการ RFQ ทั้งหมด
   */
  async getList(): Promise<RFQListResponse> {
    if (USE_MOCK) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        data: MOCK_RFQS,
        total: MOCK_RFQS.length,
        page: 1,
        limit: 20,
      };
    }
    const response = await api.get<RFQListResponse>(ENDPOINTS.list);
    return response.data;
  },

  /**
   * ดึง RFQ ตาม ID
   */
  async getById(id: string): Promise<RFQHeader | null> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return MOCK_RFQS.find(rfq => rfq.rfq_id === id) || null;
    }
    const response = await api.get<{ data: RFQHeader }>(ENDPOINTS.detail(id));
    return response.data.data;
  },

  /**
   * สร้าง RFQ ใหม่
   */
  async create(data: RFQFormData): Promise<RFQHeader> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newRFQ: RFQHeader = {
        rfq_id: `rfq-${Date.now()}`,
        rfq_no: `RFQ-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(MOCK_RFQS.length + 1).padStart(4, '0')}`,
        pr_id: data.pr_id,
        pr_no: 'PR-202601-0001', // Mock
        branch_id: 'branch-001',
        branch_name: 'สำนักงานใหญ่',
        rfq_date: new Date().toISOString().split('T')[0],
        quote_due_date: data.quote_due_date,
        terms_and_conditions: data.terms_and_conditions,
        status: 'DRAFT',
        created_by_user_id: 'current-user',
        created_by_name: 'ผู้ใช้ปัจจุบัน',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vendor_count: data.vendor_ids.length,
        vendor_responded: 0,
      };
      MOCK_RFQS.push(newRFQ);
      return newRFQ;
    }
    const response = await api.post<{ data: RFQHeader }>(ENDPOINTS.create, data);
    return response.data.data;
  },

  /**
   * ส่ง RFQ ไปยังผู้ขาย
   */
  async sendToVendors(rfqId: string, vendorIds: string[]): Promise<boolean> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const rfq = MOCK_RFQS.find(r => r.rfq_id === rfqId);
      if (rfq) {
        rfq.status = 'SENT';
        rfq.vendor_count = vendorIds.length;
        rfq.updated_at = new Date().toISOString();
      }
      return true;
    }
    await api.post(ENDPOINTS.sendToVendors(rfqId), { vendor_ids: vendorIds });
    return true;
  },
};
