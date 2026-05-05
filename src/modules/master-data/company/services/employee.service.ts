/**
 * @file employee.service.ts
 * @description Service for Employee (พนักงาน) master data
 */

import api from '@/core/api/api';
import type { EmployeeMaster, EmployeeFormData } from '@/modules/master-data/company/types/employee.types';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

export const OrgEmployeeService = {
  getList: (params?: Partial<TableFilters>) => api.get<PaginatedListResponse<EmployeeMaster>>('/employees', { params }),
  get: (id: number) => api.get<EmployeeMaster>(`/employees/${id}`),
  create: (data: EmployeeFormData) => api.post<{ success: boolean; data?: EmployeeMaster; message?: string }>('/employees', data),
  update: (id: number, data: Partial<EmployeeFormData>) => api.put<{ success: boolean; data?: EmployeeMaster; message?: string }>(`/employees/${id}`, data),
  delete: (id: number) => api.delete<boolean>(`/employees/${id}`),

  // Signature Management (แยก Endpoint ตามคำแนะนำ Backend)
  uploadSignature: (employeeId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ success: boolean; data?: { id: number; signature_path: string }; message?: string }>(
      `/employees/${employeeId}/signatures`, 
      formData, 
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
  deleteSignature: (employeeId: number, signatureId: number) => 
    api.delete<{ success: boolean; message?: string }>(`/employees/${employeeId}/signatures/${signatureId}`),
};
