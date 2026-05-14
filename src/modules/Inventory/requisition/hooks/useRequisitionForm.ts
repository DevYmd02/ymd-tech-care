/**
 * @file useRequisitionForm.ts
 * @description React Hook Form + Zod hook สำหรับ Issue Requisition Form
 * @features
 *   - Zod validation ครบทุก field ตาม D1/D2 schema
 *   - qty_total คำนวณอัตโนมัติจาก sum ของ qty_ic ทุก line
 *   - docu_item_no เป็น dropdown (doc-link-ic)
 *   - branch_id เป็น dropdown
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch, type Resolver, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';

import { requisitionHeaderSchema } from '../schemas/requisition.schemas';
import type { RequisitionHeaderFormData, RequisitionLineFormData } from '../schemas/requisition.schemas';
import { RequisitionService } from '../services/requisition.service';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';

// ====================================================================================
// HELPERS
// ====================================================================================

const getTodayISO = () => new Date().toISOString().split('T')[0];

const createDefaultLine = (listno: number): RequisitionLineFormData => ({
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
    lot_id: '',
    lot_no: '',
    qty_ic: '',
    stock_flag: 0,
    remark: '',
});

const DEFAULT_VALUES: RequisitionHeaderFormData = {
    docu_item_no: '',
    issue_req_no: 'ระบบจะกรอกอัตโนมัติ',
    docu_date: getTodayISO(),
    emp_dept_id: '',
    job_id: '',
    branch_id: '',
    save_emp_id: '',
    audit_emp_id: '',
    qty_total: 0,
    stock_effect_ic: 0,
    remark: '',
    cancel_flag: 'N',
    cancel_date: null,
    cancel_remark: '',
    lines: [createDefaultLine(1)],
};

// ====================================================================================
// HOOK
// ====================================================================================

interface UseRequisitionFormOptions {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

export function useRequisitionForm({ isOpen, onClose, editId, onSuccess }: UseRequisitionFormOptions) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isEditMode = !!editId;

    // ── Form Methods ──────────────────────────────────────────────────────────────
    const formMethods = useForm<RequisitionHeaderFormData>({
        resolver: zodResolver(requisitionHeaderSchema) as Resolver<RequisitionHeaderFormData>,
        defaultValues: DEFAULT_VALUES as DefaultValues<RequisitionHeaderFormData>,
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

    // ── Watch lines for auto-calculate qty_total ──────────────────────────────────
    const watchedLines = useWatch({ control, name: 'lines' });

    useEffect(() => {
        const total = (watchedLines ?? []).reduce((sum, line) => {
            return sum + (Number(line.qty_ic) || 0);
        }, 0);
        setValue('qty_total', parseFloat(total.toFixed(3)));
    }, [watchedLines, setValue]);

    // ── Load Master Data ─────────────────────────────────────────────────────────
    const { data: docLinks = [] } = useQuery({
        queryKey: ['doc-link-ic-options'],
        queryFn: () => RequisitionService.getDocLinks(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

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

    const { data: units = [] } = useQuery({
        queryKey: ['units-options'],
        queryFn: () => MasterDataService.getUnits(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    // ── Load Edit Data ────────────────────────────────────────────────────────────
    const { data: editData, isLoading: isLoadingEdit } = useQuery({
        queryKey: ['requisition', editId],
        queryFn: () => (editId ? RequisitionService.getById(editId) : null),
        enabled: !!editId && isOpen,
    });

    useEffect(() => {
        if (editData) {
            const { header, lines } = editData;
            reset({
                docu_item_id: header.docu_item_id,
                docu_item_no: header.docu_item_no,
                issue_req_no: header.issue_req_no,
                docu_date: header.docu_date,
                emp_dept_id: header.emp_dept_id,
                job_id: header.job_id,
                branch_id: header.branch_id,
                save_emp_id: header.save_emp_id,
                audit_emp_id: header.audit_emp_id,
                qty_total: header.qty_total,
                stock_effect_ic: header.stock_effect_ic,
                remark: header.remark ?? '',
                cancel_flag: header.cancel_flag,
                cancel_date: header.cancel_date ?? null,
                cancel_remark: header.cancel_remark ?? '',
                lines: lines.map((l, i) => ({
                    _tempId: `edit-${l.docu_item_line_id ?? i}`,
                    docu_item_line_id: l.docu_item_line_id,
                    listno: l.listno ?? i + 1,
                    item_id: l.item_id,
                    item_code: l.item_code || '',
                    item_name: l.item_name || '',
                    uom_id: l.uom_id,
                    warehouse_id: l.warehouse_id,
                    warehouse_name: l.warehouse_name || '',
                    location_id: l.location_id ?? '',
                    location_name: l.location_name || '',
                    lot_id: l.lot_id ?? '',
                    lot_no: l.lot_no || '',
                    qty_ic: l.qty_ic,
                    stock_flag: l.stock_flag ?? 0,
                    remark: l.remark ?? '',
                })),
            });
        } else if (!editId && isOpen) {
            reset({ 
                ...DEFAULT_VALUES, 
                docu_date: getTodayISO(), 
                save_emp_id: user?.employee_id ? String(user.employee_id) : '',
                lines: [createDefaultLine(1)] 
            });
        }
    }, [editData, editId, isOpen, reset, user]);

    // ── Mutations ─────────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (data: RequisitionHeaderFormData) =>
            RequisitionService.create(data as Parameters<typeof RequisitionService.create>[0]),
        onSuccess: (result) => {
            if (result.success) {
                toast.success('บันทึกใบขอเบิกสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['requisitions'] });
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.message || 'เกิดข้อผิดพลาด');
            }
        },
        onError: () => toast.error('เกิดข้อผิดพลาดในการบันทึก'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: RequisitionHeaderFormData }) =>
            RequisitionService.update(id, data as Parameters<typeof RequisitionService.update>[1]),
        onSuccess: (result) => {
            if (result.success) {
                toast.success('แก้ไขใบขอเบิกสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['requisitions'] });
                queryClient.invalidateQueries({ queryKey: ['requisition', editId] });
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
        (data: RequisitionHeaderFormData) => {
            // Prepare payload
            const payload = { ...data };
            if (payload.issue_req_no === 'ระบบจะกรอกอัตโนมัติ') {
                payload.issue_req_no = ''; // Let backend generate
            }

            if (isEditMode && editId) {
                updateMutation.mutate({ id: editId, data: payload });
            } else {
                createMutation.mutate(payload);
            }
        },
        [isEditMode, editId, createMutation, updateMutation]
    );

    const handleFormError = useCallback((errs: unknown) => {
        console.warn('[RequisitionForm] Validation errors:', errs);
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
        (index: number, field: keyof RequisitionLineFormData | null, value: RequisitionLineFormData | unknown) => {
            if (field === null) {
                update(index, value as RequisitionLineFormData);
            } else {
                const current = fields[index];
                update(index, { ...current, [field]: value } as RequisitionLineFormData);
            }
        },
        [fields, update]
    );

    // ── Derived State ─────────────────────────────────────────────────────────────
    const isSaving = useMemo(
        () => isSubmitting || createMutation.isPending || updateMutation.isPending,
        [isSubmitting, createMutation.isPending, updateMutation.isPending]
    );

    return {
        // Form
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

        // Lines
        fields,
        addLine,
        removeLine,
        updateLine,

        // Data
        docLinks,
        branches,
        departments,
        employees,
        projects,
        units,
    };
}
