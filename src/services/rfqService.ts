/**
 * @file rfqService.ts
 * @description Service สำหรับ RFQ Module
 * 
 * @note รองรับทั้ง Mock Data และ Real API
 * ควบคุมโดย VITE_USE_MOCK ใน .env
 */

import api, { USE_MOCK } from './api';
import { RELATED_RFQS } from '../__mocks__/relatedMocks';
import type { RFQHeader, RFQListResponse, RFQCreateData } from '../types/rfq-types';
import { logger } from '../utils/logger';

// =============================================================================
// ENDPOINTS
// =============================================================================

const ENDPOINTS = {
  list: '/rfq',
  detail: (id: string) => `/rfq/${id}`,
  create: '/rfq',
  sendToVendors: (id: string) => `/rfq/${id}/send`,
};

// =============================================================================
// RFQ SERVICE
// =============================================================================

export const rfqService = {
  /**
   * ดึงรายการ RFQ ทั้งหมด
   */
  async getList(): Promise<RFQListResponse> {
    if (USE_MOCK) {
      logger.log('[rfqService] Using MOCK data');
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        data: RELATED_RFQS,
        total: RELATED_RFQS.length,
        page: 1,
        limit: 20,
      };
    }

    try {
      const response = await api.get<RFQListResponse>(ENDPOINTS.list);
      return response.data;
    } catch (error) {
      logger.error('[rfqService] getList error:', error);
      throw error;
    }
  },

  /**
   * ดึง RFQ ตาม ID
   */
  async getById(id: string): Promise<RFQHeader | null> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return RELATED_RFQS.find(rfq => rfq.rfq_id === id) || null;
    }

    try {
      const response = await api.get<{ data: RFQHeader }>(ENDPOINTS.detail(id));
      return response.data.data;
    } catch (error) {
      logger.error('[rfqService] getById error:', error);
      throw error;
    }
  },

  /**
   * สร้าง RFQ ใหม่
   */
  async create(data: RFQCreateData): Promise<{ success: boolean; data?: RFQHeader; message?: string }> {
    if (USE_MOCK) {
      logger.log('[rfqService] Mock create:', data);
      await new Promise(resolve => setTimeout(resolve, 500));
      const newRFQ: RFQHeader = {
        rfq_id: `rfq-${Date.now()}`,
        rfq_no: `RFQ-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(RELATED_RFQS.length + 1).padStart(4, '0')}`,
        pr_id: data.pr_id,
        pr_no: 'PR-202601-0001',
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
        vendor_count: data.vendor_ids?.length ?? 0,
        vendor_responded: 0,
      };
      return { success: true, data: newRFQ };
    }

    try {
      const response = await api.post<{ data: RFQHeader }>(ENDPOINTS.create, data);
      return { success: true, data: response.data.data };
    } catch (error) {
      logger.error('[rfqService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้าง RFQ' };
    }
  },

  /**
   * ส่ง RFQ ไปยังผู้ขาย
   */
  async sendToVendors(rfqId: string, vendorIds: string[]): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK) {
      logger.log('[rfqService] Mock sendToVendors:', rfqId, vendorIds);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    }

    try {
      await api.post(ENDPOINTS.sendToVendors(rfqId), { vendor_ids: vendorIds });
      return { success: true };
    } catch (error) {
      logger.error('[rfqService] sendToVendors error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการส่ง RFQ' };
    }
  },

  /**
   * อัพเดท RFQ
   */
  async update(id: string, data: Partial<RFQCreateData>): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK) {
      logger.log('[rfqService] Mock update:', id, data);
      return { success: true };
    }

    try {
      await api.put(ENDPOINTS.detail(id), data);
      return { success: true };
    } catch (error) {
      logger.error('[rfqService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดท RFQ' };
    }
  },

  /**
   * ลบ RFQ
   */
  async delete(id: string): Promise<boolean> {
    if (USE_MOCK) {
      logger.log('[rfqService] Mock delete:', id);
      return true;
    }

    try {
      await api.delete(ENDPOINTS.detail(id));
      return true;
    } catch (error) {
      logger.error('[rfqService] delete error:', error);
      return false;
    }
  },
};

export default rfqService;
