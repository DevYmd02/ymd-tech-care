/**
 * @file api.ts
 * @description Axios instance and API configuration
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';
import { logger } from '@/shared/utils';

/**
 * Extended Axios configuration to support custom properties
 */
export interface CustomAxiosConfig extends AxiosRequestConfig {
  skipToast?: boolean;
}

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || '/api';

/**
 * Flag to indicate if Mock Data is used
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const AUTH_TOKEN_KEY = 'token';
export const AUTH_PROFILE_KEY = 'user_profile';

let unauthorizedHandler: (() => void) | null = null;

/**
 * Register a callback to be executed when a 401 Unauthorized error occurs.
 * This decouples the API layer from routing/browser specific side-effects.
 */
export const setUnauthorizedHandler = (handler: () => void) => {
  unauthorizedHandler = handler;
};

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
    logger.debug(`✅ [API] [${method}] ${url}`);

    // 🎉 Success Toast for mutations (POST, PATCH, DELETE)
    // Only show if not specifically disabled in config
    const skipToast = (response.config as CustomAxiosConfig).skipToast === true;
    if (!skipToast && ['POST', 'PATCH', 'DELETE'].includes(method)) {
      // Don't toast for login
      if (!url?.includes('/auth/login')) {
        toast.success('ดำเนินการสำเร็จ');
      }
    }

    // Standardized Response Unwrapping
    const resBody = response.data;
    if (resBody && typeof resBody === 'object' && resBody.success === true && resBody.data !== undefined) {
      return resBody.data;
    }

    return resBody;
  },
  (error) => {
    // Centralized Logging for Error
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const url = error.config?.url || 'UNKNOWN';
    const status = error.response?.status || 'UNKNOWN';
    
    // Skip logging for canceled requests
    if (axios.isCancel(error) || error.name === 'CanceledError') {
      logger.debug(`[API Canceled] [${method}] ${url}`);
    } else {
      logger.error(`❌ [API Error] [${method}] ${url} (${status})`, error);
      
      // 🚨 Automatic Error Toast
      const skipToast = (error.config as CustomAxiosConfig)?.skipToast === true;
      if (!skipToast) {
        // Handle specific status codes
        if (status === 401) {
          // Handled by unauthorizedHandler or LoginPage
        } else if (status === 403) {
          toast.error('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
        } else if (status === 429) {
          toast.error('คุณทำรายการบ่อยเกินไป กรุณารอสักครู่');
        } else {
          const errorMessage = extractErrorMessage(error);
          toast.error(errorMessage);
        }
      }
    }

    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_PROFILE_KEY);
        if (unauthorizedHandler) {
          unauthorizedHandler();
        }
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

/**
 * Interface for NestJS Error Response Payload
 */
interface NestErrorPayload {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  errors?: string[] | { [key: string]: string | string[] }[];
  retryAfter?: number; // 💡 Seconds until lockout expires
  attemptsRemaining?: number; // 💡 Number of failed attempts left before lockout
}

export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as NestErrorPayload | undefined;
    
    if (data && typeof data === 'object') {
      const msg = data.message || data.error || (Array.isArray(data.errors) ? data.errors[0] : undefined);
      
      if (Array.isArray(msg)) {
        return msg.join('. ');
      }
      
      if (typeof msg === 'string') {
        return msg;
      }
    }
    
    return error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
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
  get<T>(url: string, config?: CustomAxiosConfig): Promise<T>;
  delete<T>(url: string, config?: CustomAxiosConfig): Promise<T>;
  post<T, D = unknown>(url: string, data?: D, config?: CustomAxiosConfig): Promise<T>;
  put<T, D = unknown>(url: string, data?: D, config?: CustomAxiosConfig): Promise<T>;
  patch<T, D = unknown>(url: string, data?: D, config?: CustomAxiosConfig): Promise<T>;
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
