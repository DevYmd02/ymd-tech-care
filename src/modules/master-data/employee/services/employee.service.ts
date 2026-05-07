/**
 * @file employee.service.ts
 * @description Simplified Employee Service
 */

import api from '@/core/api/api';
import type { IEmployeeCreateRequest, IEmployeeResponse, IEmployee } from '@/modules/master-data/company/types/employee-types';
import { logger } from '@/shared/utils';

export const EmployeeService = {
  createEmployee: async (data: IEmployeeCreateRequest): Promise<IEmployeeResponse> => {
    try {
      const response = await api.post<IEmployeeResponse>('/employees', data);
      return response;
    } catch (error) {
      logger.error('[EmployeeService] createEmployee error:', error);
      throw error;
    }
  },

  getAll: async (): Promise<IEmployee[]> => {
    try {
      const response = await api.get<IEmployee[]>('/employees');
      logger.info('[EmployeeService] Raw API Response:', response);
      // Handle both direct array and paginated response { items: [...] } or { data: [...] }
      const res = response as unknown as Record<string, unknown>;
      const list = (res?.items as IEmployee[]) || (res?.data as IEmployee[]) || (Array.isArray(response) ? response : []);
      return list;
    } catch (error) {
      logger.error('[EmployeeService] Error fetching employees:', error);
      throw error;
    }
  }
};
