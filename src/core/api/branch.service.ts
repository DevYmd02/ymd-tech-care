/**
 * @file branch.service.ts
 * @description Simplified Branch Service
 */

import api, { USE_MOCK } from '@/core/api/api';
import type { 
  BranchListItem, 
  BranchDropdownItem,
  BranchCreateRequest,
  BranchUpdateRequest
} from '@/modules/master-data/types/master-data-types';
import { logger } from '@/shared/utils/logger';
import { mockBranches, mockBranchDropdown } from '@/modules/master-data/mocks/masterDataMocks';

const ENDPOINT = '/org-branches';

export const BranchService = {
  getList: async (): Promise<BranchListItem[]> => {
    if (USE_MOCK) {
       return mockBranches;
    }
    try {
      // Legacy handling: verify strictly later
      // Legacy handling: verify strictly later
      const response = await api.get<BranchListItem[]>(ENDPOINT);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = response as any;
      
      // Handle multiple response formats (Unwrapped)
      if (Array.isArray(response)) {
        return response;
      }
      if (res?.data && Array.isArray(res.data)) {
        return res.data;
      }
      
      logger.warn('[BranchService] getList: unexpected response format');
      return [];
    } catch (error) {
      logger.error('[BranchService] getList error:', error);
      return [];
    }
  },

  getDropdown: async (): Promise<BranchDropdownItem[]> => {
    if (USE_MOCK) {
       return mockBranchDropdown;
    }
    try {
      const response = await api.get<BranchDropdownItem[]>(`${ENDPOINT}/dropdown`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      logger.error('[BranchService] getDropdown error:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<BranchListItem | null> => {
    try {
      const response = await api.get<BranchListItem>(`${ENDPOINT}/${id}`);
      return response;
    } catch (error) {
      logger.error('[BranchService] getById error:', error);
      return null;
    }
  },

  create: async (data: BranchCreateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.post<unknown>(ENDPOINT, data);
      return { success: true };
    } catch (error) {
      logger.error('[BranchService] create error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างสาขา' };
    }
  },

  update: async (data: BranchUpdateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.put<unknown>(`${ENDPOINT}/${data.branch_id}`, data);
      return { success: true };
    } catch (error) {
      logger.error('[BranchService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทสาขา' };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete<unknown>(`${ENDPOINT}/${id}`);
      return true;
    } catch (error) {
      logger.error('[BranchService] delete error:', error);
      return false;
    }
  }
};
