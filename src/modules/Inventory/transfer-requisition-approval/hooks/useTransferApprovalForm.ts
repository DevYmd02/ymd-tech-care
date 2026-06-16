/**
 * @file useTransferApprovalForm.ts
 * @description React Hook Form + Zod hook สำหรับฟอร์มอนุมัติใบขอโอนย้ายสินค้า (Transfer Requisition Approval Form)
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch, type Resolver, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils';

import { transferApprovalSchema } from '../schemas/transfer-approval.schemas';
import type { TransferApprovalFormData, TransferApprovalLineFormData } from '../schemas/transfer-approval.schemas';
import { TransferApprovalService } from '../services/transfer-approval.service';
import { TransferService } from '../../transfer-requisition/services/transfer.service';
import { useICOptions } from '@/shared/ic-option';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import { UOMConversionService } from '@inventory/services/uom-conversion.service';
import { SYSTEM_DOCUMENT_CODES } from '@/shared/constants/system-documents';
import type {
    BranchListItem,
    EmployeeListItem,
    DepartmentListItem,
    Project,
    UOMListItem,
    UOMConversionListItem,
    WarehouseListItem,
} from '@/modules/master-data/types/master-data-types';

const getTodayISO = () => new Date().toISOString().split('T')[0];

const DEFAULT_VALUES: TransferApprovalFormData = {
    appv_transfer_no: 'ระบบจะกรอกอัตโนมัติ',
    transfer_req_id: '',
    transfer_req_no: '',
    appv_date: getTodayISO(),
    emp_dept_id: '',
    job_id: '',
    remark: '',
    branch_id: '',
    appv_flag: 'Y',
    cancel_date: '',
    cancel_flag: 'N',
    cancel_remark: '',
    save_emp_id: '',
    appv_emp_id: '',
    stock_effect_ic: 0,
    lines: [],
};

interface UseTransferApprovalFormOptions {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    requisitionId?: string | null;
    onSuccess?: () => void;
}

export function useTransferApprovalForm({
    isOpen,
    onClose,
    editId,
    requisitionId,
    onSuccess,
}: UseTransferApprovalFormOptions) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isEditMode = !!editId;

    // ── Form Methods ──────────────────────────────────────────────────────────────
    const formMethods = useForm<TransferApprovalFormData>({
        resolver: zodResolver(transferApprovalSchema) as Resolver<TransferApprovalFormData>,
        defaultValues: DEFAULT_VALUES as DefaultValues<TransferApprovalFormData>,
        mode: 'onChange',
    });

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = formMethods;

    // ── Field Array (Lines) ───────────────────────────────────────────────────────
    const { fields, replace, update } = useFieldArray({
        control,
        name: 'lines',
        keyName: '_id',
    });

    // ── Load Master Data ─────────────────────────────────────────────────────────
    const { data: branches = [] } = useQuery<BranchListItem[]>({
        queryKey: ['branches-options'],
        queryFn: () => MasterDataService.getBranches(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: employees = [] } = useQuery<EmployeeListItem[]>({
        queryKey: ['employees-options'],
        queryFn: () => MasterDataService.getEmployees(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: departments = [] } = useQuery<DepartmentListItem[]>({
        queryKey: ['departments-options'],
        queryFn: () => MasterDataService.getDepartments(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: projects = [] } = useQuery<Project[]>({
        queryKey: ['projects-options'],
        queryFn: () => MasterDataService.getProjects(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: uoms = [] } = useQuery<UOMListItem[]>({
        queryKey: ['uoms-options'],
        queryFn: () => MasterDataService.getUOMs(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: warehouses = [] } = useQuery<WarehouseListItem[]>({
        queryKey: ['warehouses-options'],
        queryFn: () => MasterDataService.getWarehouses(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: docLinks = [] } = useQuery({
        queryKey: ['doc-link-ic-options', SYSTEM_DOCUMENT_CODES.INVENTORY_TRANSFER_REQ],
        queryFn: () => TransferService.getDocLinks(SYSTEM_DOCUMENT_CODES.INVENTORY_TRANSFER_REQ),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const watchedBranchId = useWatch({ control, name: 'branch_id' });
    const { icOptions } = useICOptions(SYSTEM_DOCUMENT_CODES.INVENTORY_TRANSFER_APPV, String(watchedBranchId));

    // ── Load Edit Data ────────────────────────────────────────────────────────────
    const { data: editData, isLoading: isLoadingEdit } = useQuery({
        queryKey: ['transfer-requisition-approval', editId],
        queryFn: () => (editId ? TransferApprovalService.getById(editId) : null),
        enabled: !!editId && isOpen,
    });

    // ── Load Requisition Data (Create mode referencing Req) ──────────────────────
    const { data: reqData, isLoading: isLoadingReq } = useQuery({
        queryKey: ['transfer-requisition-reference', requisitionId],
        queryFn: () => (requisitionId ? TransferApprovalService.getRequisitionById(requisitionId) : null),
        enabled: !!requisitionId && !editId && isOpen,
    });

    // Handle Edit Mode Setup
    useEffect(() => {
        if (editData && isOpen) {
            const { header, lines = [] } = editData;
            const allItemIds = [...new Set(lines.map(l => Number(l.item_id)).filter(id => id > 0))];

            const handleHydration = async () => {
                const conversionMap = new Map<number, UOMConversionListItem[]>();
                const itemMap = new Map<number, Record<string, unknown>>();
                const locMap = new Map<number, Record<string, unknown>>();
                const lotMap = new Map<number, Record<string, unknown>>();

                if (allItemIds.length > 0) {
                    try {
                        const { ItemMasterService } = await import('@/modules/master-data/inventory/services/item-master.service');
                        const itemsList = await Promise.all(
                            allItemIds.map(id => queryClient.ensureQueryData({
                                queryKey: ['item-master', id],
                                queryFn: () => ItemMasterService.getById(id),
                                staleTime: 5 * 60 * 1000
                            }))
                        );
                        itemsList.forEach(itm => { if (itm) itemMap.set(Number((itm as unknown as Record<string, unknown>).item_id || (itm as unknown as Record<string, unknown>).id), itm as unknown as Record<string, unknown>); });

                        const convsList = await Promise.all(
                            allItemIds.map(itemId =>
                                queryClient.ensureQueryData({
                                    queryKey: ['transfer-uom-conversions', itemId],
                                    queryFn: () => UOMConversionService.getByItemId(itemId),
                                    staleTime: 5 * 60 * 1000
                                })
                            )
                        );
                        convsList.forEach((res, idx) => {
                            if (res) conversionMap.set(allItemIds[idx], res.items || []);
                        });
                    } catch (err) {
                        logger.warn('[useTransferApprovalForm] items/UOM conversions load failed:', err);
                    }
                }

                try {
                    const { LocationService, LotNoService } = await import('@/modules/master-data/inventory/services/inventory-master.service');
                    const allFromLocIds = lines.map(l => Number(l.out_loca_id || (l as unknown as Record<string, unknown>).from_location_id)).filter(id => id > 0);
                    const allToLocIds = lines.map(l => Number(l.income_loca_id || (l as unknown as Record<string, unknown>).to_location_id)).filter(id => id > 0);
                    const allLocIds = [...new Set([...allFromLocIds, ...allToLocIds])];
                    const allLotIds = [...new Set(lines.map(l => Number(l.lot_id)).filter(id => id > 0))];
                    
                    if (allLocIds.length > 0) {
                        const locsList = await Promise.all(allLocIds.map(id => queryClient.ensureQueryData({
                            queryKey: ['location', id],
                            queryFn: () => LocationService.getById(id),
                            staleTime: 5 * 60 * 1000
                        })));
                        locsList.forEach(loc => { if (loc) locMap.set(Number((loc as unknown as Record<string, unknown>).id || (loc as unknown as Record<string, unknown>).location_id), loc as unknown as Record<string, unknown>); });
                    }
                    
                    if (allLotIds.length > 0) {
                        const lotsList = await Promise.all(allLotIds.map(id => queryClient.ensureQueryData({
                            queryKey: ['lot', id],
                            queryFn: () => LotNoService.getById(id),
                            staleTime: 5 * 60 * 1000
                        })));
                        lotsList.forEach(lot => { if (lot) lotMap.set(Number((lot as unknown as Record<string, unknown>).id || (lot as unknown as Record<string, unknown>).lot_no_id), lot as unknown as Record<string, unknown>); });
                    }
                } catch (err) {
                    logger.warn('[useTransferApprovalForm] location/lot load failed:', err);
                }

                const docNo = String((header as unknown as Record<string, unknown>).docu_item_no || (header as unknown as Record<string, unknown>).doc_type_no || '');
                const matchedDoc = docLinks.find(d => String(d.docu_type_id) === docNo || String(d.docu_item_no) === docNo);

                const headerRecord = header as unknown as Record<string, unknown>;

                const saveEmpId = String(header.save_emp_id || headerRecord.created_by_emp_id || '');
                const transEmpId = String(header.transfer_emp_id || headerRecord.transfer_by_emp_id || '');
                const appvEmpId = String(header.appv_emp_id || headerRecord.approval_emp_id || '');

                const getEmpName = (empId: string) => {
                    const emp = employees.find(e => String(e.employee_id || e.id) === empId);
                    return emp ? (emp.employee_fullname || `${emp.employee_firstname_th || ''} ${emp.employee_lastname_th || ''}`.trim()) : '';
                };

                reset({
                    appv_transfer_id: header.appv_transfer_id,
                    appv_transfer_no: header.appv_transfer_no,
                    transfer_req_id: header.transfer_req_id,
                    transfer_req_no: header.transfer_req_no || headerRecord.transfer_req_no as string || '',
                    docu_date: header.transfer_req_date || header.docu_date || headerRecord.appv_transfer_date as string || '',
                    docu_item_name: String(headerRecord.doc_type_name || matchedDoc?.doc_type_name || header.transfer_docu_item_name || headerRecord.docu_item_no || ''),
                    transfer_emp_id: transEmpId,
                    transfer_emp_name: header.transfer_emp_name || getEmpName(transEmpId),
                    appv_date: header.appv_date || headerRecord.appv_transfer_date as string || '',
                    emp_dept_id: header.emp_dept_id,
                    job_id: header.job_id ?? '',
                    remark: header.remark || (headerRecord.remarks ? String(headerRecord.remarks) : ''),
                    reject_reason: headerRecord.remarks ? String(headerRecord.remarks) : '',
                    branch_id: header.branch_id,
                    appv_flag: headerRecord.status === 'REJECTED' ? 'N' : headerRecord.status === 'PARTIAL_APPROVED' || headerRecord.status === 'PARTIAL' ? 'P' : header.appv_flag as 'Y' | 'P' | 'N',
                    cancel_date: header.cancel_date ?? headerRecord.cancel_date as string ?? '',
                    cancel_flag: header.cancel_flag || headerRecord.cancel_flag as string || 'N',
                    cancel_remark: header.cancel_remark ?? '',
                    save_emp_id: saveEmpId,
                    appv_emp_id: appvEmpId,
                    stock_effect_ic: header.stock_effect_ic ?? 0,
                    lines: lines.map((l, i) => {
                        const itemId = Number(l.item_id);
                        const convs = conversionMap.get(itemId) || [];
                        const currentUomVal = String(l.uom_id);
                        const matchedConv = convs.find(c => String(c.conversion_id) === currentUomVal);

                        const outInveId = l.out_inve_id || (l as unknown as Record<string, unknown>).from_warehouse_id;
                        const incomeInveId = l.income_inve_id || (l as unknown as Record<string, unknown>).to_warehouse_id;
                        const outLocaId = l.out_loca_id || (l as unknown as Record<string, unknown>).from_location_id;
                        const incomeLocaId = l.income_loca_id || (l as unknown as Record<string, unknown>).to_location_id;

                        const fromWhName = String((warehouses.find(w => String(w.id || (w as unknown as Record<string, unknown>).warehouse_id) === String(outInveId)) as unknown as Record<string, unknown>)?.warehouse_name || '');
                        const toWhName = String((warehouses.find(w => String(w.id || (w as unknown as Record<string, unknown>).warehouse_id) === String(incomeInveId)) as unknown as Record<string, unknown>)?.warehouse_name || '');

                        return {
                            listno: l.listno ?? i + 1,
                            item_id: l.item_id,
                            item_code: l.item_code || String(itemMap.get(itemId)?.item_code || itemMap.get(itemId)?.item_no || ''),
                            item_name: l.item_name || String(itemMap.get(itemId)?.item_name || itemMap.get(itemId)?.item_desc || ''),
                            uom_id: matchedConv ? String(matchedConv.from_unit_id) : l.uom_id,
                            item_uom_id: matchedConv ? String(matchedConv.conversion_id) : l.uom_id,
                            income_inve_id: String(incomeInveId || ''),
                            income_inve_name: l.income_inve_name || String((l as unknown as Record<string, unknown>).to_warehouse_name || toWhName),
                            income_loca_id: String(incomeLocaId || ''),
                            income_loca_name: l.income_loca_name || String((l as unknown as Record<string, unknown>).to_location_name || locMap.get(Number(incomeLocaId))?.name_th || ''),
                            out_inve_id: String(outInveId || ''),
                            out_inve_name: l.out_inve_name || String((l as unknown as Record<string, unknown>).from_warehouse_name || fromWhName),
                            out_loca_id: String(outLocaId || ''),
                            out_loca_name: l.out_loca_name || String((l as unknown as Record<string, unknown>).from_location_name || locMap.get(Number(outLocaId))?.name_th || ''),
                            qty_ic: l.qty_ic,
                            appv_stock_qty: l.appv_stock_qty,
                            lot_id: l.lot_id ?? '',
                            lot_no: String(l.lot_no || lotMap.get(Number(l.lot_id))?.code || lotMap.get(Number(l.lot_id))?.name_th || ''),
                            stock_flag: l.stock_flag ?? 0,
                            remark: l.remark || String((l as unknown as Record<string, unknown>).remarks || ''),
                        };
                    }),
                });
            };
            void handleHydration();
        }
    }, [editData, isOpen, reset, queryClient, warehouses, docLinks, employees]);

    // Handle Create Mode from Reference Setup
    useEffect(() => {
        if (reqData && !editId && isOpen) {
            const { header, lines } = reqData;
            const allItemIds = [...new Set(lines.map(l => Number(l.item_id)).filter(id => id > 0))];

            const handleHydration = async () => {
                const conversionMap = new Map<number, UOMConversionListItem[]>();
                const itemMap = new Map<number, Record<string, unknown>>();
                const locMap = new Map<number, Record<string, unknown>>();
                const lotMap = new Map<number, Record<string, unknown>>();

                if (allItemIds.length > 0) {
                    try {
                        const { ItemMasterService } = await import('@/modules/master-data/inventory/services/item-master.service');
                        const itemsList = await Promise.all(
                            allItemIds.map(id => queryClient.ensureQueryData({
                                queryKey: ['item-master', id],
                                queryFn: () => ItemMasterService.getById(id),
                                staleTime: 5 * 60 * 1000
                            }))
                        );
                        itemsList.forEach(itm => { if (itm) itemMap.set(Number((itm as unknown as Record<string, unknown>).item_id || (itm as unknown as Record<string, unknown>).id), itm as unknown as Record<string, unknown>); });

                        const convsList = await Promise.all(
                            allItemIds.map(itemId =>
                                queryClient.ensureQueryData({
                                    queryKey: ['transfer-uom-conversions', itemId],
                                    queryFn: () => UOMConversionService.getByItemId(itemId),
                                    staleTime: 5 * 60 * 1000
                                })
                            )
                        );
                        convsList.forEach((res, idx) => {
                            if (res) conversionMap.set(allItemIds[idx], res.items || []);
                        });
                    } catch (err) {
                        logger.warn('[useTransferApprovalForm] UOM conversions load failed:', err);
                    }
                }

                try {
                    const { LocationService, LotNoService } = await import('@/modules/master-data/inventory/services/inventory-master.service');
                    const allFromLocIds = lines.map(l => Number(l.from_location_id || (l as unknown as Record<string, unknown>).out_loca_id)).filter(id => id > 0);
                    const allToLocIds = lines.map(l => Number(l.to_location_id || (l as unknown as Record<string, unknown>).income_loca_id)).filter(id => id > 0);
                    const allLocIds = [...new Set([...allFromLocIds, ...allToLocIds])];
                    const allLotIds = [...new Set(lines.map(l => Number(l.lot_id)).filter(id => id > 0))];
                    
                    if (allLocIds.length > 0) {
                        const locsList = await Promise.all(allLocIds.map(id => queryClient.ensureQueryData({
                            queryKey: ['location', id],
                            queryFn: () => LocationService.getById(id),
                            staleTime: 5 * 60 * 1000
                        })));
                        locsList.forEach(loc => { if (loc) locMap.set(Number((loc as unknown as Record<string, unknown>).id || (loc as unknown as Record<string, unknown>).location_id), loc as unknown as Record<string, unknown>); });
                    }
                    
                    if (allLotIds.length > 0) {
                        const lotsList = await Promise.all(allLotIds.map(id => queryClient.ensureQueryData({
                            queryKey: ['lot', id],
                            queryFn: () => LotNoService.getById(id),
                            staleTime: 5 * 60 * 1000
                        })));
                        lotsList.forEach(lot => { if (lot) lotMap.set(Number((lot as unknown as Record<string, unknown>).id || (lot as unknown as Record<string, unknown>).lot_no_id), lot as unknown as Record<string, unknown>); });
                    }
                } catch (err) {
                    logger.warn('[useTransferApprovalForm] location/lot load failed:', err);
                }

                const docNoCreate = String((header as unknown as Record<string, unknown>).docu_item_no || (header as unknown as Record<string, unknown>).doc_type_no || '');
                const matchedDocCreate = docLinks.find(d => String(d.docu_type_id) === docNoCreate || String(d.docu_item_no) === docNoCreate);

                reset({
                    ...DEFAULT_VALUES,
                    transfer_req_id: String(header.transfer__req_id || (header as unknown as Record<string, unknown>).transfer_req_id || ''),
                    transfer_req_no: String(header.transfer__req_no || (header as unknown as Record<string, unknown>).transfer_req_no || ''),
                    docu_date: (header.docu_date || String((header as unknown as Record<string, unknown>).transfer_req_date || '')).split('T')[0],
                    docu_item_name: String((header as unknown as Record<string, unknown>).doc_type_name || matchedDocCreate?.doc_type_name || (header as unknown as Record<string, unknown>).transfer_docu_item_name || (header as unknown as Record<string, unknown>).docu_item_no || ''),
                    transfer_emp_id: String(header.transfer_emp_id || (header as unknown as Record<string, unknown>).transfer_by_emp_id || ''),
                    transfer_emp_name: header.transfer_emp_name || '',
                    remark: header.remark || String((header as unknown as Record<string, unknown>).remarks || ''),
                    branch_id: String(header.branch_id || ''),
                    emp_dept_id: String((header as unknown as Record<string, unknown>).emp_dept_id || (((user as unknown as Record<string, unknown>)?.employee as Record<string, unknown>)?.department_id) || ''),
                    doc_link_ic_id: Number(header.doc_link_ic_id || (header as unknown as Record<string, unknown>).doc_link_ic_id || 0),
                    save_emp_id: String((header as unknown as Record<string, unknown>).created_by_emp_id || header.save_emp_id || (user?.employee?.employee_id ? String(user.employee.employee_id) : (user?.employee_id ? String(user.employee_id) : ''))),
                    appv_emp_id: user?.employee?.employee_id ? String(user.employee.employee_id) : (user?.employee_id ? String(user.employee_id) : ''),
                    lines: lines.map((l, i) => {
                        const itemId = Number(l.item_id);
                        const convs = conversionMap.get(itemId) || [];
                        const currentUomVal = String(l.uom_id);
                        const matchedConv = convs.find(c => String(c.conversion_id) === currentUomVal);

                        const outInveId = l.from_warehouse_id || (l as unknown as Record<string, unknown>).out_inve_id;
                        const incomeInveId = l.to_warehouse_id || (l as unknown as Record<string, unknown>).income_inve_id;
                        const outLocaId = l.from_location_id || (l as unknown as Record<string, unknown>).out_loca_id;
                        const incomeLocaId = l.to_location_id || (l as unknown as Record<string, unknown>).income_loca_id;

                        const fromWhName = String((warehouses.find(w => String(w.id || (w as unknown as Record<string, unknown>).warehouse_id) === String(outInveId)) as unknown as Record<string, unknown>)?.warehouse_name || '');
                        const toWhName = String((warehouses.find(w => String(w.id || (w as unknown as Record<string, unknown>).warehouse_id) === String(incomeInveId)) as unknown as Record<string, unknown>)?.warehouse_name || '');

                        return {
                            transfer_req_line_id: Number(l.transfer__req_line_id || (l as unknown as Record<string, unknown>).transfer_req_line_id || (l as unknown as Record<string, unknown>).id || 0),
                            listno: l.listno ?? i + 1,
                            item_id: l.item_id,
                            item_code: l.item_code || String(itemMap.get(itemId)?.item_code || itemMap.get(itemId)?.item_no || ''),
                            item_name: l.item_name || String(itemMap.get(itemId)?.item_name || itemMap.get(itemId)?.item_desc || ''),
                            uom_id: matchedConv ? String(matchedConv.from_unit_id) : l.uom_id,
                            item_uom_id: matchedConv ? String(matchedConv.conversion_id) : l.uom_id,
                            income_inve_id: String(incomeInveId || ''),
                            income_inve_name: l.to_warehouse_name || String((l as unknown as Record<string, unknown>).income_inve_name || toWhName),
                            income_loca_id: String(incomeLocaId || ''),
                            income_loca_name: l.to_location_name || String((l as unknown as Record<string, unknown>).income_loca_name || locMap.get(Number(incomeLocaId))?.name_th || ''),
                            out_inve_id: String(outInveId || ''),
                            out_inve_name: l.from_warehouse_name || String((l as unknown as Record<string, unknown>).out_inve_name || fromWhName),
                            out_loca_id: String(outLocaId || ''),
                            out_loca_name: l.from_location_name || String((l as unknown as Record<string, unknown>).out_loca_name || locMap.get(Number(outLocaId))?.name_th || ''),
                            qty_ic: l.qty_ic,
                            approved_qty: Number(l.approved_qty || 0),
                            appv_stock_qty: Math.max(0, Number(l.qty_ic) - Number(l.approved_qty || 0)), // Default approved quantity to remaining quantity
                            lot_id: l.lot_id ?? '',
                            lot_balance_id: (l as unknown as Record<string, unknown>).lot_balance_id ? String((l as unknown as Record<string, unknown>).lot_balance_id) : '',
                            lot_no: String(l.lot_no || lotMap.get(Number(l.lot_id))?.code || lotMap.get(Number(l.lot_id))?.name_th || ''),
                            stock_flag: l.stock_flag ?? 0,
                            remark: l.remark || String((l as unknown as Record<string, unknown>).remarks || ''),
                        };
                    }),
                });
            };
            void handleHydration();
        } else if (!editId && !requisitionId && isOpen) {
            reset({
                ...DEFAULT_VALUES,
                save_emp_id: user?.employee?.employee_id ? String(user.employee.employee_id) : (user?.employee_id ? String(user.employee_id) : ''),
                appv_emp_id: user?.employee?.employee_id ? String(user.employee.employee_id) : (user?.employee_id ? String(user.employee_id) : ''),
            });
        }
    }, [reqData, editId, requisitionId, isOpen, reset, user, queryClient, warehouses, docLinks]);

    // ── Mutations ─────────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (data: TransferApprovalFormData) =>
            TransferApprovalService.create(data),
        onSuccess: (result, variables) => {
            if (result.success) {
                const msg = variables.appv_flag === 'P'
                    ? 'บันทึกการอนุมัติบางส่วนสำเร็จ'
                    : 'บันทึกการอนุมัติสำเร็จ';
                toast.success(msg);
                queryClient.invalidateQueries({ queryKey: ['transfer-requisition-approvals'] });
                queryClient.invalidateQueries({ queryKey: ['transfer-pending-approvals'] });
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.message || 'เกิดข้อผิดพลาด');
            }
        },
        onError: () => toast.error('เกิดข้อผิดพลาดในการบันทึก'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: TransferApprovalFormData }) =>
            TransferApprovalService.update(id, data),
        onSuccess: (result, variables) => {
            if (result.success) {
                const msg = variables.data.appv_flag === 'P'
                    ? 'แก้ไขข้อมูลการอนุมัติบางส่วนสำเร็จ'
                    : 'แก้ไขข้อมูลการอนุมัติสำเร็จ';
                toast.success(msg);
                queryClient.invalidateQueries({ queryKey: ['transfer-requisition-approvals'] });
                queryClient.invalidateQueries({ queryKey: ['transfer-requisition-approval', editId] });
                queryClient.invalidateQueries({ queryKey: ['transfer-pending-approvals'] });
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.message || 'เกิดข้อผิดพลาด');
            }
        },
        onError: () => toast.error('เกิดข้อผิดพลาดในการแก้ไข'),
    });

    // ── Submit Handler ────────────────────────────────────────────────────────────
    const onSubmit = useCallback(
        async (data: TransferApprovalFormData) => {
            // Auto-detect partial approval: if any line's total approved (previous + current) is less than requested qty
            const isPartial = data.lines.some(l => (Number(l.approved_qty || 0) + Number(l.appv_stock_qty || 0)) < Number(l.qty_ic));
            const resolvedFlag: 'Y' | 'P' | 'N' = data.appv_flag === 'N' ? 'N' : (isPartial ? 'P' : 'Y');

            const payload: TransferApprovalFormData = {
                ...data,
                appv_flag: resolvedFlag,
                lines: data.lines.map(l => ({
                    ...l,
                    uom_id: l.item_uom_id || l.uom_id,
                })),
            };
            if (payload.appv_transfer_no === 'ระบบจะกรอกอัตโนมัติ') {
                payload.appv_transfer_no = '';
            }

            try {
                if (isEditMode && editId) {
                    await updateMutation.mutateAsync({ id: editId, data: payload });
                } else {
                    await createMutation.mutateAsync(payload);
                }
            } catch (error) {
                logger.error('[TransferApprovalForm] Submit failed:', error);
            }
        },
        [isEditMode, editId, createMutation, updateMutation]
    );

    const handleFormError = useCallback((errs: unknown) => {
        console.warn('[TransferApprovalForm] Validation errors:', errs);
        toast.error('กรุณาตรวจสอบข้อมูลให้ครบถ้วน');
    }, []);

    // ── Line Handlers ─────────────────────────────────────────────────────────────
    const updateLine = useCallback(
        (index: number, field: keyof TransferApprovalLineFormData | null, value: TransferApprovalLineFormData | unknown) => {
            if (field === null) {
                update(index, value as TransferApprovalLineFormData);
            } else {
                const current = fields[index];
                update(index, { ...current, [field]: value } as TransferApprovalLineFormData);
            }
        },
        [fields, update]
    );

    const isSaving = useMemo(
        () => isSubmitting || createMutation.isPending || updateMutation.isPending,
        [isSubmitting, createMutation.isPending, updateMutation.isPending]
    );

    const isLoading = isLoadingEdit || isLoadingReq;

    return {
        formMethods,
        register,
        control,
        errors,
        handleSubmit,
        onSubmit,
        handleFormError,
        isSaving,
        isLoading,
        isEditMode,
        setValue,

        fields,
        replace,
        updateLine,

        branches,
        employees,
        departments,
        projects,
        uoms,
        warehouses,
        docLinks,
        reqData,
        icOptions,
    };
}
