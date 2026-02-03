import api from './api';
import type { IEmployeeCreateRequest, IEmployeeResponse, IEmployee } from '../interfaces/IEmployee';

export const createEmployee = async (data: IEmployeeCreateRequest): Promise<IEmployeeResponse> => {
  const response = await api.post('/employees', data);
  return response.data;
};

import { logger } from '../utils/logger';

export const getAll = async (): Promise<IEmployee[]> => {
  try {
    const response = await api.get('/employees');
    logger.info('[EmployeeService] Raw API Response:', response.data);
    return response.data;
  } catch (error) {
    logger.error('[EmployeeService] Error fetching employees:', error);
    throw error;
  }
};

export const employeeService = {
  createEmployee,
  getAll,
};
