/**
 * @file sale-target.service.ts
 * @description Service for managing Sale Targets (Employee Targets) aligned with backend schema.
 */

import api from '@/core/api/api';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import type { 
  SaleTargetMaster,
  SaleTargetFormData,
  SaleTargetFilters
} from '../../types/target/sale-target.types';

export const SaleTargetService = {
  // Aligned Endpoint: /empployees-sale-target (Removes /master/ to match Postman)
  getList: (params?: Partial<SaleTargetFilters>) => 
    api.get<PaginatedListResponse<SaleTargetMaster>>('/empployees-sale-target', { params }),

  get: (id: string | number) => 
    api.get<SaleTargetMaster>(`/empployees-sale-target/${id}`),

  create: (data: SaleTargetFormData) => 
    api.post<{ success: boolean; data?: SaleTargetMaster; message?: string }>('/empployees-sale-target', data),

  update: (id: string | number, data: Partial<SaleTargetFormData>) => 
    api.patch<{ success: boolean; data?: SaleTargetMaster; message?: string }>(`/empployees-sale-target/${id}`, data),

  delete: (id: string | number) => 
    api.delete<boolean>(`/empployees-sale-target/${id}`),
};
