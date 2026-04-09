/**
 * @file org-section.service.ts
 * @description Service for Section/Dept (แผนก) master data - endpoint /org-sections
 */

import api from '@/core/api/api';
import type { EmployeeDeptMaster, EmployeeDeptFormData } from '@/modules/master-data/company/types/employee-dept.types';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

export const EmployeeDeptService = {
  getList: (params?: Partial<TableFilters>) => api.get<PaginatedListResponse<EmployeeDeptMaster>>('/org-sections', { params }),
  get: (id: string | number) => api.get<EmployeeDeptMaster>(`/org-sections/${id}`),
  create: (data: EmployeeDeptFormData) => api.post<{ success: boolean; data?: EmployeeDeptMaster; message?: string }>('/org-sections', data),
  update: (id: string | number, data: Partial<EmployeeDeptFormData>) => api.put<{ success: boolean; data?: EmployeeDeptMaster; message?: string }>(`/org-sections/${id}`, data),
  delete: (id: string | number) => api.delete<boolean>(`/org-sections/${id}`),
};

// Backward compatibility alias
export const SectionService = EmployeeDeptService;
