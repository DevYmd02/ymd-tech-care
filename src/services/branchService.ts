/**
 * @file branchService.ts
 * @description Service สำหรับจัดการข้อมูล Branch (สาขา)
 * 
 * @note รองรับทั้ง Mock Data และ Real API
 * ควบคุมโดย VITE_USE_MOCK ใน .env
 */

import api, { USE_MOCK } from './api';
import { mockBranches, mockBranchDropdown } from '../__mocks__/masterDataMocks';
import type { BranchListItem, BranchDropdownItem } from '../types/master-data-types';
import { logger } from '../utils/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface BranchCreateRequest {
  branch_code: string;
  branch_name: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
}

export interface BranchUpdateRequest extends Partial<BranchCreateRequest> {
  branch_id: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export const branchService = {
  /**
   * ดึงรายการสาขาทั้งหมด
   */
  async getList(): Promise<BranchListItem[]> {
    if (USE_MOCK) {
      logger.log('[branchService] Using MOCK data');
      return mockBranches;
    }

    try {
      const response = await api.get<BranchListItem[]>('/branches');
      return response.data;
    } catch (error) {
      logger.error('[branchService] getList error:', error);
      throw error;
    }
  },

  /**
   * ดึง dropdown options สาขา (เฉพาะ active)
   */
  async getDropdown(): Promise<BranchDropdownItem[]> {
    if (USE_MOCK) {
      logger.log('[branchService] Using MOCK dropdown');
      return mockBranchDropdown;
    }

    try {
      const response = await api.get<BranchDropdownItem[]>('/branches/dropdown');
      return response.data;
    } catch (error) {
      logger.error('[branchService] getDropdown error:', error);
      throw error;
    }
  },

  /**
   * ดึงข้อมูลสาขาตาม ID
   */
  async getById(id: string): Promise<BranchListItem | null> {
    if (USE_MOCK) {
      return mockBranches.find(b => b.branch_id === id) || null;
    }

    try {
      const response = await api.get<BranchListItem>(`/branches/${id}`);
      return response.data;
    } catch (error) {
      logger.error('[branchService] getById error:', error);
      throw error;
    }
  },

  /**
   * สร้างสาขาใหม่
   */
  async create(data: BranchCreateRequest): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK) {
      logger.log('[branchService] Mock create:', data);
      return { success: true, message: 'Created (mock)' };
    }

    try {
      await api.post('/branches', data);
      return { success: true };
    } catch (error) {
      logger.error('[branchService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างสาขา' };
    }
  },

  /**
   * อัพเดทข้อมูลสาขา
   */
  async update(data: BranchUpdateRequest): Promise<{ success: boolean; message?: string }> {
    if (USE_MOCK) {
      logger.log('[branchService] Mock update:', data);
      return { success: true, message: 'Updated (mock)' };
    }

    try {
      await api.put(`/branches/${data.branch_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[branchService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทสาขา' };
    }
  },

  /**
   * ลบสาขา
   */
  async delete(id: string): Promise<boolean> {
    if (USE_MOCK) {
      logger.log('[branchService] Mock delete:', id);
      return true;
    }

    try {
      await api.delete(`/branches/${id}`);
      return true;
    } catch (error) {
      logger.error('[branchService] delete error:', error);
      return false;
    }
  },
};

export default branchService;
