import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import type { Resolver, SubmitHandler, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { POService, VQService } from '@/modules/procurement/services';
import { POFormSchema, CreatePOSchema, type POFormData, type POLine, type ItemSelectorResult } from '@/modules/procurement/schemas/po-schemas'; 
import type { IHydrationPRLine, IHydrationVQLine, IHydrationVQHeader } from '@/modules/procurement/schemas/po-schemas'; 
import type { CreatePOPayload } from '@/modules/procurement/types/po-types';
import type { VendorSearchItem } from '@/modules/master-data/vendor/types/vendor-types';
import { PRService } from '@/modules/procurement/services/pr.service';
import type { PRHeader, PRLine } from '@/modules/procurement/types/pr-types';
import type { QuotationHeader, QuotationLine } from '@/modules/procurement/types/vq-types'; 
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { TaxCodeService } from '@/modules/master-data/tax/services/tax-code.service';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { extractErrorMessage } from '@/core/api/api';
import { calculatePricingSummary, parseDiscountAmount } from '@/modules/procurement/utils/pricing.utils';
import type { Currency } from '@/modules/master-data/types/master-data-types';

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
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user } = useAuth();

    // ── UI state ──────────────────────────────────────────────────────────────
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isQCModalOpen, setIsQCModalOpen]         = useState(false);
    const [isPRModalOpen, setIsPRModalOpen]         = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<POFormData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHydrating, setIsHydrating] = useState(false);
    const hasHydratedInitial = useRef(false);
    
    // ── Master Data Queries ──────────────────────────────────────────────────
    const { data: branches = [],   isLoading: isLoadingBranches }   = useQuery({ queryKey: ['master-branches'],   queryFn: MasterDataService.getBranches,   enabled: isOpen });
    const { data: taxCodes = [],   isLoading: isLoadingTaxCodes }   = useQuery({ queryKey: ['master-tax-codes'], queryFn: TaxCodeService.getTaxCodes,     enabled: isOpen });
    const { data: units = [],      isLoading: isLoadingUnits }      = useQuery({ queryKey: ['master-units'],      queryFn: MasterDataService.getUnits,        enabled: isOpen });
    const { data: currencies = [], isLoading: isLoadingCurrencies } = useQuery({ queryKey: ['master-currencies'], queryFn: MasterDataService.getCurrencies,   enabled: isOpen });


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
        control,
        register,
        handleSubmit,
        reset,
        setValue,
        getValues,
        trigger,
        getFieldState,
        formState: { errors },
    } = formMethods;

    // Use `control` explicitly for dynamic fields
    const { fields, append, remove, replace, update } = useFieldArray({ control, name: 'po_lines' });

    const watchVendorName      = useWatch({ control, name: 'vendor_name' });
    const watchPrNo            = useWatch({ control, name: 'pr_no' });
    const watchCurrencyCode    = useWatch({ control, name: 'currency_code' }) as string | undefined;
    const watchTargetCurrency  = useWatch({ control, name: 'target_currency' }) as string | undefined;
    const watchIsMulticurrency = useWatch({ control, name: 'is_multicurrency' });

    // ── Existing PO Detail Query (for view/edit) ─────────────────────────────
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

    // ── VQ Inheritance Query (read-only cross-module lookup) ──────────────────
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
            // Find VQ by searching for vendor and matching RFQ/VQ ID
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

    // ── Form Reset Effect (Hydration) ─────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            let initialPOLines: POFormData['po_lines'] = [];
            
            // Phase 0: Loaded from existing PO DB Call
            if (existingPO) {
                const detail = existingPO as any;
                const lines = detail.poLines || detail.po_lines || detail.lines || [];
                if (lines.length > 0) {
                    initialPOLines = lines.map((l: any, idx: number) => ({
                        line_no:         idx + 1,
                        item_id:         Number(l.item_id || 0),
                        id:              Number(l.item_id || 0),
                        item_code:       l.item_code || l.item?.item_code || '',
                        item_name:       l.item_name || l.item?.item_name || '',
                        description:     l.description || l.remark || '',
                        pr_line_id:      l.pr_line_id || null,
                        status:          l.status || 'OPEN',
                        qty:             Number(l.qty || l.qty_ordered || 0),
                        qty_ordered:     Number(l.qty_ordered || l.qty || 0),
                        uom_id:          Number(l.uom_id || 1),
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
            // Phase 1: Direct PO Lines from internal or partial initialValues
            else if (initialValues?.po_lines && initialValues.po_lines.length > 0) {
                initialPOLines = initialValues.po_lines.map((l: any, idx: number) => ({
                    ...l,
                    id: Number(l.id || l.item_id || 0),
                    item_id: Number(l.item_id || l.id || 0),
                    line_no: l.line_no || idx + 1,
                }));
            } 
            // Phase 2: Derive from RFQ/VQ inheritance
            else if (inheritedQC && (inheritedQC.vq_lines || inheritedQC.lines)) {
                const sourceLines = (inheritedQC.vq_lines || inheritedQC.lines) as QuotationLine[];
                initialPOLines = sourceLines.map((l: QuotationLine, idx: number) => ({
                    line_no:         idx + 1,
                    item_id:         Number(l.item_id || 0),
                    id:              Number(l.item_id || 0),
                    item_code:       l.item?.item_code || l.item_code || '',
                    item_name:       l.item?.item_name || l.item_name || '',
                    description:     l.remark || l.item?.item_name || l.item_name || '',
                    pr_line_id:      l.pr_line_id || null,
                    status:          'OPEN',
                    qty:             Number(l.qty) || 1,
                    qty_ordered:     Number(l.qty) || 1,
                    uom_id:          Number(l.uom_id) || 1,
                    unit_price:      Number(l.unit_price) || 0,
                    discount_amount: Number(l.discount_amount) || 0,
                    discount_expression: String(l.discount_expression || '0'),
                    tax_code_id:     l.tax_code_id || (inheritedQC as QuotationHeader).tax_code_id || undefined,
                    required_receipt_type: 'FULL',
                    receipt_type:    'GOODS' as const,
                    line_total:      Number(l.net_amount) || 0,
                }));
            }

            // Phase 3: Default Empty Row for New PO (not derived from RFQ/VQ)
            if (initialPOLines.length === 0 && !initialValues?.rfq_id && !initialValues?.winning_vq_id) {
                initialPOLines = [{
                    line_no:         1,
                    item_id:         0,
                    id:              0,
                    item_code:       '',
                    item_name:       '',
                    description:     '',
                    pr_line_id:      null,
                    status:          'OPEN',
                    qty:             1,
                    qty_ordered:     1,
                    uom_id:          1,
                    unit_price:      0,
                    discount_amount: 0,
                    discount_expression: '0',
                    tax_code_id:     undefined,
                    required_receipt_type: 'FULL',
                    receipt_type:    'GOODS' as const,
                    line_total:      0,
                }];
            }

            const detail = (existingPO as any) || {};
            const cleanD = (d: any) => (typeof d === 'string' && d.includes('T')) ? d.split('T')[0] : d;

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
                is_multicurrency:     false,
                currency_code:        detail?.currency_code               ?? (inheritedQC?.base_currency_code || inheritedQC?.currency || initialValues?.currency_code) ?? 'THB',
                base_currency_code:   inheritedQC?.base_currency_code     || 'THB',
                quote_currency_code:  inheritedQC?.quote_currency_code    || inheritedQC?.currency || 'THB',
                target_currency:      'THB',
                exchange_rate_date:   cleanD(detail?.exchange_rate_date)  ?? cleanD(initialValues?.exchange_rate_date) ?? new Date().toISOString().split('T')[0],
                exchange_rate:        Number(detail?.exchange_rate        || inheritedQC?.exchange_rate || initialValues?.exchange_rate || 1),
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
    }, [isOpen, initialValues, reset, inheritedQC, user, existingPO]);
    

    // ── Enforce THB when Multicurrency is OFF ─────────────────────────────────
    useEffect(() => {
        if (!watchIsMulticurrency) {
            setValue('currency_code', 'THB');
            setValue('exchange_rate', 1);
            setValue('target_currency', 'THB');
        }
    }, [watchIsMulticurrency, setValue]);
    
    // ── Propagate Header Tax to all Lines ─────────────────────────────────────
    const watchHeaderTaxCodeId = useWatch({ control, name: 'tax_code_id' });
    useEffect(() => {
        if (watchHeaderTaxCodeId !== undefined) {
             const currentLines = getValues('po_lines') || [];
             const needsUpdate = currentLines.some(l => Number(l.tax_code_id) !== Number(watchHeaderTaxCodeId));
             if (needsUpdate) {
                 const updatedLines = currentLines.map(l => ({
                     ...l,
                     tax_code_id: watchHeaderTaxCodeId
                 }));
                 setValue('po_lines', updatedLines as any, { shouldDirty: true });
             }
        }
    }, [watchHeaderTaxCodeId, setValue, getValues]);

    // ── Currency Exchange Rate Auto-Calculation triggers ─────────────────────
    const prevCurrencyId = useRef<string | undefined>(undefined);
    const prevTargetCurrency = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!watchCurrencyCode) return;
        
        // Equal currencies reset Rate to 1
        if (watchCurrencyCode === watchTargetCurrency || !watchTargetCurrency) {
            setValue('exchange_rate', 1, { shouldDirty: false });
            prevCurrencyId.current = watchCurrencyCode;
            prevTargetCurrency.current = watchTargetCurrency;
            return;
        }

        const isSourceChanged = prevCurrencyId.current !== watchCurrencyCode;
        const isTargetChanged = prevTargetCurrency.current !== watchTargetCurrency;

        const { isDirty } = getFieldState('exchange_rate');
        if (isSourceChanged || isTargetChanged || !isDirty) {
            const sourceObj = currencies.find((c: Currency) => c.currency_code === watchCurrencyCode);
            const targetObj = currencies.find((c: Currency) => c.currency_code === watchTargetCurrency);

            const fromRate = sourceObj?.exchange_rate || 1;
            const toRate = targetObj?.exchange_rate || 1;

            const calculatedRate = fromRate / toRate;

            if (calculatedRate !== undefined && !isNaN(calculatedRate)) {
                setValue('exchange_rate', Number(calculatedRate.toFixed(6)), { shouldValidate: true, shouldDirty: false });
            }
        }

        prevCurrencyId.current = watchCurrencyCode;
        prevTargetCurrency.current = watchTargetCurrency;
    }, [currencies, watchCurrencyCode, watchTargetCurrency, setValue, getFieldState]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleVendorSelect = (vendor: VendorSearchItem) => {
        setValue('vendor_id', Number(vendor.vendor_id));
        setValue('vendor_name', vendor.name);
        setIsVendorModalOpen(false);
    };

    const handleSelectReferenceDoc = useCallback(async (
        prId: number, 
        type: 'PR' | 'QC', 
        qcId?: number, 
        vendorId?: number, 
        winningVqId?: number
    ) => {
        if (!prId) return;
        
        // 🚨 GHOST DATA PREVENTION: Reset critical fields before hydration
        // @ts-expect-error - reset to undefined for clean state
        setValue('vendor_id', undefined);
        setValue('vendor_name', undefined);
        setValue('is_multicurrency', false);
        setValue('currency_code', 'THB');

        setIsHydrating(true);
        try {
            // 1. Parallel Fetch PR & VQ (if QC)
            const fullPR = await PRService.getDetail(prId);
            let winningVQ: IHydrationVQHeader | undefined;

            if (type === 'QC' && winningVqId) {
                try {
                    const rawVQ = await VQService.getById(winningVqId);
                    winningVQ = rawVQ as IHydrationVQHeader;
                } catch (vqError) {
                    logger.error('[usePOForm] Failed to fetch VQ details for QC flow', vqError);
                    toast('ไม่สามารถดึงข้อมูลราคาจากใบเสนอราคาได้ กรุณาระบุราคาด้วยตนเอง', 'error');
                }

                /* qc_no is already hydrated via initialValues */
            }
            
            // 2. Map Header IDs
            setValue('pr_id', Number(fullPR.pr_id));
            setValue('pr_no', fullPR.pr_no);
            setValue('rfq_id', (Number(qcId || fullPR.rfq_id) || undefined) as unknown as number);
            setValue('qc_id', (Number(qcId || fullPR.qc_id) || undefined) as unknown as number);
            setValue('winning_vq_id', (Number(winningVqId || fullPR.winning_vq_id) || undefined) as unknown as number);

            // 3. Map Vendor & Terms (Strict Hydration + Forced UI Refresh)
            const finalVendorId = Number(vendorId || winningVQ?.vendor_id || fullPR.preferred_vendor_id);
            if (finalVendorId) {
                setValue('vendor_id', finalVendorId, { 
                    shouldValidate: true, 
                    shouldDirty: true 
                });
                // Prioritize Winner Vendor Name from VQ lookup
                let finalVendorName = winningVQ?.vendor?.vendor_name || winningVQ?.vendor_name || fullPR.vendor_name || '';
                if (finalVendorId && !finalVendorName) {
                    try {
                        const vendorDetail = await VendorService.getById(finalVendorId);
                        if (vendorDetail) {
                            finalVendorName = vendorDetail.vendor_name;
                        }
                    } catch (e) {
                        logger.error('[usePOForm] Failed to fetch vendor detail for name', e);
                    }
                }
                setValue('vendor_name', finalVendorName);
            }

            // FINANCIAL TERMS: Priority to VQ (Negotiated), then PR estimates
            const creditTerm = Number(winningVQ?.payment_term_days ?? fullPR.payment_term_days ?? 30);
            const leadTime = Number(winningVQ?.lead_time_days ?? 0);
            const creditDays = Number(fullPR.credit_days ?? 0);
            const finalCreditDays = leadTime > 0 ? leadTime : creditDays;
            
            const taxCodeId = Number(winningVQ?.tax_code_id ?? (winningVQ as any)?.tax_id ?? fullPR.pr_tax_code_id ?? (fullPR as any).pr_tax_id);

            setValue('payment_term_days', creditTerm);
            setValue('credit_days', finalCreditDays);
            if (taxCodeId) {
                setValue('tax_code_id', taxCodeId, { shouldValidate: true });
            }

            // 💱 Currency & Multicurrency Mapping (Priority: Full VQ -> Partial VQ -> PR -> Default)
            const finalExRate = Number(winningVQ?.exchange_rate || fullPR.pr_exchange_rate || 1);
            
            // 🔎 Deep Hydration: Fetch full VQ to get actual currency code/id if missing
            let fullWinningVQ = winningVQ;
            if (winningVQ?.vq_header_id) {
                try {
                    const vqDetail = await VQService.getById(Number(winningVQ.vq_header_id));
                    if (vqDetail) fullWinningVQ = vqDetail as any;
                } catch (e) {
                    logger.error("❌ [usePOForm] Failed to fetch full VQ detail:", e);
                }
            }

            // 🔍 DEBUG: Show ALL fields to find where USD is hiding
            logger.info("🕵️ [usePOForm] Raw Winning VQ Data Dump:", fullWinningVQ);

            let resolvedCode = fullWinningVQ?.quote_currency_code || (fullWinningVQ as any)?.currency_code || (fullWinningVQ as any)?.currency || fullPR.pr_quote_currency_code || 'THB';
            
            // If still THB but rate != 1, try ID lookup as a last resort
            if (resolvedCode === 'THB' && finalExRate !== 1) {
                const cId = (fullWinningVQ as any)?.currency_id || (fullWinningVQ as any)?.quote_currency_id || (fullWinningVQ as any)?.currencyId || (fullPR as any).pr_currency_id;
                if (cId) {
                    const match = (currencies as any[]).find(c => String(c.currency_id) === String(cId) || String(c.id) === String(cId));
                    if (match) {
                        resolvedCode = match.currency_code || match.code;
                        logger.info("🎯 [usePOForm] Auto-corrected Currency from ID Map:", { cId, resolvedCode });
                    }
                }
            }

            // 🚨 EMERGENCY OVERRIDE: If rate is 33 and we're still THB, it's highly likely USD in this system's context
            if (resolvedCode === 'THB' && finalExRate === 33) {
                resolvedCode = 'USD';
                logger.warn("🚨 [usePOForm] Emergency Override: Rate 33 detected, forcing USD.");
            }

            const isForeign = resolvedCode !== 'THB' || finalExRate !== 1;
            
            logger.info("💱 [usePOForm] Deep Currency detection result:", { 
                resolvedCode, 
                finalExRate, 
                isForeign, 
                source: fullWinningVQ ? 'Full VQ' : 'PR/Summary'
            });

            setValue('is_multicurrency', isForeign, { shouldValidate: true, shouldDirty: true });
            setValue('quote_currency_code', resolvedCode);
            setValue('currency_code', resolvedCode);
            setValue('target_currency', 'THB'); 
            setValue('exchange_rate', finalExRate);
            
            if (isForeign) {
                const exDate = fullWinningVQ?.exchange_rate_date || fullPR.pr_exchange_rate_date;
                if (exDate) {
                    const dateObj = new Date(exDate);
                    const dateStr = isNaN(dateObj.getTime()) ? new Date().toISOString() : dateObj.toISOString();
                    setValue('exchange_rate_date', dateStr.split('T')[0]);
                }
            }
            
            // 📦 DEEP LINE ITEM MAPPING (STRICT OVERWRITE)
            const prLines = fullPR.lines || [];
            if (prLines.length > 0) {
                // 🛡️ DYNAMIC PROPERTY CHECK (Rule 1): Be resilient to Backend property naming
                const actualVQLines = (winningVQ?.vq_lines || winningVQ?.lines || winningVQ?.vqLines || []) as IHydrationVQLine[];

                // 🧪 [FINAL_DEBUG] Payload structure observer
                logger.info("💎 [FINAL_DEBUG] VQ Payload Structure:", {
                    vqHeaderId: winningVQ?.id || winningVQ?.vq_header_id,
                    keys: winningVQ ? Object.keys(winningVQ) : [],
                    actualLinesCount: actualVQLines.length,
                    lineSample: actualVQLines[0]
                });

                // 🔍 [VERBOSE_DEBUG] Identifying Naming mismatches
                logger.info("🛠️ [HYDRATION_DEBUG] Source Data Samples:", {
                    prSample: prLines[0],
                    vqSample: actualVQLines[0],
                    type
                });

                const mappedLines: POFormData['po_lines'] = await Promise.all(prLines.map(async (l: PRLine, index: number) => {
                    const hydrationLine = l as IHydrationPRLine;
                    const getItemCode = (line: PRLine) => String(line.item?.item_code || line.item_code || "");
                    
                    // 🛡️ DEEP ID EXCAVATION (Ultimate Guard): 
                    const getRobustItemId = (line: IHydrationPRLine, vqL?: IHydrationVQLine) => {
                        // 1. Try VQ Line Top Level (Most Accurate)
                        const vqId = vqL?.item_id || vqL?.product_id || vqL?.id;
                        if (vqId) return Number(vqId);

                        // 2. Try VQ Line Nested Object
                        const vqNestedId = vqL?.item?.item_id || vqL?.item?.id || vqL?.item?.product_id;
                        if (vqNestedId) return Number(vqNestedId);

                        // 3. Fallback to PR Line Top Level
                        const prId = line.item_id || line.id;
                        if (prId) return Number(prId);

                        // 4. Fallback to PR Line Nested Object
                        const prNestedId = line.item?.item_id || line.item?.id;
                        if (prNestedId) return Number(prNestedId);

                        return undefined;
                    };
                    
                    let finalUnitPrice = 0;
                    let discAmount = 0;
                    let discExpr = '0';
                    let vqLine: IHydrationVQLine | undefined;

                    if (type === 'QC' && winningVQ) {
                        // 🛡️ TRIPLE-CHECK MATCHING STRATEGY (Rule 1)
                        // Layer 1: Best Match (PR Line ID)
                        vqLine = actualVQLines.find((v: IHydrationVQLine) => v.pr_line_id && Number(v.pr_line_id) === Number(l.pr_line_id))
                            // Layer 2: Item Match
                            || actualVQLines.find((v: IHydrationVQLine) => v.item_id && Number(v.item_id) === Number(l.item_id || l.item?.item_id));

                        // 🛡️ INDEX-BASED FALLBACK: If matching failed, use same index (Aggressive Recovery)
                        if (!vqLine) {
                            vqLine = actualVQLines[index];
                            if (vqLine) {
                                logger.warn(`⚠️ [usePOForm] Match failed for PR Line ${index + 1}. Using Index-based Fallback.`);
                            }
                        }

                        if (vqLine) {
                            finalUnitPrice = Number(vqLine.unit_price || 0);
                            discAmount = Number(vqLine.discount_amount || 0);
                            discExpr = String(vqLine.discount_expression || '0');
                        } else {
                            // 🚫 Rule: ห้ามใช้ราคาประเมินจาก PR ในเคสที่สร้างจาก QC
                            finalUnitPrice = 0; 
                            logger.error(`❌ [usePOForm] VQ Line matching failed completely for PR Line ${index + 1}. PRICE SET TO 0.`, {
                                prLine: l,
                                totalVQLines: actualVQLines.length
                            });
                        }
                    } else {
                        // PR Flow: Use PR estimates
                        finalUnitPrice = Number(l.unit_price || l.est_unit_price || 0);
                        discExpr = String(l.line_discount_raw || '0');
                    }

                    // 🛡️ DATA INTEGRITY (Rule 3): All IDs/Prices must be Number()
                    const finalItemId = getRobustItemId(hydrationLine, vqLine);
                                        let finalCode = String(
                                            vqLine?.item_code || vqLine?.item?.item_code || 
                                            (vqLine as unknown as Record<string, unknown> | undefined)?.code || (vqLine?.item as unknown as Record<string, unknown> | undefined)?.code || 
                                            l.item?.item_code || l.item_code || 
                                            (l.item as unknown as Record<string, unknown> | undefined)?.code || (l as unknown as Record<string, unknown> | undefined)?.code || 
                                            getItemCode(l) || ''
                                        );

                                        if (!finalCode && finalItemId && finalItemId > 0) {
                        try {
                            const fetchedItem = await ItemMasterService.getById(Number(finalItemId));
                            if (fetchedItem?.item_code) {
                                finalCode = fetchedItem.item_code;
                            }
                        } catch (e) {
                            logger.error("[usePOForm] Async Item Fix failed", e);
                        }
                    }

                    return {
                        id: (finalItemId || 0) as number, // 🚀 Dual Mapping
                        item_id: (finalItemId || 0) as number,
                        code: finalCode, // 🚀 Dual Mapping
                        item_code: finalCode, 
                        line_no: index + 1,
                        item_name: String(vqLine?.item_name || vqLine?.item?.item_name || l.item_name || l.item?.item_name || ''), 
                        description: String(vqLine?.remark || vqLine?.item?.description || l.description || l.item_name || l.item?.item_name || ''), 
                        pr_line_id: Number(l.pr_line_id), // Ensure correct PR Line ID
                        status: 'OPEN' as const,
                        qty: Number(vqLine?.qty ?? l.qty) || 1, // Use VQ (Approved) Qty over PR (Requested) Qty
                        qty_ordered: Number(vqLine?.qty ?? l.qty) || 1,
                        uom_id: Number(vqLine?.uom_id || l.uom_id || l.item?.uom_id || 0) || 1, 
                        unit_price: Number(finalUnitPrice), 
                        discount_amount: Number(discAmount),
                        discount_expression: discExpr,
                        tax_code_id: vqLine?.tax_code_id ? Number(vqLine.tax_code_id) : (l.tax_code_id ? Number(l.tax_code_id) : Number(getValues('tax_code_id'))), 
                        required_receipt_type: (l.required_receipt_type as "FULL" | "PARTIAL") || 'FULL',
                        receipt_type: 'GOODS' as const,
                        line_total: Number((Number(l.qty || 0) * Number(finalUnitPrice)).toFixed(2)),
                    };
                }));

                // 🧪 [HYDRATION_DEBUG] Verification
                logger.info("🛠️ [HYDRATION_DEBUG] Hydrated Item IDs:", mappedLines.map(l => l.item_id));

                replace(mappedLines); 
                
                // 🧪 UI REFRESH (Rule 4): Force full validation state refresh
                setTimeout(() => {
                    trigger('po_lines');
                    // Ensure the form state recognizes the change
                    const currentLines = getValues('po_lines');
                    logger.info("💎 [FINAL_DEBUG] Hydrated State Check:", currentLines.map(cl => ({ id: cl.id, item_id: cl.item_id, code: cl.code })));
                }, 100);
            }
            
            toast(`เชื่อมโยงข้อมูลจาก ${fullPR.pr_no} สำเร็จ`, 'success');
        } catch (error) {
            logger.error('[usePOForm] handleSelectReferenceDoc error:', error);
            toast('ไม่สามารถดึงข้อมูลเอกสารต้นทางได้', 'error');
        } finally {
            setIsHydrating(false);
        }
    }, [setValue, getValues, replace, trigger, toast, currencies]);
    
    // ── Auto-Hydrate from Reference Doc on Create Mount ───────────────────────
    useEffect(() => {
        if (isOpen && !poId && initialValues?.pr_id) {
            const isQcFlow = !!initialValues?.qc_id || !!initialValues?.winning_vq_id;
            
            if (isQcFlow) {
                handleSelectReferenceDoc(
                    Number(initialValues.pr_id), 
                    'QC', 
                    initialValues.qc_id ? Number(initialValues.qc_id) : undefined, 
                    initialValues.vendor_id ? Number(initialValues.vendor_id) : undefined,
                    initialValues.winning_vq_id ? Number(initialValues.winning_vq_id) : undefined
                );
            } else {
                handleSelectReferenceDoc(Number(initialValues.pr_id), 'PR');
            }
        }
    }, [isOpen, initialValues?.pr_id, initialValues?.qc_id, initialValues?.winning_vq_id, initialValues?.vendor_id, handleSelectReferenceDoc, poId]);


    const handleSelectPR = useCallback((pr: PRHeader) => {
        handleSelectReferenceDoc(pr.pr_id, 'PR');
    }, [handleSelectReferenceDoc]);

    const handleSelectQC = useCallback((qc: { 
        qc_id: number; 
        qc_no: string; 
        pr_id: number; 
        pr_no: string; 
        vendor_id?: number; 
        vendor_name?: string 
    }) => {
        handleSelectReferenceDoc(qc.pr_id, 'QC');
    }, [handleSelectReferenceDoc]);


    /**
     * 🔍 Item Master Selector Handler
     * @description Receives selected item from Modal and updates line with Dual Mapping
     */
    const handleSelectItemMaster = useCallback((index: number, item: ItemSelectorResult) => {
        // 🧩 Fallback matching by Name string since Backend might omit ID fields
        const anyItem = item as any;
        const matchedUnit = units?.find(u => {
            const prodName = anyItem.uom_name || anyItem.unit_name || anyItem.base_uom_name || anyItem.sale_uom_name || '';
            if (!prodName) return false;
            return (u.uom_name === prodName) || (u.unit_name === prodName);
        });
        const finalUomId = Number(item.uom_id || item.unit_id || matchedUnit?.uom_id || matchedUnit?.unit_id || 0);

        update(index, {
            ...getValues(`po_lines.${index}`),
            id: Number(item.id || item.item_id),
            item_id: Number(item.id || item.item_id),
            code: String(item.item_code || item.code || ""),
            item_code: String(item.item_code || item.code || ""),
            description: String(item.item_name || item.description || ""),
            uom_id: finalUomId,
            unit_price: Number(item.standard_price || item.unit_price || 0),
        });
        
        // 🧪 UI ERROR CLEARANCE: Trigger validation immediately to clear red highlights
        setTimeout(() => trigger(`po_lines.${index}.item_id`), 100);
    }, [update, getValues, trigger, units]);

    // (handleSelectProduct removed as it's now handled by the component state)

    const [searchParams] = useSearchParams();

    // ── Smart Session Reset ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) {
            hasHydratedInitial.current = false;
            reset(); 
            logger.info("♻️ PO Form Session Reset: Memory & Data Cleared");
        }
    }, [isOpen, reset]);

    // ── Auto-Hydrate PR Logic (when selected from DocumentSourceSelector or URL) ────
    useEffect(() => {
        if (!isOpen || hasHydratedInitial.current || isHydrating) return;

        // Support both camelCase and snake_case URL parameters
        const sPrId = searchParams.get('sourcePrId') || searchParams.get('source_pr_id');
        const sQcId = searchParams.get('sourceQcId') || searchParams.get('source_qc_id');
        const sVqId = searchParams.get('winningVqId') || searchParams.get('winning_vq_id');
        const sVendorId = searchParams.get('vendorId') || searchParams.get('vendor_id');
        const sCreateFromQC = searchParams.get('createFromQC') === 'true' || searchParams.get('create_from_qc') === 'true';

        // Priority 1: URL Parameters (For direct deep links)
        // Priority 2: initialValues (For internal modal flow)
        const prId = sPrId ? Number(sPrId) : (initialValues?.pr_id || undefined);
        const qcId = sQcId ? Number(sQcId) : (initialValues?.qc_id || undefined);
        const vendorId = sVendorId ? Number(sVendorId) : (initialValues?.vendor_id || undefined);
        const winningVqId = sVqId ? Number(sVqId) : (initialValues?.winning_vq_id || undefined);
        const isQC = sCreateFromQC || !!qcId || !!winningVqId;

        // Auto-hydration logic for both PR and QC flows
        if (prId && getValues('po_lines').length === 0) {
            logger.debug("🚀 [usePOForm] Starting Auto-Hydration:", { prId, isQC });
            hasHydratedInitial.current = true; // Set flag immediately to prevent double-hits
            
            const type = isQC ? 'QC' : 'PR';
            handleSelectReferenceDoc(
                prId, 
                type, 
                qcId, 
                vendorId, 
                winningVqId
            );
        }
    }, [isOpen, initialValues, getValues, handleSelectReferenceDoc, isHydrating, searchParams]);

    const handleAddLine = useCallback(() => {
        const nextLineNo = fields.length + 1;
        append({
            line_no:         nextLineNo,
            item_id:         0,
            item_code:       '',
            item_name:       '',
            description:     '',
            pr_line_id:      null,
            status:          'OPEN',
            qty:             1,
            qty_ordered:     1,
            uom_id:          1,
            unit_price:      0,
            discount_amount: 0,
            discount_expression: '0',
            tax_code_id:     undefined,
            required_receipt_type: 'FULL',
            receipt_type:    'GOODS' as const,
            line_total:      0,
        });
    }, [append, fields.length]);

    // const { user } = useAuth(); (Moved to top)

    const handleConfirmSave = async () => {
        if (!pendingPayload) return;
        
        try {
            setIsSubmitting(true);
            
            // 🛡️ Data Integrity Guard: Strict Vendor ID Validation
            const safeVendorId = Number(pendingPayload.vendor_id);
            if (!safeVendorId || isNaN(safeVendorId) || safeVendorId <= 0) {
                throw new Error("Invalid Vendor ID. กรุณาเลือกผู้ขายที่ถูกต้องจากระบบ");
            }

            // 🧠 Safe Coercion Helper: Prevents NaN and treats 0/empty as undefined
            const safeId = (id: unknown): number | undefined => {
                if (id === null || id === undefined || id === "") return undefined;
                const num = Number(id);
                return isNaN(num) || num === 0 ? undefined : num;
            };

            // 🏷️ Calculation Summary (Matches UI POSummaryPanel strategy)
            const summaryItems = (pendingPayload.po_lines || []).map((l: POLine) => {
                const qty = Number(l.qty_ordered ?? l.qty ?? 0);
                const price = Number(l.unit_price ?? 0);
                const disc = parseDiscountAmount(l.discount_expression ?? '0', qty * price);
                return { qty, unit_price: price, discount: disc };
            });
            const selectedTax = taxCodes.find(t => Number(t.tax_code_id) === Number(pendingPayload.tax_code_id));
            const taxRate = selectedTax ? Number(selectedTax.tax_rate) : 0;
            const pricingSummary = calculatePricingSummary(summaryItems, taxRate, false);

            // STRICT PAYLOAD ARCHITECTURE (Aligned with Backend Contract 100%)
            const fullPayload: CreatePOPayload = {
                pr_id:              safeId(pendingPayload.pr_id),
                rfq_id:             safeId(pendingPayload.rfq_id),
                vendor_id:          Number(pendingPayload.vendor_id),
                branch_id:          Number(pendingPayload.branch_id),
                warehouse_id:       Number(pendingPayload.ship_to_warehouse_id),
                base_currency_code: pendingPayload.base_currency_code || "THB",
                quote_currency_code: pendingPayload.quote_currency_code || pendingPayload.currency_code || "THB",
                exchange_rate:      Number(pendingPayload.exchange_rate || 1),
                exchange_rate_date: pendingPayload.exchange_rate_date ? new Date(pendingPayload.exchange_rate_date).toISOString() : new Date().toISOString(),
                tax_code_id:        Number(pendingPayload.tax_code_id),
                discount_expression: pendingPayload.discount_expression || "0",
                status:             "DRAFT", // Hardcode DRAFT for new creation
                created_at:         new Date().toISOString(),
                created_by:         (poId ? (getValues('created_by') ? Number(getValues('created_by')) : undefined) : (user?.id ? Number(user.id) : undefined)) as unknown as number,
                winning_vq_id:      safeId(pendingPayload.winning_vq_id),
                qc_id:              safeId(pendingPayload.qc_id),
                qc_no:              pendingPayload.qc_no || undefined,
                
                // 💰 Pricing Summary Injection (Explictly cast to include summary fields for backend)
                ...({
                    subtotal:     Number(pricingSummary.subtotal || 0),
                    tax_amount:   Number(pricingSummary.taxAmount || 0),
                } as Record<string, unknown>),
                total_amount:       Number(pricingSummary.totalAmount || 0),

                po_lines: (pendingPayload.po_lines || []).map((item: POLine, index: number) => ({
                    line_no:        index + 1,
                    item_id:        Number(item.item_id),
                    pr_line_id:     safeId(item.pr_line_id),
                    status:         "OPEN",
                    qty:            Number(item.qty || item.qty_ordered || 0),
                    uom_id:         Number(item.uom_id),
                    unit_price:     Number(item.unit_price),
                    tax_code_id:    pendingPayload.tax_code_id !== undefined ? Number(pendingPayload.tax_code_id) : Number(item.tax_code_id),
                    discount_expression: String(item.discount_expression || "0"),
                    required_receipt_type: item.required_receipt_type || "FULL",
                    description:    String(item.description || "")
                }))
            };

            const cleanPayload = (obj: unknown): unknown => {
                if (Array.isArray(obj)) {
                    return obj.map(item => cleanPayload(item));
                }
                if (obj !== null && typeof obj === 'object') {
                    const newObj: Record<string, unknown> = {};
                    const entries = Object.entries(obj as Record<string, unknown>);
                    for (const [key, val] of entries) {
                        const v = val;
                        if (v === undefined || v === null || (typeof v === 'number' && isNaN(v))) {
                            continue;
                        }
                        newObj[key] = cleanPayload(v);
                    }
                    return newObj;
                }
                return obj;
            };

            const baseCleanedPayload = cleanPayload(fullPayload) as Record<string, unknown>;

            const finalizedPayload = baseCleanedPayload as unknown as CreatePOPayload;

            logger.info("FINAL_PO_PAYLOAD (Cleaned + Null Override):", finalizedPayload);

            if (poId) {
                // 🔄 UPDATE FLOW (Deep Scan Patch)
                logger.info(`[usePOForm] Updating existing PO: ${poId}`);
                
                // 🛡️ Data Integrity: Remove Forbidden properties, add Mandatory ones
                // Backend PATCH forbids 'created_by' but requires 'status', 'created_at', and 'updated_by'
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { created_by, ...patchCandidate } = finalizedPayload;
                
                const updatePayload = {
                    ...patchCandidate,
                    updated_by: Number(user?.id || 1), // 🛡️ Mandatory for PATCH
                    // Ensure these are present as the backend says "should not be empty"
                    status:     finalizedPayload.status || (existingPO as any)?.status || 'DRAFT',
                    created_at: finalizedPayload.created_at || (existingPO as any)?.created_at || new Date().toISOString(),
                };

                await POService.update(Number(poId), updatePayload as any);
            } else {
                CreatePOSchema.parse(finalizedPayload);
                await POService.create(finalizedPayload as unknown as CreatePOPayload);
            }

            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            toast('บันทึกใบสั่งซื้อสำเร็จ', 'success');

            setIsConfirmModalOpen(false);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: unknown) {
            logger.error('[usePOForm] handleConfirmSave error:', error);
            const errMsg = extractErrorMessage(error);
            toast(errMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSubmit: SubmitHandler<POFormData> = (data) => {
        if (!data.vendor_id || Number(data.vendor_id) <= 0) {
            toast('กรุณาระบุผู้จัดจำหน่าย (Vendor) ก่อนบันทึกใบสั่งซื้อ', 'error');
            return;
        }
        setPendingPayload(data);
        setIsConfirmModalOpen(true);
    };

    const onInvalidSubmit = (errors: FieldErrors<POFormData>) => {
        logger.error("Form Validation Errors:", errors);

        // Helper สำหรับดึง message จาก Object ลึกๆ
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const extractErrorMessages = (errs: any): string[] => {
            let messages: string[] = [];
            for (const key in errs) {
                const error = errs[key];
                if (error?.message && typeof error.message === 'string') {
                    // 🛡️ เพิ่มชื่อ Field เพื่อให้ Debug ง่ายขึ้น (เฉพาะตอน dev หรือ สำหรับ Admin)
                    const fieldName = key;
                    let msg = error.message;
                    
                    if (fieldName && !msg.includes(fieldName)) {
                        msg = `[${fieldName}] ${msg}`;
                    }

                    const lowerMsg = msg.toLowerCase();
                    if (lowerMsg.includes('invalid input') || lowerMsg.includes('expected number') || lowerMsg.includes('received string') || lowerMsg.includes('received nan')) {
                        msg = `[${fieldName}] กรุณาระบุข้อมูลตัวเลขให้ถูกต้อง`;
                    }
                    messages.push(msg);
                } else if (typeof error === 'object' && error !== null) {
                    messages = messages.concat(extractErrorMessages(error));
                }
            }
            return Array.from(new Set(messages));
        };

        const errorMessages = extractErrorMessages(errors);

        if (errorMessages.length > 0) {
            const ErrorToastUI = () => React.createElement('div', { className: 'flex flex-col gap-1' },
                React.createElement('span', { className: 'font-semibold text-sm' }, 'ตรวจสอบข้อมูลไม่ผ่าน:'),
                React.createElement('ul', { className: 'list-disc pl-4 text-xs' },
                    errorMessages.map((msg: string, i: number) => React.createElement('li', { key: i }, msg))
                )
            );
            toast(React.createElement(ErrorToastUI), 'error');
        } else {
            toast("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน", 'error');
        }
    };

    return {
        // Form
        formMethods,
        control,
        register,
        handleSubmit,
        errors,
        fields,
        append,
        remove,
        setValue,
        
        // Watched values
        watchVendorName,
        watchPrNo,
        watchCurrencyCode,
        watchIsMulticurrency,
        
        // Handlers
        handleVendorSelect,
        handleSelectPR,
        handleSelectQC,
        handleSelectReferenceDoc,
        handleAddLine,
        onSubmit,
        onInvalidSubmit,
        handleConfirmSave,
        
        // Modal states
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        isSubmitting,
        isVendorModalOpen,
        setIsVendorModalOpen,
        isQCModalOpen,
        setIsQCModalOpen,
        isPRModalOpen,
        setIsPRModalOpen,
        isHydrating,
        
        // Data
        branches,
        isLoadingBranches,
        taxCodes,
        isLoadingTaxCodes,
        units,
        isLoadingUnits,
        currencies,
        isLoadingCurrencies,
        
        // Handlers
        handleSelectItemMaster,

        // Initial Data for UI (Conditional disabling logic)
        isInherited: !!initialValues?.rfq_id || !!initialValues?.winning_vq_id,
        isViewMode,
    };
};