import api from '@/core/api/api';
import type { RequisitionApprovalListItem, ApproveRequisitionPayload } from '../types/requisition-approval.types';
import type { IssueRequisitionHeader, IssueRequisitionLine } from '../../requisition/types/requisition.types';
import type { ListResponse, SuccessResponse } from '@/shared/types/api.types';

const ENDPOINTS = {
    pending: '/issue-requisition-approval/pending-approval',
    history: '/issue-requisition-approval',
    detail: (id: string) => `/issue-requisition/${id}`,
    approve: '/issue-requisition-approval',
};

export const RequisitionApprovalService = {
    getPending: async (): Promise<RequisitionApprovalListItem[]> => {
        try {
            // Check if backend pending endpoint exists, otherwise fallback to filtering all requisitions
            const res = await api.get<ListResponse<RequisitionApprovalListItem> | RequisitionApprovalListItem[]>(ENDPOINTS.pending);
            if (Array.isArray(res)) return res;
            return res.items || [];
        } catch {
            // Fallback: Query all requisitions and filter by PENDING state locally if backend is unavailable
            try {
                const res = await api.get<ListResponse<IssueRequisitionHeader>>('/issue-requisition');
                const list = res.items || [];
                // Map to approval items
                return list
                    .filter(h => h.cancel_flag === 'N') // Filter active requisitions
                    .map((h, i) => ({
                        row_key: `pending-${h.docu_item_id}-${i}`,
                        docu_item_id: h.docu_item_id,
                        issue_req_no: h.issue_req_no,
                        docu_date: h.docu_date,
                        qty_total: h.qty_total,
                        status: 'PENDING',
                    }));
            } catch {
                return [];
            }
        }
    },

    getHistory: async (params?: Record<string, unknown>): Promise<RequisitionApprovalListItem[]> => {
        try {
            const res = await api.get<ListResponse<RequisitionApprovalListItem> | RequisitionApprovalListItem[]>(ENDPOINTS.history, { params });
            if (Array.isArray(res)) return res;
            return res.items || [];
        } catch {
            // Fallback empty history
            return [];
        }
    },

    getRequisitionById: async (id: string): Promise<{ header: IssueRequisitionHeader; lines: IssueRequisitionLine[] } | null> => {
        try {
            const res = await api.get<{ header: IssueRequisitionHeader; lines: IssueRequisitionLine[] }>(ENDPOINTS.detail(id));
            return res;
        } catch {
            return null;
        }
    },

    approve: async (payload: ApproveRequisitionPayload): Promise<SuccessResponse> => {
        try {
            await api.post(ENDPOINTS.approve, payload);
            return { success: true };
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return {
                success: false,
                message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการอนุมัติ',
            };
        }
    },
};
