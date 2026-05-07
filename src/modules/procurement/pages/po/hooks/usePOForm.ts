import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useBranches, useUnits, useCurrencies, useTaxCodes } from '@/modules/master-data/hooks/useMasterData';
import { useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import type { Resolver, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { POService, VQService } from '@/modules/procurement/services';
import { POFormSchema, type POFormData, type ItemSelectorResult } from '@/modules/procurement/schemas/po-schemas'; 
import { usePOHydration } from './usePOHydration';
import { usePOCalculations } from './usePOCalculations';
import { usePOActions } from './usePOActions';
import type { VendorSearchItem } from '@/modules/master-data/vendor/types/vendor-types';
import type { PRHeader } from '@/modules/procurement/types/pr-types';
import type { QuotationHeader, QuotationLine } from '@/modules/procurement/types/vq-types'; 
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils';
import { useToast } from '@/shared/components/ui/feedback/Toast';


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
}: UsePOFormOptions) => {
    const { toast } = useToast();
    const { user } = useAuth();

    // ── UI state ──────────────────────────────────────────────────────────────
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isQCModalOpen, setIsQCModalOpen]         = useState(false);
    const [isPRModalOpen, setIsPRModalOpen]         = useState(false);
    const [isHydrating, setIsHydrating] = useState(false);
    const hasHydratedInitial = useRef(false);
    const docAbortControllerRef = useRef<AbortController | null>(null);

    // ── Helper ──────────────────────────────────────────────────────────────
    const cleanD = (d: any) => (typeof d === 'string' && d.includes('T')) ? d.split('T')[0] : d;
    
    // ── Master Data Queries (Shared Hooks) ──────────────────────────────────
    const { data: branches = [],   isLoading: isLoadingBranches }   = useBranches(isOpen);
    const { data: taxCodesData = [], isLoading: isLoadingTaxCodes } = useTaxCodes(isOpen);
    const taxCodes = (taxCodesData as any)?.data || taxCodesData; 
    
    const { data: unitsResponse,   isLoading: isLoadingUnits }      = useUnits(isOpen);
    const units = useMemo(() => unitsResponse?.items || [], [unitsResponse]);
    
    const { data: currenciesResponse, isLoading: isLoadingCurrencies } = useCurrencies(isOpen);
    const currencies = useMemo(() => (currenciesResponse as any)?.data || (currenciesResponse as any)?.items || currenciesResponse || [], [currenciesResponse]);

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
            is_multicurrency: false,
            currency_code: 'THB',
            target_currency: 'THB',
            exchange_rate_date: new Date().toISOString().split('T')[0],
            exchange_rate: 1,
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
        formState: { errors },
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
        toast,
        currencies
    });

    // ── Default Currency Sync ─────────────────────────────────────────────
    useEffect(() => {
        if (isOpen && !isLoadingCurrencies && currencies.length > 0 && !poId && !isHydrating) {
            const currentCurrency = getValues('currency_code');
            const currentTarget = getValues('target_currency');
            
            if (!currentCurrency || currentCurrency === '') {
                setValue('currency_code', 'THB');
            }
            if (!currentTarget || currentTarget === '') {
                setValue('target_currency', 'THB');
            }
        }
    }, [isOpen, isLoadingCurrencies, currencies, setValue, getValues, poId, isHydrating]);

    // ── VQ Inheritance Query ──────────────────
    const { data: inheritedQC } = useQuery({
        queryKey: ['inherit-vq', 
            initialValues?.rfq_id || existingPO?.rfq_id, 
            initialValues?.winning_vq_id || existingPO?.winning_vq_id, 
            initialValues?.vendor_id || existingPO?.vendor_id
        ],
        queryFn: async () => {
            const rfqId = initialValues?.rfq_id || existingPO?.rfq_id;
            const winningVqId = initialValues?.winning_vq_id || existingPO?.winning_vq_id;
            const vendorId = initialValues?.vendor_id || existingPO?.vendor_id;

            if ((!rfqId && !winningVqId) || !vendorId) return null;
            const res = await VQService.getList({});
            const sourceVQ = res.data.find(vq => 
                Number(vq.vendor_id) === Number(vendorId) && 
                (Number(vq.rfq_id) === Number(rfqId) || Number(vq.vq_header_id) === Number(winningVqId) || Number(vq.quotation_id) === Number(winningVqId))
            );
            
            if (sourceVQ?.vq_header_id || sourceVQ?.quotation_id) {
                return await VQService.getById(sourceVQ.vq_header_id || sourceVQ.quotation_id!);
            }
            return null;
        },
        enabled: isOpen && (!!initialValues?.rfq_id || !!initialValues?.winning_vq_id || !!existingPO?.rfq_id || !!existingPO?.winning_vq_id) && (!!initialValues?.vendor_id || !!existingPO?.vendor_id)
    });

    // ── Form Initial Hydration Effect ─────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            const isMasterDataReady = (
                (branches?.length > 0 || !isOpen) && 
                (taxCodes?.length > 0 || !isOpen) && 
                (units?.length > 0 || !isOpen)
            );

            if (isOpen && !isMasterDataReady) return;

            let initialPOLines: POFormData['po_lines'] = [];
            
            if (existingPO) {
                const detail = existingPO as unknown as Record<string, unknown>;
                const lines = (detail.poLines || detail.po_lines || detail.lines || []) as Record<string, unknown>[];
                if (lines.length > 0) {
                    initialPOLines = lines.map((l: Record<string, any>, idx: number) => ({
                        line_no:         idx + 1,
                        item_id:         Number(l.item_id || 0),
                        po_line_id:      l.po_line_id ? Number(l.po_line_id) : undefined,
                        id:              Number(l.po_line_id || l.item_id || 0),
                        item_code:       l.item_code || l.item?.item_code || '',
                        item_name:       l.item_name || l.item?.item_name || '',
                        description:     l.description || l.remark || '',
                        pr_line_id:      l.pr_line_id || null,
                        status:          l.status || 'OPEN',
                        qty:             Number(l.qty || l.qty_ordered || 0),
                        qty_ordered:     Number(l.qty_ordered || l.qty || 0),
                        uom_id:          l.uom_id ? Number(l.uom_id) : 0,
                        unit_price:      Number(l.unit_price || 0),
                        discount_amount: Number(l.discount_amount || 0),
                        discount_expression: String(l.discount_expression || '0'),
                        tax_code_id:     l.tax_code_id || undefined,
                        required_receipt_type: l.required_receipt_type || 'FULL',
                        receipt_type:    'GOODS' as const,
                        line_total:      Number(l.line_total || 0),
                    }));
                }
            }
            else if (initialValues?.po_lines && initialValues.po_lines.length > 0) {
                initialPOLines = initialValues.po_lines.map((l: Record<string, any>, idx: number) => ({
                    ...l,
                    po_line_id: Number(l.po_line_id || (l.id && l.id !== l.item_id ? l.id : undefined) || 0) || undefined,
                    id: Number(l.po_line_id || l.id || l.item_id || 0),
                    item_id: Number(l.item_id || l.id || 0),
                    line_no: l.line_no || idx + 1,
                })) as any[]; 
            } 
            else if (inheritedQC && (inheritedQC.vq_lines || inheritedQC.lines)) {
                const sourceLines = (inheritedQC.vq_lines || inheritedQC.lines) as QuotationLine[];
                initialPOLines = sourceLines.map((l: QuotationLine, idx: number) => ({
                    line_no:         idx + 1,
                    item_id:         Number(l.item_id || 0),
                    po_line_id:      undefined,
                    id:              Number(l.item_id || 0),
                    item_code:       l.item?.item_code || l.item_code || '',
                    item_name:       l.item?.item_name || l.item_name || '',
                    description:     l.remark || l.item?.item_name || l.item_name || '',
                    pr_line_id:      l.pr_line_id || null,
                    status:          'OPEN',
                    qty:             Number(l.qty) || 1,
                    qty_ordered:     Number(l.qty) || 1,
                    uom_id:          l.uom_id ? Number(l.uom_id) : 0,
                    unit_price:      Number(l.unit_price) || 0,
                    discount_amount: Number(l.discount_amount) || 0,
                    discount_expression: String(l.discount_expression || '0'),
                    tax_code_id:     l.tax_code_id || (inheritedQC as QuotationHeader).tax_code_id || undefined,
                    required_receipt_type: 'FULL',
                    receipt_type:    'GOODS' as const,
                    line_total:      Number(l.net_amount) || 0,
                }));
            }

            if (initialPOLines.length === 0 && !initialValues?.rfq_id && !initialValues?.winning_vq_id) {
                initialPOLines = [{
                    line_no: 1, item_id: 0, id: 0, item_code: '', item_name: '', description: '',
                    pr_line_id: null, status: 'OPEN', qty: 1, qty_ordered: 1, uom_id: 0, unit_price: 0,
                    discount_amount: 0, discount_expression: '0', tax_code_id: undefined,
                    required_receipt_type: 'FULL', receipt_type: 'GOODS' as const, line_total: 0,
                }];
            }

            const detail = (existingPO as any) || {};
            const backendCurrency = detail?.currency_code || detail?.quote_currency_code || initialValues?.currency_code || 'THB';
            const backendRate = Number(detail?.exchange_rate || inheritedQC?.exchange_rate || initialValues?.exchange_rate || 1);
            const isActuallyMulti = !!(backendCurrency && backendCurrency !== 'THB') || backendRate !== 1;

            reset({
                po_no:                detail?.po_no                       ?? initialValues?.po_no                ?? undefined,
                po_date:              cleanD(detail?.po_date)              ?? cleanD(initialValues?.po_date)      ?? new Date().toISOString().split('T')[0],
                rfq_id:               detail?.rfq_id                      ?? initialValues?.rfq_id               ?? inheritedQC?.rfq_id ?? undefined,
                winning_vq_id:        detail?.winning_vq_id               ?? initialValues?.winning_vq_id        ?? inheritedQC?.vq_header_id ?? inheritedQC?.quotation_id ?? undefined,
                pr_id:                detail?.pr_id                       ?? (inheritedQC?.pr_id || initialValues?.pr_id) ?? undefined,
                pr_no:                detail?.pr_no                       ?? (inheritedQC?.pr_no || initialValues?.pr_no) ?? undefined,
                qc_id:                detail?.qc_id                       ?? initialValues?.qc_id                ?? undefined,
                qc_no:                detail?.qc_no                       ?? initialValues?.qc_no                ?? undefined,
                vendor_id:            detail?.vendor_id                   ?? initialValues?.vendor_id            ?? undefined,
                vendor_name:          detail?.vendor_name                 ?? initialValues?.vendor_name          ?? undefined,
                branch_id:            detail?.branch_id                   ?? initialValues?.branch_id            ?? undefined,
                ship_to_warehouse_id: detail?.ship_to_warehouse_id       ?? detail?.warehouse_id ?? initialValues?.ship_to_warehouse_id ?? undefined,
                is_multicurrency:     isActuallyMulti,
                currency_code:        backendCurrency,
                base_currency_code:   detail?.base_currency_code          || inheritedQC?.base_currency_code     || 'THB',
                quote_currency_code:  backendCurrency,
                target_currency:      'THB',
                exchange_rate_date:   cleanD(detail?.exchange_rate_date)  ?? cleanD(initialValues?.exchange_rate_date) ?? new Date().toISOString().split('T')[0],
                exchange_rate:        backendRate,
                payment_term_days:    Number(detail?.payment_term_days    || inheritedQC?.payment_term_days || initialValues?.payment_term_days || 30),
                delivery_date:        cleanD(detail?.delivery_date)       || cleanD(initialValues?.delivery_date) || '',
                remarks:              detail?.remarks                     ?? initialValues?.remarks ?? '',
                discount_expression:  detail?.discount_expression         ?? initialValues?.discount_expression ?? '0',
                tax_code_id:          Number(detail?.tax_code_id || detail?.tax_id || initialValues?.tax_code_id || inheritedQC?.tax_code_id || initialPOLines[0]?.tax_code_id) || undefined,
                created_by:           detail?.created_by                  ?? initialValues?.created_by,
                created_by_name:      detail?.created_by_name             ?? initialValues?.created_by_name ?? (user?.employee?.employee_fullname || user?.username || ''),
                po_lines:             initialPOLines,
            });
        }
    }, [
        isOpen, initialValues, reset, inheritedQC, user, existingPO,
        branches?.length, taxCodes?.length, units?.length, currencies?.length
    ]);
    
    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleVendorSelect = (vendor: VendorSearchItem) => {
        setValue('vendor_id', Number(vendor.vendor_id));
        setValue('vendor_name', vendor.name);
        setIsVendorModalOpen(false);
    };

    const handleClearReference = useCallback(() => {
        setValue('pr_id', undefined);
        setValue('pr_no', '');
        setValue('rfq_id', undefined as any);
        setValue('qc_id', undefined as any);
        setValue('qc_no', undefined as any);
        setValue('winning_vq_id', undefined as any);
        setValue('approval_no', undefined as any);
        setValue('vendor_id', undefined as any);
        setValue('vendor_name', undefined as any);
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

    // ── Auto-Hydrate from Reference Doc on Create Mount ───────────────────────
    useEffect(() => {
        if (isOpen && !poId && initialValues?.pr_id) {
            const isQcFlow = !!initialValues?.qc_id || !!initialValues?.winning_vq_id;
            if (isQcFlow) {
                handleSelectReferenceDoc(
                    Number(initialValues.pr_id), 'QC', 
                    initialValues.qc_id ? Number(initialValues.qc_id) : undefined, 
                    initialValues.vendor_id ? Number(initialValues.vendor_id) : undefined,
                    initialValues.winning_vq_id ? Number(initialValues.winning_vq_id) : undefined,
                    initialValues.qc_no
                );
            } else {
                handleSelectReferenceDoc(Number(initialValues.pr_id), 'PR');
            }
        }
    }, [isOpen, initialValues?.pr_id, initialValues?.qc_id, initialValues?.winning_vq_id, initialValues?.vendor_id, initialValues?.qc_no, handleSelectReferenceDoc, poId]);

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
        const anyItem = item as any;
        const prodUomId = anyItem.uom_id || anyItem.unit_id || anyItem.base_uom_id || anyItem.sale_uom_id;
        const prodUomName = anyItem.uom_name || anyItem.unit_name || anyItem.base_uom_name || anyItem.sale_uom_name || '';

        const safeUnits = Array.isArray(units) ? units : [];
        const matchedUnit = safeUnits.find(u => {
            if (prodUomId && (String(u.id) === String(prodUomId) || String(u.uom_id) === String(prodUomId))) return true;
            if (prodUomName && (u.uom_name?.trim() === prodUomName.trim() || u.unit_name?.trim() === prodUomName.trim())) return true;
            return false;
        });

        const finalUomId = Number(prodUomId || matchedUnit?.uom_id || matchedUnit?.id || 1);

        update(index, {
            ...getValues(`po_lines.${index}`),
            id: Number(item.id || item.item_id),
            item_id: Number(item.id || item.item_id),
            code: String(item.item_code || item.code || ""),
            item_code: String(item.item_code || item.code || ""),
            description: String(item.item_name || item.description || ""),
            uom_id: finalUomId || 0,
            unit_price: Number(item.standard_price || item.unit_price || 0),
        });
        setTimeout(() => trigger(`po_lines.${index}.item_id`), 100);
    }, [update, getValues, trigger, units]);

    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (!isOpen) {
            hasHydratedInitial.current = false;
            reset(); 
            logger.debug("♻️ PO Form Session Reset: Memory & Data Cleared");
        }
    }, [isOpen, reset]);

    useEffect(() => {
        if (!isOpen || hasHydratedInitial.current || isHydrating) return;
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

        if (prId && getValues('po_lines').length === 0) {
            hasHydratedInitial.current = true; 
            handleSelectReferenceDoc(
                prId, isQC ? 'QC' : 'PR', qcId, vendorId, winningVqId,
                sQcNo || initialValues?.qc_no,
                searchParams.get('approvalNo') || searchParams.get('approval_no') || initialValues?.approval_no
            );
        }
    }, [isOpen, initialValues, getValues, handleSelectReferenceDoc, isHydrating, searchParams]);

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
        const firstErrorKey = Object.keys(errors)[0] as keyof POFormData;
        if (firstErrorKey) {
            const errorElement = document.getElementsByName(firstErrorKey)[0] || 
                               document.querySelector(`[name="${firstErrorKey}"]`);
            if (errorElement) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if ('focus' in errorElement) (errorElement as any).focus();
            }
        }
    };

    return {
        // Form & Master Data
        formMethods, register, control, errors, handleSubmit, setValue,
        branches, units, currencies, taxCodes,
        isLoadingBranches, isLoadingUnits, isLoadingCurrencies, isLoadingTaxCodes,
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
        onClose,
        existingPO,
        isInherited: !!(getValues('rfq_id') || getValues('winning_vq_id'))
    };
};