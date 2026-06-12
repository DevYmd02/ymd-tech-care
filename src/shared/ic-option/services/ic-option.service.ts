/**
 * @file ic-option.service.ts
 * @description Global IC Option service — CRUD for /inventory-option endpoint.
 * Shared across all modules (Sales, Inventory, Purchase, MRP).
 */

import api from '@/core/api/api';
import { logger } from '@/shared/utils';
import type { ICOptionBranchConfig, ICOptionFormData } from '../types/ic-option.types';

export const ICOptionService = {
    /**
     * Fetch all IC Options (branch-level configs)
     */
    async getICOptions(params?: Record<string, string | number | boolean>): Promise<ICOptionBranchConfig[]> {
        try {
            const response = await api.get<ICOptionBranchConfig[]>('/inventory-option', { params });
            return Array.isArray(response) ? response : [];
        } catch (error) {
            logger.error('[ICOptionService] Failed to get IC Options:', error);
            throw error;
        }
    },

    /**
     * Fetch a single IC Option by ID
     */
    async getICOptionById(id: string): Promise<ICOptionBranchConfig | undefined> {
        try {
            const response = await api.get<ICOptionBranchConfig>(`/inventory-option/${id}`);
            return response;
        } catch (error) {
            logger.error(`[ICOptionService] Failed to get IC Option ID ${id}:`, error);
            return undefined;
        }
    },

    /**
     * Create a new IC Option
     */
    async createICOption(data: ICOptionFormData): Promise<ICOptionBranchConfig> {
        try {
            const response = await api.post<ICOptionBranchConfig>('/inventory-option', data);
            return response;
        } catch (error) {
            logger.error('[ICOptionService] Failed to create IC Option:', error);
            throw error;
        }
    },

    /**
     * Update an existing IC Option
     */
    async updateICOption(id: string, data: Partial<ICOptionFormData>): Promise<ICOptionBranchConfig> {
        try {
            const response = await api.patch<ICOptionBranchConfig>(`/inventory-option/${id}`, data);
            return response;
        } catch (error) {
            logger.error(`[ICOptionService] Failed to update IC Option ID ${id}:`, error);
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
            logger.error(`[ICOptionService] Failed to delete IC Option ID ${id}:`, error);
            throw error;
        }
    },
};
