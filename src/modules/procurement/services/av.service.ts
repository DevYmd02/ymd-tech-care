import api from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import type { PRListParams, PRListResponse, PRHeaderExtended } from '@/modules/procurement/types/pr-types';
import type { ApproveExpensePayload, ApprovalListResponse, ApprovalDetail } from '@/modules/procurement/types/av-types';
import type { SuccessResponse } from '@/shared/types/api.types';

export const AVService = {
  getPendingPRs: async (params?: PRListParams, config?: AxiosRequestConfig): Promise<PRListResponse> => {
    return await api.get<PRListResponse>('/pr', { ...config, params: { ...params, status: 'PENDING' } });
  },

  getPendingApprovalPRs: async (config?: AxiosRequestConfig): Promise<PRHeaderExtended[]> => {
    return await api.get<PRHeaderExtended[]>('/pr-approval/pr/pending-approval', config);
  },

  getPRById: async (prId: string | number, config?: AxiosRequestConfig): Promise<PRHeaderExtended> => {
    return await api.get<PRHeaderExtended>(`/pr/${prId}`, config);
  },

  approvePR: async (payload: ApproveExpensePayload, config?: AxiosRequestConfig): Promise<SuccessResponse> => {
    return await api.post<SuccessResponse>('/pr-approval', payload, config);
  },

  rejectPR: async (payload: ApproveExpensePayload, config?: AxiosRequestConfig): Promise<SuccessResponse> => {
    return await api.post<SuccessResponse>('/pr-approval', payload, config);
  },

  getApprovalList: async (params?: Partial<PRListParams>, config?: AxiosRequestConfig): Promise<ApprovalListResponse> => {
    return await api.get<ApprovalListResponse>('/pr-approval', { ...config, params });
  },

  getApprovalById: async (id: number, config?: AxiosRequestConfig): Promise<ApprovalDetail> => {
    return await api.get<ApprovalDetail>(`/pr-approval/${id}`, config);
  }
};
