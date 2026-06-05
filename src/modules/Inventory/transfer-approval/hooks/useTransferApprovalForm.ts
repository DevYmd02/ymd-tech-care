/**
 * @file useTransferApprovalForm.ts
 * @description React Hook Form + Zod hook สำหรับฟอร์มอนุมัติใบขอโอนย้ายสินค้า (Transfer Requisition Approval Form)
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, type Resolver, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils';

import { transferApprovalSchema } from '../schemas/transfer-approval.schemas';
import type { TransferApprovalFormData, TransferApprovalLineFormData } from '../schemas/transfer-approval.schemas';
import { TransferApprovalService } from '../services/transfer-approval.service';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import type {
    BranchListItem,
    EmployeeListItem,
    DepartmentListItem,
    Project,
    UOMListItem
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
            const { header, lines } = editData;
            reset({
                appv_transfer_id: header.appv_transfer_id,
                appv_transfer_no: header.appv_transfer_no,
                transfer_req_id: header.transfer_req_id,
                appv_date: header.appv_date,
                emp_dept_id: header.emp_dept_id,
                job_id: header.job_id ?? '',
                remark: header.remark ?? '',
                branch_id: header.branch_id,
                appv_flag: header.appv_flag as 'Y' | 'P' | 'N',
                cancel_date: header.cancel_date ?? '',
                cancel_flag: header.cancel_flag,
                cancel_remark: header.cancel_remark ?? '',
                save_emp_id: header.save_emp_id ?? '',
                appv_emp_id: header.appv_emp_id ?? '',
                stock_effect_ic: header.stock_effect_ic ?? 0,
                lines: lines.map((l, i) => ({
                    listno: l.listno ?? i + 1,
                    item_id: l.item_id,
                    item_code: l.item_code || '',
                    item_name: l.item_name || '',
                    uom_id: l.uom_id,
                    income_inve_id: l.income_inve_id,
                    income_inve_name: l.income_inve_name || '',
                    income_loca_id: l.income_loca_id ?? '',
                    income_loca_name: l.income_loca_name || '',
                    out_inve_id: l.out_inve_id,
                    out_inve_name: l.out_inve_name || '',
                    out_loca_id: l.out_loca_id ?? '',
                    out_loca_name: l.out_loca_name || '',
                    qty_ic: l.qty_ic,
                    appv_stock_qty: l.appv_stock_qty,
                    lot_id: l.lot_id ?? '',
                    lot_no: l.lot_no || '',
                    stock_flag: l.stock_flag ?? 0,
                    remark: l.remark ?? '',
                })),
            });
        }
    }, [editData, isOpen, reset]);

    // Handle Create Mode from Reference Setup
    useEffect(() => {
        if (reqData && !editId && isOpen) {
            const { header, lines } = reqData;
            reset({
                ...DEFAULT_VALUES,
                transfer_req_id: header.transfer__req_id,
                transfer_req_no: header.transfer__req_no,
                branch_id: header.branch_id,
                save_emp_id: user?.employee_id ? String(user.employee_id) : '',
                appv_emp_id: user?.employee_id ? String(user.employee_id) : '',
                lines: lines.map((l, i) => ({
                    listno: l.listno ?? i + 1,
                    item_id: l.item_id,
                    item_code: l.item_code || '',
                    item_name: l.item_name || '',
                    uom_id: l.uom_id,
                    income_inve_id: l.income_inve_id,
                    income_inve_name: l.income_inve_name || '',
                    income_loca_id: l.income_loca_id ?? '',
                    income_loca_name: l.income_loca_name || '',
                    out_inve_id: l.out_inve_id,
                    out_inve_name: l.out_inve_name || '',
                    out_loca_id: l.out_loca_id ?? '',
                    out_loca_name: l.out_loca_name || '',
                    qty_ic: l.qty_ic,
                    appv_stock_qty: l.qty_ic, // Default approved quantity to request quantity
                    lot_id: l.lot_id ?? '',
                    lot_no: l.lot_no || '',
                    stock_flag: l.stock_flag ?? 0,
                    remark: l.remark ?? '',
                })),
            });
        } else if (!editId && !requisitionId && isOpen) {
            reset({
                ...DEFAULT_VALUES,
                save_emp_id: user?.employee_id ? String(user.employee_id) : '',
                appv_emp_id: user?.employee_id ? String(user.employee_id) : '',
            });
        }
    }, [reqData, editId, requisitionId, isOpen, reset, user]);

    // ── Mutations ─────────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (data: TransferApprovalFormData) =>
            TransferApprovalService.create(data),
        onSuccess: (result) => {
            if (result.success) {
                toast.success('บันทึกการอนุมัติสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['transfer-requisition-approvals'] });
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
        onSuccess: (result) => {
            if (result.success) {
                toast.success('แก้ไขข้อมูลการอนุมัติสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['transfer-requisition-approvals'] });
                queryClient.invalidateQueries({ queryKey: ['transfer-requisition-approval', editId] });
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
            const payload = { ...data };
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
    };
}
