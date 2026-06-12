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

import { ICDocumentService } from '@/modules/Inventory/shared/services/ic-document.service';

// ====================================================================================
// SERVICE
// ====================================================================================

export const TransferService = {
    // ─── Doc Link IC Dropdown ───────────────────────────────────────────────────────
    getDocLinks: async (systemDocCode: string): Promise<Record<string, unknown>[]> => {
        return ICDocumentService.getDocLinks(systemDocCode) as Promise<Record<string, unknown>[]>;
    },

    // ─── List ────────────────────────────────────────────────────────────────────────
    getList: async (params?: TransferRequisitionListParams, config?: { signal?: AbortSignal }): Promise<ListResponse<TransferRequisitionListItem>> => {
        try {
            const { MasterDataService } = await import('@/modules/master-data/services/master-data.service');
            const { LocationService } = await import('@/modules/master-data/inventory/services/inventory-master.service');
            
            const [res, branches, employees, warehouses, locationsRes] = await Promise.all([
                api.get<{ data?: Record<string, unknown>[]; items?: Record<string, unknown>[]; total?: number }>('/transfer-stock', { params, ...config }),
                MasterDataService.getBranches(),
                MasterDataService.getEmployees(),
                MasterDataService.getWarehouses(),
                LocationService.getAll({ limit: 1000 })
            ]);
            
            const locations = Array.isArray(locationsRes) ? locationsRes : (locationsRes?.items || []);
            
            const dataArray = res?.data || res?.items || (Array.isArray(res) ? res : []);
            
            const items = await Promise.all(dataArray.map(async (item: Record<string, unknown>) => {
                const branchId = String(item.branch_id || item.from_branch_id || '');
                const branch = branches.find(b => String(b.branch_id || (b as unknown as Record<string, unknown>).id) === branchId);
                const branchName = branch ? String(branch.branch_name || '') : branchId;

                const saveEmpId = String(item.created_by_emp_id || item.save_emp_id || '');
                const saveEmp = employees.find(e => String(e.employee_id || (e as unknown as Record<string, unknown>).id) === saveEmpId);
                const saveEmpName = saveEmp ? (saveEmp.employee_fullname || `${saveEmp.employee_firstname_th || ''} ${saveEmp.employee_lastname_th || ''}`.trim()) : saveEmpId;

                const transEmpId = String(item.transfer_by_emp_id || item.transfer_emp_id || '');
                const transEmp = employees.find(e => String(e.employee_id || (e as unknown as Record<string, unknown>).id) === transEmpId);
                const transEmpName = transEmp ? (transEmp.employee_fullname || `${transEmp.employee_firstname_th || ''} ${transEmp.employee_lastname_th || ''}`.trim()) : transEmpId;

                const lines = (item.lines || item.items || item.transferStockLines || item.details || []) as Record<string, unknown>[];
                let firstLine = lines[0] || {};

                // Fetch detail if list API didn't include lines
                if (Object.keys(firstLine).length === 0 && (item.transfer_req_id || item.transfer__req_id)) {
                    try {
                        const id = String(item.transfer_req_id || item.transfer__req_id);
                        const detailRes = await api.get<Record<string, unknown>>(`/transfer-stock/${id}`).catch(() => null);
                        if (detailRes) {
                            let d = (detailRes?.data || detailRes) as Record<string, unknown>;
                            if (d && typeof d === 'object' && 'data' in d) d = d.data as Record<string, unknown>;
                            let h = (d.header || d) as Record<string, unknown>;
                            if (Array.isArray(h)) h = h[0] as Record<string, unknown> || {};
                            const l = (h.lines || h.items || h.transferStockLines || h.transferRequisitionLines || h.details || d.lines || d.items || d.transferStockLines || d.details || []) as Record<string, unknown>[];
                            if (l && l.length > 0) firstLine = l[0] || {};
                        }
                    } catch {
                        // ignore
                    }
                }
                
                const fromWhId = String(item.from_warehouse_id || item.warehouse_id || firstLine.from_warehouse_id || firstLine.warehouse_id || '');
                const fromLocId = String(item.from_location_id || firstLine.from_location_id || '');
                const toWhId = String(item.to_warehouse_id || firstLine.to_warehouse_id || '');
                const toLocId = String(item.to_location_id || firstLine.to_location_id || '');

                const getWhName = (id: string, fallback: string) => {
                    if (!id) return fallback;
                    const wh = warehouses.find(w => String(w.id || (w as unknown as Record<string, unknown>).warehouse_id) === id);
                    return wh ? String(wh.warehouse_name || (wh as unknown as Record<string, unknown>).name_th || '') : fallback;
                };

                const getLocName = (id: string, fallback: string) => {
                    if (!id) return fallback;
                    const loc = locations.find(l => String(l.id || (l as unknown as Record<string, unknown>).location_id) === id);
                    return loc ? String((loc as unknown as Record<string, unknown>).name_th || (loc as unknown as Record<string, unknown>).location_name || (loc as unknown as Record<string, unknown>).name || '') : fallback;
                };

                const fromWh = getWhName(fromWhId, String(item.from_warehouse_name || firstLine.from_warehouse_name || firstLine.warehouse_name || ''));
                const fromLoc = getLocName(fromLocId, String(item.from_location_name || firstLine.from_location_name || firstLine.location_name || ''));
                const toWh = getWhName(toWhId, String(item.to_warehouse_name || firstLine.to_warehouse_name || ''));
                const toLoc = getLocName(toLocId, String(item.to_location_name || firstLine.to_location_name || ''));

                return {
                    transfer__req_id: String(item.transfer_req_id || item.transfer__req_id || ''),
                    transfer__req_no: String(item.transfer_req_no || item.transfer__req_no || ''),
                    docu_date: String(item.transfer_req_date || item.docu_date || ''),
                    branch_name: String(item.branch_name || branchName || ''),
                    save_emp_name: String(item.created_by_emp_name || saveEmpName || ''),
                    transfer_emp_name: String(item.transfer_by_emp_name || transEmpName || ''),
                    from_warehouse_name: fromWh,
                    from_location_name: fromLoc,
                    to_warehouse_name: toWh,
                    to_location_name: toLoc,
                    cancelflag: String(item.cancel_flag || item.cancelflag || 'N'),
                    status: String(item.status || (item.cancel_flag === 'Y' ? 'VOID' : 'DRAFT')),
                };
            }));

            return { items, total: res?.total || items.length, page: params?.page || 1, limit: params?.limit || 20 };
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
            const res = await api.get<Record<string, unknown>>(
                `/transfer-stock/${id}`
            );
            logger.debug('[TransferService] getById raw response:', res);
            
            let data = (res?.data || res) as Record<string, unknown>;
            if (data && typeof data === 'object' && 'data' in data) {
                // Nested data
                data = data.data as Record<string, unknown>;
            }
            
            // Extract header and lines, adjusting for different API structures
            let rawHeader = (data.header || data) as Record<string, unknown>;
            if (Array.isArray(rawHeader)) {
                rawHeader = (rawHeader[0] || {}) as Record<string, unknown>;
            }
            
            const rawLines = (rawHeader.lines || rawHeader.items || rawHeader.transferStockLines || rawHeader.transferRequisitionLines || rawHeader.details || data.lines || data.items || data.transferStockLines || data.details || []) as Record<string, unknown>[];
            
            // Map header
            const header: TransferRequisitionHeader = {
                transfer__req_id: String(rawHeader.transfer__req_id || rawHeader.transfer_req_id || id),
                transfer__req_no: String(rawHeader.transfer__req_no || rawHeader.transfer_req_no || ''),
                docu_date: String(rawHeader.docu_date || rawHeader.transfer_req_date || ''),
                branch_id: String(rawHeader.branch_id || rawHeader.from_branch_id || ''),
                save_emp_id: String(rawHeader.save_emp_id || rawHeader.created_by_emp_id || ''),
                transfer_emp_id: String(rawHeader.transfer_emp_id || rawHeader.transfer_by_emp_id || ''),
                cancelflag: String(rawHeader.cancelflag || rawHeader.cancel_flag || 'N'),
                status: String(rawHeader.status || ((rawHeader as unknown as Record<string, unknown>).cancel_flag === 'Y' ? 'VOID' : 'DRAFT')),
                remark: String(rawHeader.remark || rawHeader.remarks || ''),
                cancle_remark: String(rawHeader.cancle_remark || rawHeader.cancel_remarks || ''),
            };
            
            // Map lines
            const lines: TransferRequisitionLine[] = Array.isArray(rawLines) ? rawLines.map((l: Record<string, unknown>, i: number) => ({
                ...l,
                listno: Number(l.listno ?? l.seq ?? (i + 1)),
                transfer__req_id: String(l.transfer__req_id || l.transfer_req_id || id),
                item_id: String(l.item_id || ''),
                item_code: String(l.item_code || l.item_no || ''),
                item_name: String(l.item_name || l.item_desc || ''),
                uom_id: String(l.uom_id || l.unit_id || ''),
                from_warehouse_id: String(l.from_warehouse_id || l.warehouse_id || ''),
                from_location_id: String(l.from_location_id || l.location_id || ''),
                to_warehouse_id: String(l.to_warehouse_id || ''),
                to_location_id: String(l.to_location_id || ''),
                qty_ic: Number(l.qty_ic !== undefined ? l.qty_ic : (l.qty !== undefined ? l.qty : '')),
                lot_id: String(l.lot_id || ''),
                lot_no: String(l.lot_no || ''),
                remark: String(l.remark || l.remarks || ''),
                lot_balance_id: String(l.lot_balance_id || ''),
                stock_flag: Number(l.stock_flag ?? 0),
            })) : [];

           logger.debug('[TransferService] getById mapped result:', { header, lines });
            return { header, lines };
        } catch (error) {
            logger.error('[TransferService] getById error:', error);
            return null;
        }
    },

    // ─── Create ──────────────────────────────────────────────────────────────────────
    create: async (data: TransferFormData): Promise<SuccessResponse> => {
        try {
            // Map frontend schema to backend payload
            const payload = {
                transfer_req_date: data.docu_date ? new Date(data.docu_date).toISOString() : new Date().toISOString(),
                branch_id: Number(data.branch_id),
                doc_link_ic_id: data.docu_item_no ? Number(data.docu_item_no) : null,
                created_by_emp_id: Number(data.save_emp_id),
                transfer_by_emp_id: Number(data.transfer_emp_id),
                remarks: data.remark || '',
                status: data.cancelflag === 'Y' ? 'VOID' : 'DRAFT',
                lines: data.lines.map(line => ({
                    item_id: Number(line.item_id),
                    qty: Number(line.qty_ic),
                    uom_id: Number(line.uom_id),
                    from_warehouse_id: Number(line.from_warehouse_id),
                    from_location_id: line.from_location_id ? Number(line.from_location_id) : null,
                    to_warehouse_id: Number(line.to_warehouse_id),
                    to_location_id: line.to_location_id ? Number(line.to_location_id) : null,
                    lot_id: line.lot_id ? Number(line.lot_id) : null,
                    lot_balance_id: line.lot_balance_id ? Number(line.lot_balance_id) : null,
                    remarks: line.remark || ''
                }))
            };

            // ใช้ endpoint ตาม Postman
            await api.post('/transfer-stock', payload);
            return { success: true };
        } catch (error) {
            logger.error('[TransferService] create error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return { success: false, message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด' };
        }
    },

    // ─── Update ──────────────────────────────────────────────────────────────────────
    update: async (id: string, data: Partial<TransferFormData> | Record<string, unknown>): Promise<SuccessResponse> => {
        try {
            await api.patch(`/transfer-stock/${id}`, data);
            return { success: true };
        } catch (error) {
            logger.error('[TransferService] update error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return { success: false, message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด' };
        }
    },

    // ─── Update Status ───────────────────────────────────────────────────────────────
    updateStatus: async (id: string, status: string): Promise<SuccessResponse> => {
        try {
            await api.patch(`/transfer-stock/${id}`, { status });
            return { success: true };
        } catch (error) {
            logger.error('[TransferService] updateStatus error:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            return { success: false, message: err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด' };
        }
    },

    // ─── Delete / Cancel ────────────────────────────────────────────────────────────
    delete: async (id: string): Promise<SuccessResponse> => {
        try {
            await api.delete(`/transfer-stock/${id}`);
            return { success: true };
        } catch (error) {
            logger.error('[TransferService] delete error:', error);
            return { success: false, message: 'ไม่สามารถยกเลิกใบขอโอนย้ายสินค้าได้' };
        }
    },
};
