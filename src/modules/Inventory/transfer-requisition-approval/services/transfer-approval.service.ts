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
import type { TransferRequisitionHeader, TransferRequisitionLine, TransferRequisitionListItem } from '../../transfer-requisition/types/transfer.types';
import { TransferService } from '../../transfer-requisition/services/transfer.service';
import type { TransferApprovalFormData } from '../schemas/transfer-approval.schemas';
import type { ListResponse, SuccessResponse } from '@/shared/types/api.types';

const ENDPOINTS = {
    base: '/appv-transfer-stock',
    pending: '/appv-transfer-stock/pending-approval',
    requisitionDetail: (id: string) => `/transfer-stock/${id}`,
};

export const TransferApprovalService = {
    // ─── List / History ──────────────────────────────────────────────────────────────
    getList: async (params?: TransferApprovalListParams, config?: { signal?: AbortSignal }): Promise<ListResponse<TransferApprovalListItem>> => {
        try {
            const res = await api.get<Record<string, unknown>>(ENDPOINTS.base, { params, ...config });
            let items = Array.isArray(res) ? res : (Array.isArray(res.items) ? res.items : (Array.isArray(res.data) ? res.data : []));
            
            // Fetch missing transfer_by_emp_id for each item
            items = await Promise.all(items.map(async (item: Record<string, unknown>) => {
                if (item.transfer_req_id && !item.transfer_by_emp_id && !item.transfer_emp_id) {
                    try {
                        const reqRes = await api.get<Record<string, unknown>>(`/transfer-stock/${item.transfer_req_id}`);
                        const reqData = (reqRes?.data || reqRes) as Record<string, unknown>;
                        if (reqData) {
                            return {
                                ...item,
                                transfer_by_emp_id: reqData.transfer_by_emp_id || reqData.transfer_emp_id || item.transfer_by_emp_id,
                            };
                        }
                    } catch {
                        // Ignore individual fetch errors
                    }
                }
                return item;
            }));

            const total = typeof res.total === 'number' ? res.total : items.length;
            return { items, total, page: params?.page || 1, limit: params?.limit || 10 };
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
            interface ApprovalResponse {
                lines?: Record<string, unknown>[];
                appvTransferLines?: Record<string, unknown>[];
                transfer_req_id?: string | number;
                status?: string;
                appv_flag?: string;
                [key: string]: unknown;
            }
            const response = await api.get<{ data?: ApprovalResponse } & ApprovalResponse>(
                `${ENDPOINTS.base}/${id}`
            );
            const res = (response?.data || response) as ApprovalResponse;
            
            // Map lines from appvTransferLines if lines does not exist
            const approvalLines = res.lines || res.appvTransferLines || [];

            // If we have transfer_req_id, fetch the original requisition to get its details
            let reqHeader = {};
            let reqLines: Record<string, unknown>[] = [];
            if (res.transfer_req_id) {
                try {
                    interface ReqResponse {
                        lines?: Record<string, unknown>[];
                        transferStockLines?: Record<string, unknown>[];
                        transferRequisitionLines?: Record<string, unknown>[];
                        [key: string]: unknown;
                    }
                    const reqRes = await api.get<{ data?: ReqResponse } & ReqResponse>(`/transfer-stock/${res.transfer_req_id}`);
                    const reqData = (reqRes?.data || reqRes) as ReqResponse;
                    if (reqData) {
                        reqHeader = reqData;
                        reqLines = reqData.lines || reqData.transferStockLines || reqData.transferRequisitionLines || [];
                    }
                } catch (e) {
                    logger.warn('[TransferApprovalService] Failed to fetch transfer requisition details', e);
                }
            }

            // Merge lines: use appv qty if exists, otherwise original req line qty
            const mergedLines = reqLines.length > 0 ? reqLines.map(rl => {
                const al = approvalLines.find((a: Record<string, unknown>) => String(a.transfer_req_line_id) === String(rl.id || rl.transfer_req_line_id));
                if (al) {
                    return {
                        ...rl,
                        ...al,
                        qty_ic: al.qty || rl.qty || rl.qty_ic, // keep original requested qty
                        appv_stock_qty: al.qty_approved,
                    };
                }
                return rl;
            }) : approvalLines;

            // Merge header
            const mergedHeader = {
                ...reqHeader,
                ...res,
                // Ensure the approval status overwrites the req status
                status: res.status || res.appv_flag,
            };

            return { header: mergedHeader as unknown as TransferApprovalHeader, lines: mergedLines as unknown as TransferApprovalLine[] };
        } catch (error) {
            logger.error('[TransferApprovalService] getById error:', error);
            return null;
        }
    },

    getPending: async (config?: { signal?: AbortSignal }): Promise<TransferRequisitionListItem[]> => {
        try {
            interface PendingApiItem {
                transfer_req_id?: string | number;
                transfer__req_id?: string;
                transfer_req_no?: string;
                transfer__req_no?: string;
                transfer_req_date?: string;
                docu_date?: string;
                branch_id?: string | number;
                created_by_emp_id?: string | number;
                [key: string]: unknown;
            }
            interface PendingApiResponse {
                items?: PendingApiItem[];
                data?: PendingApiItem[];
            }
            const res = await api.get<PendingApiItem[] | PendingApiResponse>('/appv-transfer-stock/pending-approval', config);
            const list = Array.isArray(res) ? res : res.items || res.data || [];
            return list.map((item) => ({
                ...item,
                transfer__req_id: item.transfer_req_id ? String(item.transfer_req_id) : item.transfer__req_id,
                transfer__req_no: item.transfer_req_no || item.transfer__req_no,
                docu_date: item.transfer_req_date || item.docu_date,
                branch_id: item.branch_id,
                created_by_emp_id: item.created_by_emp_id,
            })) as unknown as TransferRequisitionListItem[];
        } catch (error) {
            logger.error('[TransferApprovalService] getPending error:', error);
            return [];
        }
    },

    // ─── Get Requisition Detail ──────────────────────────────────────────────────────
    getRequisitionById: async (id: string): Promise<{ header: TransferRequisitionHeader; lines: TransferRequisitionLine[] } | null> => {
        try {
            // API /appv-transfer-stock/pending-approval มีแค่ ID (item_id, warehouse_id) ไม่มีชื่อ
            // ต้องไปดึงจาก Service ใบขอโอนย้าย (TransferService) โดยตรง ถึงจะได้ชื่อสินค้า/คลังมาด้วย
            return await TransferService.getById(id);
        } catch (error) {
            logger.error('[TransferApprovalService] getRequisitionById error:', error);
            return null;
        }
    },

    // ─── Create (Approve) ────────────────────────────────────────────────────────────
    create: async (data: TransferApprovalFormData): Promise<SuccessResponse> => {
        try {
            const isPartial = data.lines.some(line => Number(line.appv_stock_qty) < Number(line.qty_ic));
            const payload = {
                transfer_req_id: Number(data.transfer_req_id),
                branch_id: Number(data.branch_id),
                appv_transfer_date: data.appv_date,
                doc_link_ic_id: Number(data.doc_link_ic_id || 0),
                approval_emp_id: Number(data.appv_emp_id),
                status: data.appv_flag === 'N' ? 'REJECTED' : isPartial ? 'PARTIAL' : 'APPROVED',
                remarks: data.appv_flag === 'N' ? (data.remark || undefined) : (data.reject_reason || data.remark || undefined),
                cancel_remark: data.appv_flag === 'N' ? data.reject_reason : undefined,
                lines: data.lines.map(line => ({
                    transfer_req_line_id: Number(line.transfer_req_line_id || 0),
                    item_id: Number(line.item_id),
                    qty: Number(line.qty_ic),
                    qty_approved: Number(line.appv_stock_qty),
                    uom_id: Number(line.uom_id),
                    lot_id: line.lot_id ? Number(line.lot_id) : null,
                    lot_balance_id: (line as Record<string, unknown>).lot_balance_id ? Number((line as Record<string, unknown>).lot_balance_id) : null,
                    from_warehouse_id: Number(line.out_inve_id || line.income_inve_id),
                    from_location_id: Number(line.out_loca_id || line.income_loca_id || 0),
                    to_warehouse_id: Number(line.income_inve_id || line.out_inve_id),
                    to_location_id: Number(line.income_loca_id || line.out_loca_id || 0),
                }))
            };
            await api.post(ENDPOINTS.base, payload);
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
