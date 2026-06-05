/**
 * @file transfer-approval.service.ts
 * @description Service layer สำหรับ อนุมัติใบขอโอนย้ายสินค้า (Transfer Requisition Approval)
 * @api /transfer-requisition-approval
 */

import api from '@/core/api/api';
import { logger } from '@/shared/utils';
import type {
    TransferApprovalHeader,
    TransferApprovalLine,
    TransferApprovalListItem,
    TransferApprovalListParams,
} from '../types/transfer-approval.types';
import type { TransferRequisitionHeader, TransferRequisitionLine, TransferRequisitionListItem } from '../../transfer/types/transfer.types';
import type { TransferApprovalFormData } from '../schemas/transfer-approval.schemas';
import type { ListResponse, SuccessResponse } from '@/shared/types/api.types';

const ENDPOINTS = {
    base: '/transfer-requisition-approval',
    pending: '/transfer-requisition-approval/pending',
    requisitionDetail: (id: string) => `/transfer-requisition/${id}`,
};

export const TransferApprovalService = {
    // ─── List / History ──────────────────────────────────────────────────────────────
    getList: async (params?: TransferApprovalListParams): Promise<ListResponse<TransferApprovalListItem>> => {
        try {
            const res = await api.get<ListResponse<TransferApprovalListItem>>(ENDPOINTS.base, { params });
            return res as ListResponse<TransferApprovalListItem>;
        } catch (error) {
            logger.error('[TransferApprovalService] getList error:', error);
            return { items: [], total: 0, page: 1, limit: 10 };
        }
    },

    // ─── Get By ID ───────────────────────────────────────────────────────────────────
    getById: async (
        id: string
    ): Promise<{ header: TransferApprovalHeader; lines: TransferApprovalLine[] } | null> => {
        try {
            const res = await api.get<{ header: TransferApprovalHeader; lines: TransferApprovalLine[] }>(
                `${ENDPOINTS.base}/${id}`
            );
            return res as { header: TransferApprovalHeader; lines: TransferApprovalLine[] };
        } catch (error) {
            logger.error('[TransferApprovalService] getById error:', error);
            return null;
        }
    },

    // ─── Get Pending Requisitions ────────────────────────────────────────────────────
    getPending: async (): Promise<TransferRequisitionListItem[]> => {
        try {
            const res = await api.get<ListResponse<TransferRequisitionListItem> | TransferRequisitionListItem[]>(ENDPOINTS.pending);
            if (Array.isArray(res)) return res;
            return res.items || [];
        } catch {
            // Fallback: Query all transfer requisitions and filter by cancel flag
            try {
                const res = await api.get<ListResponse<TransferRequisitionHeader>>('/transfer-requisition');
                const list = res.items || [];
                return list
                    .filter(h => h.cancelflag === 'N')
                    .map((h) => ({
                        transfer__req_id: h.transfer__req_id,
                        transfer__req_no: h.transfer__req_no,
                        docu_date: h.docu_date,
                        cancelflag: h.cancelflag,
                    }));
            } catch {
                return [];
            }
        }
    },

    // ─── Get Requisition Detail ──────────────────────────────────────────────────────
    getRequisitionById: async (id: string): Promise<{ header: TransferRequisitionHeader; lines: TransferRequisitionLine[] } | null> => {
        try {
            const res = await api.get<{ header: TransferRequisitionHeader; lines: TransferRequisitionLine[] }>(
                ENDPOINTS.requisitionDetail(id)
            );
            return res;
        } catch (error) {
            logger.error('[TransferApprovalService] getRequisitionById error:', error);
            return null;
        }
    },

    // ─── Create (Approve) ────────────────────────────────────────────────────────────
    create: async (data: TransferApprovalFormData): Promise<SuccessResponse> => {
        try {
            await api.post(ENDPOINTS.base, data);
            return { success: true };
        } catch (error) {
            logger.error('[TransferApprovalService] create error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return { success: false, message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการอนุมัติ' };
        }
    },

    // ─── Update ──────────────────────────────────────────────────────────────────────
    update: async (id: string, data: Partial<TransferApprovalFormData>): Promise<SuccessResponse> => {
        try {
            await api.patch(`${ENDPOINTS.base}/${id}`, data);
            return { success: true };
        } catch (error) {
            logger.error('[TransferApprovalService] update error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return { success: false, message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด' };
        }
    },

    // ─── Cancel/Delete ───────────────────────────────────────────────────────────────
    delete: async (id: string): Promise<SuccessResponse> => {
        try {
            await api.delete(`${ENDPOINTS.base}/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[TransferApprovalService] delete error:', error);
            return { success: false, message: 'ไม่สามารถยกเลิกเอกสารอนุมัติได้' };
        }
    },
};
