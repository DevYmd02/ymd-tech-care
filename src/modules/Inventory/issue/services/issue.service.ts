/**
 * @file issue.service.ts
 * @description Service layer สำหรับ Stock Issue (ใบเบิก)
 * @api /issue-stock
 */

import api from '@/core/api/api';
import { logger } from '@/shared/utils';
import type {
    IssueStockHeader,
    IssueStockLine,
    IssueStockListItem,
    IssueStockListParams,
} from '../types/issue.types';
import type { IssueStockFormData } from '../schemas/issue.schemas';
import type { ListResponse, SuccessResponse } from '@/shared/types/api.types';

// ====================================================================================
// SERVICE
// ====================================================================================

export const IssueStockService = {
    // ─── List ────────────────────────────────────────────────────────────────────────
    getList: async (params?: IssueStockListParams): Promise<ListResponse<IssueStockListItem>> => {
        try {
            const res = await api.get<ListResponse<IssueStockListItem>>('/issue-stock', { params });
            return res as ListResponse<IssueStockListItem>;
        } catch (error) {
            logger.error('[IssueStockService] getList error:', error);
            return { items: [], total: 0, page: 1, limit: 10 };
        }
    },

    // ─── Get Pending Issue Stock (Approved Requisitions) ────────────────────────
    getPendingIssues: async (params?: Record<string, any>): Promise<ListResponse<any>> => {
        try {
            const res = await api.get<ListResponse<any>>('/issue-stock/pending-issue-stock', { params });
            return res as ListResponse<any>;
        } catch (error) {
            logger.error('[IssueStockService] getPendingIssues error:', error);
            return { items: [], total: 0, page: 1, limit: 10 };
        }
    },

    // ─── Get By ID ───────────────────────────────────────────────────────────────────
    getById: async (
        id: string
    ): Promise<{ header: IssueStockHeader; lines: IssueStockLine[] } | null> => {
        try {
            const res = await api.get<{ header: IssueStockHeader; lines: IssueStockLine[] }>(
                `/issue-stock/${id}`
            );
            return res as { header: IssueStockHeader; lines: IssueStockLine[] };
        } catch (error) {
            logger.error('[IssueStockService] getById error:', error);
            return null;
        }
    },

    // ─── Create ──────────────────────────────────────────────────────────────────────
    create: async (data: IssueStockFormData): Promise<SuccessResponse> => {
        try {
            await api.post('/issue-stock', data);
            return { success: true };
        } catch (error) {
            logger.error('[IssueStockService] create error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return { success: false, message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด' };
        }
    },

    // ─── Update ──────────────────────────────────────────────────────────────────────
    update: async (id: string, data: Partial<IssueStockFormData>): Promise<SuccessResponse> => {
        try {
            await api.patch(`/issue-stock/${id}`, data);
            return { success: true };
        } catch (error) {
            logger.error('[IssueStockService] update error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return { success: false, message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด' };
        }
    },

    // ─── Delete / Cancel ────────────────────────────────────────────────────────────
    delete: async (id: string): Promise<SuccessResponse> => {
        try {
            await api.delete(`/issue-stock/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[IssueStockService] delete error:', error);
            return { success: false, message: 'ไม่สามารถยกเลิกใบเบิกได้' };
        }
    },
};
