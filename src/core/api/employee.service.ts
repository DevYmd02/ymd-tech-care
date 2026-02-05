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
      const response = await api.post('/employees', data);
      return response.data;
    } catch (error) {
      logger.error('[EmployeeService] createEmployee error:', error);
      throw error;
    }
  },

  getAll: async (): Promise<IEmployee[]> => {
    // 1. Mock Mode Check
    if (import.meta.env.VITE_USE_MOCK === 'true') {
        const { mockEmployees } = await import('@/modules/master-data/company/mocks/employeeMocks');
        logger.info('🎭 [Mock Mode] Serving Employee List');
        return new Promise(resolve => setTimeout(() => resolve(mockEmployees), 500));
    }

    try {
      const response = await api.get('/employees');
      logger.info('[EmployeeService] Raw API Response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('[EmployeeService] Error fetching employees:', error);
      throw error;
    }
  }
};
