import api from '@/core/api/api';
import { logger } from '@/shared/utils';
import type { DocLinkIC, DocLinkICCreatePayload, DocLinkICUpdatePayload, DocLinkICItem, DocLinkICBackendResponse } from '../types/doc-link-ic.types';

export const DocLinkICService = {
    /**
     * GET /doc-link-ic — ดึง list ทั้งหมด
     */
    async getAll(): Promise<DocLinkIC[]> {
        try {
            const response = await api.get<DocLinkIC[]>('/doc-link-ic');
            return Array.isArray(response) ? response : [];
        } catch (error) {
            logger.error('Failed to get doc-link-ic list:', error);
            throw error;
        }
    },

    /**
     * GET /doc-link-ic/:docu_type_id/items — ดึงรายการเอกสารย่อย
     */
    async getItems(docu_type_id: string): Promise<DocLinkICItem[]> {
        try {
            // TODO: swap เป็น API จริงตอน backend พร้อม
            // const response = await api.get<DocLinkICItem[]>(`/doc-link-ic/${docu_type_id}/items`);
            // return Array.isArray(response) ? response : [];
            
            // ใช้ MOCK data ไปก่อน
            logger.info(`Fetching items for docu_type_id: ${docu_type_id}`);
            return [];
        } catch (error) {
            logger.error(`Failed to get doc-link-ic items for ${docu_type_id}:`, error);
            throw error;
        }
    },

    /**
     * POST /doc-link-ic — สร้างใหม่
     */
    async create(data: DocLinkICCreatePayload): Promise<DocLinkIC> {
        try {
            const response = await api.post<DocLinkIC>('/doc-link-ic', data);
            return response;
        } catch (error) {
            logger.error('Failed to create doc-link-ic:', error);
            throw error;
        }
    },

    /**
     * PATCH /doc-link-ic/:id — แก้ไข
     */
    async update(id: string, data: DocLinkICUpdatePayload): Promise<DocLinkIC> {
        try {
            const response = await api.patch<DocLinkIC>(`/doc-link-ic/${id}`, data);
            return response;
        } catch (error) {
            logger.error(`Failed to update doc-link-ic ${id}:`, error);
            throw error;
        }
    },

    /**
     * DELETE /doc-link-ic/:id — ลบ
     */
    async remove(id: string): Promise<void> {
        try {
            await api.delete(`/doc-link-ic/${id}`);
        } catch (error) {
            logger.error(`Failed to delete doc-link-ic ${id}:`, error);
            throw error;
        }
    },

    // ==========================================
    // DOC LINK IC ITEM CRUD (Real API)
    // ==========================================

    async createItem(data: Omit<DocLinkICItem, 'docu_item_id'> & { system_document_id?: number }): Promise<DocLinkICItem> {
        try {
            const payload: Record<string, unknown> = {
                system_document_id: Number(data.system_document_id ?? data.docu_type_id),
                doc_type_no: Number(data.doc_type_no ?? data.docu_item_no ?? 0),
                doc_type_name: data.doc_type_name ?? data.docu_item_name,
                docu_desc: data.docu_desc !== undefined ? data.docu_desc : (data.doc_type_name ?? data.docu_item_name),
                remark: data.remark !== undefined ? data.remark : (data.doc_type_name ?? data.docu_item_name),
                stock_effect_ic: data.stock_effect_ic,
                is_active: data.is_active,
            };
            const response = await api.post<DocLinkICBackendResponse>('/doc-link-ic', payload);
            return {
                docu_item_id: String(response.doc_link_ic_id ?? response.docu_item_id ?? ''),
                docu_type_id: String(response.system_document_id ?? response.docu_type_id ?? ''),
                docu_item_no: Number(response.doc_type_no ?? response.docu_item_no ?? 0),
                doc_type_no: Number(response.doc_type_no ?? response.docu_item_no ?? 0),
                docu_item_name: response.doc_type_name || response.docu_desc || '',
                doc_type_name: response.doc_type_name || response.docu_desc || '',
                stock_effect_ic: response.stock_effect_ic ?? 0,
                is_active: response.is_active ?? true,
                docu_desc: response.docu_desc || '',
                remark: response.remark || '',
            };
        } catch (error) {
            logger.error('Failed to create doc-link-ic item:', error);
            throw error;
        }
    },

    async updateItem(id: string, data: Partial<DocLinkICItem> & { system_document_id?: number }): Promise<DocLinkICItem> {
        try {
            const payload: Record<string, unknown> = {};
            if (data.system_document_id !== undefined || data.docu_type_id !== undefined) {
                payload.system_document_id = Number(data.system_document_id ?? data.docu_type_id);
            }
            if (data.doc_type_no !== undefined || data.docu_item_no !== undefined) {
                payload.doc_type_no = Number(data.doc_type_no ?? data.docu_item_no);
            }
            if (data.doc_type_name !== undefined || data.docu_item_name !== undefined) {
                payload.doc_type_name = data.doc_type_name ?? data.docu_item_name;
            }
            if (data.docu_desc !== undefined) {
                payload.docu_desc = data.docu_desc;
            }
            if (data.remark !== undefined) {
                payload.remark = data.remark;
            }
            if (data.stock_effect_ic !== undefined) payload.stock_effect_ic = data.stock_effect_ic;
            if (data.is_active !== undefined) payload.is_active = data.is_active;

            const response = await api.patch<DocLinkICBackendResponse>(`/doc-link-ic/${id}`, payload);
            return {
                docu_item_id: String(response.doc_link_ic_id ?? response.docu_item_id ?? ''),
                docu_type_id: String(response.system_document_id ?? response.docu_type_id ?? ''),
                docu_item_no: Number(response.doc_type_no ?? response.docu_item_no ?? 0),
                doc_type_no: Number(response.doc_type_no ?? response.docu_item_no ?? 0),
                docu_item_name: response.doc_type_name || response.docu_desc || '',
                doc_type_name: response.doc_type_name || response.docu_desc || '',
                stock_effect_ic: response.stock_effect_ic ?? 0,
                is_active: response.is_active ?? true,
                docu_desc: response.docu_desc || '',
                remark: response.remark || '',
            };
        } catch (error) {
            logger.error(`Failed to update doc-link-ic item ${id}:`, error);
            throw error;
        }
    },

    async removeItem(id: string): Promise<void> {
        try {
            await api.delete(`/doc-link-ic/${id}`);
        } catch (error) {
            logger.error(`Failed to delete doc-link-ic ${id}:`, error);
            throw error;
        }
    },
};
