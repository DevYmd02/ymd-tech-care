import type { ICOption, ICOptionFormData } from '../types/ic-option.types';
import api from '@/core/api/api';
import { logger } from '@/shared/utils';

export const ICOptionService = {
    /**
     * Fetch all IC Options
     */
    async getICOptions(params?: Record<string, string | number | boolean>): Promise<ICOption[]> {
        try {
            // Note: The specific endpoint should match the backend router (usually table name or kebab-case)
            const response = await api.get<ICOption[]>('/inventory-option', { params });
            return Array.isArray(response) ? response : response;
        } catch (error) {
            logger.error('Failed to get IC Options:', error);
            throw error;
        }
    },

    /**
     * Fetch a single IC Option by ID
     */
    async getICOptionById(id: string): Promise<ICOption | undefined> {
        try {
            const response = await api.get<ICOption>(`/inventory-option/${id}`);
            return response;
        } catch (error) {
            logger.error(`Failed to get IC Option ID ${id}:`, error);
            return undefined;
        }
    },

    /**
     * Create a new IC Option
     */
    async createICOption(data: ICOptionFormData): Promise<ICOption> {
        try {
            const response = await api.post<ICOption>('/inventory-option', data);
            return response;
        } catch (error) {
            logger.error('Failed to create IC Option:', error);
            throw error;
        }
    },

    /**
     * Update an existing IC Option
     */
    async updateICOption(id: string, data: Partial<ICOptionFormData>): Promise<ICOption> {
        try {
            const response = await api.patch<ICOption>(`/inventory-option/${id}`, data);
            return response;
        } catch (error) {
            logger.error(`Failed to update IC Option ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete an IC Option
     */
    async deleteICOption(id: string): Promise<void> {
        try {
            await api.delete(`/inventory-option/${id}`);
        } catch (error) {
            logger.error(`Failed to delete IC Option ID ${id}:`, error);
            throw error;
        }
    }
};
