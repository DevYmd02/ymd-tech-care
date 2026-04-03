/**
 * @file target.service.ts
 * @description Service for managing Sales Target Master Data
 */

import api from '@/core/api/api';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import type { 
  SalesTargetMaster, 
  SalesTargetFormData 
} from '@/modules/master-data/sales/types/target/target.types';

export const SalesTargetService = {
  getList: (params?: Record<string, string | number | boolean>) => 
    api.get<PaginatedListResponse<SalesTargetMaster>>('/master/sales-targets', { params }),

  get: (id: string | number) => 
    api.get<SalesTargetMaster>(`/master/sales-targets/${id}`),

  create: (data: SalesTargetFormData) => 
    api.post<{ success: boolean; data?: SalesTargetMaster; message?: string }>('/master/sales-targets', data),

  update: (id: string | number, data: Partial<SalesTargetFormData>) => 
    api.put<{ success: boolean; data?: SalesTargetMaster; message?: string }>(`/master/sales-targets/${id}`, data),

  delete: (id: string | number) => 
    api.delete<boolean>(`/master/sales-targets/${id}`),
};
