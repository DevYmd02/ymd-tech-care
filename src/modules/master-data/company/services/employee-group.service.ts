/**
 * @file employee-group.service.ts
 * @description Service for Employee Group (กลุ่มพนักงาน) master data
 */

import api from '@/core/api/api';
import type { EmployeeGroupMaster, EmployeeGroupFormData } from '@/modules/master-data/company/types/employee-group.types';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

export const EmployeeGroupService = {
  getList: (params?: Partial<TableFilters>) => api.get<PaginatedListResponse<EmployeeGroupMaster>>('/org-employee-groups', { params }),
  get: (id: number) => api.get<EmployeeGroupMaster>(`/org-employee-groups/${id}`),
  create: (data: EmployeeGroupFormData) => api.post<{ success: boolean; data?: EmployeeGroupMaster; message?: string }>('/org-employee-groups', data),
  update: (id: number, data: Partial<EmployeeGroupFormData>) => api.put<{ success: boolean; data?: EmployeeGroupMaster; message?: string }>(`/org-employee-groups/${id}`, data),
  delete: (id: number) => api.delete<boolean>(`/org-employee-groups/${id}`),
};
