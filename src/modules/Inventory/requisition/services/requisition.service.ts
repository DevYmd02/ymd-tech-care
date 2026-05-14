/**
 * @file requisition.service.ts
 * @description Service layer สำหรับ Issue Requisition (ใบขอเบิก)
 * @api /issue-requisition, /doc-link-ic
 */

import api from '@/core/api/api';
import { logger } from '@/shared/utils';
import type {
    IssueRequisitionHeader,
    IssueRequisitionLine,
    RequisitionListItem,
    RequisitionListParams,
    DocLinkOption,
} from '../types/requisition.types';
import type { RequisitionFormData } from '../schemas/requisition.schemas';
import type { ListResponse, SuccessResponse } from '@/shared/types/api.types';

// ====================================================================================
// SERVICE
// ====================================================================================

export const RequisitionService = {
    // ─── Doc Link IC Dropdown ───────────────────────────────────────────────────────
    getDocLinks: async (): Promise<DocLinkOption[]> => {
        try {
            const res = await api.get<DocLinkOption[] | { items?: DocLinkOption[]; data?: DocLinkOption[] }>(
                '/doc-link-ic',
                { params: { is_active: true } }
            );
            if (Array.isArray(res)) return res;
            return (res as { items?: DocLinkOption[]; data?: DocLinkOption[] }).items
                ?? (res as { items?: DocLinkOption[]; data?: DocLinkOption[] }).data
                ?? [];
        } catch (error) {
            logger.error('[RequisitionService] getDocLinks error:', error);
            return [];
        }
    },

    // ─── List ────────────────────────────────────────────────────────────────────────
    getList: async (params?: RequisitionListParams): Promise<ListResponse<RequisitionListItem>> => {
        try {
            const res = await api.get<ListResponse<RequisitionListItem>>('/issue-requisition', { params });
            return res as ListResponse<RequisitionListItem>;
        } catch (error) {
            logger.error('[RequisitionService] getList error:', error);
            return { items: [], total: 0, page: 1, limit: 10 };
        }
    },

    // ─── Get By ID ───────────────────────────────────────────────────────────────────
    getById: async (
        id: string
    ): Promise<{ header: IssueRequisitionHeader; lines: IssueRequisitionLine[] } | null> => {
        try {
            const res = await api.get<{ header: IssueRequisitionHeader; lines: IssueRequisitionLine[] }>(
                `/issue-requisition/${id}`
            );
            return res as { header: IssueRequisitionHeader; lines: IssueRequisitionLine[] };
        } catch (error) {
            logger.error('[RequisitionService] getById error:', error);
            return null;
        }
    },

    // ─── Create ──────────────────────────────────────────────────────────────────────
    create: async (data: RequisitionFormData): Promise<SuccessResponse> => {
        try {
            await api.post('/issue-requisition', data);
            return { success: true };
        } catch (error) {
            logger.error('[RequisitionService] create error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return { success: false, message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด' };
        }
    },

    // ─── Update ──────────────────────────────────────────────────────────────────────
    update: async (id: string, data: Partial<RequisitionFormData>): Promise<SuccessResponse> => {
        try {
            await api.patch(`/issue-requisition/${id}`, data);
            return { success: true };
        } catch (error) {
            logger.error('[RequisitionService] update error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return { success: false, message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด' };
        }
    },

    // ─── Delete / Cancel ────────────────────────────────────────────────────────────
    delete: async (id: string): Promise<SuccessResponse> => {
        try {
            await api.delete(`/issue-requisition/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[RequisitionService] delete error:', error);
            return { success: false, message: 'ไม่สามารถลบได้' };
        }
    },
};
