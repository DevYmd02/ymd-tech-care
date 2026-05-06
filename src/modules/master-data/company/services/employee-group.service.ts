/**
 * @file employee-group.service.ts
 * @description Service for Employee Group (กลุ่มพนักงาน) master data
 */

import api, { extractErrorMessage } from '@/core/api/api';
import { logger } from '@/shared/utils';
import type { EmployeeGroupMaster, EmployeeGroupFormData } from '@/modules/master-data/company/types/employee-group.types';
import { type PaginatedListResponse } from '@/shared/types/api.types';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

interface EmployeeGroupPayload {
  employee_group_code?: string;
  employee_group_name?: string;
  employee_group_nameeng?: string;
  is_active?: boolean;
}

export const EmployeeGroupService = {
  getList: async (filters?: Partial<TableFilters>): Promise<PaginatedListResponse<EmployeeGroupMaster>> => {
    // Transform 'status' filter to 'is_active' if needed by backend
    const params: Record<string, string | number | boolean | undefined> = { ...filters };
    
    if (params.status === 'ACTIVE') {
      params.is_active = true;
    } else if (params.status === 'INACTIVE') {
      params.is_active = false;
    }
    
    // Remove status if we already mapped it to is_active, or if it's 'ALL'
    delete params.status;

    const response = await api.get<PaginatedListResponse<EmployeeGroupMaster> | EmployeeGroupMaster[]>('/employee-group', { params });
    
    if (Array.isArray(response)) {
      const page = Number(params?.page) || 1;
      const limit = Number(params?.limit) || 10;
      return {
        items: response,
        total: response.length,
        page,
        limit
      };
    }
    
    return response;
  },


  get: (id: string) => 
    api.get<EmployeeGroupMaster>(`/employee-group/${id}`),

  create: async (data: EmployeeGroupFormData): Promise<{ success: boolean; data?: EmployeeGroupMaster; message?: string }> => {
    try {
      const payload: EmployeeGroupPayload = {
        employee_group_code: data.employeeGroupCode,
        employee_group_name: data.employeeGroupName,
        employee_group_nameeng: data.employeeGroupNameEn || undefined,
        is_active: data.isActive,
      };
      const response = await api.post<EmployeeGroupMaster>('/employee-group', payload);
      return { success: true, data: response };
    } catch (error) {
      logger.error('[EmployeeGroupService] create failed:', error);
      return { success: false, message: extractErrorMessage(error) };
    }
  },

  update: async (id: string, data: Partial<EmployeeGroupFormData>): Promise<{ success: boolean; data?: EmployeeGroupMaster; message?: string }> => {
    try {
      const payload: EmployeeGroupPayload = {};
      if (data.employeeGroupCode !== undefined) payload.employee_group_code = data.employeeGroupCode;
      if (data.employeeGroupName !== undefined) payload.employee_group_name = data.employeeGroupName;
      if (data.employeeGroupNameEn !== undefined) payload.employee_group_nameeng = data.employeeGroupNameEn || undefined;
      if (data.isActive !== undefined) payload.is_active = data.isActive;
      
      const response = await api.patch<EmployeeGroupMaster>(`/employee-group/${id}`, payload);
      return { success: true, data: response };
    } catch (error) {
      logger.error('[EmployeeGroupService] update failed:', error);
      return { success: false, message: extractErrorMessage(error) };
    }
  },


  delete: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/employee-group/${id}`);
      return true;
    } catch (error) {
      logger.error('[EmployeeGroupService] delete failed:', error);
      return false;
    }
  },
};



