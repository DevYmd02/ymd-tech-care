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
import { ICDocumentService } from '@/modules/Inventory/shared/services/ic-document.service';
import { UOMConversionService } from '@inventory/services/uom-conversion.service';
import type { UOMConversionListItem } from '@/modules/master-data/types/master-data-types';
import type { PendingReturnIssue } from '../types/return.types';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { LocationService, LotNoService } from '@master-data/inventory/services/inventory-master.service';
import { useICOptions } from '@/shared/ic-option';
import { SYSTEM_DOCUMENT_CODES } from '@/shared/constants/system-documents';

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
    item_uom_id: '',
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
    docu_item_no: '',
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
    pendingReturn?: PendingReturnIssue | null;
}

export function useReturnForm({ isOpen, onClose, editId, onSuccess, pendingReturn }: UseReturnFormOptions) {
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
        getValues,
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

    // ── Queries ───────────────────────────────────────────────────────────────────
    const { data: docLinks = [] } = useQuery({
        queryKey: ['doc-link-ic-options', 'RIS'],
        queryFn: () => ICDocumentService.getDocLinks('RIS'),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    // ── IC Options ────────────────────────────────────────────────────────────────
    const watchedBranchId = useWatch({ control, name: 'branch_id' });
    const { icOptions } = useICOptions(
        watchedBranchId,
        SYSTEM_DOCUMENT_CODES.INVENTORY_RETURN_ISSUE
    );

    // ── Watch docu_item_no to update stock_effect_ic ──────────────────────────────
    const watchedDocuItemNo = useWatch({ control, name: 'docu_item_no' });

    useEffect(() => {
        if (watchedDocuItemNo && docLinks.length > 0) {
            const selectedDoc = docLinks.find(d => String(d.docu_type_id) === String(watchedDocuItemNo) || String(d.docu_item_no) === String(watchedDocuItemNo));
            if (selectedDoc && selectedDoc.stock_effect_ic !== undefined) {
                // Ensure stock_effect_ic is a valid number: -1, 0, or 1
                let newEffect = Number(selectedDoc.stock_effect_ic);
                if (![-1, 0, 1].includes(newEffect)) {
                    newEffect = 1; // Default to 1 for return
                }

                const currentEffect = getValues('stock_effect_ic');
                if (currentEffect !== newEffect) {
                    setValue('stock_effect_ic', newEffect, { shouldValidate: true, shouldDirty: true });
                }
                
                // Update stock_flag for all lines
                const currentLines = getValues('lines') || [];
                currentLines.forEach((line: ReturnIssueLineFormData, index: number) => {
                    if (Number(line.stock_flag) !== newEffect) {
                        setValue(`lines.${index}.stock_flag`, newEffect, { shouldValidate: true, shouldDirty: true });
                    }
                });
            }
        }
    }, [watchedDocuItemNo, docLinks, setValue, getValues]);

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
            const allItemIds = [...new Set(lines.map(l => Number(l.item_id)).filter(id => id > 0))];

            const handleHydration = async () => {
                const conversionMap = new Map<number, UOMConversionListItem[]>();
                const itemDetailsMap = new Map<number, { item_code?: string; item_name?: string; standard_cost?: number }>();
                const locationDetailsMap = new Map<number, { name_th?: string; name?: string }>();
                const lotDetailsMap = new Map<number, { code?: string; lot_no?: string }>();
                
                const allLocationIds = [...new Set(lines.map(l => Number(l.location_id)).filter(id => id > 0))];
                const allLotIds = [...new Set(lines.map(l => Number(l.lot_id)).filter(id => id > 0))];

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

                        const itemDetailsList = await Promise.all(
                            allItemIds.map(itemId =>
                                ItemMasterService.getById(itemId).then(res => ({ itemId, data: res }))
                            )
                        );
                        itemDetailsList.forEach(c => {
                            if (c.data) itemDetailsMap.set(c.itemId, c.data as unknown as Record<string, unknown>);
                        });
                        
                        if (allLocationIds.length > 0) {
                            const locationDetailsList = await Promise.all(
                                allLocationIds.map(locId =>
                                    LocationService.getById(locId).then(res => ({ locId, data: res }))
                                )
                            );
                            locationDetailsList.forEach(c => {
                                if (c.data) locationDetailsMap.set(c.locId, c.data as unknown as Record<string, unknown>);
                            });
                        }

                        if (allLotIds.length > 0) {
                            const lotDetailsList = await Promise.all(
                                allLotIds.map(lotId =>
                                    LotNoService.getById(lotId).then(res => ({ lotId, data: res }))
                                )
                            );
                            lotDetailsList.forEach(c => {
                                if (c.data) lotDetailsMap.set(c.lotId, c.data);
                            });
                        }
                    } catch (err) {
                        logger.warn('[useReturnForm] Hydration data load failed:', err);
                    }
                }

                reset({
                    docu_item_id: header.docu_item_id,
                    docu_item_no: header.docu_item_no || '',
                    issue_stock_id: (header as unknown as Record<string, unknown>).issue_stock_id as number | undefined,
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
                    lines: lines.map((l, i) => {
                        const itemId = Number(l.item_id);
                        const convs = conversionMap.get(itemId) || [];
                        const currentUomVal = String(l.uom_id);
                        const matchedConv = convs.find(c => String(c.conversion_id) === currentUomVal);
                        
                        const itemDetail = itemDetailsMap.get(itemId);
                        const locDetail = locationDetailsMap.get(Number(l.location_id));
                        const lotDetail = lotDetailsMap.get(Number(l.lot_id));
                        const matchedWarehouse = warehouses.find(w => String(w.warehouse_id) === String(l.warehouse_id));

                        return {
                            _tempId: `edit-${l.docu_item_id ?? i}`,
                            issue_stock_line_id: (l as unknown as Record<string, unknown>).issue_stock_line_id as number | undefined,
                            listno: l.listno ?? i + 1,
                            item_id: l.item_id,
                            item_code: l.item_code || itemDetail?.item_code || '',
                            item_name: l.item_name || itemDetail?.item_name || '',
                            uom_id: matchedConv ? String(matchedConv.from_unit_id) : l.uom_id,
                            item_uom_id: matchedConv ? String(matchedConv.conversion_id) : l.uom_id,
                            warehouse_id: l.warehouse_id,
                            warehouse_name: l.warehouse_name || matchedWarehouse?.warehouse_name || '',
                            location_id: l.location_id ?? '',
                            location_name: l.location_name || locDetail?.name_th || locDetail?.name || '',
                            qty_ic: l.qty_ic,
                            qty_return_ic: l.qty_return_ic,
                            lot_id: l.lot_id ?? '',
                            lot_balance_id: (l as unknown as Record<string, unknown>).lot_balance_id as number | undefined,
                            lot_no: l.lot_no || lotDetail?.code || lotDetail?.lot_no || '',
                            unit_cost: Number(l.unit_cost) || Number(itemDetail?.standard_cost) || 0,
                            good_amnt: Number(l.good_amnt) || (Number(l.qty_return_ic) * (Number(l.unit_cost) || Number(itemDetail?.standard_cost) || 0)),
                            standard_buy_price: l.standard_buy_price ?? 0,
                            standard_cost: l.standard_cost ?? itemDetail?.standard_cost ?? 0,
                            stock_flag: l.stock_flag ?? 1,
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
    }, [editData, editId, isOpen, reset, user, warehouses]);

    // ── Hydrate from Pending Return (Confirmed Issue Stock) ───────────────────────
    useEffect(() => {
        if (!pendingReturn || editId || !isOpen) return;

        const handlePendingHydration = async () => {
            const lines = pendingReturn.issueStockLines || [];
            const allItemIds = [...new Set(lines.map(l => Number(l.item_id)).filter(id => id > 0))];

            const conversionMap = new Map<number, UOMConversionListItem[]>();
            const itemMap = new Map<number, { item_code?: string; item_name?: string; standard_cost?: number }>();
            const locMap = new Map<number, { name_th?: string; code?: string; name?: string }>();
            const lotMap = new Map<number, { code?: string; lot_no?: string }>();

            if (allItemIds.length > 0) {
                try {
                    const [itemsList, convsList] = await Promise.all([
                        Promise.all(allItemIds.map(id => ItemMasterService.getById(id))),
                        Promise.all(
                            allItemIds.map(itemId =>
                                UOMConversionService.getByItemId(itemId).then(res => ({ itemId, items: res?.items || [] }))
                            )
                        ),
                    ]);
                    itemsList.forEach(itm => { if (itm) itemMap.set(Number((itm as { item_id?: number | string; id?: number | string }).item_id || (itm as { id?: number | string }).id), itm as { item_code?: string; item_name?: string; standard_cost?: number }); });
                    convsList.forEach(c => {
                        if (c) conversionMap.set(c.itemId, c.items);
                    });
                } catch (err) {
                    console.warn('[useReturnForm] pendingHydration items/UOM load failed:', err);
                }
            }

            let autoDocuItemNo = '';
            try {
                const allLocIds = [...new Set(lines.map(l => Number(l.location_id)).filter(id => id > 0))];
                const allLotIds = [...new Set(lines.map(l => Number(l.lot_id)).filter(id => id > 0))];

                const [locsList, lotsList, links] = await Promise.all([
                    Promise.all(allLocIds.map(id => LocationService.getById(id))),
                    Promise.all(allLotIds.map(id => LotNoService.getById(id))),
                    ICDocumentService.getDocLinks('RIS')
                ]);
                locsList.forEach(loc => { if (loc) locMap.set(Number((loc as { id?: number | string }).id), loc as { name_th?: string; code?: string; name?: string }); });
                lotsList.forEach(lot => { if (lot) lotMap.set(Number((lot as { id?: number | string }).id), lot as { code?: string; lot_no?: string }); });
                
                if (links && links.length > 0) {
                    const matchedDoc = links.find(d => Number(d.docu_item_no) === Number(pendingReturn.doc_type_no));
                    if (matchedDoc) {
                        autoDocuItemNo = String(matchedDoc.docu_type_id);
                    }
                }
            } catch (err) {
                console.warn('[useReturnForm] location/lot/docLinks load failed:', err);
            }

            reset({
                ...DEFAULT_VALUES,
                docu_date: getTodayISO(),
                save_emp_id: user?.employee_id ? String(user.employee_id) : '',
                branch_id: String(pendingReturn.branch_id || user?.employee?.branch_id || ''),
                emp_dept_id: String(pendingReturn.emp_dept_id || ''),
                job_id: String(pendingReturn.project_id || ''),
                issue_stk_no: pendingReturn.issue_stock_no || '',
                docu_item_no: autoDocuItemNo,
                remark: pendingReturn.remarks || '',
                issue_stock_id: pendingReturn.issue_stock_id,
                lines: lines.map((line, i) => {
                    const itemId = Number(line.item_id);
                    const item = itemMap.get(itemId);
                    const location = locMap.get(Number(line.location_id));
                    const lot = lotMap.get(Number(line.lot_id));
                    const convs = conversionMap.get(itemId) || [];
                    const currentUomVal = String(line.uom_id);
                    const matchedConv = convs.find(c => String(c.conversion_id) === currentUomVal);

                    const matchedWarehouse = warehouses.find(
                        w => String((w as unknown as Record<string, unknown>).warehouse_id) === String(line.warehouse_id)
                    );
                    const warehouseName = (matchedWarehouse as unknown as { warehouse_name?: string })?.warehouse_name ?? '';

                    return {
                        ...createDefaultLine(i + 1),
                        issue_stock_line_id: line.issue_stock_line_id,
                        item_id: String(line.item_id ?? ''),
                        item_code: item?.item_code ?? '',
                        item_name: item?.item_name ?? '',
                        uom_id: matchedConv ? String(matchedConv.from_unit_id) : String(line.uom_id ?? ''),
                        item_uom_id: matchedConv ? String(matchedConv.conversion_id) : String(line.uom_id ?? ''),
                        warehouse_id: String(line.warehouse_id ?? ''),
                        warehouse_name: warehouseName,
                        location_id: String(line.location_id || ''),
                        location_name: location?.name_th || location?.code || '',
                        lot_id: String(line.lot_id || ''),
                        lot_no: lot?.code || '',
                        lot_balance_id: line.lot_balance_id,
                        qty_ic: Number(line.qty) || 0,
                        qty_return_ic: Number(line.qty) || 0,
                        unit_cost: Number(line.unit_cost_price) || Number(item?.standard_cost) || 0,
                        good_amnt: (Number(line.qty) || 0) * (Number(line.unit_cost_price) || Number(item?.standard_cost) || 0),
                        stock_flag: 1, // รับคืน = เพิ่มสต็อก
                    };
                }),
            });
        };

        void handlePendingHydration();
    }, [pendingReturn, editId, isOpen, reset, user, warehouses]);

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
            // Find selected docLink to get doc_type_no
            const selectedDoc = docLinks.find(d => String(d.docu_type_id) === String(data.docu_item_no));
            const docTypeNo = selectedDoc ? Number(selectedDoc.docu_item_no) : undefined;

            // Construct payload matching backend API (POST /return-stock)
            const payload: Record<string, unknown> = {
                issue_stock_id: pendingReturn ? Number(pendingReturn.issue_stock_id) : (data.issue_stock_id ? Number(data.issue_stock_id) : undefined),
                return_stock_date: new Date(data.docu_date).toISOString(),
                created_by_emp_id: Number(data.save_emp_id),
                received_by_emp_id: Number(data.rece_emp_id),
                doc_link_ic_id: data.docu_item_no ? Number(data.docu_item_no) : undefined,
                doc_type_no: docTypeNo,
                emp_dept_id: Number(data.emp_dept_id),
                project_id: Number(data.job_id),
                remarks: data.remark || '',
                branch_id: Number(data.branch_id),
                status: 'COMFIRMED',
                lines: (data.lines || []).map((l: ReturnIssueLineFormData) => ({
                    issue_stock_line_id: l.issue_stock_line_id ? Number(l.issue_stock_line_id) : undefined,
                    item_id: Number(l.item_id),
                    qty: Number(l.qty_return_ic),
                    uom_id: Number(l.item_uom_id || l.uom_id),
                    warehouse_id: Number(l.warehouse_id),
                    location_id: l.location_id ? Number(l.location_id) : undefined,
                    lot_id: l.lot_id ? Number(l.lot_id) : undefined,
                    lot_balance_id: l.lot_balance_id ? Number(l.lot_balance_id) : undefined,
                    unit_cost_price: Number(l.unit_cost) || 0,
                })),
            };

            try {
                if (isEditMode && editId) {
                    await updateMutation.mutateAsync({ id: editId, data: payload as ReturnIssueHeaderFormData });
                } else {
                    await createMutation.mutateAsync(payload as ReturnIssueHeaderFormData);
                }
            } catch (error) {
                logger.error('[ReturnForm] Submit failed:', error);
            }
        },
        [isEditMode, editId, createMutation, updateMutation, docLinks, pendingReturn]
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
        docLinks,
        icOptions,
    };
}
