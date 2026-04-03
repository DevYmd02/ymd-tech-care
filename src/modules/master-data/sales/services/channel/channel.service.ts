/**
 * @file channel.service.ts
 * @description Service for managing Sales Channel Master Data
 */

import api from '@/core/api/api';
import type { 
  SalesChannelMaster, 
  SalesChannelFormData 
} from '@/modules/master-data/sales/types/channel/channel.types';

export const SalesChannelService = {
  getList: (params?: Record<string, string | number | boolean>) => 
    api.get<SalesChannelMaster[]>('/master/sales-channels', { params }),

  get: (id: string | number) => 
    api.get<SalesChannelMaster>(`/master/sales-channels/${id}`),

  create: (data: SalesChannelFormData) => 
    api.post<{ success: boolean; data?: SalesChannelMaster; message?: string }>('/master/sales-channels', data),

  update: (id: string | number, data: Partial<SalesChannelFormData>) => 
    api.put<{ success: boolean; data?: SalesChannelMaster; message?: string }>(`/master/sales-channels/${id}`, data),

  delete: (id: string | number) => 
    api.delete<boolean>(`/master/sales-channels/${id}`),
};
