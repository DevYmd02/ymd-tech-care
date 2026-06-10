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
import { useForm, useFieldArray, useWatch, type Resolver, type DefaultValues, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils';

import { requisitionHeaderSchema } from '../schemas/requisition.schemas';
import type { RequisitionHeaderFormData, RequisitionLineFormData } from '../schemas/requisition.schemas';
import { RequisitionService } from '../services/requisition.service';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';

import { UOMConversionService } from '@inventory/services/uom-conversion.service';
import type { UOMConversionListItem } from '@/modules/master-data/types/master-data-types';
import { ItemMasterService } from '@master-data/inventory/services/item-master.service';
import { LocationService } from '@master-data/inventory/services/inventory-master.service';
import type { Location } from '@master-data/inventory/types/inventory-master.types';
import api from '@/core/api/api';

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
    item_uom_id: '',
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
    created_by_emp_id: '',
    request_by_emp_id: '',
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

    const { data: uoms = [] } = useQuery({
        queryKey: ['uoms-options'],
        queryFn: () => MasterDataService.getUOMs(),
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
            const allItemIds = [...new Set(lines.map(l => Number(l.item_id)).filter(id => id > 0))];

            const handleHydration = async () => {
                const conversionMap = new Map<number, UOMConversionListItem[]>();
                const itemDetailsMap = new Map<number, { item_code: string; item_name: string }>();
                const locationMap = new Map<number, Location[]>();
                const lotMap = new Map<number, { lot_id: number; lot_no: string }>();

                try {
                    const uniqueWhIds = [...new Set(lines.map(l => Number(l.warehouse_id)).filter(id => id > 0))];
                    const uniqueLotIds = [...new Set(lines.map(l => Number(l.lot_id)).filter(id => id > 0))];

                    const [convsList, itemDetailsList, warehousesList, locsList, lotsList] = await Promise.all([
                        Promise.all(
                            allItemIds.map(itemId =>
                                UOMConversionService.getByItemId(itemId).then(res => ({ itemId, items: res?.items || [] }))
                            )
                        ),
                        Promise.all(
                            allItemIds.map(itemId =>
                                ItemMasterService.getById(itemId).then(res => ({
                                    itemId,
                                    detail: res ? { item_code: res.item_code, item_name: res.item_name } : null
                                })).catch(() => ({ itemId, detail: null }))
                            )
                        ),
                        MasterDataService.getWarehouses().catch(() => []),
                        Promise.all(
                            uniqueWhIds.map(whId =>
                                LocationService.getAll({ warehouse_id: whId }).then(res => ({ whId, items: res?.items || [] })).catch(() => ({ whId, items: [] }))
                            )
                        ),
                        Promise.all(
                            uniqueLotIds.map(lotId =>
                                api.get<Record<string, unknown>>(`/item-lot/${lotId}`).then(res => {
                                    const raw = (res?.data || res) as Record<string, unknown> | undefined;
                                    return {
                                        lotId,
                                        detail: raw ? { lot_id: Number(raw.lot_no_id || raw.lot_id || 0), lot_no: String(raw.lot_no_code || raw.lot_no || '') } : null
                                    };
                                }).catch(() => ({ lotId: Number(lotId), detail: null }))
                            )
                        )
                    ]);

                    convsList.forEach(c => {
                        if (c) conversionMap.set(c.itemId, c.items);
                    });

                    itemDetailsList.forEach(item => {
                        if (item && item.detail) itemDetailsMap.set(item.itemId, item.detail);
                    });

                    locsList.forEach(l => {
                        if (l) locationMap.set(l.whId, l.items);
                    });

                    lotsList.forEach(lot => {
                        if (lot && lot.detail) lotMap.set(lot.lotId, lot.detail);
                    });

                    const h = header as unknown as Record<string, unknown>;
                    reset({
                        docu_item_id: header.docu_item_id,
                        docu_item_no: String(h.doc_link_ic_id || header.docu_item_no || ''),
                        issue_req_no: header.issue_req_no,
                        docu_date: typeof h.issue_req_date === 'string' ? h.issue_req_date.split('T')[0] : (header.docu_date || ''),
                        emp_dept_id: String(header.emp_dept_id || ''),
                        job_id: String(h.project_id || header.job_id || ''),
                        branch_id: String(header.branch_id || ''),
                        created_by_emp_id: String(header.created_by_emp_id || ''),
                        request_by_emp_id: String(header.request_by_emp_id || ''),
                        qty_total: header.qty_total,
                        stock_effect_ic: h.stock_effect_ic !== undefined && h.stock_effect_ic !== null ? Number(h.stock_effect_ic) : 0,
                        remark: typeof h.remarks === 'string' ? h.remarks : (header.remark ?? ''),
                        cancel_flag: header.cancel_flag,
                        cancel_date: header.cancel_date ?? null,
                        cancel_remark: header.cancel_remark ?? '',
                        lines: lines.map((l, i) => {
                            const itemId = Number(l.item_id);
                            const whId = Number(l.warehouse_id);
                            const locId = Number(l.location_id);
                            const lotId = Number(l.lot_id);

                            const convs = conversionMap.get(itemId) || [];
                            const currentUomVal = String(l.uom_id);
                            const matchedConv = convs.find(c => String(c.conversion_id) === currentUomVal);

                            const itemDetail = itemDetailsMap.get(itemId);
                            const matchedWh = warehousesList.find(w => Number(w.warehouse_id || w.id) === whId);
                            const locs = locationMap.get(whId) || [];
                            const matchedLoc = locs.find(loc => Number(loc.location_id || loc.id) === locId);
                            const matchedLot = lotMap.get(lotId);

                            const lineObj = l as unknown as Record<string, unknown>;
                            
                            let mappedQty: number | '' = '';
                            if (lineObj.qty !== undefined && lineObj.qty !== null && lineObj.qty !== '') {
                                mappedQty = Number(lineObj.qty);
                            } else if (l.qty_ic !== undefined && l.qty_ic !== null) {
                                mappedQty = Number(l.qty_ic);
                            }

                            // Fallback to nested relation objects if returned by backend API
                            const itemObj = (lineObj.item || lineObj.item_master || {}) as Record<string, unknown>;
                            const whObj = (lineObj.warehouse || lineObj.warehouse_master || {}) as Record<string, unknown>;
                            const locObj = (lineObj.location || lineObj.location_master || {}) as Record<string, unknown>;
                            const lotObj = (lineObj.lot || lineObj.item_lot || lineObj.lot_balance || {}) as Record<string, unknown>;

                            return {
                                _tempId: `edit-${l.docu_item_line_id ?? i}`,
                                docu_item_line_id: l.docu_item_line_id,
                                listno: l.listno ? Number(l.listno) : i + 1,
                                item_id: String(l.item_id),
                                item_code: l.item_code || itemDetail?.item_code || String(itemObj.item_code || itemObj.code || ''),
                                item_name: l.item_name || itemDetail?.item_name || String(itemObj.item_name || itemObj.name || ''),
                                uom_id: matchedConv ? String(matchedConv.from_unit_id) : String(l.uom_id),
                                item_uom_id: matchedConv ? String(matchedConv.conversion_id) : String(l.uom_id),
                                warehouse_id: String(l.warehouse_id),
                                warehouse_name: l.warehouse_name || matchedWh?.warehouse_name || String(whObj.warehouse_name || whObj.name || ''),
                                location_id: l.location_id ? String(l.location_id) : '',
                                location_name: l.location_name || matchedLoc?.name_th || matchedLoc?.code || String(locObj.location_name || locObj.name || ''),
                                lot_id: l.lot_id ? String(l.lot_id) : '',
                                lot_no: l.lot_no || matchedLot?.lot_no || String(lotObj.lot_no || lotObj.lot_number || lotObj.code || ''),
                                qty_ic: isNaN(Number(mappedQty)) ? '' : Number(mappedQty),
                                stock_flag: l.stock_flag ?? 0,
                                remark: l.remark || String(lineObj.remark || lineObj.remarks || ''),
                            };
                        }),
                    });
                } catch (err) {
                    logger.error('[useRequisitionForm] handleHydration failed:', err);
                }
            };
            void handleHydration();
        } else if (!editId && isOpen) {
            reset({ 
                ...DEFAULT_VALUES, 
                docu_date: getTodayISO(), 
                created_by_emp_id: user?.employee_id ? String(user.employee_id) : '1',
                branch_id: user?.employee?.branch_id ? String(user.employee.branch_id) : '1',
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
        async (data: RequisitionHeaderFormData) => {
            // Prepare payload matching Postman specs
            const payload: Record<string, unknown> = {
                issue_req_date: new Date(data.docu_date).toISOString(),
                doc_link_ic_id: Number(data.docu_item_no),
                emp_dept_id: Number(data.emp_dept_id),
                project_id: Number(data.job_id),
                remarks: data.remark || '',
                branch_id: Number(data.branch_id),
                created_by_emp_id: Number(data.created_by_emp_id) || 1,
                request_by_emp_id: Number(data.request_by_emp_id) || 1,
                status: isEditMode 
                    ? (
                        (editData as unknown as { header?: { status?: string } })?.header?.status === 'REJECTED'
                            ? 'PENDING'
                            : ((editData as unknown as { header?: { status?: string } })?.header?.status || 'DRAFT')
                      )
                    : 'DRAFT',
                stock_effect_ic: null,
                lines: (data.lines || []).map((l) => ({
                    item_id: Number(l.item_id),
                    qty: Number(l.qty_ic),
                    uom_id: Number(l.item_uom_id || l.uom_id),
                    warehouse_id: Number(l.warehouse_id),
                    location_id: l.location_id ? Number(l.location_id) : null,
                    lot_id: l.lot_id ? Number(l.lot_id) : null,
                    lot_balance_id: l.lot_id ? Number(l.lot_id) : null,
                }))
            };

            try {
                if (isEditMode && editId) {
                    await updateMutation.mutateAsync({ id: editId, data: payload as unknown as RequisitionHeaderFormData });
                } else {
                    await createMutation.mutateAsync(payload as unknown as RequisitionHeaderFormData);
                }
            } catch (error) {
                // Error is handled by mutation's onError
                logger.error('[RequisitionForm] Submit failed:', error);
            }
        },
        [isEditMode, editId, editData, createMutation, updateMutation]
    );

    const handleFormError = useCallback((errs: FieldErrors<RequisitionHeaderFormData>) => {
        console.warn('[RequisitionForm] Validation errors:', errs);
        const firstErrorKey = Object.keys(errs)[0] as keyof FieldErrors<RequisitionHeaderFormData> | undefined;
        if (firstErrorKey) {
            const err = errs[firstErrorKey];
            if (err && 'message' in err && err.message) {
                toast.error(`ข้อผิดพลาด: ${err.message as string}`);
                return;
            }
            if (Array.isArray(err)) {
                // For lines validation errors
                const firstLineErr = err.find(e => e) as Record<string, { message?: string }> | undefined;
                if (firstLineErr) {
                    const subKey = Object.keys(firstLineErr)[0];
                    if (subKey && firstLineErr[subKey]?.message) {
                        toast.error(`ข้อผิดพลาดในรายการ: ${firstLineErr[subKey].message}`);
                        return;
                    }
                }
            }
        }
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
        uoms,
    };
}
