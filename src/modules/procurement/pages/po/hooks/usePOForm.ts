import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useBranches, useUnits, useCurrencies, useTaxCodes } from '@/modules/master-data/hooks/useMasterData';
import { useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import type { Resolver, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { POService } from '@/modules/procurement/services';
import { POFormSchema, type POFormData, type ItemSelectorResult } from '@/modules/procurement/schemas/po-schemas'; 
import { usePOHydration } from './usePOHydration';
import { usePOCalculations } from './usePOCalculations';
import { usePOActions } from './usePOActions';
import type { VendorSearchItem } from '@/modules/master-data/vendor/types/vendor-types';
import type { PRHeader } from '@/modules/procurement/types/pr-types';
import type { Currency } from '@/modules/master-data/types/master-data-types';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { useUnsavedChangesGuard } from '@/shared/hooks/useUnsavedChangesGuard';
import { UOMConversionService } from '@/modules/master-data/inventory/services/uom-conversion.service';


// ====================================================================================
// CONFIG
// ====================================================================================

interface UsePOFormOptions {
    isOpen:         boolean;
    onClose:        () => void;
    onSuccess?:     () => void;
    poId?:          number; // Handle numeric ID
    initialValues?: Partial<POFormData>;
    isViewMode?:    boolean;
}

// ====================================================================================
// HOOK
// ====================================================================================

export const usePOForm = ({
    isOpen,
    onClose,
    onSuccess,
    poId,
    initialValues,
    isViewMode = false,
}: UsePOFormOptions) => {
    const { toast } = useToast();
    const { user } = useAuth();

    // ── UI state ──────────────────────────────────────────────────────────────
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isQCModalOpen, setIsQCModalOpen]         = useState(false);
    const [isPRModalOpen, setIsPRModalOpen]         = useState(false);
    const [isHydrating, setIsHydrating] = useState(false);
    const isInitialResetDone = useRef(false);
    const isSourceHydrated = useRef(false);
    const docAbortControllerRef = useRef<AbortController | null>(null);

    // ── Helper ──────────────────────────────────────────────────────────────
    const cleanD = (d: string | Date | null | undefined) => (typeof d === 'string' && d.includes('T')) ? d.split('T')[0] : d as string;
    
    // ── Master Data Queries (Shared Hooks) ──────────────────────────────────
    const { data: branches = [],   isLoading: isLoadingBranches }   = useBranches(isOpen);
    const { data: taxCodesData = [], isLoading: isLoadingTaxCodes } = useTaxCodes(isOpen);
    const taxCodes = (taxCodesData as unknown as { data: TaxCode[] })?.data || (taxCodesData as TaxCode[]); 
    
    const { data: uomsResponse,   isLoading: isLoadingUoms }      = useUnits(isOpen);
    const uoms = useMemo(() => uomsResponse?.items || [], [uomsResponse]);
    
    const { data: currenciesResponse, isLoading: isLoadingCurrencies } = useCurrencies(isOpen);
    const currencies = useMemo(() => (currenciesResponse as unknown as { data: Currency[] })?.data || (currenciesResponse as unknown as { items: Currency[] })?.items || (currenciesResponse as Currency[]) || [], [currenciesResponse]);

    // ── Form ──────────────────────────────────────────────────────────────────
    const formMethods = useForm<POFormData>({
        resolver: zodResolver(POFormSchema) as Resolver<POFormData>,
        defaultValues: {
            po_no: undefined,
            po_date: new Date().toISOString().split('T')[0],
            qc_id: undefined,
            qc_no: undefined,
            pr_id: undefined,
            pr_no: undefined,
            vendor_id: undefined,
            vendor_name: undefined,
            branch_id: undefined,
            ship_to_warehouse_id: undefined,
            is_multicurrency: true,
            currency_code: 'THB',
            target_currency: 'THB',
            exchange_rate_date: new Date().toISOString().split('T')[0],
            exchange_rate: 1,
            base_currency_code: 'THB',
            quote_currency_code: 'THB',
            payment_term_days: 30,
            delivery_date: '',
            remarks: '',
            tax_code_id: undefined,
            created_by_name: user?.employee?.employee_fullname || user?.username || '',
            po_lines: [],
        },
    });

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        getValues,
        trigger,
        formState: { errors, isDirty },
    } = formMethods;

    const { fields, append, remove, replace, update } = useFieldArray({ control, name: 'po_lines' });

    // ── Watch Values ────────────────────────────────────────────────────────
    const watchIsMulticurrency = useWatch({ control, name: 'is_multicurrency' });
    const watchCurrencyCode    = useWatch({ control, name: 'currency_code' }) as string | undefined;
    const watchTargetCurrency  = useWatch({ control, name: 'target_currency' }) as string | undefined;
    const watchHeaderTaxCodeId = useWatch({ control, name: 'tax_code_id' });
    const watchVendorName      = useWatch({ control, name: 'vendor_name' });
    const watchPrNo            = useWatch({ control, name: 'pr_no' });

    // ── Existing PO Detail Query ─────────────────────────────────────────────
    const { data: existingPO, isLoading: isLoadingPO } = useQuery({
        queryKey: ['existing-po', poId],
        queryFn: async () => {
            if (!poId) return null;
            return await POService.getById(poId);
        },
        enabled: isOpen && !!poId
    });

    useEffect(() => {
        setIsHydrating(isLoadingPO);
    }, [isLoadingPO]);

    // ── Sub-Hooks (Modularized Logic) ───────────────────────────────────────
    
    // 1. Calculations & Propagation
    usePOCalculations({
        formMethods,
        currencies,
        watchIsMulticurrency,
        watchCurrencyCode,
        watchTargetCurrency,
        watchHeaderTaxCodeId
    });

    // 2. Actions (Save, Update, Delete)
    const {
        isSubmitting,
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        handleConfirmSave,
        onSubmit
    } = usePOActions({
        poId,
        user,
        formMethods,
        existingPO,
        onClose,
        onSuccess,
        toast
    });

    // 3. Hydration (Source Mapping)
    const { hydrateFromSource } = usePOHydration({
        setValue,
        getValues,
        replace,
        trigger,
        toast
    });

    // ── Default Currency Sync ─────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen || poId || isHydrating) return;
        if (!getValues('currency_code')) setValue('currency_code', 'THB', { shouldDirty: false });
        if (!getValues('target_currency')) setValue('target_currency', 'THB', { shouldDirty: false });
    }, [isOpen, poId, isHydrating, setValue, getValues]);
    
    // 🛡️ Unsaved Changes Guard
    const { handleCloseAttempt, blocker } = useUnsavedChangesGuard({
        isDirty: isDirty && !isViewMode,
        onSafeClose: onClose
    });


    // 🎯 INITIAL FORM HYDRATION / RESET
    useEffect(() => {
        if (!isOpen) {
            isInitialResetDone.current = false;
            isSourceHydrated.current = false;
            return;
        }

        // 🛡️ HYDRATION GUARD: If we have a poId but data isn't here yet, WAIT.
        // Don't trigger a reset with empty 'existingPO' because it will clear the form.
        if (poId && !existingPO) return;

        // Only reset if we haven't done it for this session.
        if (isInitialResetDone.current) return;

        const detail = (existingPO as unknown as Record<string, unknown>) || {};
        let initialPOLines: POFormData['po_lines'] = [];

        if (existingPO) {
            const lines = (detail.po_lines || detail.poLines || detail.lines || []) as Record<string, unknown>[];
            initialPOLines = lines.map((l: Record<string, unknown>, idx: number) => {
                const itemObj = (l.item || {}) as Record<string, unknown>;
                
                // 🚀 EXHAUSTIVE ID DETECTION
                const itemId = Number(l.item_id || l.product_id || itemObj.item_id || itemObj.product_id || itemObj.id || 0);
                
                const itemCode = String(
                    l.item_code || l.itemCode || itemObj.item_code || itemObj.itemCode ||
                    l.code || itemObj.code || l.sku || l.part_no || ''
                ).trim();
                
                // 🚀 EXHAUSTIVE NAME DETECTION
                const itemName = String(
                    l.item_name || 
                    l.itemName ||
                    itemObj.item_name || 
                    itemObj.itemName ||
                    l.name || 
                    itemObj.name || 
                    l.item_id_name ||
                    l.description || 
                    l.remark || 
                    l.item_description ||
                    ''
                ).trim();

                // 🛡️ Final Sanity Clean
                let finalItemCode = (itemCode === '-' || itemCode === 'undefined' || itemCode === 'null' || !itemCode) ? '' : itemCode;
                const finalItemName = (itemName === '-' || itemName === 'undefined' || itemName === 'null' || !itemName) ? '' : itemName;

                // 🚨 NUCLEAR FALLBACK: If code is STILL empty but we have an ID, show the ID so the user isn't blind
                if (!finalItemCode && itemId > 0) {
                    finalItemCode = `ID: ${itemId}`;
                }

                return {
                    line_no:         idx + 1,
                    item_id:         itemId,
                    po_line_id:      l.po_line_id ? Number(l.po_line_id) : undefined,
                    id:              Number(l.po_line_id || itemId || 0),
                    item_code:       finalItemCode,
                    code:            finalItemCode,
                    item_name:       finalItemName,
                    description:     (l.description as string) || (l.remark as string) || '',
                    pr_line_id:      (l.pr_line_id as number) || null,
                    status:          (l.status as string) || 'OPEN',
                    qty:             Number(l.qty || l.qty_ordered || 0),
                    qty_ordered:     Number(l.qty_ordered || l.qty || 0),
                    uom_id:          l.uom_id ? Number(l.uom_id) : 0,
                    unit_price:      Number(l.unit_price || 0),
                    discount_amount: Number(l.discount_amount || 0),
                    discount_expression: String(l.discount_expression || '0'),
                    tax_code_id:     (l.tax_code_id as number) || undefined,
                    required_receipt_type: (l.required_receipt_type as "FULL" | "PARTIAL") || 'FULL',
                    receipt_type:    'GOODS' as const,
                    line_total:      Number(l.line_total || 0),
                };
            });
        } else if (initialValues?.po_lines) {
            initialPOLines = initialValues.po_lines as POFormData['po_lines'];
        }
        
        const backendCurrency = detail?.currency_code || detail?.quote_currency_code || initialValues?.currency_code || 'THB';
        const backendRate = Number(detail?.exchange_rate || initialValues?.exchange_rate || 1);

        reset({
            po_no:                (detail.po_no as string)                       ?? (initialValues?.po_no as string)                ?? undefined,
            po_date:              cleanD(detail.po_date as string)              ?? cleanD(initialValues?.po_date)      ?? new Date().toISOString().split('T')[0],
            rfq_id:               (detail.rfq_id as number)                      ?? (initialValues?.rfq_id as number)               ?? undefined,
            winning_vq_id:        (detail.winning_vq_id as number)               ?? (initialValues?.winning_vq_id as number)        ?? undefined,
            pr_id:                (detail.pr_id as number)                       ?? (initialValues?.pr_id as number)                ?? undefined,
            pr_no:                (detail.pr_no as string)                       ?? (initialValues?.pr_no as string)                ?? undefined,
            qc_id:                (detail.qc_id as number)                       ?? (initialValues?.qc_id as number)                ?? undefined,
            qc_no:                (detail.qc_no as string)                       ?? (initialValues?.qc_no as string)                ?? undefined,
            vendor_id:            (detail.vendor_id as number)                   ?? (initialValues?.vendor_id as number)            ?? undefined,
            vendor_name:          (detail.vendor_name as string)                 ?? (initialValues?.vendor_name as string)          ?? undefined,
            branch_id:            (detail.branch_id as number)                   ?? (initialValues?.branch_id as number)            ?? undefined,
            ship_to_warehouse_id: (detail.ship_to_warehouse_id as number)       ?? (detail.warehouse_id as number) ?? (initialValues?.ship_to_warehouse_id as number) ?? undefined,
            is_multicurrency:     true, // Force visible for Detail/Edit as requested
            currency_code:        backendCurrency as string,
            base_currency_code:   (detail.base_currency_code as string)          || 'THB',
            quote_currency_code:  backendCurrency as string,
            target_currency:      'THB',
            exchange_rate_date:   cleanD(detail.exchange_rate_date as string)  ?? cleanD(initialValues?.exchange_rate_date) ?? new Date().toISOString().split('T')[0],
            exchange_rate:        backendRate,
            payment_term_days:    Number(detail.payment_term_days    || initialValues?.payment_term_days || 30),
            delivery_date:        cleanD(detail.delivery_date as string)       || cleanD(initialValues?.delivery_date) || '',
            remarks:              (detail.remarks as string)                     ?? (initialValues?.remarks as string) ?? '',
            discount_expression:  (detail.discount_expression as string)         ?? (initialValues?.discount_expression as string) ?? '0',
            tax_code_id:          Number(detail.tax_code_id || detail.tax_id || initialValues?.tax_code_id) || undefined,
            created_by:           (detail.created_by as number)                  ?? (initialValues?.created_by as number),
            created_by_name:      (detail.created_by_name as string)             ?? (initialValues?.created_by_name as string) ?? (user?.employee?.employee_fullname || user?.username || ''),
            po_lines:             initialPOLines,
        });

        isInitialResetDone.current = true;
    }, [isOpen, initialValues, reset, user, existingPO, poId]);
    
    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleVendorSelect = (vendor: VendorSearchItem) => {
        setValue('vendor_id', Number(vendor.vendor_id));
        setValue('vendor_name', vendor.name);
        setIsVendorModalOpen(false);
    };

    const handleClearReference = useCallback(() => {
        setValue('pr_id', undefined);
        setValue('pr_no', '');
        setValue('rfq_id', undefined as unknown as number);
        setValue('qc_id', undefined as unknown as number);
        setValue('qc_no', undefined);
        setValue('winning_vq_id', undefined as unknown as number);
        setValue('approval_no', undefined);
        setValue('vendor_id', undefined as unknown as number);
        setValue('vendor_name', undefined);
        setValue('is_multicurrency', false);
        setValue('currency_code', 'THB');
        replace([{
            line_no: 1, item_id: 0, id: 0, item_code: '', item_name: '', description: '',
            qty: 1, uom_id: 1, unit_price: 0, discount_amount: 0, discount_expression: '0',
            status: 'OPEN', required_receipt_type: 'FULL', receipt_type: 'GOODS', line_total: 0
        }]);
    }, [setValue, replace]);

    const handleSelectReferenceDoc = useCallback(async (
        prId: number, type: 'PR' | 'QC', qcId?: number, vendorId?: number, 
        winningVqId?: number, qcNo?: string, approvalNo?: string
    ) => {
        if (docAbortControllerRef.current) docAbortControllerRef.current.abort();
        docAbortControllerRef.current = new AbortController();
        setIsHydrating(true);
        try {
            await hydrateFromSource(prId, type, { 
                qcId, vendorId, winningVqId, qcNo, approvalNo, 
                signal: docAbortControllerRef.current.signal 
            });
        } finally {
            setIsHydrating(false);
        }
    }, [hydrateFromSource]);

    const handleSelectPR = useCallback((pr: PRHeader) => {
        handleSelectReferenceDoc(pr.pr_id, 'PR');
    }, [handleSelectReferenceDoc]);

    const handleSelectQC = useCallback((qc: { 
        qc_id: number; qc_no: string; pr_id: number; pr_no: string; 
        vendor_id?: number; vendor_name?: string; approval_no?: string;
    }) => {
        handleSelectReferenceDoc(qc.pr_id, 'QC', qc.qc_id, qc.vendor_id, undefined, qc.qc_no, qc.approval_no);
    }, [handleSelectReferenceDoc]);

    const handleSelectItemMaster = useCallback((index: number, item: ItemSelectorResult) => {
        const anyItem = item as unknown as Record<string, unknown>;
        const prodUomId = anyItem.purchasing_unit_id ? Number(anyItem.purchasing_unit_id) : Number(anyItem.uom_id || anyItem.base_uom_id || anyItem.sale_uom_id || 1);
        const prodUomName = (anyItem.purchasing_unit_name || anyItem.uom_name || anyItem.base_uom_name || anyItem.sale_uom_name || 'ชิ้น') as string;

        const finalUomId = Number(prodUomId);

        update(index, {
            ...getValues(`po_lines.${index}`),
            id: Number(item.id || item.item_id),
            item_id: Number(item.id || item.item_id),
            item_code: String(item.item_code || item.code || ""),
            description: String(item.item_name || item.description || ""),
            uom_id: finalUomId,
            uom_name: prodUomName,
            unit_price: Number(anyItem.standard_price || anyItem.unit_price || 0),
            item_uom_id: undefined,
        });

        // Resolve item_uom_id conversion PK
        const itemId = Number(item.id || item.item_id);
        if (itemId) {
            UOMConversionService.getByItemId(itemId).then(response => {
                const convs = response?.items || [];
                const matchedConv = convs.find(c => Number(c.from_unit_id) === finalUomId) ||
                                   convs.find(c => Number(c.conversion_factor) === 1);
                if (matchedConv) {
                    setValue(`po_lines.${index}.item_uom_id` as never, Number(matchedConv.conversion_id) as never, { shouldDirty: true });
                }
            }).catch(() => {});
        }

        setTimeout(() => trigger(`po_lines.${index}.item_id`), 100);
    }, [update, getValues, trigger, setValue]);

    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (!isOpen) {
            docAbortControllerRef.current?.abort();
            docAbortControllerRef.current = null;
            isInitialResetDone.current = false;
            isSourceHydrated.current = false;
            reset();
        }
    }, [isOpen, reset]);

    useEffect(() => {
        return () => {
            docAbortControllerRef.current?.abort();
            docAbortControllerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!isOpen || isSourceHydrated.current || isHydrating || poId) return;
        
        const sPrId = searchParams.get('sourcePrId') || searchParams.get('source_pr_id');
        const sQcId = searchParams.get('sourceQcId') || searchParams.get('source_qc_id');
        const sVqId = searchParams.get('winningVqId') || searchParams.get('winning_vq_id');
        const sVendorId = searchParams.get('vendorId') || searchParams.get('vendor_id');
        const sQcNo = searchParams.get('qcNo') || searchParams.get('qc_no');
        const sCreateFromQC = searchParams.get('createFromQC') === 'true' || searchParams.get('create_from_qc') === 'true';

        const prId = sPrId ? Number(sPrId) : (initialValues?.pr_id || undefined);
        const qcId = sQcId ? Number(sQcId) : (initialValues?.qc_id || undefined);
        const vendorId = sVendorId ? Number(sVendorId) : (initialValues?.vendor_id || undefined);
        const winningVqId = sVqId ? Number(sVqId) : (initialValues?.winning_vq_id || undefined);
        const isQC = sCreateFromQC || !!qcId || !!winningVqId;

        if (prId) {
            isSourceHydrated.current = true;
            handleSelectReferenceDoc(
                prId, 
                isQC ? 'QC' : 'PR', 
                qcId, 
                vendorId, 
                winningVqId, 
                sQcNo || initialValues?.qc_no,
                searchParams.get('approvalNo') || searchParams.get('approval_no') || initialValues?.approval_no
            );
        }
    }, [isOpen, initialValues, handleSelectReferenceDoc, isHydrating, searchParams, poId]);

    const handleAddLine = useCallback(() => {
        append({
            line_no: fields.length + 1, item_id: 0, item_code: '', item_name: '', description: '',
            pr_line_id: null, status: 'OPEN', qty: 1, qty_ordered: 1, uom_id: 0, unit_price: 0,
            discount_amount: 0, discount_expression: '0', tax_code_id: undefined,
            required_receipt_type: 'FULL', receipt_type: 'GOODS' as const, line_total: 0,
        });
    }, [append, fields.length]);

    const onInvalidSubmit = (errors: FieldErrors<POFormData>) => {
        logger.error("Form Validation Errors:", errors);
        
        const errorCount = Object.keys(errors).length;
        if (errorCount > 0) {
            toast(`พบข้อผิดพลาด ${errorCount} จุด กรุณาตรวจสอบข้อมูลให้ครบถ้วน`, 'error');
        }

        const firstErrorKey = Object.keys(errors)[0] as keyof POFormData;
        if (firstErrorKey) {
            const errorElement = document.getElementsByName(firstErrorKey)[0] || 
                                document.querySelector(`[name="${firstErrorKey}"]`);
            if (errorElement) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (errorElement instanceof HTMLElement && 'focus' in errorElement) errorElement.focus();
            }
        }
    };

    return {
        // Form & Master Data
        formMethods, register, control, errors, handleSubmit, setValue,
        branches, uoms, currencies, taxCodes,
        isLoadingBranches, isLoadingCurrencies, isLoadingUoms, isLoadingTaxCodes,
        fields, append, remove, replace, update,
        
        // State
        isVendorModalOpen, setIsVendorModalOpen,
        isQCModalOpen, setIsQCModalOpen,
        isPRModalOpen, setIsPRModalOpen,
        isHydrating, isSubmitting,
        isConfirmModalOpen, setIsConfirmModalOpen,
        
        // Values
        watchVendorName, watchPrNo, watchCurrencyCode, watchTargetCurrency,
        watchIsMulticurrency, watchRfqId: initialValues?.rfq_id || existingPO?.rfq_id,
        watchWinningVqId: initialValues?.winning_vq_id || existingPO?.winning_vq_id,
        
        // Handlers
        onSubmit,
        onInvalidSubmit,
        handleConfirmSave,
        handleVendorSelect,
        handleClearReference,
        handleSelectReferenceDoc,
        handleSelectPR,
        handleSelectQC,
        handleSelectItemMaster,
        handleAddLine,
        onClose: handleCloseAttempt, // Override with guarded version
        blocker, // Expose for Router blocking if needed
        isDirty,
        existingPO,
        isInherited: !!(getValues('rfq_id') || getValues('winning_vq_id'))
    };
};