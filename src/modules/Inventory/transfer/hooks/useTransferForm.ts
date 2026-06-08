/**
 * @file useTransferForm.ts
 * @description React Hook Form + Zod hook สำหรับ Transfer Requisition Form (ใบขอโอนย้ายสินค้า)
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, type Resolver, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils';

import { transferHeaderSchema } from '../schemas/transfer.schemas';
import type { TransferHeaderFormData, TransferLineFormData } from '../schemas/transfer.schemas';
import { TransferService } from '../services/transfer.service';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import { UOMConversionService } from '@inventory/services/uom-conversion.service';
import type { UOMConversionListItem } from '@/modules/master-data/types/master-data-types';

// ====================================================================================
// HELPERS
// ====================================================================================

const getTodayISO = () => new Date().toISOString().split('T')[0];

const createDefaultLine = (listno: number): TransferLineFormData => ({
    _tempId: `temp-${Date.now()}-${listno}`,
    listno,
    item_id: '',
    item_code: '',
    item_name: '',
    uom_id: '',
    item_uom_id: '',
    income_inve_id: '',
    income_inve_name: '',
    income_loca_id: '',
    income_loca_name: '',
    out_inve_id: '',
    out_inve_name: '',
    out_loca_id: '',
    out_loca_name: '',
    qty_ic: '',
    lot_id: '',
    lot_no: '',
    stock_flag: 0,
    remark: '',
});

const DEFAULT_VALUES: TransferHeaderFormData = {
    transfer__req_no: 'ระบบจะกรอกอัตโนมัติ',
    docu_date: getTodayISO(),
    branch_id: '',
    save_emp_id: '',
    transfer_emp_id: '',
    stock_effect_ic: 0,
    remark: '',
    cancelflag: 'N',
    cancle_remark: '',
    lines: [createDefaultLine(1)],
};

// ====================================================================================
// HOOK
// ====================================================================================

interface UseTransferFormOptions {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

export function useTransferForm({ isOpen, onClose, editId, onSuccess }: UseTransferFormOptions) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isEditMode = !!editId;

    // ── Form Methods ──────────────────────────────────────────────────────────────
    const formMethods = useForm<TransferHeaderFormData>({
        resolver: zodResolver(transferHeaderSchema) as Resolver<TransferHeaderFormData>,
        defaultValues: DEFAULT_VALUES as DefaultValues<TransferHeaderFormData>,
        mode: 'onChange',
    });

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = formMethods;

    // ── Field Array (Lines) ───────────────────────────────────────────────────────
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'lines',
        keyName: '_id',
    });

    // ── Load Master Data ─────────────────────────────────────────────────────────
    const { data: branches = [] } = useQuery({
        queryKey: ['branches-options'],
        queryFn: () => MasterDataService.getBranches(),
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
        queryKey: ['transfer-requisition', editId],
        queryFn: () => (editId ? TransferService.getById(editId) : null),
        enabled: !!editId && isOpen,
    });

    useEffect(() => {
        if (editData) {
            const { header, lines } = editData;
            const allItemIds = [...new Set(lines.map(l => Number(l.item_id)).filter(id => id > 0))];

            const handleHydration = async () => {
                const conversionMap = new Map<number, UOMConversionListItem[]>();
                if (allItemIds.length > 0) {
                    try {
                        const convsList = await Promise.all(
                            allItemIds.map(itemId =>
                                UOMConversionService.getByItemId(itemId).then(res => ({ itemId, items: res?.items || [] }))
                            )
                        );
                        convsList.forEach(c => {
                            if (c) conversionMap.set(c.itemId, c.items);
                        });
                    } catch (err) {
                        logger.warn('[useTransferForm] UOM conversions load failed:', err);
                    }
                }

                reset({
                    transfer__req_id: header.transfer__req_id,
                    transfer__req_no: header.transfer__req_no,
                    docu_date: header.docu_date,
                    branch_id: header.branch_id,
                    save_emp_id: header.save_emp_id,
                    transfer_emp_id: header.transfer_emp_id,
                    stock_effect_ic: header.stock_effect_ic,
                    remark: header.remark ?? '',
                    cancelflag: header.cancelflag,
                    cancle_remark: header.cancle_remark ?? '',
                    lines: lines.map((l, i) => {
                        const itemId = Number(l.item_id);
                        const convs = conversionMap.get(itemId) || [];
                        const currentUomVal = String(l.uom_id);
                        const matchedConv = convs.find(c => String(c.conversion_id) === currentUomVal);

                        return {
                            _tempId: `edit-${l.transfer__req_id ?? i}`,
                            listno: l.listno ?? i + 1,
                            item_id: l.item_id,
                            item_code: l.item_code || '',
                            item_name: l.item_name || '',
                            uom_id: matchedConv ? String(matchedConv.from_unit_id) : l.uom_id,
                            item_uom_id: matchedConv ? String(matchedConv.conversion_id) : l.uom_id,
                            income_inve_id: l.income_inve_id,
                            income_inve_name: l.income_inve_name || '',
                            income_loca_id: l.income_loca_id ?? '',
                            income_loca_name: l.income_loca_name || '',
                            out_inve_id: l.out_inve_id,
                            out_inve_name: l.out_inve_name || '',
                            out_loca_id: l.out_loca_id ?? '',
                            out_loca_name: l.out_loca_name || '',
                            qty_ic: l.qty_ic,
                            lot_id: l.lot_id ?? '',
                            lot_no: l.lot_no || '',
                            stock_flag: l.stock_flag ?? 0,
                            remark: l.remark ?? '',
                        };
                    }),
                });
            };
            void handleHydration();
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
        mutationFn: (data: TransferHeaderFormData) =>
            TransferService.create(data as Parameters<typeof TransferService.create>[0]),
        onSuccess: (result) => {
            if (result.success) {
                toast.success('บันทึกใบขอโอนย้ายสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['transfer-requisitions'] });
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.message || 'เกิดข้อผิดพลาด');
            }
        },
        onError: () => toast.error('เกิดข้อผิดพลาดในการบันทึก'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: TransferHeaderFormData }) =>
            TransferService.update(id, data as Parameters<typeof TransferService.update>[1]),
        onSuccess: (result) => {
            if (result.success) {
                toast.success('แก้ไขใบขอโอนย้ายสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['transfer-requisitions'] });
                queryClient.invalidateQueries({ queryKey: ['transfer-requisition', editId] });
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
        async (data: TransferHeaderFormData) => {
            const payload = {
                ...data,
                lines: data.lines.map(l => ({
                    ...l,
                    uom_id: l.item_uom_id || l.uom_id,
                })),
            };
            if (payload.transfer__req_no === 'ระบบจะกรอกอัตโนมัติ') {
                payload.transfer__req_no = '';
            }

            try {
                if (isEditMode && editId) {
                    await updateMutation.mutateAsync({ id: editId, data: payload });
                } else {
                    await createMutation.mutateAsync(payload);
                }
            } catch (error) {
                logger.error('[TransferForm] Submit failed:', error);
            }
        },
        [isEditMode, editId, createMutation, updateMutation]
    );

    const handleFormError = useCallback((errs: unknown) => {
        console.warn('[TransferForm] Validation errors:', errs);
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
        (index: number, field: keyof TransferLineFormData | null, value: TransferLineFormData | unknown) => {
            if (field === null) {
                update(index, value as TransferLineFormData);
            } else {
                const current = fields[index];
                update(index, { ...current, [field]: value } as TransferLineFormData);
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
        employees,
        projects,
        uoms,
        warehouses,
    };
}
