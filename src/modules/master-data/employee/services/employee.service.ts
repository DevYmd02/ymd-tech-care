/**
 * @file employee.service.ts
 * @description Simplified Employee Service
 */

import api from '@/core/api/api';
import type { IEmployeeCreateRequest, IEmployeeResponse, IEmployee } from '@/modules/master-data/company/types/employee-types';
import { logger } from '@/shared/utils/logger';

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
      return response;
    } catch (error) {
      logger.error('[EmployeeService] Error fetching employees:', error);
      throw error;
    }
  }
};
