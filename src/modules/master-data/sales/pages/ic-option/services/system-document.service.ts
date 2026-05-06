import api from '@/core/api/api';
import { logger } from '@/shared/utils';

export interface SystemDocument {
    system_document_id: number;
    system_document_code: string;
    system_document_name: string;
    system_document_name_eng?: string;
    sort_order?: number;
    is_active?: boolean;
}

export const SystemDocumentService = {
    /**
     * Fetch all system documents
     */
    async getAll(): Promise<SystemDocument[]> {
        try {
            const response = await api.get<SystemDocument[]>('/system-document');
            return Array.isArray(response) ? response : [];
        } catch (error) {
            logger.error('Failed to get system documents:', error);
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
            logger.error(`Failed to get system document ID ${id}:`, error);
            return undefined;
        }
    },
};
