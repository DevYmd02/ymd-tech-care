/**
 * @file useReturnForm.ts
 * @description React Hook Form + Zod hook สำหรับ Return Issue Stock Form (รับคืนจากการเบิก)
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch, type Resolver, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils';

import { returnIssueHeaderSchema } from '../schemas/return.schemas';
import type { ReturnIssueHeaderFormData, ReturnIssueLineFormData } from '../schemas/return.schemas';
import { ReturnIssueService } from '../services/return.service';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';

// ====================================================================================
// HELPERS
// ====================================================================================

const getTodayISO = () => new Date().toISOString().split('T')[0];

const createDefaultLine = (listno: number): ReturnIssueLineFormData => ({
    _tempId: `temp-${Date.now()}-${listno}`,
    listno,
    item_id: '',
    item_code: '',
    item_name: '',
    uom_id: '',
    warehouse_id: '',
    warehouse_name: '',
    location_id: '',
    location_name: '',
    qty_ic: '',
    qty_return_ic: '',
    lot_id: '',
    lot_no: '',
    unit_cost: '',
    good_amnt: 0,
    standard_buy_price: 0,
    standard_cost: 0,
    stock_flag: 1, // เพิ่มสต็อก สำหรับรับคืนจากการเบิก
    remark: '',
});

const DEFAULT_VALUES: ReturnIssueHeaderFormData = {
    docu_item_no: null,
    issue_stk_no: '',
    reissue_stk_no: 'ระบบจะกรอกอัตโนมัติ',
    docu_date: getTodayISO(),
    emp_dept_id: '',
    job_id: '',
    branch_id: '',
    save_emp_id: '',
    rece_emp_id: '',
    stock_effect_ic: 1, // เพิ่มคลัง
    amnt_total: 0,
    remark: '',
    cancel_flag: 'N',
    cancel_date: null,
    cancel_remark: '',
    lines: [createDefaultLine(1)],
};

// ====================================================================================
// HOOK
// ====================================================================================

interface UseReturnFormOptions {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

export function useReturnForm({ isOpen, onClose, editId, onSuccess }: UseReturnFormOptions) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isEditMode = !!editId;

    // ── Form Methods ──────────────────────────────────────────────────────────────
    const formMethods = useForm<ReturnIssueHeaderFormData>({
        resolver: zodResolver(returnIssueHeaderSchema) as Resolver<ReturnIssueHeaderFormData>,
        defaultValues: DEFAULT_VALUES as DefaultValues<ReturnIssueHeaderFormData>,
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
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'lines',
        keyName: '_id',
    });

    // ── Watch lines for auto-calculate good_amnt and amnt_total ────────────────────
    const watchedLines = useWatch({ control, name: 'lines' });

    useEffect(() => {
        let total = 0;
        (watchedLines ?? []).forEach((line, index) => {
            const qtyReturn = Number(line.qty_return_ic) || 0;
            const cost = Number(line.unit_cost) || 0;
            const lineTotal = parseFloat((qtyReturn * cost).toFixed(4));
            
            if (line.good_amnt !== lineTotal) {
                setValue(`lines.${index}.good_amnt`, lineTotal);
            }
            total += lineTotal;
        });

        setValue('amnt_total', parseFloat(total.toFixed(4)));
    }, [watchedLines, setValue]);

    // ── Load Master Data ─────────────────────────────────────────────────────────
    const { data: branches = [] } = useQuery({
        queryKey: ['branches-options'],
        queryFn: () => MasterDataService.getBranches(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['departments-options'],
        queryFn: () => MasterDataService.getDepartments(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees-options'],
        queryFn: () => MasterDataService.getEmployees(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['projects-options'],
        queryFn: () => MasterDataService.getProjects(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: uoms = [] } = useQuery({
        queryKey: ['uoms-options'],
        queryFn: () => MasterDataService.getUOMs(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses-options'],
        queryFn: () => MasterDataService.getWarehouses(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    // ── Load Edit Data ────────────────────────────────────────────────────────────
    const { data: editData, isLoading: isLoadingEdit } = useQuery({
        queryKey: ['return-issue-stock', editId],
        queryFn: () => (editId ? ReturnIssueService.getById(editId) : null),
        enabled: !!editId && isOpen,
    });

    useEffect(() => {
        if (editData) {
            const { header, lines } = editData;
            reset({
                docu_item_id: header.docu_item_id,
                docu_item_no: header.docu_item_no,
                issue_stk_no: header.issue_stk_no,
                reissue_stk_no: header.reissue_stk_no,
                docu_date: header.docu_date,
                emp_dept_id: header.emp_dept_id,
                job_id: header.job_id,
                branch_id: header.branch_id,
                save_emp_id: header.save_emp_id,
                rece_emp_id: header.rece_emp_id,
                stock_effect_ic: header.stock_effect_ic,
                amnt_total: header.amnt_total,
                remark: header.remark ?? '',
                cancel_flag: header.cancel_flag,
                cancel_date: header.cancel_date ?? null,
                cancel_remark: header.cancel_remark ?? '',
                lines: lines.map((l, i) => ({
                    _tempId: `edit-${l.docu_item_id ?? i}`,
                    listno: l.listno ?? i + 1,
                    item_id: l.item_id,
                    item_code: l.item_code || '',
                    item_name: l.item_name || '',
                    uom_id: l.uom_id,
                    warehouse_id: l.warehouse_id,
                    warehouse_name: l.warehouse_name || '',
                    location_id: l.location_id ?? '',
                    location_name: l.location_name || '',
                    qty_ic: l.qty_ic,
                    qty_return_ic: l.qty_return_ic,
                    lot_id: l.lot_id ?? '',
                    lot_no: l.lot_no || '',
                    unit_cost: l.unit_cost,
                    good_amnt: l.good_amnt,
                    standard_buy_price: l.standard_buy_price ?? 0,
                    standard_cost: l.standard_cost ?? 0,
                    stock_flag: l.stock_flag ?? 1,
                    remark: l.remark ?? '',
                })),
            });
        } else if (!editId && isOpen) {
            reset({ 
                ...DEFAULT_VALUES, 
                docu_date: getTodayISO(), 
                save_emp_id: user?.employee_id ? String(user.employee_id) : '',
                branch_id: user?.employee?.branch_id ? String(user.employee.branch_id) : '',
                lines: [createDefaultLine(1)] 
            });
        }
    }, [editData, editId, isOpen, reset, user]);

    // ── Mutations ─────────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (data: ReturnIssueHeaderFormData) =>
            ReturnIssueService.create(data as Parameters<typeof ReturnIssueService.create>[0]),
        onSuccess: (result) => {
            if (result.success) {
                toast.success('บันทึกใบรับคืนจากการเบิกสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['return-issue-stocks'] });
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.message || 'เกิดข้อผิดพลาด');
            }
        },
        onError: () => toast.error('เกิดข้อผิดพลาดในการบันทึก'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ReturnIssueHeaderFormData }) =>
            ReturnIssueService.update(id, data as Parameters<typeof ReturnIssueService.update>[1]),
        onSuccess: (result) => {
            if (result.success) {
                toast.success('แก้ไขใบรับคืนจากการเบิกสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['return-issue-stocks'] });
                queryClient.invalidateQueries({ queryKey: ['return-issue-stock', editId] });
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
        async (data: ReturnIssueHeaderFormData) => {
            const payload = { ...data };
            if (payload.reissue_stk_no === 'ระบบจะกรอกอัตโนมัติ') {
                payload.reissue_stk_no = '';
            }

            try {
                if (isEditMode && editId) {
                    await updateMutation.mutateAsync({ id: editId, data: payload });
                } else {
                    await createMutation.mutateAsync(payload);
                }
            } catch (error) {
                logger.error('[ReturnForm] Submit failed:', error);
            }
        },
        [isEditMode, editId, createMutation, updateMutation]
    );

    const handleFormError = useCallback((errs: unknown) => {
        console.warn('[ReturnForm] Validation errors:', errs);
        toast.error('กรุณาตรวจสอบข้อมูลให้ครบถ้วน');
    }, []);

    // ── Line Handlers ─────────────────────────────────────────────────────────────
    const addLine = useCallback(() => {
        append(createDefaultLine(fields.length + 1));
    }, [append, fields.length]);

    const removeLine = useCallback(
        (index: number) => {
            if (fields.length > 1) {
                remove(index);
            } else {
                toast.error('ต้องมีรายการสินค้าอย่างน้อย 1 รายการ');
            }
        },
        [fields.length, remove]
    );

    const updateLine = useCallback(
        (index: number, field: keyof ReturnIssueLineFormData | null, value: ReturnIssueLineFormData | unknown) => {
            if (field === null) {
                update(index, value as ReturnIssueLineFormData);
            } else {
                const current = fields[index];
                update(index, { ...current, [field]: value } as ReturnIssueLineFormData);
            }
        },
        [fields, update]
    );

    const isSaving = useMemo(
        () => isSubmitting || createMutation.isPending || updateMutation.isPending,
        [isSubmitting, createMutation.isPending, updateMutation.isPending]
    );

    return {
        formMethods,
        register,
        control,
        errors,
        handleSubmit,
        onSubmit,
        handleFormError,
        isSaving,
        isLoading: isLoadingEdit,
        isEditMode,

        fields,
        addLine,
        removeLine,
        updateLine,

        branches,
        departments,
        employees,
        projects,
        uoms,
        warehouses,
    };
}
