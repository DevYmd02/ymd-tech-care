/**
 * @file employee-side.service.ts
 * @description Service for Employee Side (ฝ่าย) master data
 */

import api from '@/core/api/api';
import type { EmployeeSideMaster, EmployeeSideFormData } from '@/modules/master-data/company/types/employee-side.types';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

export const EmployeeSideService = {
  getList: (params?: Partial<TableFilters>) => api.get<PaginatedListResponse<EmployeeSideMaster>>('/org-departments', { params }),
  get: (id: string | number) => api.get<EmployeeSideMaster>(`/org-departments/${id}`),
  create: (data: EmployeeSideFormData) => api.post<{ success: boolean; data?: EmployeeSideMaster; message?: string }>('/org-departments', data),
  update: (id: string | number, data: Partial<EmployeeSideFormData>) => api.put<{ success: boolean; data?: EmployeeSideMaster; message?: string }>(`/org-departments/${id}`, data),
  delete: (id: string | number) => api.delete<boolean>(`/org-departments/${id}`),
};

// Backward compatibility alias
export const DepartmentService = EmployeeSideService;
