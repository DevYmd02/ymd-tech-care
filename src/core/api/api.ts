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

    // =========================================================================
    // Standardized Response Handling (Robust Unwrapping)
    // =========================================================================
    const resBody = response.data;
    
    // 1. Explicit Error Check (success: false)
    if (resBody && typeof resBody === 'object' && resBody.success === false) {
      return Promise.reject(response);
    }

    let finalData = resBody;

    // 2. Unwrap standard envelopes { success: true, data: ... } or { data: ... }
    if (resBody && typeof resBody === 'object') {
      // Handle { success: true, data: ... }
      if (resBody.data !== undefined && ('success' in resBody || Object.keys(resBody).length <= 3)) {
        finalData = resBody.data;
      }
      
      // Handle nested data { data: { data: ... } } or { data: { header: ... } }
      if (finalData && typeof finalData === 'object' && !Array.isArray(finalData)) {
        if (finalData.data !== undefined && !Array.isArray(finalData.data) && !('total' in finalData)) {
          finalData = finalData.data;
        } else if (finalData.header !== undefined && typeof finalData.header === 'object' && !Array.isArray(finalData.header)) {
          // 🎯 STABILITY FIX: In document details (PR, SO, PO), lines/items are often siblings of 'header'.
          // Instead of returning ONLY header (which strips lines) or ONLY the wrapper (which nests header),
          // we flatten the header fields into the top level while preserving sibling arrays.
          const keys = Object.keys(finalData);
          const hasLines = keys.some(k => 
            k.toLowerCase().includes('line') || 
            k.toLowerCase().includes('item') || 
            k.toLowerCase().includes('detail')
          );
          
          if (!hasLines) {
            // Standard case: just a header wrapper, return it directly
            finalData = finalData.header;
          } else {
            // Detail case: header + lines as siblings. Merge them to prevent data loss.
            finalData = { 
              ...(finalData.header as Record<string, unknown>), 
              ...finalData 
            };
            // Note: we keep the 'header' key in there just in case, but fields are now flat.
          }
        }
      }

      // 3. Normalize Paginated Lists (data vs items)
      // If we have 'items' but no 'data' (array), add 'data' for consistency (used by PR module)
      if (finalData && typeof finalData === 'object' && Array.isArray(finalData.items) && finalData.data === undefined) {
        finalData.data = finalData.items;
      }
      // If we have 'data' (array) but no 'items', add 'items' for consistency (used by Master Data)
      if (finalData && typeof finalData === 'object' && Array.isArray(finalData.data) && finalData.items === undefined) {
        finalData.items = finalData.data;
      }
    }

    return finalData;
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
  success?: boolean;
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

export interface ApiClient extends Omit<AxiosInstance, 'get' | 'put' | 'post' | 'delete' | 'patch'> {
  /** Returns the unwrapped data payload (T or Items[]) */
  get<T>(url: string, config?: CustomAxiosConfig): Promise<T>;
  /** Returns the unwrapped data payload (T or success/message envelope if no data) */
  delete<T = unknown>(url: string, config?: CustomAxiosConfig): Promise<T>;
  /** Returns the unwrapped data payload (T or success/message envelope if no data) */
  post<T = unknown, D = unknown>(url: string, data?: D, config?: CustomAxiosConfig): Promise<T>;
  /** Returns the unwrapped data payload (T or success/message envelope if no data) */
  put<T = unknown, D = unknown>(url: string, data?: D, config?: CustomAxiosConfig): Promise<T>;
  /** Returns the unwrapped data payload (T or success/message envelope if no data) */
  patch<T = unknown, D = unknown>(url: string, data?: D, config?: CustomAxiosConfig): Promise<T>;
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