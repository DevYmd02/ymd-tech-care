/**
 * @file requisition.service.ts
 * @description Service layer สำหรับ Issue Requisition (ใบขอเบิก)
 * @api /issue-requisition, /doc-link-ic
 */

import api from '@/core/api/api';
import { logger } from '@/shared/utils';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
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
            const [sysDocs, docLinksRaw] = await Promise.all([
                api.get<unknown[]>('/system-document'),
                api.get<unknown[]>('/doc-link-ic')
            ]);

            const sysDocsList = Array.isArray(sysDocs) ? sysDocs : [];
            const docLinksList = Array.isArray(docLinksRaw) ? docLinksRaw : [];

            // Find ISSUE_REQ system document
            const issueReqDoc = sysDocsList.find(
                (d) => (d as Record<string, unknown>).system_document_code?.toString().trim().toUpperCase() === 'ISSUE_REQ'
            ) as Record<string, unknown> | undefined;
            if (!issueReqDoc) return [];

            // Filter doc-link-ic belonging to ISSUE_REQ
            const relatedDocs = docLinksList.filter(
                (item) => Number((item as Record<string, unknown>).system_document_id) === Number(issueReqDoc.system_document_id) && (item as Record<string, unknown>).is_active !== false
            ) as Record<string, unknown>[];

            // Sort by doc_type_no (parents first, then sub-items)
            const sortedDocs = [...relatedDocs].sort((a, b) => Number(a.doc_type_no || 0) - Number(b.doc_type_no || 0));

            return sortedDocs.map((item) => {
                const name = (item.doc_type_name || item.docu_name_th || item.docu_desc || item.docu_name_en || '') as string;
                return {
                    docu_type_id: String(item.doc_link_ic_id ?? item.docu_type_id),
                    docu_type_code: '',
                    docu_name_th: name,
                    docu_name_en: (item.docu_name_en as string) || name,
                    docu_item_no: Number(item.doc_type_no || 0),
                };
            });
        } catch (error) {
            logger.error('[RequisitionService] getDocLinks error:', error);
            return [];
        }
    },

    // ─── List ────────────────────────────────────────────────────────────────────────
    getList: async (params?: RequisitionListParams): Promise<ListResponse<RequisitionListItem>> => {
        try {
            const [res, docLinks, departments, employees, uoms, approvalsRes] = await Promise.all([
                api.get<unknown>('/issue-requistion', { params }),
                RequisitionService.getDocLinks(),
                MasterDataService.getDepartments(),
                MasterDataService.getEmployees(),
                MasterDataService.getUOMs(),
                api.get<unknown>('/appv-issue-requistion').catch(() => [])
            ]);
            
            let items: unknown[] = [];
            let total = 0;
            let page = 1;
            let limit = 10;

            if (res && typeof res === 'object') {
                const resObj = res as Record<string, unknown>;
                items = (resObj.items || resObj.data || (Array.isArray(res) ? res : [])) as unknown[];
                total = (resObj.total as number) ?? items.length;
                page = (resObj.page as number) ?? 1;
                limit = (resObj.limit as number) ?? 10;
            } else if (Array.isArray(res)) {
                items = res;
                total = res.length;
            }

            const approvals = (Array.isArray(approvalsRes) ? approvalsRes : (((approvalsRes as Record<string, unknown> | undefined)?.items || []))) as Record<string, unknown>[];

            const mappedItems = items.map((itemVal) => {
                const item = itemVal as Record<string, unknown>;
                // Find document link name
                const docLink = docLinks.find(
                    (d) => Number(d.docu_type_id) === Number(item.doc_link_ic_id)
                );
                
                // Find department name
                const dept = departments.find(
                    (d) => Number((d as unknown as Record<string, unknown>).emp_dept_id || (d as unknown as Record<string, unknown>).department_id || (d as unknown as Record<string, unknown>).id) === Number(item.emp_dept_id)
                ) as unknown as Record<string, unknown> | undefined;

                // Find employee name (Requester)
                const emp = employees.find(
                    (e) => Number((e as unknown as Record<string, unknown>).employee_id || (e as unknown as Record<string, unknown>).id) === Number(item.request_by_emp_id)
                ) as unknown as Record<string, unknown> | undefined;

                // Find employee name (Creator / Recorder)
                const creatorEmp = employees.find(
                    (e) => Number((e as unknown as Record<string, unknown>).employee_id || (e as unknown as Record<string, unknown>).id) === Number(item.created_by_emp_id)
                ) as unknown as Record<string, unknown> | undefined;

                // Sum qty in lines & find unit names
                const lines = (item.issueRequistionLines || item.issueRequisitionLines || []) as Record<string, unknown>[];
                const qty_total = lines.reduce((sum: number, line) => sum + (Number(line.qty) || 0), 0);

                const uomNames = lines.map(line => {
                    const uomId = line.uom_id;
                    const uom = uoms.find(u => Number(u.uom_id || u.id) === Number(uomId));
                    return uom ? (uom.uom_name || uom.uom_name_en || uom.uom_nameeng) : '';
                }).filter(Boolean);
                const uniqueUomNames = Array.from(new Set(uomNames));
                const uom_name = uniqueUomNames.join(', ');

                const reqId = String(item.issue_req_id || item.docu_item_id || '');
                const matchedAppv = approvals.find(a => String(a.issue_req_id) === reqId);
                const approvalStatus = matchedAppv ? (matchedAppv.status as 'PENDING' | 'APPROVED' | 'REJECTED') : null;

                let finalFlag = item.cancel_flag === 'Y' ? 'Y' : (item.status === 'PENDING' ? 'PENDING' : (item.status === 'DRAFT' ? 'DRAFT' : 'N'));
                if (item.cancel_flag !== 'Y') {
                    const reqStatus = (item.status as string || '').toUpperCase();
                    if (reqStatus === 'APPROVED' || approvalStatus === 'APPROVED') {
                        finalFlag = 'APPROVED';
                    } else if (reqStatus === 'REJECTED' || approvalStatus === 'REJECTED') {
                        finalFlag = 'REJECTED';
                    } else if (reqStatus === 'PENDING' || approvalStatus === 'PENDING') {
                        finalFlag = 'PENDING';
                    }
                }

                return {
                    docu_item_id: String(item.issue_req_id || item.docu_item_id || ''),
                    issue_req_no: (item.issue_req_no as string) || `REQ-${item.issue_req_id || ''}`,
                    docu_item_no: docLink ? (docLink.docu_name_th || docLink.docu_name_en) : '-',
                    docu_date: (item.issue_req_date as string) || (item.docu_date as string) || '',
                    dept_name: dept ? ((dept.emp_dept_name as string) || (dept.department_name as string) || (dept.dept_name as string) || '-') : '-',
                    save_emp_name: emp ? ((emp.employee_fullname as string) || `${(emp.employee_firstname_th as string) || ''} ${(emp.employee_lastname_th as string) || ''}`.trim()) : '-',
                    created_emp_name: creatorEmp ? ((creatorEmp.employee_fullname as string) || `${(creatorEmp.employee_firstname_th as string) || ''} ${(creatorEmp.employee_lastname_th as string) || ''}`.trim()) : '-',
                    qty_total: qty_total,
                    cancel_flag: finalFlag,
                    uom_name: uom_name || undefined,
                };
            });

            return { items: mappedItems, total, page, limit };
        } catch (error) {
            logger.error('[RequisitionService] getList error:', error);
            return { items: [], total: 0, page: 1, limit: 10 };
        }
    },

    getById: async (
        id: string
    ): Promise<{ header: IssueRequisitionHeader; lines: IssueRequisitionLine[] } | null> => {
        try {
            const res = await api.get<unknown>(
                `/issue-requistion/${id}`
            );
            if (!res || typeof res !== 'object') return null;

            const resObj = res as Record<string, unknown>;
            const header = resObj.header ? (resObj.header as IssueRequisitionHeader) : (resObj as unknown as IssueRequisitionHeader);
            const lines = (resObj.lines || resObj.issueRequistionLines || resObj.issueRequisitionLines || []) as IssueRequisitionLine[];

            return {
                header,
                lines,
            };
        } catch (error) {
            logger.error('[RequisitionService] getById error:', error);
            return null;
        }
    },

    // ─── Create ──────────────────────────────────────────────────────────────────────
    create: async (data: RequisitionFormData): Promise<SuccessResponse> => {
        try {
            await api.post('/issue-requistion', data);
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
            await api.patch(`/issue-requistion/${id}`, data);
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
            await api.delete(`/issue-requistion/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[RequisitionService] delete error:', error);
            return { success: false, message: 'ไม่สามารถลบได้' };
        }
    },
};
