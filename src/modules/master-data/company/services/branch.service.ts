import api from '@/core/api/api';
import type { 
  BranchListItem, 
  BranchDropdownItem,
  BranchCreateRequest,
  BranchUpdateRequest
} from '@/modules/master-data/types/master-data-types';
import type { PaginatedListResponse } from '@/shared/types/api-response.types';
import type { TableFilters } from '@/shared/hooks/useTableFilters';
import { logger } from '@/shared/utils/logger';

const ENDPOINT = '/org-branches';

export const BranchService = {
  getList: async (params?: Partial<TableFilters>): Promise<PaginatedListResponse<BranchListItem>> => {
    const response = await api.get<PaginatedListResponse<BranchListItem> | BranchListItem[]>(ENDPOINT, { params });
    
    // Normalize: Handle raw array response (Real API)
    if (Array.isArray(response)) {
      return {
        items: response,
        total: response.length,
        page: params?.page || 1,
        limit: params?.limit || 10
      };
    }
    
    return response;
  },

  getDropdown: async (): Promise<BranchDropdownItem[]> => {
    return api.get<BranchDropdownItem[]>(`${ENDPOINT}/dropdown`);
  },

  getById: async (id: number): Promise<BranchListItem | null> => {
    return api.get<BranchListItem>(`${ENDPOINT}/${id}`);
  },

  create: async (data: BranchCreateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.post<void>(ENDPOINT, data);
      return { success: true };
    } catch {
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างสาขา' };
    }
  },

  update: async (data: BranchUpdateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.put<void>(`${ENDPOINT}/${data.branch_id}`, data);
      return { success: true };
    } catch {
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทสาขา' };
    }
  },

  delete: async (id: number): Promise<boolean> => {
    try {
      await api.delete<void>(`${ENDPOINT}/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  toggleStatus: async (id: number, isActive: boolean): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.patch(`${ENDPOINT}/${id}/status`, { is_active: isActive });
      return { success: true };
    } catch (error) {
      logger.error('[BranchService] toggleStatus failed:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะสาขา' };
    }
  }
};
