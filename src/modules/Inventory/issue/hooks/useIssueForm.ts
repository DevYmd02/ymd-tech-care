/**
 * @file useIssueForm.ts
 * @description React Hook Form + Zod hook สำหรับ Stock Issue Form (ใบเบิก)
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch, type Resolver, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils';

import { issueStockHeaderSchema } from '../schemas/issue.schemas';
import type { IssueStockHeaderFormData, IssueStockLineFormData } from '../schemas/issue.schemas';
import { IssueStockService } from '../services/issue.service';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import { UOMConversionService } from '@inventory/services/uom-conversion.service';
import type { UOMConversionListItem } from '@/modules/master-data/types/master-data-types';
import type { PendingIssueStock } from '../types/issue.types';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { LocationService, LotNoService } from '@master-data/inventory/services/inventory-master.service';

// ====================================================================================
// HELPERS
// ====================================================================================

const getTodayISO = () => new Date().toISOString().split('T')[0];

const createDefaultLine = (listno: number): IssueStockLineFormData => ({
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
    unit_cost: '',
    good_amnt: 0,
    standard_buy_price: 0,
    standard_cost: 0,
    stock_flag: -1, // ลดสต็อก สำหรับใบเบิก
    remark: '',
});

const DEFAULT_VALUES: IssueStockHeaderFormData = {
    docu_item_no: '',
    appvissue_req_no: '',
    issue_stk_no: 'ระบบจะกรอกอัตโนมัติ',
    docu_date: getTodayISO(),
    emp_dept_id: '',
    job_id: '',
    branch_id: '',
    save_emp_id: '',
    received_by_emp_id: '',
    stock_effect_ic: -1, // ลดคลัง
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

interface UseIssueFormOptions {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
    pendingIssue?: PendingIssueStock | null;
}

export function useIssueForm({ isOpen, onClose, editId, onSuccess, pendingIssue }: UseIssueFormOptions) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isEditMode = !!editId;

    // ── Form Methods ──────────────────────────────────────────────────────────────
    const formMethods = useForm<IssueStockHeaderFormData>({
        resolver: zodResolver(issueStockHeaderSchema) as Resolver<IssueStockHeaderFormData>,
        defaultValues: DEFAULT_VALUES as DefaultValues<IssueStockHeaderFormData>,
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
            const qty = Number(line.qty_ic) || 0;
            const cost = Number(line.unit_cost) || 0;
            const lineTotal = parseFloat((qty * cost).toFixed(4));
            
            if (line.good_amnt !== lineTotal) {
                setValue(`lines.${index}.good_amnt`, lineTotal);
            }
            total += lineTotal;
        });

        setValue('amnt_total', parseFloat(total.toFixed(4)));
    }, [watchedLines, setValue]);

    // ── Load Master Data ─────────────────────────────────────────────────────────
    const { data: docLinks = [] } = useQuery({
        queryKey: ['doc-link-ic-options', 'ISSUE_STOCK'],
        queryFn: () => IssueStockService.getDocLinks('ISSUE_STOCK'),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    // ── Watch docu_item_no to update stock_effect_ic ──────────────────────────────
    const watchedDocuItemNo = useWatch({ control, name: 'docu_item_no' });

    useEffect(() => {
        if (watchedDocuItemNo && docLinks.length > 0) {
            const selectedDoc = docLinks.find(d => String(d.docu_type_id) === String(watchedDocuItemNo) || String(d.docu_item_no) === String(watchedDocuItemNo));
            if (selectedDoc && selectedDoc.stock_effect_ic !== undefined) {
                // Ensure stock_effect_ic is a valid number: -1, 0, or 1
                let newEffect = Number(selectedDoc.stock_effect_ic);
                if (![-1, 0, 1].includes(newEffect)) {
                    newEffect = -1; // Default to -1 if invalid
                }

                const currentEffect = getValues('stock_effect_ic');
                if (currentEffect !== newEffect) {
                    setValue('stock_effect_ic', newEffect, { shouldValidate: true, shouldDirty: true });
                }
                
                // Update stock_flag for all lines to match, without triggering infinite re-renders
                const currentLines = getValues('lines') || [];
                currentLines.forEach((line, index) => {
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
        queryKey: ['issue-stock', editId],
        queryFn: () => (editId ? IssueStockService.getById(editId) : null),
        enabled: !!editId && isOpen,
    });

    useEffect(() => {
        if (editData) {
            const { header, lines } = editData;
            const allItemIds = [...new Set((lines || []).map(l => Number(l.item_id)).filter(id => id > 0))];

            const handleHydration = async () => {
                const conversionMap = new Map<number, UOMConversionListItem[]>();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const itemMap = new Map<number, any>();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const locMap = new Map<number, any>();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lotMap = new Map<number, any>();

                if (allItemIds.length > 0) {
                    try {
                        const itemsList = await Promise.all(allItemIds.map(id => ItemMasterService.getById(id)));
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        itemsList.forEach(itm => { if (itm) itemMap.set(Number((itm as any).item_id || (itm as any).id), itm); });

                        const convsList = await Promise.all(
                            allItemIds.map(itemId =>
                                UOMConversionService.getByItemId(itemId).then(res => ({ itemId, items: res?.items || [] }))
                            )
                        );
                        convsList.forEach(c => {
                            if (c) conversionMap.set(c.itemId, c.items);
                        });
                    } catch (err) {
                        logger.warn('[useIssueForm] UOM conversions / items load failed:', err);
                    }
                }

                try {
                    const allLocIds = [...new Set((lines || []).map(l => Number(l.location_id)).filter(id => id > 0))];
                    const allLotIds = [...new Set((lines || []).map(l => Number(l.lot_id)).filter(id => id > 0))];
                    
                    const locsList = await Promise.all(allLocIds.map(id => LocationService.getById(id)));
                    locsList.forEach(loc => { if (loc) locMap.set(Number(loc.id), loc); });
                    
                    const lotsList = await Promise.all(allLotIds.map(id => LotNoService.getById(id)));
                    lotsList.forEach(lot => { if (lot) lotMap.set(Number(lot.id), lot); });
                } catch (err) {
                    logger.warn('[useIssueForm] location/lot load failed:', err);
                }

                const getValidId = (v: unknown) => (v !== null && v !== undefined && v !== '') ? String(v) : null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let docuItemNoVal = getValidId((header as any).doc_type_no) ?? getValidId((header as any).doc_link_ic_id) ?? getValidId(header.docu_item_no) ?? '';
                console.log('[DEBUG] useIssueForm docuItemNoVal before:', docuItemNoVal);
                console.log('[DEBUG] useIssueForm docLinks:', docLinks);
                if (docLinks?.length) {
                    // Match by UUID or old index-based value and set it to UUID so the <select> matches
                    const matchedDoc = docLinks.find(d => String(d.docu_type_id) === docuItemNoVal || String(d.docu_item_no) === docuItemNoVal);
                    console.log('[DEBUG] useIssueForm matchedDoc:', matchedDoc);
                    if (matchedDoc) {
                        docuItemNoVal = String(matchedDoc.docu_type_id);
                        console.log('[DEBUG] useIssueForm docuItemNoVal after:', docuItemNoVal);
                    }
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let appvReqNoVal = String(header.appvissue_req_no || (header as any).appv_issue_req_no || (header as any).ref_doc_no || '');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const issueDocId = getValidId((header as any).doc_type_no) ?? getValidId((header as any).doc_link_ic_id) ?? getValidId(header.docu_item_no) ?? '';
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const docLink = docLinks.find((d: any) => String(d.docu_type_id) === issueDocId || String(d.docu_item_no) === issueDocId);
                const docName = docLink ? (docLink.docu_name_th || docLink.docu_name_en || '') : '';
                console.log('[DEBUG] useIssueForm issue.service item:', header.issue_stk_no, 'issueDocId:', issueDocId, 'docName:', docName);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let issueReqNoVal = String(header.issue_req_no || (header as any).ref_req_no || '');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const appvReqId = (header as any).appv_issue_req_id || (header as any).appvissue_req_id || (header as any).ref_doc_id;
                
                if ((!appvReqNoVal || !issueReqNoVal) && appvReqId) {
                    const reqNos = await IssueStockService.getReqNos(appvReqId as string | number);
                    if (!appvReqNoVal) appvReqNoVal = reqNos.appvReqNo;
                    if (!issueReqNoVal) issueReqNoVal = reqNos.issueReqNo;
                }

                reset({
                    docu_item_id: header.docu_item_id,
                    docu_item_no: docuItemNoVal,
                    appvissue_req_no: appvReqNoVal,
                    issue_req_no: issueReqNoVal,
                    issue_stk_no: header.issue_stk_no,
                    docu_date: header.docu_date,
                    emp_dept_id: header.emp_dept_id,
                    job_id: header.job_id,
                    branch_id: header.branch_id,
                    save_emp_id: header.save_emp_id,
                    received_by_emp_id: header.received_by_emp_id || '',
                    stock_effect_ic: header.stock_effect_ic,
                    amnt_total: header.amnt_total,
                    remark: header.remark ?? '',
                    cancel_flag: header.cancel_flag,
                    cancel_date: header.cancel_date ?? null,
                    cancel_remark: header.cancel_remark ?? '',
                    lines: (lines || []).map((l, i) => {
                        const itemId = Number(l.item_id);
                        const convs = conversionMap.get(itemId) || [];
                        const currentUomVal = String(l.uom_id);
                        const matchedConv = convs.find(c => String(c.conversion_id) === currentUomVal);

                        return {
                            _tempId: `edit-${l.docu_item_id ?? i}`,
                            listno: l.listno ?? i + 1,
                            item_id: l.item_id,
                            item_code: l.item_code || String(itemMap.get(itemId)?.item_code || ''),
                            item_name: l.item_name || String(itemMap.get(itemId)?.item_name || ''),
                            uom_id: matchedConv ? String(matchedConv.from_unit_id) : l.uom_id,
                            item_uom_id: matchedConv ? String(matchedConv.conversion_id) : l.uom_id,
                            warehouse_id: l.warehouse_id,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            warehouse_name: l.warehouse_name || warehouses.find(w => String(w.id || (w as any).warehouse_id) === String(l.warehouse_id))?.warehouse_name || '',
                            location_id: l.location_id ?? '',
                            location_name: l.location_name || String(locMap.get(Number(l.location_id))?.name_th || ''),
                            lot_id: l.lot_id ?? '',
                            lot_no: l.lot_no || lotMap.get(Number(l.lot_id))?.code || lotMap.get(Number(l.lot_id))?.name_th || '',
                            qty_ic: l.qty_ic,
                            unit_cost: Number(l.unit_cost) >= 0 ? Number(l.unit_cost) : 0,
                            good_amnt: l.good_amnt,
                            standard_buy_price: l.standard_buy_price ?? 0,
                            standard_cost: l.standard_cost ?? 0,
                            stock_flag: l.stock_flag ?? -1,
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
    }, [editData, editId, isOpen, reset, user, docLinks, warehouses]);

    useEffect(()=>{
        if (!pendingIssue || editId || !isOpen) return;

        const handlePendingHydration = async () => {
            const lines = pendingIssue.appvissueRequistionLines;
            const allItemIds = [...new Set((lines || []).map(l => Number(l.item_id)).filter(id => id > 0))];

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
                    console.warn('[useIssueForm] pendingHydration UOM conversions load failed:', err);
                }
            }

        // Fetch item details ทุก item พร้อมกัน
       const [ itemDetails, locationDetails, lotDetails] = await Promise.all([
        Promise.allSettled(
            lines.map(line => ItemMasterService.getById(Number(line.item_id)))
        ),
        Promise.allSettled(
            lines.map(line =>
                line.location_id 
                ? LocationService.getById(Number(line.location_id)): Promise.resolve(null))
        ),
        Promise.allSettled(
            lines.map(line => 
                line.lot_id 
                ? LotNoService.getById(Number(line.lot_id)): Promise.resolve(null))
        )
       ])

        const getValidId = (v: unknown) => (v !== null && v !== undefined && v !== '') ? String(v) : null;
        let pendingDocuItemNo = getValidId(pendingIssue.doc_type_no) ?? getValidId(pendingIssue.doc_link_ic_id) ?? '';
        if (docLinks?.length && pendingDocuItemNo) {
            const matchedDoc = docLinks.find(d => String(d.docu_type_id) === pendingDocuItemNo || String(d.docu_item_no) === pendingDocuItemNo);
            if (matchedDoc) {
                pendingDocuItemNo = String(matchedDoc.docu_type_id);
            }
        }

        const pendingData = pendingIssue as unknown as Record<string, unknown>;

        reset({
        ...DEFAULT_VALUES,
        docu_date: getTodayISO(),
        save_emp_id: user?.employee_id ? String(user.employee_id) : '',
        docu_item_no: pendingDocuItemNo,
        branch_id: String(pendingIssue.branch_id || ''),
        emp_dept_id: String(pendingIssue.emp_dept_id || ''),
        job_id: String(pendingIssue.project_id || ''),
        appvissue_req_no: pendingIssue.appv_issue_req_no,
        issue_req_no: String(pendingData.issue_req_no || pendingData.ref_req_no || pendingData.ref_doc_no || ''),
        appv_issue_req_id: pendingIssue.appv_issue_req_id,
        doc_link_ic_id: pendingIssue.doc_link_ic_id,
        remark: pendingIssue.remarks || '',
        lines: lines.map((line, i) => {
                //  ใช้ itemDetails ที่ fetch มาแล้ว
                const item = itemDetails[i].status === 'fulfilled' ? itemDetails[i].value : null;
                const location = locationDetails[i].status === 'fulfilled' ? locationDetails[i].value : null;
                const lot = lotDetails[i].status === 'fulfilled' ? lotDetails[i].value : null;

                //  หา warehouse_name จาก warehouses state
                const matchedWarehouse = warehouses.find(
                    w => String((w as unknown as Record<string, unknown>).warehouse_id) === String(line.warehouse_id)
                );
                const warehouseName = (matchedWarehouse as unknown as { warehouse_name?: string })?.warehouse_name ?? '';

                const itemId = Number(line.item_id);
                const convs = conversionMap.get(itemId) || [];
                const currentUomVal = String(line.uom_id);
                const matchedConv = convs.find(c => String(c.conversion_id) === currentUomVal);

                return {
                    ...createDefaultLine(i + 1),
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
                    lot_balance_id: line.lot_balance_id,
                    lot_no: lot?.code || '',
                    qty_ic: (line.approved_qty || line.qty || '') as number | '',
                    unit_cost: 0,   
                    appvissue_req_line_id: line.appvissue_req_line_id || undefined,
                };
            }),
        });
    };

    void handlePendingHydration();
        
    }, [pendingIssue, editId, isOpen, reset, user, warehouses, docLinks]);

    // ── Mutations ─────────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mutationFn: (data: any) =>
            IssueStockService.create(data),
        onSuccess: (result) => {
            if (result.success) {
                toast.success('บันทึกใบเบิกสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['issue-stocks'] });
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.message || 'เกิดข้อผิดพลาด');
            }
        },
        onError: () => toast.error('เกิดข้อผิดพลาดในการบันทึก'),
    });

    const updateMutation = useMutation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            IssueStockService.update(id, data),
        onSuccess: (result) => {
            if (result.success) {
                toast.success('แก้ไขใบเบิกสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['issue-stocks'] });
                queryClient.invalidateQueries({ queryKey: ['issue-stock', editId] });
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
        async (data: IssueStockHeaderFormData) => {
            // Find selected docLink to ensure doc_link_ic_id is set
            let docLinkIcId = data.doc_link_ic_id;
            if (!docLinkIcId && docLinks && docLinks.length > 0) {
                const selectedDoc = docLinks.find(d => String(d.docu_type_id) === String(data.docu_item_no) || String(d.docu_item_no) === String(data.docu_item_no));
                if (selectedDoc) docLinkIcId = Number(selectedDoc.docu_type_id);
            }

            // Construct payload according to backend API requirements
            const payload = {
                issue_stock_date: new Date(data.docu_date).toISOString(),
                branch_id: Number(data.branch_id),
                appv_issue_req_id: data.appv_issue_req_id ? Number(data.appv_issue_req_id) : undefined,
                created_by_emp_id: Number(data.save_emp_id),
                received_by_emp_id: Number(data.received_by_emp_id),
                doc_link_ic_id: Number(docLinkIcId),
                emp_dept_id: Number(data.emp_dept_id),
                project_id: Number(data.job_id),
                remarks: data.remark || '',
                status: 'CONFIRMED',
                lines: (data.lines || []).map((l: IssueStockLineFormData) => ({
                    appvissue_req_line_id: l.appvissue_req_line_id ? Number(l.appvissue_req_line_id) : undefined,
                    item_id: Number(l.item_id),
                    qty: Number(l.qty_ic),
                    uom_id: Number(l.item_uom_id || l.uom_id),
                    warehouse_id: Number(l.warehouse_id),
                    location_id: l.location_id ? Number(l.location_id) : undefined,
                    lot_id: l.lot_id ? Number(l.lot_id) : undefined,
                    lot_balance_id: l.lot_balance_id ? Number(l.lot_balance_id) : undefined,
                    unit_cost_price: Number(l.unit_cost) || 0,
                }))
            };

            try {
                if (isEditMode && editId) {
                    await updateMutation.mutateAsync({ id: editId, data: payload });
                } else {
                    await createMutation.mutateAsync(payload);
                }
            } catch (error) {
                logger.error('[IssueForm] Submit failed:', error);
            }
        },
        [isEditMode, editId, createMutation, updateMutation, docLinks]
    );

    const handleFormError = useCallback((errs: unknown) => {
        console.warn('[IssueForm] Validation errors:', errs);
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
        (index: number, field: keyof IssueStockLineFormData | null, value: IssueStockLineFormData | unknown) => {
            if (field === null) {
                update(index, value as IssueStockLineFormData);
            } else {
                const current = fields[index];
                update(index, { ...current, [field]: value } as IssueStockLineFormData);
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
        docLinks,
        employees,
        projects,
        uoms,
        warehouses,
    };
}
