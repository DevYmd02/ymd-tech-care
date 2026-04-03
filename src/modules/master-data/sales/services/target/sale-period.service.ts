/**
 * @file sale-period.service.ts
 * @description Service for managing Sale Period
 */

import api from '@/core/api/api';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import type { 
  SalePeriodMaster, 
  SalePeriodFormData,
  SalePeriodFilters
} from '../../types/target/sale-period.types';

export const SalePeriodService = {
  getList: (params?: Partial<SalePeriodFilters>) => 
    api.get<PaginatedListResponse<SalePeriodMaster>>('/employees-sale-period', { params }),

  get: (id: string | number) => 
    api.get<SalePeriodMaster>(`/employees-sale-period/${id}`),

  create: (data: SalePeriodFormData) => 
    api.post<SalePeriodMaster>('/employees-sale-period', data),

  update: (id: string | number, data: Partial<SalePeriodFormData>) => 
    api.patch<SalePeriodMaster>(`/employees-sale-period/${id}`, data),

  delete: (id: string | number) => 
    api.delete<boolean>(`/employees-sale-period/${id}`),
};
