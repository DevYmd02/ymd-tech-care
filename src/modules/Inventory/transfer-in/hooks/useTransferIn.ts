/**
 * @file useTransferIn.ts
 * @description React Hook Form สำหรับ Transfer In
 */

import { useCallback, useEffect } from 'react';
import { useForm, useFieldArray, useWatch, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils';
import type { UOMListItem } from '@/modules/master-data/types/master-data-types';

import { transferInFormSchema, type TransferInFormValues } from '../schemas/transfer-in.schemas';
import { TransferInService } from '../services/transfer-in.services';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import { useUnsavedChangesGuard } from '@/shared/hooks/useUnsavedChangesGuard';
import { useICOptions } from '@/shared/ic-option';
import { SYSTEM_DOCUMENT_CODES } from '@/shared/constants/system-documents';

const getTodayISO = () => new Date().toISOString().split('T')[0];

const DEFAULT_VALUES: Partial<TransferInFormValues> = {
    transfer_in_date: getTodayISO(),
    branch_id: '',
    emp_dept_id: '',
    status: 'COMPLETED',
    lines: [
        {
            item_id: '',
            qty: 1,
            uom_id: '',
            from_warehouse_id: '',
            to_warehouse_id: '',
        } as never
    ],
};

interface UseTransferInOptions {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    pendingData?: import('../types/transfer-in.types').PendingTransferInItem | null;
    onSuccess?: () => void;
}

export function useTransferIn({ isOpen, onClose, editId, pendingData, onSuccess }: UseTransferInOptions) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isEditMode = !!editId;

    const formMethods = useForm<TransferInFormValues>({
        resolver: zodResolver(transferInFormSchema) as never,
        defaultValues: DEFAULT_VALUES as DefaultValues<TransferInFormValues>,
        mode: 'onChange',
    });

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        getValues,
        formState: { errors, isSubmitting, isDirty },
    } = formMethods;

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'lines',
        keyName: '_id',
    });

    const { handleCloseAttempt, blocker } = useUnsavedChangesGuard({
        isDirty,
        enabled: isOpen,
        onSafeClose: onClose
    });

    // Master Data
    const { data: branches = [] } = useQuery({
        queryKey: ['branches-options'],
        queryFn: () => MasterDataService.getBranches(),
        enabled: isOpen,
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees-options'],
        queryFn: () => MasterDataService.getEmployees(),
        enabled: isOpen,
    });

    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses-options'],
        queryFn: () => MasterDataService.getWarehouses(),
        enabled: isOpen,
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['departments-options'],
        queryFn: () => MasterDataService.getDepartments(),
        enabled: isOpen,
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['projects-options'],
        queryFn: () => MasterDataService.getProjects(),
        enabled: isOpen,
    });

    const { data: uoms = [] } = useQuery<UOMListItem[]>({
        queryKey: ['uoms-options'],
        queryFn: () => MasterDataService.getUOMs(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: editData, isLoading: isLoadingEdit } = useQuery({
        queryKey: ['transfer-in', editId],
        queryFn: () => (editId ? TransferInService.getById(editId) : null),
        enabled: !!editId && isOpen,
    });

    useEffect(() => {
        const sourceData = editData || pendingData;
        const isEdit = !!editData;

        if (sourceData && isOpen) {
            const handleHydration = async () => {
                const sourceDataRecord = sourceData as unknown as Record<string, unknown>;
                const rawLinesArray = (isEdit 
                    ? (sourceDataRecord.transferInLines || sourceDataRecord.lines || [])
                    : (sourceDataRecord.appvTransferLines || [])) as Record<string, unknown>[];

                const itemMap = new Map<number, Record<string, unknown>>();
                const conversionMap = new Map<number, Record<string, unknown>[]>();
                const allItemIds = Array.from(new Set(rawLinesArray.map((raw) => Number(raw.item_id)).filter(Boolean)));
                
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
                        itemsList.forEach(rawItm => { if (rawItm) { const itm = rawItm as unknown as Record<string, unknown>; itemMap.set(Number(itm.item_id || itm.id), itm); } });
                    } catch (err) {
                        console.warn('[useTransferIn] items load failed:', err);
                    }

                    try {
                        const { UOMConversionService } = await import('@/modules/master-data/inventory/services/uom-conversion.service');
                        const convsList = await Promise.all(
                            allItemIds.map(itemId => queryClient.ensureQueryData({
                                queryKey: ['transfer-uom-conversions', itemId],
                                queryFn: () => UOMConversionService.getByItemId(itemId),
                                staleTime: 5 * 60 * 1000
                            }))
                        );
                        convsList.forEach((res, idx) => {
                            if (res) conversionMap.set(allItemIds[idx], (res as unknown as Record<string, unknown>).items as Record<string, unknown>[] || []);
                        });
                    } catch (err) {
                        console.warn('[useTransferIn] conversions load failed:', err);
                    }
                }

                const locMap = new Map<number, Record<string, unknown>>();
                const lotMap = new Map<number, Record<string, unknown>>();

                try {
                    const { LocationService, LotNoService } = await import('@/modules/master-data/inventory/services/inventory-master.service');
                    const allLocIds = [...new Set([
                        ...rawLinesArray.map((raw) => Number(raw.from_location_id)),
                        ...rawLinesArray.map((raw) => Number(raw.to_location_id))
                    ].filter(id => id > 0))];
                    const allLotIds = [...new Set(rawLinesArray.map((raw) => Number(raw.lot_id)).filter((id: number) => id > 0))];

                    if (allLocIds.length > 0) {
                        const locsList = await Promise.all(allLocIds.map(id => queryClient.ensureQueryData({
                            queryKey: ['location', id],
                            queryFn: () => LocationService.getById(id),
                            staleTime: 5 * 60 * 1000
                        })));
                        locsList.forEach(rawLoc => { if (rawLoc) { const loc = rawLoc as unknown as Record<string, unknown>; locMap.set(Number(loc.id || loc.location_id), loc); } });
                    }

                    if (allLotIds.length > 0) {
                        const lotsList = await Promise.all(allLotIds.map(id => queryClient.ensureQueryData({
                            queryKey: ['lot', id],
                            queryFn: () => LotNoService.getById(id),
                            staleTime: 5 * 60 * 1000
                        })));
                        lotsList.forEach(rawLot => { if (rawLot) { const lot = rawLot as unknown as Record<string, unknown>; lotMap.set(Number(lot.id || lot.lot_no_id), lot); } });
                    }
                } catch (err) {
                    console.warn('[useTransferIn] loc/lot load failed:', err);
                }

                reset({
                    ...DEFAULT_VALUES,
                    transfer_in_no: String(sourceDataRecord.transfer_in_no || ''),
                    transfer_in_date: String(sourceDataRecord.transfer_in_date || getTodayISO()),
                    appv_transfer_id: sourceDataRecord.appv_transfer_id as string | number | undefined,
                    emp_dept_id: String(sourceDataRecord.emp_dept_id || (user?.employee as Record<string, unknown>)?.emp_dept_id || user?.employee?.department_id || ''),
                    branch_id: String(sourceDataRecord.branch_id || user?.employee?.branch_id || ''),
                    project_id: sourceDataRecord.project_id ? String(sourceDataRecord.project_id) : '',
                    remarks: String(sourceDataRecord.remarks || sourceDataRecord.remark || ''),
                    status: String(sourceDataRecord.status || 'COMPLETED'),
                    doc_link_ic_id: sourceDataRecord.doc_link_ic_id as number | string | undefined,
                    stock_effect_ic: sourceDataRecord.stock_effect_ic !== undefined ? Number(sourceDataRecord.stock_effect_ic) : 1,
                    doc_type_no: sourceDataRecord.doc_type_no as number | string | undefined,
                    created_by_emp_id: String(sourceDataRecord.created_by_emp_id || sourceDataRecord.save_emp_id || user?.employee?.employee_id || (user?.employee as Record<string, unknown>)?.id || ''),
                    lines: rawLinesArray.map((rawLine) => {
                        const line = rawLine as unknown as Record<string, unknown>;
                        const itemId = Number(line.item_id);
                        const convs = conversionMap.get(itemId) || [];
                        const currentUomVal = String(line.uom_id);
                        const matchedConv = convs.find((c: Record<string, unknown>) => String(c.conversion_id) === currentUomVal);
                        
                        return {
                        ...rawLine,
                        item_code: line.item_code || itemMap.get(itemId)?.item_code || itemMap.get(itemId)?.item_no || '',
                        item_name: line.item_name || itemMap.get(itemId)?.item_name || itemMap.get(itemId)?.item_desc || '',
                        appv_transfer_line_id: line.appv_transfer_line_id,
                        item_id: String(itemId),
                        req_qty: line.qty,
                        qty: Number(line.qty_approved) > 0 ? Number(line.qty_approved) : Number(line.qty),
                        uom_id: matchedConv ? String(matchedConv.from_unit_id) : String(line.uom_id || itemMap.get(itemId)?.item_uom_id || itemMap.get(itemId)?.uom_id || ''),
                        conversion_id: String(line.uom_id),
                        uom_name: (line.uom_name && line.uom_name !== String(line.uom_id)) ? line.uom_name : (itemMap.get(itemId)?.uom_name || itemMap.get(itemId)?.base_uom_name || itemMap.get(itemId)?.sale_uom_name || ''),
                        from_warehouse_id: String(line.from_warehouse_id),
                        to_warehouse_id: String(line.to_warehouse_id),
                        from_location_id: line.from_location_id ? String(line.from_location_id) : undefined,
                        from_location_name: line.from_location_name || line.from_location_code || line.income_loca_name || locMap.get(Number(line.from_location_id))?.name_th || locMap.get(Number(line.from_location_id))?.location_name || undefined,
                        to_location_id: line.to_location_id ? String(line.to_location_id) : undefined,
                        to_location_name: line.to_location_name || line.to_location_code || line.out_loca_name || locMap.get(Number(line.to_location_id))?.name_th || locMap.get(Number(line.to_location_id))?.location_name || undefined,
                        lot_id: line.lot_id ? String(line.lot_id) : undefined,
                        lot_no: line.lot_no || line.lot_number || lotMap.get(Number(line.lot_id))?.code || lotMap.get(Number(line.lot_id))?.name_th || undefined,
                        remarks: line.remarks || '',
                        };
                    }) || DEFAULT_VALUES.lines
                } as unknown as TransferInFormValues);
            };
            void handleHydration();
        } else if (!editId && isOpen) {
            reset({
                ...DEFAULT_VALUES,
                transfer_in_date: getTodayISO(),
                branch_id: user?.employee?.branch_id ? String(user.employee.branch_id) : '',
                created_by_emp_id: user?.employee?.employee_id || (user?.employee as unknown as Record<string, unknown>)?.id || '',
            } as unknown as TransferInFormValues);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editData, editId, isOpen, reset, user, pendingData]);

    const createMutation = useMutation({
        mutationFn: (data: TransferInFormValues) => TransferInService.create(data as unknown as Parameters<typeof TransferInService.create>[0]),
        onSuccess: (result: { success: boolean; message?: string }) => {
            if (result.success) {
                toast.success('บันทึกสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['transfer-in-list'] });
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.message || 'เกิดข้อผิดพลาด');
            }
        },
        onError: () => toast.error('เกิดข้อผิดพลาดในการบันทึก'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: TransferInFormValues }) => TransferInService.update(id, data as unknown as Parameters<typeof TransferInService.update>[1]),
        onSuccess: (result: { success: boolean; message?: string }) => {
            if (result.success) {
                toast.success('แก้ไขสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['transfer-in-list'] });
                queryClient.invalidateQueries({ queryKey: ['transfer-in', editId] });
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.message || 'เกิดข้อผิดพลาด');
            }
        },
        onError: () => toast.error('เกิดข้อผิดพลาดในการแก้ไข'),
    });

    const watchedBranchId = useWatch({ control, name: 'branch_id' });
    const { icOptions } = useICOptions(watchedBranchId, SYSTEM_DOCUMENT_CODES.INVENTORY_TRANSFER_IN);

    // Update stock_effect_ic and doc_link_ic_id when icOptions finishes loading
    useEffect(() => {
        if (icOptions?.stock_effect !== undefined) {
            const currentStockEffect = getValues('stock_effect_ic');
            if (!currentStockEffect || currentStockEffect === 0) {
                setValue('stock_effect_ic', icOptions.stock_effect);
            }
        }
        if (icOptions?.doc_link_ic_id !== undefined) {
            const currentDocLink = getValues('doc_link_ic_id');
            if (!currentDocLink) {
                setValue('doc_link_ic_id', icOptions.doc_link_ic_id);
            }
        }
    }, [icOptions?.stock_effect, icOptions?.doc_link_ic_id, setValue, getValues]);

    const onSubmit = useCallback(async (data: TransferInFormValues) => {
        try {
            const payload = {
                ...data,
                doc_link_ic_id: data.doc_link_ic_id || (icOptions as unknown as Record<string, unknown>)?.doc_link_ic_id,
                created_by_emp_id: data.created_by_emp_id || user?.employee?.employee_id,
                emp_dept_id: data.emp_dept_id || user?.employee?.department_id,
                project_id: data.project_id || undefined,
                lines: data.lines.map(line => ({
                    appv_transfer_line_id: line.appv_transfer_line_id,
                    item_id: line.item_id,
                    qty: line.qty,
                    qty_approved: line.qty_approved,
                    uom_id: line.conversion_id || line.uom_id,
                    from_warehouse_id: line.from_warehouse_id,
                    from_location_id: line.from_location_id || null,
                    to_warehouse_id: line.to_warehouse_id,
                    to_location_id: line.to_location_id || null,
                    lot_id: line.lot_id || null,
                    lot_balance_id: line.lot_balance_id || null,
                    remarks: line.remarks || null,
                }))
            } as unknown as TransferInFormValues;

            if (isEditMode && editId) {
                await updateMutation.mutateAsync({ id: editId, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
        } catch (error) {
            logger.error('Submit failed:', error);
        }
    }, [isEditMode, editId, createMutation, updateMutation, icOptions, user]);

    const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;

    return {
        formMethods,
        register,
        control,
        errors,
        handleSubmit,
        onSubmit,
        isSaving,
        isLoading: isLoadingEdit,
        isEditMode,
        onClose: handleCloseAttempt,
        blocker,
        fields,
        append,
        remove,
        update,
        setValue,
        getValues,
        branches,
        employees,
        warehouses,
        departments,
        projects,
        uoms,
        icOptions,
    };
}
