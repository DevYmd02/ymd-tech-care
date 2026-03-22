import api from '@/core/api/api';
import type { AVFormData } from '../schemas/av.schema';

export const AVService = {
  getPendingPRs: async (params?: any) => {
    return await api.get<any>('/pr', { params: { ...params, status: 'PENDING' } });
  },

  getPRById: async (prId: string | number) => {
    return await api.get<any>(`/pr/${prId}`);
  },

  approvePR: async (prId: string | number, payload: AVFormData) => {
    const apiPayload = {
      pr_id: prId,
      comment: payload.remark,
      lines: payload.lines.map(line => ({
        pr_line_id: (line as any).id || (line as any).pr_line_id,
        item_id: line.item_id,
        is_approved: line.is_approved,
        approved_qty: line.approved_qty,
        remark: line.remark,
      }))
    };
    
    return await api.post<any>(`/pr/${prId}/approve`, apiPayload);
  },

  rejectPR: async (prId: string | number, reason: string) => {
    return await api.post<any>(`/pr/${prId}/reject`, { reason });
  }
};
