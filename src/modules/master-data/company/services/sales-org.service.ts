/**
 * @file sales-org.service.ts
 * @description Service for managing Sales Organization Master Data (Zone, Target, Channel)
 */

import api from '@/core/api/api';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import type { 
  SalesZoneMaster, SalesZoneFormData, 
  SalesChannelMaster, SalesChannelFormData,
  SalesTargetMaster, SalesTargetFormData 
} from '@/modules/master-data/sales/types/sales-structure.types';

// ====================================================================================
// SALES ZONE SERVICE
// ====================================================================================

export const SalesZoneService = {
  getList: (params?: any) => api.get<SalesZoneMaster[]>('/master/sales-zones', { params }),
  get: (id: string | number) => api.get<SalesZoneMaster>(`/master/sales-zones/${id}`),
  create: (data: SalesZoneFormData) => api.post<{ success: boolean; data?: SalesZoneMaster; message?: string }>('/master/sales-zones', data),
  update: (id: string | number, data: Partial<SalesZoneFormData>) => api.put<{ success: boolean; data?: SalesZoneMaster; message?: string }>(`/master/sales-zones/${id}`, data),
  delete: (id: string | number) => api.delete<boolean>(`/master/sales-zones/${id}`),
};

// ====================================================================================
// SALES CHANNEL SERVICE
// ====================================================================================

export const SalesChannelService = {
  getList: (params?: any) => api.get<SalesChannelMaster[]>('/master/sales-channels', { params }),
  get: (id: string | number) => api.get<SalesChannelMaster>(`/master/sales-channels/${id}`),
  create: (data: SalesChannelFormData) => api.post<{ success: boolean; data?: SalesChannelMaster; message?: string }>('/master/sales-channels', data),
  update: (id: string | number, data: Partial<SalesChannelFormData>) => api.put<{ success: boolean; data?: SalesChannelMaster; message?: string }>(`/master/sales-channels/${id}`, data),
  delete: (id: string | number) => api.delete<boolean>(`/master/sales-channels/${id}`),
};

// ====================================================================================
// SALES TARGET SERVICE
// ====================================================================================

export const SalesTargetService = {
  getList: (params?: any) => api.get<PaginatedListResponse<SalesTargetMaster>>('/master/sales-targets', { params }),
  get: (id: string | number) => api.get<SalesTargetMaster>(`/master/sales-targets/${id}`),
  create: (data: SalesTargetFormData) => api.post<{ success: boolean; data?: SalesTargetMaster; message?: string }>('/master/sales-targets', data),
  update: (id: string | number, data: Partial<SalesTargetFormData>) => api.put<{ success: boolean; data?: SalesTargetMaster; message?: string }>(`/master/sales-targets/${id}`, data),
  delete: (id: string | number) => api.delete<boolean>(`/master/sales-targets/${id}`),
};
