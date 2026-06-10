import api from '@/core/api/api';
import type { RequisitionApprovalListItem, ApproveRequisitionPayload } from '../types/requisition-approval.types';
import type { IssueRequisitionHeader, IssueRequisitionLine } from '../../requisition/types/requisition.types';
import type { SuccessResponse } from '@/shared/types/api.types';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import { getResolvedDocName, type DocLinkLike } from '../utils/ic-document.util';
import { RequisitionService } from '../../requisition/services/requisition.service';

const ENDPOINTS = {
    pending: '/appv-issue-requistion/pending',
    history: '/appv-issue-requistion',
    detail: (id: string) => `/issue-requistion/${id}`,
    approve: '/appv-issue-requistion',
};

export const RequisitionApprovalService = {
    getPending: async (): Promise<RequisitionApprovalListItem[]> => {
        try {
            // Fetch all requisitions
            const requisitionsRes = await api.get<unknown>('/issue-requistion');
            let requisitions: Record<string, unknown>[] = [];
            if (requisitionsRes && typeof requisitionsRes === 'object') {
                const resObj = requisitionsRes as Record<string, unknown>;
                const rawItems = resObj.items || resObj.data || (Array.isArray(requisitionsRes) ? requisitionsRes : []);
                requisitions = (Array.isArray(rawItems) ? rawItems : []) as Record<string, unknown>[];
            } else if (Array.isArray(requisitionsRes)) {
                requisitions = requisitionsRes as Record<string, unknown>[];
            }

            // Fetch all approvals
            const approvalsRes = await api.get<unknown>(ENDPOINTS.history).catch(() => []);
            const approvals = (Array.isArray(approvalsRes) ? approvalsRes : (((approvalsRes as Record<string, unknown> | undefined)?.items || []))) as Record<string, unknown>[];

            // Map master data
            const [departments, employees, docLinks, appvDocLinks] = await Promise.all([
                MasterDataService.getDepartments().catch(() => []),
                MasterDataService.getEmployees().catch(() => []),
                RequisitionService.getDocLinks('ISSUE_REQ').catch(() => []),
                RequisitionService.getDocLinks('APPV_ISSUE').catch(() => [])
            ]);

            const mapped = requisitions
                .filter(h => {
                    const reqId = String(h.issue_req_id || h.docu_item_id || '');
                    const matchedAppv = approvals.find(a => String(a.issue_req_id) === reqId);
                    if (!matchedAppv && (h.status as string || '').toUpperCase() === 'DRAFT') {
                        return false;
                    }
                    return true;
                })
                .map((h, i: number) => {
                    const dept = departments.find(
                        (d) => Number((d as unknown as Record<string, unknown>).emp_dept_id || (d as unknown as Record<string, unknown>).department_id || (d as unknown as Record<string, unknown>).id) === Number(h.emp_dept_id)
                    ) as unknown as Record<string, unknown> | undefined;
                    const emp = employees.find(
                        (e) => Number((e as unknown as Record<string, unknown>).employee_id || (e as unknown as Record<string, unknown>).id) === Number(h.request_by_emp_id)
                    ) as unknown as Record<string, unknown> | undefined;


                    const reqId = String(h.issue_req_id || h.docu_item_id || '');
                    const matchedAppv = approvals.find(a => String(a.issue_req_id) === reqId);
                    const rawStatus = (h.status as string || 'PENDING').toUpperCase();
                    const finalStatus = (matchedAppv 
                        ? (matchedAppv.status as 'PENDING' | 'APPROVED' | 'REJECTED') 
                        : (rawStatus === 'APPROVED' || rawStatus === 'REJECTED' ? rawStatus : 'PENDING')) as 'PENDING' | 'APPROVED' | 'REJECTED';

                    const docName = getResolvedDocName(finalStatus, h.doc_link_ic_id as string, docLinks as unknown as DocLinkLike[], appvDocLinks as unknown as DocLinkLike[]);
                    
                    const lines = (h.issueRequistionLines || h.issueRequisitionLines || []) as Record<string, unknown>[];
                    const qty_total = lines.reduce((sum: number, line) => sum + (Number(line.qty) || 0), 0);

                    return {
                        row_key: `pending-${h.issue_req_id || h.docu_item_id}-${i}`,
                        docu_item_id: String(h.issue_req_id || h.docu_item_id || ''),
                        issue_req_no: (h.issue_req_no as string) || `REQ-${h.issue_req_id || ''}`,
                        docu_item_no: docName,
                        docu_date: (h.issue_req_date as string) || (h.docu_date as string) || '',
                        dept_name: dept ? ((dept.emp_dept_name as string) || (dept.department_name as string) || (dept.dept_name as string) || '-') : '-',
                        save_emp_name: emp ? ((emp.employee_fullname as string) || `${(emp.employee_firstname_th as string) || ''} ${(emp.employee_lastname_th as string) || ''}`.trim()) : '-',
                        qty_total: qty_total,
                        status: finalStatus,
                        cancel_flag: String(h.cancel_flag || 'N'),
                    };
                });

            return mapped.filter((h) => h.status === 'PENDING' && h.cancel_flag !== 'Y');
        } catch {
            return [];
        }
    },

    getHistory: async (params?: Record<string, unknown>): Promise<RequisitionApprovalListItem[]> => {
        try {
            // Fetch all requisitions
            const requisitionsRes = await api.get<unknown>('/issue-requistion');
            let requisitions: Record<string, unknown>[] = [];
            if (requisitionsRes && typeof requisitionsRes === 'object') {
                const resObj = requisitionsRes as Record<string, unknown>;
                const rawItems = resObj.items || resObj.data || (Array.isArray(requisitionsRes) ? requisitionsRes : []);
                requisitions = (Array.isArray(rawItems) ? rawItems : []) as Record<string, unknown>[];
            } else if (Array.isArray(requisitionsRes)) {
                requisitions = requisitionsRes as Record<string, unknown>[];
            }

            // Fetch all approvals
            const approvalsRes = await api.get<unknown>(ENDPOINTS.history, { params }).catch(() => []);
            const approvals = (Array.isArray(approvalsRes) ? approvalsRes : (((approvalsRes as Record<string, unknown> | undefined)?.items || []))) as Record<string, unknown>[];

            // Map master data
            const [departments, employees, docLinks, appvDocLinks] = await Promise.all([
                MasterDataService.getDepartments().catch(() => []),
                MasterDataService.getEmployees().catch(() => []),
                RequisitionService.getDocLinks('ISSUE_REQ').catch(() => []),
                RequisitionService.getDocLinks('APPV_ISSUE').catch(() => [])
            ]);

            const mapped = requisitions
                .map((h, i: number) => {
                    const dept = departments.find(
                        (d) => Number((d as unknown as Record<string, unknown>).emp_dept_id || (d as unknown as Record<string, unknown>).department_id || (d as unknown as Record<string, unknown>).id) === Number(h.emp_dept_id)
                    ) as unknown as Record<string, unknown> | undefined;
                    const emp = employees.find(
                        (e) => Number((e as unknown as Record<string, unknown>).employee_id || (e as unknown as Record<string, unknown>).id) === Number(h.request_by_emp_id)
                    ) as unknown as Record<string, unknown> | undefined;
                    const reqId = String(h.issue_req_id || h.docu_item_id || '');
                    const matchedAppv = approvals.find(a => String(a.issue_req_id) === reqId);
                    
                    if (!matchedAppv) return null;

                    const finalStatus = (matchedAppv.status as 'APPROVED' | 'REJECTED') || 'APPROVED';
                    const docName = getResolvedDocName(finalStatus, h.doc_link_ic_id as string, docLinks as unknown as DocLinkLike[], appvDocLinks as unknown as DocLinkLike[]);

                    const lines = (h.issueRequistionLines || h.issueRequisitionLines || []) as Record<string, unknown>[];
                    const qty_total = lines.reduce((sum: number, line) => sum + (Number(line.qty) || 0), 0);

                    const approver = employees.find(
                        (e) => Number((e as unknown as Record<string, unknown>).employee_id || (e as unknown as Record<string, unknown>).id) === Number(matchedAppv.approval_emp_id)
                    ) as unknown as Record<string, unknown> | undefined;
                    const approverName = approver ? (approver.employee_fullname as string || `${(approver.employee_firstname_th as string) || ''} ${(approver.employee_lastname_th as string) || ''}`.trim()) : '-';

                    return {
                        row_key: `history-${h.issue_req_id || h.docu_item_id}-${i}`,
                        docu_item_id: String(h.issue_req_id || h.docu_item_id || ''),
                        issue_req_no: (h.issue_req_no as string) || `REQ-${h.issue_req_id || ''}`,
                        docu_item_no: docName,
                        docu_date: (h.issue_req_date as string) || (h.docu_date as string) || '',
                        dept_name: dept ? ((dept.emp_dept_name as string) || (dept.department_name as string) || (dept.dept_name as string) || '-') : '-',
                        save_emp_name: emp ? ((emp.employee_fullname as string) || `${(emp.employee_firstname_th as string) || ''} ${(emp.employee_lastname_th as string) || ''}`.trim()) : '-',
                        qty_total: qty_total,
                        status: matchedAppv.status as 'PENDING' | 'APPROVED' | 'REJECTED',
                        approval_emp_name: approverName,
                        cancel_flag: String(h.cancel_flag || 'N'),
                    };
                })
                .filter((item): item is NonNullable<typeof item> => item !== null && item.cancel_flag !== 'Y');

            return mapped;
        } catch {
            return [];
        }
    },

    getRequisitionById: async (id: string): Promise<{ header: IssueRequisitionHeader; lines: IssueRequisitionLine[] } | null> => {
        try {
            const res = await api.get<unknown>(ENDPOINTS.detail(id));
            if (!res || typeof res !== 'object') return null;

            const resObj = res as Record<string, unknown>;
            const header = (resObj.header ? resObj.header : resObj) as unknown as IssueRequisitionHeader;
            const rawLines = (resObj.lines || resObj.issueRequistionLines || resObj.issueRequisitionLines || []) as unknown[];
            const lines = rawLines as IssueRequisitionLine[];

            // Resolve Lot Numbers asynchronously from /item-lot/{lot_id}
            const uniqueLotIds = [...new Set(lines.map(l => Number(l.lot_id)).filter(lotId => lotId > 0))];
            if (uniqueLotIds.length > 0) {
                try {
                    const lotDetails = await Promise.all(
                        uniqueLotIds.map(lotId =>
                            api.get<Record<string, unknown>>(`/item-lot/${lotId}`)
                                .then(res => {
                                    const raw = (res?.data || res) as Record<string, unknown> | undefined;
                                    return {
                                        lotId,
                                        lot_no: raw ? String(raw.lot_no_code || raw.lot_no || '') : ''
                                    };
                                })
                                .catch(() => ({ lotId, lot_no: '' }))
                        )
                    );

                    lines.forEach(l => {
                        const matchedLot = lotDetails.find(ld => ld.lotId === Number(l.lot_id));
                        if (matchedLot && matchedLot.lot_no) {
                            (l as unknown as Record<string, unknown>).lot_no = matchedLot.lot_no;
                        }
                    });
                } catch {
                    // Ignore lot resolution failure
                }
            }

            // Resolve UOM conversion names asynchronously from /item-uom/{uom_id}
            const uniqueUomIds = [...new Set(lines.map(l => Number(l.uom_id)).filter(uomId => uomId > 0))];
            if (uniqueUomIds.length > 0) {
                try {
                    const uomDetails = await Promise.all(
                        uniqueUomIds.map(uomId =>
                            api.get<Record<string, unknown>>(`/item-uom/${uomId}`)
                                .then(res => {
                                    const raw = (res?.data || res) as Record<string, unknown> | undefined;
                                    const fromUom = raw?.from_uom as Record<string, unknown> | undefined;
                                    const toUom = raw?.to_uom as Record<string, unknown> | undefined;
                                    return {
                                        uomId,
                                        uom_name: fromUom ? String(fromUom.uom_name || fromUom.uom_code || '') : '',
                                        conversion_factor: raw ? Number(raw.factor || 1) : 1,
                                        to_uom_name: toUom ? String(toUom.uom_name || toUom.uom_code || '') : ''
                                    };
                                })
                                .catch(() => ({ uomId, uom_name: '', conversion_factor: 1, to_uom_name: '' }))
                        )
                    );

                    lines.forEach(l => {
                        const matchedUom = uomDetails.find(ud => ud.uomId === Number(l.uom_id));
                        if (matchedUom) {
                            if (matchedUom.uom_name) {
                                (l as unknown as Record<string, unknown>).uom_name = matchedUom.uom_name;
                            }
                            (l as unknown as Record<string, unknown>).conversion_factor = matchedUom.conversion_factor;
                            (l as unknown as Record<string, unknown>).to_uom_name = matchedUom.to_uom_name;
                        }
                    });
                } catch {
                    // Ignore UOM resolution failure
                }
            }

            // Fetch approval details if the requisition is approved/rejected to populate approval_no and reject_reason
            let approvalNo = '';
            let approvalRemarks = '';
            let approvalStatus = '';
            try {
                const approvalsRes = await api.get<unknown>(ENDPOINTS.history).catch(() => []);
                const approvals = (Array.isArray(approvalsRes) ? approvalsRes : (((approvalsRes as Record<string, unknown> | undefined)?.items || []))) as Record<string, unknown>[];
                const matchedAppv = approvals.find(a => String(a.issue_req_id) === String(id));
                if (matchedAppv) {
                    approvalNo = String(matchedAppv.appv_issue_req_no || matchedAppv.approval_no || '');
                    approvalRemarks = String(matchedAppv.remarks || matchedAppv.remark || '');
                    approvalStatus = String(matchedAppv.status || '');
                }
            } catch {
                // Ignore approval query failure
            }

            const rawHeader = header as unknown as Record<string, unknown>;
            rawHeader.approval_no = rawHeader.approval_no || approvalNo;
            rawHeader.appv_issue_req_no = rawHeader.appv_issue_req_no || approvalNo;
            rawHeader.reject_reason = rawHeader.reject_reason || approvalRemarks;
            if (approvalStatus) {
                rawHeader.status = approvalStatus;
            }

            return {
                header,
                lines,
            };
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
