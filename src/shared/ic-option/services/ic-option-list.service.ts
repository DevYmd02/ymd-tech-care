/**
 * @file ic-option-list.service.ts
 * @description Global IC Option List service — CRUD for /ic-option-list endpoint.
 * Shared across all modules (Sales, Inventory, Purchase, MRP).
 */

import api from '@/core/api/api';
import { logger } from '@/shared/utils';
import type { ICOptionListItem, ICOptionListFormData } from '../types/ic-option.types';

export const ICOptionListService = {
    /**
     * Fetch all IC Option List items by ic_option_id
     */
    async getByICOptionId(icOptionId: string | number): Promise<ICOptionListItem[]> {
        try {
            const response = await api.get<ICOptionListItem[]>('/ic-option-list', {
                params: { ic_option_id: icOptionId },
            });
            return Array.isArray(response) ? response : [];
        } catch (error) {
            logger.error('[ICOptionListService] Failed to get IC Option List:', error);
            throw error;
        }
    },

    /**
     * Fetch a single IC Option List item by ID
     */
    async getById(id: number): Promise<ICOptionListItem | undefined> {
        try {
            const response = await api.get<ICOptionListItem>(`/ic-option-list/${id}`);
            return response;
        } catch (error) {
            logger.error(`[ICOptionListService] Failed to get IC Option List ID ${id}:`, error);
            return undefined;
        }
    },

    /**
     * Create a new IC Option List item
     */
    async create(data: ICOptionListFormData): Promise<ICOptionListItem> {
        try {
            const response = await api.post<ICOptionListItem>('/ic-option-list', data);
            return response;
        } catch (error) {
            logger.error('[ICOptionListService] Failed to create IC Option List item:', error);
            throw error;
        }
    },

    /**
     * Update an existing IC Option List item
     */
    async update(id: number, data: Partial<ICOptionListFormData>): Promise<ICOptionListItem> {
        try {
            const response = await api.patch<ICOptionListItem>(`/ic-option-list/${id}`, data);
            return response;
        } catch (error) {
            logger.error(`[ICOptionListService] Failed to update IC Option List ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Upsert: if item exists for that doc → PATCH, else → POST
     */
    async upsert(data: ICOptionListFormData, existingId?: number): Promise<ICOptionListItem> {
        if (existingId) {
            return this.update(existingId, data);
        }
        return this.create(data);
    },
};
