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
    PendingReturnIssue,
    PendingReturnIssueResponse,
    PendingReturnIssueParams,
} from '../types/return.types';
import type { ReturnIssueFormData } from '../schemas/return.schemas';
import type { ListResponse, SuccessResponse } from '@/shared/types/api.types';

// ====================================================================================
// SERVICE
// ====================================================================================

export const ReturnIssueService = {
    // ─── Get Pending Return (Confirmed Issue Stocks) ────────────────────────────
    getPendingReturns: async (params?: PendingReturnIssueParams): Promise<PendingReturnIssueResponse> => {
        try {
            const res = await api.get<Record<string, unknown>>('/return-stock/pending', { params });
            // API returns { data: [...], meta: { total, page, limit, total_pages } }
            if (res && res.data && res.meta) {
                return res as unknown as PendingReturnIssueResponse;
            }
            // Fallback: if response is array directly
            const items = (Array.isArray(res) ? res : (res?.data || res?.items || [])) as unknown[];
            return {
                data: items as PendingReturnIssue[],
                meta: {
                    total: items.length,
                    page: params?.page || 1,
                    limit: params?.limit || 20,
                    total_pages: 1,
                },
            };
        } catch {
            // ไม่แจ้ง error — เมื่อค้นหาไม่เจอข้อมูลไม่ต้องแสดง toast
            return { data: [], meta: { total: 0, page: 1, limit: 20, total_pages: 0 } };
        }
    },

    // ─── List ────────────────--------------------------------------------------------
    getList: async (params?: ReturnIssueListParams): Promise<ListResponse<ReturnIssueListItem>> => {
        try {
            const res = await api.get<Record<string, unknown>>('/return-stock', { params });
            const rawItems: Record<string, unknown>[] = Array.isArray(res) ? res : ((res?.data as Record<string, unknown>[]) || (res?.items as Record<string, unknown>[]) || []);

            // ดึงข้อมูล Master data มา map ชื่อแผนกและพนักงาน (ถ้า backend ไม่ได้ส่ง name มาให้)
            let depts: Record<string, unknown>[] = [];
            let emps: Record<string, unknown>[] = [];
            let issues: Record<string, unknown>[] = [];
            try {
                // dynamically import MasterDataService since it might be needed for hydration
                const { MasterDataService } = await import('@/modules/master-data/services/master-data.service');
                const [deptsRes, empsRes, issuesRes] = await Promise.all([
                    MasterDataService.getDepartments().catch(() => []),
                    MasterDataService.getEmployees().catch(() => []),
                    api.get('/issue-stock', { params: { limit: 1000 } }).catch(() => [])
                ]);
                depts = deptsRes as Record<string, unknown>[];
                emps = empsRes as Record<string, unknown>[];
                const issData = issuesRes as Record<string, unknown>;
                issues = Array.isArray(issuesRes) ? issuesRes : ((issData?.data as Record<string, unknown>[]) || (issData?.items as Record<string, unknown>[]) || []);
            } catch (e) {
                logger.warn('Hydration failed', e);
            }

            const items = rawItems.map((item: Record<string, unknown>) => {
                const deptId = item.emp_dept_id;
                const saveEmpId = item.created_by_emp_id || item.save_emp_id;
                const receEmpId = item.received_by_emp_id || item.rece_emp_id;

                const deptObj = item.department as Record<string, unknown> | undefined;
                const empDeptObj = item.emp_dept as Record<string, unknown> | undefined;
                let deptName = deptObj?.emp_dept_name || empDeptObj?.emp_dept_name || item.dept_name || '';
                if (!deptName && deptId) {
                    const d = depts.find((x) => String(x.id || x.emp_dept_id || x.department_id) === String(deptId));
                    if (d) deptName = d.name || d.emp_dept_name || d.department_name || deptName;
                }

                const createdByObj = item.created_by_employee as Record<string, unknown> | undefined;
                let saveEmpName = createdByObj?.employee_fullname || item.save_emp_name || '';
                if (!saveEmpName && saveEmpId) {
                    const e = emps.find((x) => String(x.id || x.employee_id) === String(saveEmpId));
                    if (e) saveEmpName = e.name || e.employee_fullname || `${e.employee_firstname_th || ''} ${e.employee_lastname_th || ''}`.trim() || saveEmpName;
                }

                const receivedByObj = item.received_by_employee as Record<string, unknown> | undefined;
                let receEmpName = receivedByObj?.employee_fullname || item.rece_emp_name || '';
                if (!receEmpName && receEmpId) {
                    const e = emps.find((x) => String(x.id || x.employee_id) === String(receEmpId));
                    if (e) receEmpName = e.name || e.employee_fullname || `${e.employee_firstname_th || ''} ${e.employee_lastname_th || ''}`.trim() || receEmpName;
                }

                const issueStockObj = item.issue_stock as Record<string, unknown> | undefined;
                let issueStkNo = issueStockObj?.issue_stock_no || item.issue_stk_no || item.issue_stock_no || '';
                if (!issueStkNo && item.issue_stock_id) {
                    const iss = issues.find((x) => String(x.issue_stock_id || x.id) === String(item.issue_stock_id));
                    if (iss) issueStkNo = iss.issue_stock_no || iss.issue_stk_no || issueStkNo;
                }

                return {
                    docu_item_id: String(item.return_stock_id || item.docu_item_id || ''),
                    reissue_stk_no: item.return_stock_no || item.reissue_stk_no || '',
                    issue_stk_no: issueStkNo || '-',
                    docu_date: item.return_stock_date || item.docu_date || '',
                    dept_name: deptName || '-',
                    doc_type_name: item.doc_type_name || item.docu_item_name || '-',
                    rece_emp_name: receEmpName || '-',
                    amnt_total: (item.amnt_total as number) || (((item.returnIssueStockLines || item.returnStockLines || item.return_stock_lines) as Record<string, unknown>[]) ? ((item.returnIssueStockLines || item.returnStockLines || item.return_stock_lines) as Record<string, unknown>[]).reduce((sum: number, line: Record<string, unknown>) => sum + (Number(line.goods_amount || line.good_amnt) || (Number(line.qty || line.qty_return_ic || 0) * Number(line.unit_cost_price || line.unit_cost || line.standard_cost_price || line.standard_buy_price || 0))), 0) : 0),
                    cancel_flag: item.status === 'CANCELLED' || item.cancel_flag === 'Y' ? 'Y' : 'N'
                };
            });

            const meta = res?.meta as Record<string, unknown> | undefined;
            return {
                items: items as unknown as ReturnIssueListItem[],
                total: (meta?.total as number) || items.length,
                page: (meta?.page as number) || params?.page || 1,
                limit: (meta?.limit as number) || params?.limit || 20
            };
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
            const res = await api.get<Record<string, unknown>>(`/return-stock/${id}`);
            
            if (res && res.header && Array.isArray(res.lines)) {
                return res as unknown as { header: ReturnIssueHeader; lines: ReturnIssueLine[] };
            }
            if (res && res.data && (res.data as Record<string, unknown>).header) {
                return res.data as unknown as { header: ReturnIssueHeader; lines: ReturnIssueLine[] };
            }

            let raw = (res?.data || res) as Record<string, unknown>;
            if (Array.isArray(raw)) {
                raw = (raw[0] || {}) as Record<string, unknown>;
            }

            const header: Record<string, unknown> = {
                ...raw,
                docu_item_id: String(raw.return_stock_id || raw.docu_item_id || ''),
                docu_item_no: String(raw.doc_link_ic_id || raw.doc_type_no || raw.docu_item_no || ''),
                issue_stk_no: String((raw.issue_stock as Record<string, unknown> | undefined)?.issue_stock_no || raw.issue_stock_no || raw.issue_stk_no || ''),
                reissue_stk_no: String(raw.return_stock_no || raw.reissue_stk_no || ''),
                docu_date: raw.return_stock_date || raw.docu_date || '',
                emp_dept_id: String(raw.emp_dept_id || ''),
                job_id: String(raw.project_id || raw.job_id || ''),
                branch_id: String(raw.branch_id || ''),
                save_emp_id: String(raw.created_by_emp_id || raw.save_emp_id || ''),
                rece_emp_id: String(raw.received_by_emp_id || raw.rece_emp_id || ''),
                stock_effect_ic: 1, // รับคืนส่วนมากเพิ่มคลัง
                amnt_total: raw.total_amount || raw.amnt_total || 0,
                remark: raw.remarks || raw.remark || '',
                cancel_flag: raw.status === 'CANCELLED' ? 'Y' : (raw.cancel_flag || 'N'),
            };

            if (!header.issue_stk_no && raw.issue_stock_id) {
                try {
                    const issRes = await api.get<Record<string, unknown>>(`/issue-stock/${String(raw.issue_stock_id)}`);
                    const issRaw = issRes?.data || issRes || {};
                    const issRawObj = Array.isArray(issRaw) ? issRaw[0] : (issRaw as Record<string, unknown>);
                    if (issRawObj) {
                        header.issue_stk_no = String(issRawObj.issue_stock_no || issRawObj.issue_stk_no || header.issue_stk_no);
                    }
                } catch (e) {
                    logger.warn('Failed to fetch issue-stock for hydration', e);
                }
            }

            const rawLines = raw.returnIssueStockLines || raw.returnStockLines || raw.return_stock_lines || raw.lines || raw.items || raw.details || raw.issueStockLines || raw.issue_stock_lines || [];
            
            // Try to fetch original issue lines to get missing names
            let issueLines: Record<string, unknown>[] = [];
            const issueId = raw.issue_stock_id || raw.doc_link_ic_id;
            if (issueId) {
                try {
                    const issueRes = await api.get<Record<string, unknown>>(`/issue-stock/${issueId}`);
                    const issueData = (issueRes.data as Record<string, unknown>) || issueRes;
                    issueLines = (issueData.issueStockLines || issueData.lines || issueData.items || []) as Record<string, unknown>[];
                } catch (e) {
                    console.warn('[return.service] Failed to fetch original issue stock', e);
                }
            } else {
                console.warn(`[return.service] No issueId found in raw. Keys: ${Object.keys(raw).join(', ')}`);
            }

            const lines: Record<string, unknown>[] = (rawLines as Record<string, unknown>[]).map((l: Record<string, unknown>, i: number) => {
                // Find matching issue line
                const iLine = issueLines.find(il => 
                    (il.issue_stock_line_id && String(il.issue_stock_line_id) === String(l.issue_stock_line_id)) || 
                    (il.item_id && String(il.item_id) === String(l.item_id || l.product_id || l.inventory_item_id))
                ) as Record<string, unknown> | undefined;

                return {
                    ...l,
                    listno: l.list_no || l.listno || i + 1,
                    item_id: String(l.item_id || l.product_id || l.inventory_item_id || ''),
                    item_code: l.item_code || (l.item as Record<string, unknown> | undefined)?.item_code || iLine?.item_code || (iLine?.item as Record<string, unknown> | undefined)?.item_code || (iLine?.product as Record<string, unknown> | undefined)?.item_code || '',
                    item_name: l.item_name || (l.item as Record<string, unknown> | undefined)?.item_name || iLine?.item_name || (iLine?.item as Record<string, unknown> | undefined)?.item_name || (iLine?.product as Record<string, unknown> | undefined)?.item_name || '',
                    uom_id: String(l.uom_id || ''),
                    warehouse_id: String(l.warehouse_id || l.wh_id || ''),
                    warehouse_name: l.warehouse_name || (l.warehouse as Record<string, unknown> | undefined)?.warehouse_name || iLine?.warehouse_name || (iLine?.warehouse as Record<string, unknown> | undefined)?.warehouse_name || (iLine?.warehouse as Record<string, unknown> | undefined)?.name || '',
                    location_id: String(l.location_id || l.loc_id || ''),
                    location_name: l.location_name || (l.location as Record<string, unknown> | undefined)?.name_th || iLine?.location_name || (iLine?.location as Record<string, unknown> | undefined)?.name_th || (iLine?.location as Record<string, unknown> | undefined)?.name || '',
                    lot_id: String(l.lot_id || l.lot_balance_id || ''),
                    lot_no: l.lot_no || (l.lot as Record<string, unknown> | undefined)?.code || iLine?.lot_no || (iLine?.lot as Record<string, unknown> | undefined)?.code || '',
                    qty_ic: Number(l.qty || l.qty_ic) || 0,
                    qty_return_ic: Number(l.qty || l.qty_return_ic) || 0,
                    unit_cost: Number(l.unit_cost_price || l.unit_cost || l.standard_cost_price || l.standard_buy_price) || 0,
                    good_amnt: Number(l.goods_amount || l.good_amnt) || (Number(l.qty || 0) * Number(l.unit_cost_price || l.unit_cost || l.standard_cost_price || l.standard_buy_price || 0)),
                    stock_flag: 1,
                    remark: l.remarks || l.remark || '',
                };
            });

            return { 
                header: header as unknown as ReturnIssueHeader, 
                lines: lines as unknown as ReturnIssueLine[] 
            };
        } catch (error) {
            logger.error('[ReturnIssueService] getById error:', error);
            return null;
        }
    },

    // ─── Create ──────────────────────────────────────────────────────────────────────
    create: async (data: ReturnIssueFormData): Promise<SuccessResponse> => {
        try {
            await api.post('/return-stock', data);
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
};
