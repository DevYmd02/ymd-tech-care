/**
 * @file channel.service.ts
 * @description Service for managing Sales Channel Master Data
 */

import api from '@/core/api/api';
import type { 
  SalesChannelMaster, 
  SalesChannelFormData 
} from '../types/channel.types';

export const SalesChannelService = {
  getList: (params?: Record<string, string | number | boolean>) => 
    api.get<SalesChannelMaster[]>('/employee-sale-channel', { params }),

  get: (id: string | number) => 
    api.get<SalesChannelMaster>(`/employee-sale-channel/${id}`),

  create: async (data: SalesChannelFormData): Promise<{ success: boolean; data?: SalesChannelMaster; message?: string }> => {
    try {
      const payload = {
        channel_code: data.channelCode,
        channel_name: data.channelName,
        channel_nameeng: data.channelNameEn,
        is_active: data.isActive
      };
      const response = await api.post<SalesChannelMaster>('/employee-sale-channel', payload);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'บันทึกไม่สำเร็จ' };
    }
  },

  update: async (id: string | number, data: Partial<SalesChannelFormData>): Promise<{ success: boolean; data?: SalesChannelMaster; message?: string }> => {
    try {
      const payload: Record<string, string | number | boolean | undefined> = {};
      if (data.channelCode !== undefined) payload.channel_code = data.channelCode;
      if (data.channelName !== undefined) payload.channel_name = data.channelName;
      if (data.channelNameEn !== undefined) payload.channel_nameeng = data.channelNameEn;
      if (data.isActive !== undefined) payload.is_active = data.isActive;

      const response = await api.put<SalesChannelMaster>(`/employee-sale-channel/${id}`, payload);
      return { success: true, data: response };
    } catch (error) {
      return { success: false, message: (error as Error).message || 'บันทึกไม่สำเร็จ' };
    }
  },

  delete: (id: string | number) => 
    api.delete<boolean>(`/employee-sale-channel/${id}`),
};
