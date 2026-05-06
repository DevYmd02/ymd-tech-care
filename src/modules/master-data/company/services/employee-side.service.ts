/**
 * @file employee-side.service.ts
 * @description Service for Employee Side (ฝ่าย) master data
 */

import api from '@/core/api/api';
import type { EmployeeSideMaster, EmployeeSideFormData } from '@/modules/master-data/company/types/employee-side.types';
import { type PaginatedListResponse } from '@/shared/types/api.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

export const EmployeeSideService = {
  getList: async (params?: Partial<TableFilters>): Promise<PaginatedListResponse<EmployeeSideMaster>> => {
    const response = await api.get<PaginatedListResponse<EmployeeSideMaster> | EmployeeSideMaster[]>('/employee-side', { params });
    
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
  get: (id: string | number) => api.get<EmployeeSideMaster>(`/employee-side/${id}`),
  create: async (data: EmployeeSideFormData): Promise<{ success: boolean; data?: EmployeeSideMaster; message?: string }> => {
    try {
      const response = await api.post<EmployeeSideMaster>('/employee-side', data);
      return { success: true, data: response };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || 'บันทึกไม่สำเร็จ' };
    }
  },
  update: async (id: string | number, data: Partial<EmployeeSideFormData>): Promise<{ success: boolean; data?: EmployeeSideMaster; message?: string }> => {
    try {
      const response = await api.patch<EmployeeSideMaster>(`/employee-side/${id}`, data);
      return { success: true, data: response };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || 'แก้ไขไม่สำเร็จ' };
    }
  },
  delete: (id: string | number) => api.delete<boolean>(`/employee-side/${id}`),
};

// Backward compatibility alias
export const DepartmentService = EmployeeSideService;
