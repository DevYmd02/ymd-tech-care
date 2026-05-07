/**
 * @file employee-dept.service.ts
 * @description Service for Employee Dept (แผนก) master data
 */

import api from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import type { EmployeeDeptMaster, EmployeeDeptFormData } from '@/modules/master-data/company/types/employee-dept.types';
import { type PaginatedListResponse } from '@/shared/types/api.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

export const EmployeeDeptService = {
  getList: async (params?: Partial<TableFilters>, config?: AxiosRequestConfig): Promise<PaginatedListResponse<EmployeeDeptMaster>> => {
    const response = await api.get<PaginatedListResponse<EmployeeDeptMaster> | EmployeeDeptMaster[]>('/department', { ...config, params });
    
    // Normalize: Handle raw array response from backend
    if (Array.isArray(response)) {
      return {
        items: response,
        total: response.length,
        page: params?.page || 1,
        limit: params?.limit || 10,
      };
    }
    
    return response;
  },
  get: (id: string | number, config?: AxiosRequestConfig) => api.get<EmployeeDeptMaster>(`/department/${id}`, config),
  create: async (data: EmployeeDeptFormData): Promise<{ success: boolean; data?: EmployeeDeptMaster; message?: string }> => {
    try {
      const response = await api.post<EmployeeDeptMaster>('/department', data);
      return { success: true, data: response };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || 'บันทึกไม่สำเร็จ' };
    }
  },
  update: async (id: string | number, data: Partial<EmployeeDeptFormData>): Promise<{ success: boolean; data?: EmployeeDeptMaster; message?: string }> => {
    try {
      const response = await api.put<EmployeeDeptMaster>(`/department/${id}`, data);
      return { success: true, data: response };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || 'แก้ไขไม่สำเร็จ' };
    }
  },
  delete: (id: string | number) => api.delete<boolean>(`/department/${id}`),
};

// Backward compatibility alias
export const SectionService = EmployeeDeptService;
