/**
 * @file return.service.ts
 * @description Service layer สำหรับ Return Issue Stock (รับคืนจากการเบิก)
 * @api /return-issue-stock
 */

import api from '@/core/api/api';
import { logger } from '@/shared/utils';
import type {
    ReturnIssueHeader,
    ReturnIssueLine,
    ReturnIssueListItem,
    ReturnIssueListParams,
} from '../types/return.types';
import type { ReturnIssueFormData } from '../schemas/return.schemas';
import type { ListResponse, SuccessResponse } from '@/shared/types/api.types';

// ====================================================================================
// SERVICE
// ====================================================================================

export const ReturnIssueService = {
    // ─── List ────────────────--------------------------------------------------------
    getList: async (params?: ReturnIssueListParams): Promise<ListResponse<ReturnIssueListItem>> => {
        try {
            const res = await api.get<ListResponse<ReturnIssueListItem>>('/return-issue-stock', { params });
            return res as ListResponse<ReturnIssueListItem>;
        } catch (error) {
            logger.error('[ReturnIssueService] getList error:', error);
            return { items: [], total: 0, page: 1, limit: 10 };
        }
    },

    // ─── Get By ID ───────────────────────────────────────────────────────────────────
    getById: async (
        id: string
    ): Promise<{ header: ReturnIssueHeader; lines: ReturnIssueLine[] } | null> => {
        try {
            const res = await api.get<{ header: ReturnIssueHeader; lines: ReturnIssueLine[] }>(
                `/return-issue-stock/${id}`
            );
            return res as { header: ReturnIssueHeader; lines: ReturnIssueLine[] };
        } catch (error) {
            logger.error('[ReturnIssueService] getById error:', error);
            return null;
        }
    },

    // ─── Create ──────────────────────────────────────────────────────────────────────
    create: async (data: ReturnIssueFormData): Promise<SuccessResponse> => {
        try {
            await api.post('/return-issue-stock', data);
            return { success: true };
        } catch (error) {
            logger.error('[ReturnIssueService] create error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return { success: false, message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด' };
        }
    },

    // ─── Update ──────────────────────────────────────────────────────────────────────
    update: async (id: string, data: Partial<ReturnIssueFormData>): Promise<SuccessResponse> => {
        try {
            await api.patch(`/return-issue-stock/${id}`, data);
            return { success: true };
        } catch (error) {
            logger.error('[ReturnIssueService] update error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return { success: false, message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด' };
        }
    },

    // ─── Delete / Cancel ────────────────────────────────────────────────────────────
    delete: async (id: string): Promise<SuccessResponse> => {
        try {
            await api.delete(`/return-issue-stock/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[ReturnIssueService] delete error:', error);
            return { success: false, message: 'ไม่สามารถยกเลิกใบรับคืนจากการเบิกได้' };
        }
    },
};
