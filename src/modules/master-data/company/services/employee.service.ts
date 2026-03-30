/**
 * @file employee.service.ts
 * @description Service for Employee (พนักงาน) master data
 */

import api from '@/core/api/api';
import type { EmployeeMaster, EmployeeFormData } from '@/modules/master-data/company/types/employee.types';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

export const OrgEmployeeService = {
  getList: (params?: Partial<TableFilters>) => api.get<PaginatedListResponse<EmployeeMaster>>('/org-employees', { params }),
  get: (id: number) => api.get<EmployeeMaster>(`/org-employees/${id}`),
  create: (data: EmployeeFormData) => api.post<{ success: boolean; data?: EmployeeMaster; message?: string }>('/org-employees', data),
  update: (id: number, data: Partial<EmployeeFormData>) => api.put<{ success: boolean; data?: EmployeeMaster; message?: string }>(`/org-employees/${id}`, data),
  delete: (id: number) => api.delete<boolean>(`/org-employees/${id}`),
};
