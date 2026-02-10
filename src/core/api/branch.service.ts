import api from '@/core/api/api';
import type { 
  BranchListItem, 
  BranchDropdownItem,
  BranchCreateRequest,
  BranchUpdateRequest
} from '@/modules/master-data/types/master-data-types';

const ENDPOINT = '/org-branches';

export const BranchService = {
  getList: async (): Promise<BranchListItem[]> => {
    return api.get<BranchListItem[]>(ENDPOINT);
  },

  getDropdown: async (): Promise<BranchDropdownItem[]> => {
    return api.get<BranchDropdownItem[]>(`${ENDPOINT}/dropdown`);
  },

  getById: async (id: string): Promise<BranchListItem | null> => {
    return api.get<BranchListItem>(`${ENDPOINT}/${id}`);
  },

  create: async (data: BranchCreateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.post<unknown>(ENDPOINT, data);
      return { success: true };
    } catch {
      return { success: false, message: 'เกิดข้อผิดพลาดในการสร้างสาขา' };
    }
  },

  update: async (data: BranchUpdateRequest): Promise<{ success: boolean; message?: string }> => {
    try {
      await api.put<unknown>(`${ENDPOINT}/${data.branch_id}`, data);
      return { success: true };
    } catch {
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัพเดทสาขา' };
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete<unknown>(`${ENDPOINT}/${id}`);
      return true;
    } catch {
      return false;
    }
  }
};
