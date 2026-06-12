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
    getList: async (params?: IssueStockListParams, config?: { signal?: AbortSignal }): Promise<ListResponse<IssueStockListItem>> => {
        try {
            const res = await api.get<unknown>('/issue-stock', { params, ...config });
            const data = Array.isArray(res) ? res : ((res as Record<string, unknown>).data || (res as Record<string, unknown>).items || []);
            const rawItems = Array.isArray(data) ? data : [];

            // หา ID ของใบขอเบิกที่อนุมัติแล้วที่หายไป
            const missingAppvReqIds = Array.from(new Set(
                rawItems
                    .map((item: Record<string, unknown>) => item.appv_issue_req_id || item.appvissue_req_id || item.ref_doc_id)
                    .filter((id) => id && !rawItems.find((r: Record<string, unknown>) => (r.appv_issue_req_id || r.appvissue_req_id || r.ref_doc_id) === id)?.appv_issue_req_no && !rawItems.find((r: Record<string, unknown>) => (r.appv_issue_req_id || r.appvissue_req_id || r.ref_doc_id) === id)?.appvissue_req_no)
            ));

            const appvsMap: Record<string, { appvNo: string; reqId: string }> = {};
            if (missingAppvReqIds.length > 0) {
                try {
                    const promises = missingAppvReqIds.map(id => api.get<Record<string, unknown>>(`/appv-issue-requistion/${id}`).catch(() => null));
                    const results = await Promise.all(promises);
                    results.forEach((res, idx) => {
                        if (res) {
                            const d = res.data || res;
                            const itemData = Array.isArray(d) ? d[0] : (d as Record<string, unknown>);
                            if (itemData) {
                                appvsMap[String(missingAppvReqIds[idx])] = {
                                    appvNo: String(itemData.appv_issue_req_no || itemData.approval_no || itemData.issue_req_no || ''),
                                    reqId: String(itemData.issue_req_id || itemData.ref_doc_id || '')
                                };
                            }
                        }
                    });
                } catch (e) {
                    logger.warn('Failed to fetch missing appv reqs', e);
                }
            }

            // หา ID ของใบขอเบิกเพื่อเอาเลขที่ใบขอเบิก
            const reqIdsToFetch = Array.from(new Set(Object.values(appvsMap).map(m => m.reqId).filter(id => id)));
            const reqsMap: Record<string, string> = {};
            if (reqIdsToFetch.length > 0) {
                try {
                    const promises = reqIdsToFetch.map(id => api.get<Record<string, unknown>>(`/issue-requistion/${id}`).catch(() => null));
                    const results = await Promise.all(promises);
                    results.forEach((res, idx) => {
                        if (res) {
                            const d = res.data || res;
                            const itemData = Array.isArray(d) ? d[0] : (d as Record<string, unknown>);
                            if (itemData) {
                                reqsMap[String(reqIdsToFetch[idx])] = String(itemData.issue_req_no || itemData.docu_item_no || '');
                            }
                        }
                    });
                } catch (e) {
                    logger.warn('Failed to fetch missing reqs', e);
                }
            }

            const items = rawItems.map((itemRaw: unknown) => {
                const item = itemRaw as Record<string, unknown>;
                const getValidId = (v: unknown) => (v !== null && v !== undefined && v !== '') ? String(v) : null;
                const issueDocId = getValidId(item.doc_type_no) ?? getValidId(item.doc_link_ic_id) ?? getValidId(item.docu_item_no) ?? '';
                const issueStockLines = item.issueStockLines as Array<Record<string, unknown>> | undefined;

                // Fallback for doc_name
                const docName = (item.doc_type_name || item.doc_name || issueDocId || '') as string;
                
                const appvReqId = item.appv_issue_req_id || item.appvissue_req_id || item.ref_doc_id;
                let appvReqNo = (item.appv_issue_req_no || item.appvissue_req_no || item.ref_doc_no || '') as string;
                let issueReqNo = (item.issue_req_no || '') as string;

                if (!appvReqNo && appvReqId) {
                    const mapped = appvsMap[String(appvReqId)];
                    if (mapped) {
                        appvReqNo = mapped.appvNo;
                        if (!issueReqNo && mapped.reqId) {
                            issueReqNo = reqsMap[mapped.reqId] || '';
                        }
                    }
                }

                return {
                    docu_item_id: String(item.issue_stock_id || item.docu_item_id || ''),
                    docu_item_no: docName,
                    issue_stk_no: (item.issue_stock_no || item.issue_stk_no || '') as string,
                    appvissue_req_no: appvReqNo || '-',
                    issue_req_no: issueReqNo || '-',
                    docu_date: (item.issue_stock_date || item.docu_date || '') as string,
                    dept_name: (item.emp_dept_name || item.dept_name || item.emp_dept_id || '-') as string,
                    save_emp_name: (item.created_by_emp_name || item.save_emp_name || item.created_by_emp_id || '') as string,
                    rece_emp_name: (item.received_by_emp_name || item.rece_emp_name || item.received_by_emp_id || '-') as string,
                    amnt_total: (item.amnt_total || (issueStockLines ? issueStockLines.reduce((sum: number, line) => sum + (Number(line.goods_amount) || 0), 0) : 0)) as number,
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

    getReqNos: async (id: string | number): Promise<{ appvReqNo: string; issueReqNo: string }> => {
        try {
            const res = await api.get<unknown>('/appv-issue-requistion');
            const resRecord = res as Record<string, unknown>;
            const items = Array.isArray(res) ? res : ((resRecord?.items || resRecord?.data || []) as Record<string, unknown>[]);
            const matched = items.find((a) => String(a.appv_issue_req_id) === String(id) || String(a.issue_req_id) === String(id));
            
            let appvReqNo = '';
            let issueReqNo = '';
            
            if (matched) {
                appvReqNo = String(matched.appv_issue_req_no || matched.approval_no || matched.issue_req_no || '');
                
                const reqId = matched.issue_req_id || matched.ref_doc_id;
                if (reqId) {
                    try {
                        const reqsRes = await api.get<unknown>('/issue-requistion');
                        const reqsResRecord = reqsRes as Record<string, unknown>;
                        const reqItems = Array.isArray(reqsRes) ? reqsRes : ((reqsResRecord?.items || reqsResRecord?.data || []) as Record<string, unknown>[]);
                        const reqMatch = reqItems.find((r) => String(r.issue_req_id || r.id) === String(reqId));
                        if (reqMatch) {
                            issueReqNo = String(reqMatch.issue_req_no || reqMatch.docu_item_no || '');
                        }
                    } catch (e) {
                        logger.warn('Failed to fetch issue-requistion', e);
                    }
                }
            }
            return { appvReqNo, issueReqNo };
        } catch {
            return { appvReqNo: '', issueReqNo: '' };
        }
    },

    // ─── Get By ID ───────────────────────────────────────────────────────────────────
    getById: async (
        id: string
    ): Promise<{ header: IssueStockHeader; lines: IssueStockLine[] } | null> => {
        try {
            const res = await api.get<unknown>(`/issue-stock/${id}`);
            const resRecord = res as Record<string, unknown>;
            
            // Check if it already has header/lines structure
            if (resRecord && resRecord.header && Array.isArray(resRecord.lines)) {
                return res as { header: IssueStockHeader; lines: IssueStockLine[] };
            }
            if (resRecord && resRecord.data && (resRecord.data as Record<string, unknown>).header) {
                return resRecord.data as { header: IssueStockHeader; lines: IssueStockLine[] };
            }
            
            // Otherwise, it might be a flat response
            let raw = resRecord?.data || resRecord;
            if (Array.isArray(raw)) {
                raw = raw[0] || {};
            }
            const rawRecord = raw as Record<string, unknown>;
            
            // Map flat response to expected header structure
            const header: IssueStockHeader = {
                ...(rawRecord as unknown as IssueStockHeader),
                docu_item_id: String(rawRecord.issue_stock_id || rawRecord.docu_item_id || ''),
                docu_item_no: String(rawRecord.doc_type_no != null ? rawRecord.doc_type_no : (rawRecord.doc_link_ic_id != null ? rawRecord.doc_link_ic_id : (rawRecord.docu_item_no || ''))),
                issue_stk_no: String(rawRecord.issue_stock_no || rawRecord.issue_stk_no || ''),
                appvissue_req_no: String(rawRecord.appv_issue_req_no || rawRecord.appvissue_req_no || rawRecord.ref_doc_no || ''),
                docu_date: String(rawRecord.issue_stock_date || rawRecord.docu_date || ''),
                emp_dept_id: String(rawRecord.emp_dept_id || ''),
                job_id: String(rawRecord.project_id || rawRecord.job_id || ''),
                branch_id: String(rawRecord.branch_id || ''),
                save_emp_id: String(rawRecord.created_by_emp_id || rawRecord.save_emp_id || ''),
                received_by_emp_id: String(rawRecord.received_by_emp_id || ''),
                stock_effect_ic: (rawRecord.stock_effect_ic as number) ?? -1,
                amnt_total: (rawRecord.total_amount as number) || (rawRecord.amnt_total as number) || 0,
                remark: String(rawRecord.remarks || rawRecord.remark || ''),
                cancel_flag: rawRecord.status === 'CANCELLED' ? 'Y' : (String(rawRecord.cancel_flag || 'N') as 'Y' | 'N'),
            };

            const rawLines = (rawRecord.issueStockLines || rawRecord.lines || []) as Record<string, unknown>[];
            const lines: IssueStockLine[] = rawLines.map((l: Record<string, unknown>, i: number) => {
                const itemData = l.item as Record<string, unknown> | undefined;
                const productData = l.product as Record<string, unknown> | undefined;
                const inventoryItemData = l.inventoryItem as Record<string, unknown> | undefined;
                const warehouseData = l.warehouse as Record<string, unknown> | undefined;
                const locationData = l.location as Record<string, unknown> | undefined;
                const lotData = l.lot as Record<string, unknown> | undefined;

                return {
                    ...(l as unknown as IssueStockLine),
                    listno: Number(l.list_no || l.listno || i + 1),
                    item_id: String(l.item_id || ''),
                    item_code: String(l.item_code || itemData?.item_code || productData?.item_code || inventoryItemData?.item_code || ''),
                    item_name: String(l.item_name || itemData?.item_name || productData?.item_name || inventoryItemData?.item_name || ''),
                    uom_id: String(l.uom_id || ''),
                    warehouse_id: String(l.warehouse_id || ''),
                    warehouse_name: String(l.warehouse_name || warehouseData?.warehouse_name || warehouseData?.name || ''),
                    location_id: String(l.location_id || ''),
                    location_name: String(l.location_name || locationData?.location_name || locationData?.name || ''),
                    lot_id: String(l.lot_id || ''),
                    lot_no: String(l.lot_no || lotData?.lot_no || ''),
                    qty_ic: Number(l.qty || l.qty_ic || 0),
                    unit_cost: Number(l.unit_cost_price || l.unit_cost || 0),
                    good_amnt: Number(l.goods_amount || l.good_amnt || ((Number(l.qty || 0)) * (Number(l.unit_cost_price || 0)))),
                    remark: String(l.remarks || l.remark || ''),
                };
            });

            return { header, lines };
        } catch (error) {
            logger.error('[IssueStockService] getById error:', error);
            return null;
        }
    },

    // ─── Create ──────────────────────────────────────────────────────────────────────
    create: async (data: Record<string, unknown>): Promise<SuccessResponse> => {
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
    update: async (id: string, data: Record<string, unknown>): Promise<SuccessResponse> => {
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
