/**
 * @file api.ts
 * @description Axios instance and API configuration
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { logger } from '@/shared/utils/logger';

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

export const API_BASE_URL = '/api';

/**
 * Flag to indicate if Mock Data is used
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const AUTH_TOKEN_KEY = 'token';

// =============================================================================
// AXIOS INSTANCE
// =============================================================================

const api = axios.create({
  baseURL: API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================================================
// INTERCEPTORS
// =============================================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Centralized Logging for Success
    const method = response.config.method?.toUpperCase() || 'UNKNOWN';
    const url = response.config.url;
    logger.info(`✅ [API] [${method}] ${url}`, response.data);

    // Standardized Response Unwrapping
    // If response.data follows { success: true, data: ... }, return 'data' directly.
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
        return response.data.data;
    }

    // Default: return response.data instead of full response object
    return response.data;
  },
  (error) => {
    // Centralized Logging for Error
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const url = error.config?.url || 'UNKNOWN';
    const status = error.response?.status || 'UNKNOWN';
    
    logger.error(`❌ [API Error] [${method}] ${url} (${status})`, error);

    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const logApiMode = (): void => {
  if (import.meta.env.DEV) {
    logger.info(`🔧 API Mode: ${USE_MOCK ? 'MOCK DATA' : 'REAL API'}`);
    logger.info(`🔗 API URL: ${API_BASE_URL}`);
  }
};

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
};

// =============================================================================
// TYPE DEFINITION OVERRIDES
// =============================================================================

// Strictly override the methods that return AxiosResponse to return Promise<T>
// This matches our interceptor behavior which unwraps the response.data
export interface ApiClient extends Omit<AxiosInstance, 'get' | 'put' | 'post' | 'delete' | 'patch'> {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>;
  put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>;
  patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>;
}

if (import.meta.env.DEV) {
  logApiMode();
  if (USE_MOCK) {
    import('./mockAdapter').then(({ setupMocks }) => {
      setupMocks(api);
    });
  }
}

export default api as ApiClient;
