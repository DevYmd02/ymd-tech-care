import api from '@/core/api/api';
import { logger } from '@/shared/utils';
import type { DocLinkIC, DocLinkICCreatePayload, DocLinkICUpdatePayload, DocLinkICItem } from '../types/doc-link-ic.types';

// ==========================================
// MOCK DATA (FOR ISSUE REQUISITION)
// ==========================================
const MOCK_IC_ITEMS: DocLinkICItem[] = [
    {
        docu_item_id: 'item-1',
        docu_type_id: 'type-xxx',
        docu_item_no: 1,
        docu_item_name: 'ขอเบิกใช้',
        stock_effect_ic: 0,
        is_active: true
    },
    {
        docu_item_id: 'item-2',
        docu_type_id: 'type-xxx',
        docu_item_no: 2,
        docu_item_name: 'ขอเบิกผลิต',
        stock_effect_ic: 0,
        is_active: true
    },
    {
        docu_item_id: 'item-3',
        docu_type_id: 'type-xxx',
        docu_item_no: 3,
        docu_item_name: 'ขอเบิกตัวอย่าง',
        stock_effect_ic: 0,
        is_active: true
    },
    {
        docu_item_id: 'item-4',
        docu_type_id: 'type-xxx',
        docu_item_no: 4,
        docu_item_name: 'ขอเบิกตัดชำรุด',
        stock_effect_ic: 0,
        is_active: true
    },
    {
        docu_item_id: 'item-5',
        docu_type_id: 'type-xxx',
        docu_item_no: 5,
        docu_item_name: 'ขอเบิกยืม',
        stock_effect_ic: 0,
        is_active: true
    },
    {
        docu_item_id: 'item-6',
        docu_type_id: 'type-xxx',
        docu_item_no: 6,
        docu_item_name: 'ขอเบิกอื่นๆ',
        stock_effect_ic: 0,
        is_active: true
    },
];

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
            return MOCK_IC_ITEMS.filter(item => item.is_active && item.docu_item_no > 0);
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
    // DOC LINK IC ITEM CRUD (MOCK)
    // ==========================================

    async createItem(data: Omit<DocLinkICItem, 'docu_item_id'>): Promise<DocLinkICItem> {
        try {
            logger.info('Mock: Creating doc-link-ic item', data);
            return {
                ...data,
                docu_item_id: `item-new-${Date.now()}`
            };
        } catch (error) {
            logger.error('Failed to create doc-link-ic item:', error);
            throw error;
        }
    },

    async updateItem(id: string, data: Partial<DocLinkICItem>): Promise<DocLinkICItem> {
        try {
            logger.info(`Mock: Updating doc-link-ic item ${id}`, data);
            return { ...data } as DocLinkICItem;
        } catch (error) {
            logger.error(`Failed to update doc-link-ic item ${id}:`, error);
            throw error;
        }
    },

    async removeItem(id: string): Promise<void> {
        try {
            logger.info(`Mock: Removing doc-link-ic item ${id}`);
        } catch (error) {
            logger.error(`Failed to delete doc-link-ic item ${id}:`, error);
            throw error;
        }
    },
};
