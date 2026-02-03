/**
 * @file employee.service.ts
 * @description Simplified Employee Service
 */

import api from '@/services/core/api';
import type { IEmployeeCreateRequest, IEmployeeResponse, IEmployee } from '@/interfaces/IEmployee';
import { logger } from '@/utils/logger';

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
        const { mockEmployees } = await import('@/__mocks__/employeeMocks');
        console.log('🎭 [Mock Mode] Serving Employee List');
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
