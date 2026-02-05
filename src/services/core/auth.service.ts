/**
 * @file auth.service.ts
 * @description Auth Service with Colocated Mocking Strategy
 * @note When VITE_USE_MOCK=true, returns mock data instead of hitting real API
 */

import { AxiosError } from 'axios';
import api from '@/services/core/api';
import { logger } from '@/utils/logger';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface LoginPayload {
    username: string;
    password?: string;
    remember?: boolean;
}

export interface UserProfile {
    id: number;
    username: string;
    employee_id: number;
    employee: {
        employee_id: number;
        branch_id: number;
        employee_code: string;
        employee_fullname: string;
        position_id: number;
        department_id: number;
    };
}

export interface LoginResponse {
    access_token: string;
    user: UserProfile;
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

// =============================================================================
// MOCK DATA (For Development Mode)
// =============================================================================

const MOCK_LOGIN_RESPONSE: LoginResponse = {
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwidXNlcm5hbWUiOiJqb2huLmRvZTEiLCJpYXQiOjE3MzgzMjAwMDAsImV4cCI6MTczODQwNjQwMH0.mock_signature_for_dev",
    user: {
        id: 2,
        username: "john.doe1",
        employee_id: 2,
        employee: {
            employee_id: 2,
            branch_id: 1,
            employee_code: "EMP0003",
            employee_fullname: "นาย สมชาย ใจดี",
            position_id: 1,
            department_id: 1
        }
    }
};

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

export const AuthService = {
    login: async (data: LoginPayload): Promise<LoginResponse> => {
        const isMock = import.meta.env.VITE_USE_MOCK === 'true';

        // ===== MOCK MODE =====
        if (isMock) {
            logger.info('📢 [AuthService] Using Mock Data (VITE_USE_MOCK=true)');
            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 500));
            return MOCK_LOGIN_RESPONSE;
        }

        // ===== REAL API MODE =====
        try {
            const response = await api.post<LoginResponse>('/auth/login', data);
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
    },

    register: async (data: RegisterPayload): Promise<RegisterResponse> => {
        try {
            // Backend expects POST /auth/employees/:employee_id/auth
            const { employee_id, ...body } = data;
            const response = await api.post<RegisterResponse>(`/auth/employees/${employee_id}/auth`, body);
            logger.info('📦 [AuthService] Raw Register Response:', response.data);
            return response.data;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                logger.error('❌ [AuthService] Registration failed:', error.response?.data || error.message);
            } else {
                logger.error('❌ [AuthService] Registration failed:', error);
            }
            throw error;
        }
    }
};
