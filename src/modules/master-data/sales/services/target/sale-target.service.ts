/**
 * @file sale-target.service.ts
 * @description Service for managing Sale Targets
 */

import api from '@/core/api/api';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import type { 
  SaleTargetMaster,
  SaleTargetFormData,
  SaleTargetFilters
} from '../../types/target/sale-target.types';

export const SaleTargetService = {
  getList: (params?: Partial<SaleTargetFilters>) => 
    api.get<PaginatedListResponse<SaleTargetMaster>>('/master/employee-sales-targets', { params }),

  get: (id: string | number) => 
    api.get<SaleTargetMaster>(`/master/employee-sales-targets/${id}`),

  create: (data: SaleTargetFormData) => 
    api.post<{ success: boolean; data?: SaleTargetMaster; message?: string }>('/master/employee-sales-targets', data),

  update: (id: string | number, data: Partial<SaleTargetFormData>) => 
    api.put<{ success: boolean; data?: SaleTargetMaster; message?: string }>(`/master/employee-sales-targets/${id}`, data),

  delete: (id: string | number) => 
    api.delete<boolean>(`/master/employee-sales-targets/${id}`),
};
