import { AxiosError } from 'axios';
import api from './api';
import { logger } from '../utils/logger';

// Since the response structure is unknown, we use a flexible interface
export interface LoginResponse {
  token?: string;
  accessToken?: string;
  access_token?: string;
  [key: string]: unknown; // Changed from 'any' to 'unknown'
}

export interface LoginPayload {
  username: string;
  password?: string;
}

export interface RegisterPayload {
  username: string;
  password?: string;
  employee_id: number;
}

export interface RegisterResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

export const login = async (data: LoginPayload): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', data);
    // CRITICAL: Debug log as requested to inspect response structure
    logger.info('🔍 [AuthService] Raw Login Response:', response.data);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      logger.error('❌ [AuthService] Login failed:', error.response?.data || error.message);
    } else {
      logger.error('❌ [AuthService] Login failed:', error);
    }
    throw error;
  }
};

export const register = async (data: RegisterPayload): Promise<RegisterResponse> => {
  try {
    // Backend expects POST /auth/employees/:employee_id/auth
    const { employee_id, ...body } = data;
    const response = await api.post<RegisterResponse>(`/auth/employees/${employee_id}/auth`, body);
    logger.info('Box [AuthService] Raw Register Response:', response.data);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      logger.error('❌ [AuthService] Registration failed:', error.response?.data || error.message);
    } else {
      logger.error('❌ [AuthService] Registration failed:', error);
    }
    throw error;
  }
};

export const authService = {
  login,
  register,
};
