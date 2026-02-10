/**
 * @file auth.service.ts
 * @description Auth Service
 */

import { AxiosError } from 'axios';
import api from '@/core/api/api';
import { logger } from '@/shared/utils/logger';

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
// SERVICE IMPLEMENTATION
// =============================================================================

export const AuthService = {
    login: async (data: LoginPayload): Promise<LoginResponse> => {
        try {
            const response = await api.post<LoginResponse>('/auth/login', data);
            logger.info('🔍 [AuthService] Raw Login Response:', response);
            return response;
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
            const { employee_id, ...body } = data;
            const response = await api.post<RegisterResponse>(`/auth/employees/${employee_id}/auth`, body);
            logger.info('📦 [AuthService] Raw Register Response:', response);
            return response;
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
