/**
 * @file api.ts
 * @description Axios instance และ API configuration
 */

import axios from 'axios';
import { logger } from '@/shared/utils/logger';

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

export const API_BASE_URL = '/api';

/**
 * Flag บอกว่าใช้ Mock Data หรือไม่ (สามารถปรับให้ hardcode เป็น false ได้ถ้ายกเลิก mock แล้ว)
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
    return response;
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

if (import.meta.env.DEV) {
  logApiMode();
}

export default api;
