/**
 * @file api.ts
 * @description Axios instance และ API configuration พร้อม Mock/API switching
 * 
 * @usage 
 * ```typescript
 * import api, { USE_MOCK } from '@/services/api';
 * 
 * // ใน Service
 * if (USE_MOCK) {
 *   return mockData;
 * }
 * const response = await api.get('/endpoint');
 * return response.data;
 * ```
 * 
 * @env VITE_API_URL - Base URL ของ Backend API
 * @env VITE_USE_MOCK - true = ใช้ Mock Data, false = ใช้ API จริง
 */

import axios from 'axios';

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

/**
 * Base URL สำหรับ API
 * @default 'http://localhost:3000/api'
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Flag บอกว่าใช้ Mock Data หรือไม่
 * - true = ใช้ข้อมูลจำลองจาก __mocks__
 * - false = เรียก API จริงจาก Backend
 * 
 * @default true (ใน development)
 * 
 * @example
 * ```typescript
 * import { USE_MOCK } from '@/services/api';
 * 
 * const getData = async () => {
 *   if (USE_MOCK) {
 *     return mockItems; // คืน mock data
 *   }
 *   const response = await api.get('/items');
 *   return response.data; // คืน API data
 * };
 * ```
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// =============================================================================
// AXIOS INSTANCE
// =============================================================================

/**
 * Axios instance สำหรับเรียก API
 */
const api = axios.create({
  baseURL: API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================================================
// REQUEST INTERCEPTOR
// =============================================================================

/**
 * เพิ่ม Auth token ใน header ของทุก request
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =============================================================================
// RESPONSE INTERCEPTOR
// =============================================================================

/**
 * จัดการ error response จาก API
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Log current API mode (สำหรับ debugging)
 */
export const logApiMode = (): void => {
  if (import.meta.env.DEV) {
    console.log(`🔧 API Mode: ${USE_MOCK ? 'MOCK DATA' : 'REAL API'}`);
    console.log(`🔗 API URL: ${API_BASE_URL}`);
  }
};

// Log mode on startup (only in DEV)
if (import.meta.env.DEV) {
  logApiMode();
}

export default api;
