/**
 * @file api.ts
 * @description Axios instance และ API configuration
 * @usage import { api } from '@/services/api';
 */

// เมื่อติดตั้ง axios: npm install axios
// import axios from 'axios';

// API Base URL (เปลี่ยนเป็น URL จริงเมื่อเชื่อมต่อ Backend)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * สร้าง axios instance สำหรับเรียก API
 * 
 * @example
 * // ติดตั้ง axios ก่อน: npm install axios
 * import axios from 'axios';
 * 
 * export const api = axios.create({
 *     baseURL: API_BASE_URL,
 *     timeout: 10000,
 *     headers: {
 *         'Content-Type': 'application/json',
 *     },
 * });
 * 
 * // Add request interceptor for auth token
 * api.interceptors.request.use((config) => {
 *     const token = localStorage.getItem('auth_token');
 *     if (token) {
 *         config.headers.Authorization = `Bearer ${token}`;
 *     }
 *     return config;
 * });
 * 
 * // Add response interceptor for error handling
 * api.interceptors.response.use(
 *     (response) => response,
 *     (error) => {
 *         if (error.response?.status === 401) {
 *             // Handle unauthorized - redirect to login
 *             window.location.href = '/login';
 *         }
 *         return Promise.reject(error);
 *     }
 * );
 */

// Placeholder export (จะใช้งานเมื่อติดตั้ง axios)
export const api = {
    baseURL: API_BASE_URL,
};
