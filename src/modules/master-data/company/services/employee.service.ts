/**
 * @file employee.service.ts
 * @description Service for Employee (พนักงาน) master data
 */

import api from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import type { EmployeeMaster, EmployeeFormData } from '@/modules/master-data/company/types/employee.types';
import { type PaginatedListResponse } from '@/shared/types/api.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

export const OrgEmployeeService = {
  getList: (params?: Partial<TableFilters>, config?: AxiosRequestConfig) => api.get<PaginatedListResponse<EmployeeMaster>>('/employees', { ...config, params }),
  get: (id: number, config?: AxiosRequestConfig) => api.get<EmployeeMaster>(`/employees/${id}`, config),
  create: (data: EmployeeFormData) => api.post<EmployeeMaster & { success?: boolean; data?: EmployeeMaster; message?: string }>('/employees', data),
  update: (id: number, data: Partial<EmployeeFormData>) => api.patch<EmployeeMaster & { success?: boolean; data?: EmployeeMaster; message?: string }>(`/employees/${id}`, data),
  delete: (id: number) => api.delete<boolean>(`/employees/${id}`),
};

