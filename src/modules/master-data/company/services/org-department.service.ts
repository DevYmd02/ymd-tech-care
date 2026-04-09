/**
 * @file department.service.ts
 * @description Service for Department (ฝ่าย) - Legacy endpoint /org-departments
 * @note ใช้สำหรับ Dropdown ใน EmployeeDept, Employee, MasterDataService
 *       และงานฝั่ง Sales / Price List ที่ต้องการข้อมูล Department
 * @see employee-side.service.ts - สำหรับ CRUD หน้า "กำหนดรหัสฝ่าย" (/employee-side endpoint)
 */

import api from '@/core/api/api';
import type { EmployeeSideMaster } from '@/modules/master-data/company/types/employee-side.types';
import { type PaginatedListResponse } from '@/shared/types/api-response.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

/** Legacy type aliases for Department */
export type DepartmentMaster = EmployeeSideMaster;
export type DepartmentListItem = EmployeeSideMaster;

const ENDPOINT = '/org-departments';

export const DepartmentService = {
  getList: async (params?: Partial<TableFilters>): Promise<PaginatedListResponse<DepartmentMaster>> => {
    const response = await api.get<PaginatedListResponse<DepartmentMaster> | DepartmentMaster[]>(ENDPOINT, { params });
    // Normalize: handle raw array response
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
  get: (id: string | number) => api.get<DepartmentMaster>(`${ENDPOINT}/${id}`),
  create: async (data: Partial<DepartmentMaster>): Promise<{ success: boolean; data?: DepartmentMaster; message?: string }> => {
    try {
      const response = await api.post<DepartmentMaster>(ENDPOINT, data);
      return { success: true, data: response };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || 'บันทึกไม่สำเร็จ' };
    }
  },
  update: async (id: string | number, data: Partial<DepartmentMaster>): Promise<{ success: boolean; data?: DepartmentMaster; message?: string }> => {
    try {
      const response = await api.put<DepartmentMaster>(`${ENDPOINT}/${id}`, data);
      return { success: true, data: response };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || 'แก้ไขไม่สำเร็จ' };
    }
  },
  delete: async (id: string | number): Promise<boolean> => {
    try {
      await api.delete<void>(`${ENDPOINT}/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
