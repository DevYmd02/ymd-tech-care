/**
 * @file useTransferForm.ts
 * @description React Hook Form + Zod hook สำหรับ Transfer Requisition Form (ใบขอโอนย้ายสินค้า)
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch, type Resolver, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils';

import { transferHeaderSchema } from '../schemas/transfer.schemas';
import type { TransferHeaderFormData, TransferLineFormData } from '../schemas/transfer.schemas';
import { TransferService } from '../services/transfer.service';

import { ReservationInventoryService } from '@/modules/sales/reservation/services/reservation-inventory.service';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import { UOMConversionService } from '@inventory/services/uom-conversion.service';
import type { UOMConversionListItem } from '@/modules/master-data/types/master-data-types';
import { useICOptions } from '@/shared/ic-option';
import { SYSTEM_DOCUMENT_CODES } from '@/shared/constants/system-documents';
import { useUnsavedChangesGuard } from '@/shared/hooks/useUnsavedChangesGuard';

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
    from_warehouse_id: '',
    from_warehouse_name: '',
    from_location_id: '',
    from_location_name: '',
    to_warehouse_id: '',
    to_warehouse_name: '',
    to_location_id: '',
    to_location_name: '',
    qty_ic: '',
    lot_id: '',
    lot_balance_id: '',
    lot_no: '',
    lot_available_qty: 0,
    stock_flag: 0,
    remark: '',
});

const DEFAULT_VALUES: TransferHeaderFormData = {
    transfer__req_no: 'ระบบจะกรอกอัตโนมัติ',
    docu_date: getTodayISO(),
    docu_item_no: '',
    branch_id: '',
    save_emp_id: '',
    transfer_emp_id: '',
    stock_effect_ic: 0,
    remark: '',
    cancelflag: 'N',
    cancle_remark: '',
    status: 'DRAFT',
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
        setValue,
        getValues,
        formState: { errors, isSubmitting },
    } = formMethods;

    // ── Field Array (Lines) ───────────────────────────────────────────────────────
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'lines',
        keyName: '_id',
    });

    // 🛡️ Unsaved Changes Guard
    const { handleCloseAttempt, blocker } = useUnsavedChangesGuard({
        isDirty: formMethods.formState.isDirty,
        enabled: isOpen,
        onSafeClose: onClose
    });

    // ── Load Master Data ─────────────────────────────────────────────────────────
    const { data: docLinks = [] } = useQuery({
        queryKey: ['doc-link-ic-options', SYSTEM_DOCUMENT_CODES.INVENTORY_TRANSFER_REQ],
        queryFn: () => TransferService.getDocLinks(SYSTEM_DOCUMENT_CODES.INVENTORY_TRANSFER_REQ),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    // ── IC Options ────────────────────────────────────────────────────────────────
    const watchedBranchId = useWatch({ control, name: 'branch_id' });
    const { icOptions } = useICOptions(watchedBranchId, SYSTEM_DOCUMENT_CODES.INVENTORY_TRANSFER_REQ);

    // ── Watch docu_item_no to update stock_effect_ic ──────────────────────────────
    const watchedDocuItemNo = useWatch({ control, name: 'docu_item_no' });

    useEffect(() => {
        if (!watchedDocuItemNo && docLinks.length > 0 && !isEditMode) {
            // Default to the first docLink if empty and creating a new document
            setValue('docu_item_no', String(docLinks[0].docu_type_id), { shouldValidate: true, shouldDirty: true });
        } else if (watchedDocuItemNo && docLinks.length > 0) {
            const selectedDoc = docLinks.find(d => String(d.docu_type_id) === String(watchedDocuItemNo));
            if (selectedDoc && selectedDoc.stock_effect_ic !== undefined) {
                let newEffect = Number(selectedDoc.stock_effect_ic);
                if (![-1, 0, 1].includes(newEffect)) {
                    newEffect = 0;
                }

                const currentEffect = getValues('stock_effect_ic');
                if (currentEffect !== newEffect) {
                    setValue('stock_effect_ic', newEffect, { shouldValidate: true, shouldDirty: true });
                }

                // Update stock_flag for lines
                const currentLines = getValues('lines') || [];
                currentLines.forEach((line, index) => {
                    if (Number(line.stock_flag) !== newEffect) {
                        setValue(`lines.${index}.stock_flag`, newEffect, { shouldValidate: true, shouldDirty: true });
                    }
                });
            }
        }
    }, [watchedDocuItemNo, docLinks, setValue, getValues, isEditMode]);

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
            const { header, lines: rawLines } = editData;
            const lines = Array.isArray(rawLines) ? rawLines : [];
            const allItemIds = [...new Set(lines.map(l => Number(l.item_id)).filter(id => id > 0))];

            const handleHydration = async () => {
                const conversionMap = new Map<number, UOMConversionListItem[]>();
                const itemMap = new Map<number, Record<string, unknown>>();
                const locMap = new Map<number, Record<string, unknown>>();
                const lotMap = new Map<number, Record<string, unknown>>();
                const balanceMap = new Map<string, number>();
                
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
                        logger.warn('[useTransferForm] items/UOM conversions load failed:', err);
                    }
                }

                try {
                    const { LocationService, LotNoService } = await import('@/modules/master-data/inventory/services/inventory-master.service');
                    const allFromLocIds = lines.map(l => Number(l.from_location_id)).filter(id => id > 0);
                    const allToLocIds = lines.map(l => Number(l.to_location_id)).filter(id => id > 0);
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

                    // Fetch actual balances for edit mode so users can increase quantity without fake errors
                    if (lines.length > 0) {
                        try {
                            const balancesList = await Promise.all(lines.map(async l => {
                                if (!l.item_id || !l.from_warehouse_id) return null;
                                const res = await ReservationInventoryService.getAvailableLots({
                                    item_id: l.item_id,
                                    warehouse_id: l.from_warehouse_id,
                                    location_id: l.from_location_id || undefined,
                                    q: l.lot_no || undefined,
                                    limit: 50
                                });
                                // Match by lot_id or lot_no
                                const lot = res?.items?.find(b => String(b.lot_no_id) === String(l.lot_id) || b.code === l.lot_no);
                                if (lot) {
                                    return { id: l.lot_id, qty: lot.qty_available ?? lot.sale_stock ?? 0 };
                                }
                                return null;
                            }));
                            balancesList.forEach(b => { if (b) balanceMap.set(String(b.id), Number(b.qty)); });
                        } catch (err) {
                            logger.warn('[useTransferForm] balance load failed:', err);
                        }
                    }
                } catch (err) {
                    logger.warn('[useTransferForm] location/lot load failed:', err);
                }
                let finalDocuItemNo = '';
                if (header.docu_item_no) {
                    const exactMatch = docLinks.find(d => String(d.docu_type_id) === String(header.docu_item_no));
                    if (exactMatch) {
                        finalDocuItemNo = String(exactMatch.docu_type_id);
                    } else if (header.doc_type_no !== undefined) {
                        // Fallback to matching by doc_type_no if ID doesn't exist in the dropdown
                        const typeMatch = docLinks.find(d => Number(d.docu_item_no) === Number(header.doc_type_no));
                        if (typeMatch) finalDocuItemNo = String(typeMatch.docu_type_id);
                        else finalDocuItemNo = String(header.docu_item_no);
                    } else {
                        finalDocuItemNo = String(header.docu_item_no);
                    }
                }

                reset({
                    transfer__req_id: header.transfer__req_id,
                    transfer__req_no: header.transfer__req_no,
                    docu_date: header.docu_date,
                    docu_item_no: finalDocuItemNo,
                    branch_id: header.branch_id,
                    save_emp_id: header.save_emp_id,
                    transfer_emp_id: header.transfer_emp_id,
                    stock_effect_ic: header.stock_effect_ic,
                    remark: header.remark ?? '',
                    cancelflag: header.cancelflag,
                    cancle_remark: header.cancle_remark ?? '',
                    status: header.status || 'DRAFT',
                    lines: lines.map((l, i) => {
                        const itemId = Number(l.item_id);
                        const convs = conversionMap.get(itemId) || [];
                        const currentUomVal = String(l.uom_id);
                        const matchedConv = convs.find(c => String(c.conversion_id) === currentUomVal);

                        const fromWhName = String((warehouses.find(w => String(w.id || (w as unknown as Record<string, unknown>).warehouse_id) === String(l.from_warehouse_id)) as unknown as Record<string, unknown>)?.warehouse_name || '');
                        const toWhName = String((warehouses.find(w => String(w.id || (w as unknown as Record<string, unknown>).warehouse_id) === String(l.to_warehouse_id)) as unknown as Record<string, unknown>)?.warehouse_name || '');

                        return {
                            _tempId: `edit-${l.transfer__req_id ?? i}`,
                            listno: l.listno ?? i + 1,
                            item_id: l.item_id,
                            item_code: l.item_code || String(itemMap.get(itemId)?.item_code || itemMap.get(itemId)?.item_no || ''),
                            item_name: l.item_name || String(itemMap.get(itemId)?.item_name || itemMap.get(itemId)?.item_desc || ''),
                            uom_id: matchedConv ? String(matchedConv.from_unit_id) : l.uom_id,
                            item_uom_id: matchedConv ? String(matchedConv.conversion_id) : l.uom_id,
                            from_warehouse_id: l.from_warehouse_id,
                            from_warehouse_name: l.from_warehouse_name || fromWhName,
                            from_location_id: l.from_location_id ?? '',
                            from_location_name: l.from_location_name || String(locMap.get(Number(l.from_location_id))?.name_th || ''),
                            to_warehouse_id: l.to_warehouse_id,
                            to_warehouse_name: l.to_warehouse_name || toWhName,
                            to_location_id: l.to_location_id ?? '',
                            to_location_name: l.to_location_name || String(locMap.get(Number(l.to_location_id))?.name_th || ''),
                            qty_ic: l.qty_ic,
                            lot_id: l.lot_id ?? '',
                            lot_balance_id: String(l.lot_balance_id || ''),
                            lot_no: String(l.lot_no || lotMap.get(Number(l.lot_id))?.code || lotMap.get(Number(l.lot_id))?.name_th || ''),
                            lot_available_qty: Number(balanceMap.get(String(l.lot_id)) ?? lotMap.get(Number(l.lot_id))?.qty_available ?? lotMap.get(Number(l.lot_id))?.sale_stock ?? l.qty_ic ?? 0) || 0,
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
                docu_item_no: docLinks.length > 0 ? String(docLinks[0].docu_type_id) : '',
                docu_date: getTodayISO(), 
                save_emp_id: user?.employee_id ? String(user.employee_id) : '',
                branch_id: user?.employee?.branch_id ? String(user.employee.branch_id) : '',
                lines: [createDefaultLine(1)] 
            });
        }
    }, [editData, editId, isOpen, reset, user, queryClient, warehouses, docLinks]);

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
            // Validate Stock against IC Options
            const invalidLines = data.lines.map((l, idx) => {
                if (!l.lot_id || !icOptions) return null;
                const qty = Number(l.qty_ic) || 0;
                const avail = Number(l.lot_available_qty) || 0;
                
                // Using dynamic import to prevent circular dependency issues at module load
                return import('@/shared/ic-option').then(({ validateStock }) => {
                    const res = validateStock(qty, avail, l.from_warehouse_id, l.from_location_id, icOptions);
                    return !res.isValid ? { index: idx + 1, message: res.message } : null;
                });
            });

            const validationResults = (await Promise.all(invalidLines)).filter(Boolean);
            if (validationResults.length > 0) {
                toast.error(`รายการที่ ${validationResults.map(r => r?.index).join(', ')}: ${validationResults[0]?.message}`);
                return;
            }

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
        [isEditMode, editId, createMutation, updateMutation, icOptions]
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
        onClose: handleCloseAttempt,
        blocker,

        fields,
        addLine,
        removeLine,
        updateLine,
        setValue,
        getValues,

        branches,
        docLinks,
        employees,
        projects,
        uoms,
        warehouses,
        icOptions,
    };
}
