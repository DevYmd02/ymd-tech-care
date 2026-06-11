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
    DocLinkOption,
    PendingIssueStock,
} from '../types/issue.types';
import { ICDocumentService } from '@/modules/Inventory/shared/services/ic-document.service';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import type { IssueStockFormData } from '../schemas/issue.schemas';
import type { ListResponse, SuccessResponse } from '@/shared/types/api.types';

// ====================================================================================
// SERVICE
// ====================================================================================

export const IssueStockService = {
    // ─── Doc Link IC Dropdown ───────────────────────────────────────────────────────
    getDocLinks: async (systemDocCode = 'ISSUE_STOCK'): Promise<DocLinkOption[]> => {
        return ICDocumentService.getDocLinks(systemDocCode) as Promise<DocLinkOption[]>;
    },

    // ─── List ────────────────────────────────────────────────────────────────────────
    getList: async (params?: IssueStockListParams): Promise<ListResponse<IssueStockListItem>> => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = await api.get<any>('/issue-stock', { params });
            const data = Array.isArray(res) ? res : (res.data || res.items || []);
            const rawItems = Array.isArray(data) ? data : [];

            // Fetch master data for hydration
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let depts: any[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let emps: any[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let appvs: any[] = [];
            try {
                const [deptsRes, empsRes, appvsRes] = await Promise.all([
                    MasterDataService.getDepartments().catch(() => []),
                    MasterDataService.getEmployees().catch(() => []),
                    api.get('/appv-issue-requistion').catch(() => [])
                ]);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                depts = deptsRes as any[];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                emps = empsRes as any[];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                appvs = Array.isArray(appvsRes) ? appvsRes : ((appvsRes as any)?.data || (appvsRes as any)?.items || []);
            } catch (e) {
                logger.warn('Hydration failed', e);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items = rawItems.map((item: any) => {
                const deptId = item.emp_dept_id;
                const receEmpId = item.received_by_emp_id;
                const appvReqId = item.appv_issue_req_id || item.appvissue_req_id || item.ref_doc_id;

                let deptName = item.emp_dept_name || item.dept_name || '';
                if (!deptName && deptId) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const d = depts.find((x: any) => String(x.id || x.emp_dept_id || x.department_id) === String(deptId));
                    if (d) deptName = d.name || d.emp_dept_name || d.department_name || deptName;
                }

                let receEmpName = item.received_by_emp_name || item.rece_emp_name || '';
                if (!receEmpName && receEmpId) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const e = emps.find((x: any) => String(x.id || x.employee_id) === String(receEmpId));
                    if (e) receEmpName = e.name || e.employee_fullname || `${e.employee_firstname_th || ''} ${e.employee_lastname_th || ''}`.trim() || receEmpName;
                }

                let appvReqNo = item.appv_issue_req_no || item.appvissue_req_no || '';
                if (!appvReqNo && appvReqId) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const a = appvs.find((x: any) => String(x.appv_issue_req_id || x.issue_req_id) === String(appvReqId));
                    if (a) appvReqNo = a.appv_issue_req_no || a.approval_no || a.issue_req_no || appvReqNo;
                }

                return {
                    docu_item_id: String(item.issue_stock_id || item.docu_item_id || ''),
                    issue_stk_no: item.issue_stock_no || item.issue_stk_no || '',
                    appvissue_req_no: appvReqNo || '-',
                    docu_date: item.issue_stock_date || item.docu_date || '',
                    dept_name: deptName || '-',
                    save_emp_name: item.created_by_emp_name || item.save_emp_name || '',
                    rece_emp_name: receEmpName || (receEmpId ? `รหัสพนักงาน: ${receEmpId}` : '-'),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    amnt_total: item.amnt_total || (item.issueStockLines ? item.issueStockLines.reduce((sum: number, line: any) => sum + (Number(line.goods_amount) || 0), 0) : 0),
                    cancel_flag: item.status === 'CANCELLED' ? 'Y' : 'N'
                };
            });
            
            return {
                items,
                total: items.length,
                page: params?.page || 1,
                limit: params?.limit || 20
            };
        } catch (error) {
            logger.error('[IssueStockService] getList error:', error);
            return { items: [], total: 0, page: 1, limit: 10 };
        }
    },

    // ─── Get Pending Issue Stock (Approved Requisitions) ────────────────────────
    getPendingIssues: async (params?: Record<string, unknown>): Promise<ListResponse<PendingIssueStock>> => {
        try {
            const res = await api.get<ListResponse<PendingIssueStock>>('/issue-stock/pending-issue-stock', { params });
            return res as ListResponse<PendingIssueStock>;
        } catch (error) {
            logger.error('[IssueStockService] getPendingIssues error:', error);
            return { items: [], total: 0, page: 1, limit: 10 };
        }
    },

    getAppvReqNo: async (id: string | number): Promise<string> => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = await api.get<any>('/appv-issue-requistion');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const items = Array.isArray(res) ? res : ((res?.items || res?.data || []) as any[]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const matched = items.find((a: any) => String(a.appv_issue_req_id) === String(id) || String(a.issue_req_id) === String(id));
            if (matched) {
                return String(matched.appv_issue_req_no || matched.approval_no || matched.issue_req_no || '');
            }
            return '';
        } catch {
            return '';
        }
    },

    // ─── Get By ID ───────────────────────────────────────────────────────────────────
    getById: async (
        id: string
    ): Promise<{ header: IssueStockHeader; lines: IssueStockLine[] } | null> => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = await api.get<any>(`/issue-stock/${id}`);
            
            // Check if it already has header/lines structure
            if (res && res.header && Array.isArray(res.lines)) {
                return res as { header: IssueStockHeader; lines: IssueStockLine[] };
            }
            if (res && res.data && res.data.header) {
                return res.data as { header: IssueStockHeader; lines: IssueStockLine[] };
            }
            
            // Otherwise, it might be a flat response
            let raw = res?.data || res;
            if (Array.isArray(raw)) {
                raw = raw[0] || {};
            }
            
            // Map flat response to expected header structure
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const header: any = {
                ...raw,
                docu_item_id: String(raw.issue_stock_id || raw.docu_item_id || ''),
                docu_item_no: String(raw.doc_type_no != null ? raw.doc_type_no : (raw.doc_link_ic_id != null ? raw.doc_link_ic_id : (raw.docu_item_no || ''))),
                issue_stk_no: String(raw.issue_stock_no || raw.issue_stk_no || ''),
                appvissue_req_no: String(raw.appv_issue_req_no || raw.appvissue_req_no || raw.ref_doc_no || ''),
                docu_date: raw.issue_stock_date || raw.docu_date || '',
                emp_dept_id: String(raw.emp_dept_id || ''),
                job_id: String(raw.project_id || raw.job_id || ''),
                branch_id: String(raw.branch_id || ''),
                save_emp_id: String(raw.created_by_emp_id || raw.save_emp_id || ''),
                received_by_emp_id: String(raw.received_by_emp_id || ''),
                stock_effect_ic: raw.stock_effect_ic ?? -1,
                amnt_total: raw.total_amount || raw.amnt_total || 0,
                remark: raw.remarks || raw.remark || '',
                cancel_flag: raw.status === 'CANCELLED' ? 'Y' : (raw.cancel_flag || 'N'),
            };

            const rawLines = raw.issueStockLines || raw.lines || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const lines: any[] = rawLines.map((l: any, i: number) => ({
                ...l,
                listno: l.list_no || l.listno || i + 1,
                item_id: String(l.item_id || ''),
                item_code: l.item_code || l.item?.item_code || l.product?.item_code || l.inventoryItem?.item_code || '',
                item_name: l.item_name || l.item?.item_name || l.product?.item_name || l.inventoryItem?.item_name || '',
                uom_id: String(l.uom_id || ''),
                warehouse_id: String(l.warehouse_id || ''),
                warehouse_name: l.warehouse_name || l.warehouse?.warehouse_name || l.warehouse?.name || '',
                location_id: String(l.location_id || ''),
                location_name: l.location_name || l.location?.location_name || l.location?.name || '',
                lot_id: String(l.lot_id || ''),
                lot_no: l.lot_no || l.lot?.lot_no || '',
                qty_ic: Number(l.qty || l.qty_ic || 0),
                unit_cost: Number(l.unit_cost_price || l.unit_cost || 0),
                good_amnt: Number(l.goods_amount || l.good_amnt || ((l.qty || 0) * (l.unit_cost_price || 0))),
                remark: l.remarks || l.remark || '',
            }));

            return { header, lines };
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
