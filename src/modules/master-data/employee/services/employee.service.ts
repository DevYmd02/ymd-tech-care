/**
 * @file employee.service.ts
 * @description Simplified Employee Service
 */

import api from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import type { IEmployeeCreateRequest, IEmployeeResponse, IEmployee } from '@/modules/master-data/company/types/employee-types';
import { logger } from '@/shared/utils';

export const EmployeeService = {
  createEmployee: async (data: IEmployeeCreateRequest, config?: AxiosRequestConfig): Promise<IEmployeeResponse> => {
    try {
      const response = await api.post<IEmployeeResponse>('/employees', data, config);
      return response;
    } catch (error) {
      logger.error('[EmployeeService] createEmployee error:', error);
      throw error;
    }
  },

  getAll: async (config?: AxiosRequestConfig): Promise<IEmployee[]> => {
    try {
      const response = await api.get<IEmployee[]>('/employees', config);
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
