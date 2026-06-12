/**
 * @file system-document.service.ts
 * @description Global System Document service — shared across all modules.
 */

import api from '@/core/api/api';
import { logger } from '@/shared/utils';
import type { SystemDocument } from '../types/ic-option.types';

export const SystemDocumentService = {
    /**
     * Fetch all system documents
     */
    async getAll(): Promise<SystemDocument[]> {
        try {
            const response = await api.get<SystemDocument[]>('/system-document');
            return Array.isArray(response) ? response : [];
        } catch (error) {
            logger.error('[SystemDocumentService] Failed to get system documents:', error);
            throw error;
        }
    },

    /**
     * Fetch a single system document by ID
     */
    async getById(id: number): Promise<SystemDocument | undefined> {
        try {
            const response = await api.get<SystemDocument>(`/system-document/${id}`);
            return response;
        } catch (error) {
            logger.error(`[SystemDocumentService] Failed to get system document ID ${id}:`, error);
            return undefined;
        }
    },
};
