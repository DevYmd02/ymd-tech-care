/**
 * @file transfer.service.ts
 * @description Service layer สำหรับ Transfer Requisition (ใบขอโอนย้ายสินค้า)
 * @api /transfer-requisition
 */

import api from '@/core/api/api';
import { logger } from '@/shared/utils';
import type {
    TransferRequisitionHeader,
    TransferRequisitionLine,
    TransferRequisitionListItem,
    TransferRequisitionListParams,
} from '../types/transfer.types';
import type { TransferFormData } from '../schemas/transfer.schemas';
import type { ListResponse, SuccessResponse } from '@/shared/types/api.types';

// ====================================================================================
// SERVICE
// ====================================================================================

export const TransferService = {
    // ─── List ────────────────────────────────────────────────────────────────────────
    getList: async (params?: TransferRequisitionListParams, config?: { signal?: AbortSignal }): Promise<ListResponse<TransferRequisitionListItem>> => {
        try {
            const res = await api.get<ListResponse<TransferRequisitionListItem>>('/transfer-requisition', { params, ...config });
            return res as ListResponse<TransferRequisitionListItem>;
        } catch (error) {
            logger.error('[TransferService] getList error:', error);
            return { items: [], total: 0, page: 1, limit: 10 };
        }
    },

    // ─── Get By ID ───────────────────────────────────────────────────────────────────
    getById: async (
        id: string
    ): Promise<{ header: TransferRequisitionHeader; lines: TransferRequisitionLine[] } | null> => {
        try {
            const res = await api.get<{ header: TransferRequisitionHeader; lines: TransferRequisitionLine[] }>(
                `/transfer-requisition/${id}`
            );
            return res as { header: TransferRequisitionHeader; lines: TransferRequisitionLine[] };
        } catch (error) {
            logger.error('[TransferService] getById error:', error);
            return null;
        }
    },

    // ─── Create ──────────────────────────────────────────────────────────────────────
    create: async (data: TransferFormData): Promise<SuccessResponse> => {
        try {
            await api.post('/transfer-requisition', data);
            return { success: true };
        } catch (error) {
            logger.error('[TransferService] create error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return { success: false, message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด' };
        }
    },

    // ─── Update ──────────────────────────────────────────────────────────────────────
    update: async (id: string, data: Partial<TransferFormData>): Promise<SuccessResponse> => {
        try {
            await api.patch(`/transfer-requisition/${id}`, data);
            return { success: true };
        } catch (error) {
            logger.error('[TransferService] update error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return { success: false, message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด' };
        }
    },

    // ─── Delete / Cancel ────────────────────────────────────────────────────────────
    delete: async (id: string): Promise<SuccessResponse> => {
        try {
            await api.delete(`/transfer-requisition/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[TransferService] delete error:', error);
            return { success: false, message: 'ไม่สามารถยกเลิกใบขอโอนย้ายสินค้าได้' };
        }
    },
};
