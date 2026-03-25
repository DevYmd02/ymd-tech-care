import api from '@/core/api/api';
import type { PRListParams, PRListResponse, PRHeaderExtended } from '@/modules/procurement/types/pr-types';
import type { ApproveExpensePayload, ApprovalListResponse } from '@/modules/procurement/types/av-types';

export const AVService = {
  getPendingPRs: async (params?: PRListParams): Promise<PRListResponse> => {
    return await api.get<PRListResponse>('/pr', { params: { ...params, status: 'PENDING' } });
  },

  getPendingApprovalPRs: async (): Promise<PRHeaderExtended[]> => {
    return await api.get<PRHeaderExtended[]>('/pr-approval/pr/pending-approval');
  },

  getPRById: async (prId: string | number): Promise<PRHeaderExtended> => {
    return await api.get<PRHeaderExtended>(`/pr/${prId}`);
  },

  approvePR: async (payload: ApproveExpensePayload): Promise<any> => {
    return await api.post<any>('/pr-approval', payload);
  },

  rejectPR: async (payload: ApproveExpensePayload): Promise<any> => {
    return await api.post<any>('/pr-approval', payload);
  },

  getApprovalList: async (params?: any): Promise<ApprovalListResponse> => {
    return await api.get<ApprovalListResponse>('/pr-approval', { params });
  }
};
