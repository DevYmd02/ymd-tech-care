import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, useWatch, type Resolver, type Path, type PathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { MasterDataService } from '@master-data';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { UnitService } from '@inventory/services/unit.service';
import { TaxCodeService } from '@master-data/tax/services/tax-code.service';
import type { Currency } from '@master-data/types/master-data-types';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import type { ItemListItem, UnitListItem } from '@inventory/types/product-types';
import type { TaxCode } from '@master-data/tax/types/tax-types';
import { QuotationFormSchema, type QuotationFormValues, type QuotationLineValues, getQuotationDefaultValues } from '@sales/quotation/schemas/quotation-schemas';
import type { EstimateHeader } from '@sales/estimate/services/estimate.service';
import { PricingService } from '@sales/quotation/services/pricing.service';
import { QuotationService } from '@sales/quotation/services/quotation.service';
import type { QuotationFormData, QuotationHeader, RawQuotationLine } from '@sales/quotation/types/quotation.types';
import { ItemMasterService } from '@inventory/services/item-master.service';
import { logger } from '@utils';
import { useAuth } from '@core/auth/contexts/AuthContext';
import { 
    calculateDiscountAmount, 
    calculateVatAmount, 
    calculateNetTotal,
    calculateLineTotal 
} from '@sales/shared/utils/sales-calculations';
import { useQuotationModals } from './useQuotationModals';

export const useQuotationForm = (isOpen: boolean, id?: string, initialData?: QuotationHeader) => {
    const isEdit = !!id;
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 🏷️ Extracted Modal States
    const modals = useQuotationModals();
    
    // Pricing State
    const [loadingPriceLines, setLoadingPriceLines] = useState<Set<number>>(new Set());
    
    // 🛡️ Refs to track header changes for pricing synchronization
    const lastCustomerRef = useRef<number | null>(null);
    const lastBranchRef = useRef<number | null>(null);
    
    // React Hook Form Setup
    const methods = useForm<QuotationFormValues>({
        resolver: zodResolver(QuotationFormSchema) as Resolver<QuotationFormValues>,
        defaultValues: getQuotationDefaultValues(),
        mode: 'onBlur',
    });

    const { setValue, reset, control, getValues, handleSubmit } = methods;
    // 📺 Performance Optimization: Granular Watch instead of Global Watch
    const watchedSummary = useWatch({
        control,
        name: [
            'sq_no',
            'status',
            'sub_total',
            'discount_expression',
            'discount_amount',
            'vat_amount',
            'total_amount',
            'currency_code',
            'base_currency_code',
            'tax_code_id'
        ]
    });

    const [
        sq_no, status, sub_total, discount_expression, 
        discount_amount, vat_amount, total_amount, 
        currency_code, base_currency_code, tax_code_id
    ] = watchedSummary;

    const formData = {
        sq_no, status, sub_total, discount_expression,
        discount_amount, vat_amount, total_amount,
        currency_code, base_currency_code, tax_code_id
    };

    // 🏗️ Check if we already have sufficient data to skip fetching
    const hasInitialLines = !!(isOpen && initialData && initialData.lines && (initialData.lines as QuotationLineValues[]).length > 0);

    // Data Fetching (Detail)
    const { 
        data: quotationDetail, 
        isLoading: isLoadingDetail,
        isError: isDetailError,
        error: detailError
    } = useQuery<QuotationFormData | null>({
        queryKey: ['quotation-detail', id],
        queryFn: () => id ? QuotationService.getById(id) : null,
        enabled: !!id && isOpen, // Allow detail query to run!
        staleTime: 1000 * 60 * 5,
    });

    // 🧪 Diagnostic logging for the USER
    useEffect(() => {
        if (isDetailError) {
            logger.error(`❌ [QuotationForm] Failed to fetch ID: ${id}`, detailError);
        }
    }, [isDetailError, detailError, id]);

    /**
     * 🕵️ Smart Recovery: Automatically detect price sources for old records
     */
    const recoverMissingPriceSources = useCallback(async (lines: QuotationLineValues[], customerId: number, branchId: number) => {
        if (!lines || lines.length === 0 || !customerId || !branchId) return;

        logger.info('🔍 [QuotationForm] Recovering price sources for existing records...');
        
        const updatedLines = [...lines];
        let hasChanges = false;

        // Process all lines that are missing a clear system source
        const promises = updatedLines.map(async (line, index) => {
            // Already has a source that isn't Manual (could be from previous recovery or fresh save)
            if (line.price_source_name && line.price_source_name !== 'MANUAL') return;

            try {
                const result = await PricingService.calculatePrice({
                    itemId: line.item_id,
                    qty: line.qty,
                    customerId,
                    branchId
                });

                if (result) {
                    // Match found! (Allow for small precision differences)
                    const priceDiff = Math.abs(Number(result.unitPrice) - Number(line.unit_price));
                    if (priceDiff < 0.01) {
                        updatedLines[index] = {
                            ...line,
                            price_source: result.source,
                            price_source_name: result.sourceName,
                            price_level_priority: result.priority
                        };
                        hasChanges = true;
                    } else {
                        // Prices differ, explicitly mark as MANUAL
                        updatedLines[index] = {
                            ...line,
                            price_source_name: 'MANUAL'
                        };
                        hasChanges = true;
                    }
                }
            } catch (err) {
                logger.warn(`[QuotationForm] Price recovery failed for line ${index}`, err);
            }
        });

        await Promise.all(promises);

        if (hasChanges) {
            // Update form state silently
            setValue('lines', updatedLines, { shouldDirty: false });
            logger.info('✨ [QuotationForm] Price sources recovered successfully');
        }
    }, [setValue]);

    /**
     * ✨ Enrichment: Fetch and fill missing item details (code/name)
     */
    const enrichLinesWithItemData = useCallback(async (lines: QuotationLineValues[]) => {
        if (!lines || lines.length === 0) return;

        // Collect unique item_ids that are missing code or name
        const missingIds = [...new Set(
            lines
                .filter(l => l.item_id && (!l.item_code || l.item_code === ''))
                .map(l => Number(l.item_id))
        )];

        if (missingIds.length === 0) {
            logger.info('✅ [QuotationForm] All lines already have item codes/names. Skipping enrichment.');
            return;
        }

        logger.info(`🔍 [QuotationForm] Enriching ${missingIds.length} items:`, missingIds);
        
        try {
            // Small delay to let reset() settle
            await new Promise(resolve => setTimeout(resolve, 100));

            // Fetch all in parallel
            const results = await Promise.allSettled(
                missingIds.map(itemId => ItemMasterService.getById(itemId))
            );

            // Build id → {code, name} map
            const itemMap = new Map<number, { item_code: string; item_name: string }>();
            results.forEach((result, i) => {
                if (result.status === 'fulfilled' && result.value) {
                    const data = result.value;
                    itemMap.set(missingIds[i], {
                        item_code: data.item_code || '',
                        item_name: data.item_name || '',
                    });
                } else {
                    logger.warn(`⚠️ [QuotationForm] Failed to fetch item detail for ID: ${missingIds[i]}`);
                }
            });

            // Patch back into form
            const currentLines = getValues('lines');
            currentLines.forEach((line, idx) => {
                const itemId = Number(line.item_id);
                const found = itemMap.get(itemId);
                if (found) {
                    setValue(`lines.${idx}.item_code`, found.item_code, { shouldDirty: false });
                    setValue(`lines.${idx}.item_name`, found.item_name, { shouldDirty: false });
                    logger.debug(`✅ [QuotationForm] Enriched line ${idx} with: ${found.item_code}`);
                }
            });
        } catch (err) {
            logger.error('[QuotationForm] Enrichment process failed:', err);
        }
    }, [setValue, getValues]);

    // 🛡️ Initialization Guard to prevent reset loops
    const lastInitializedId = useRef<string | null | 'new'>(null);
    const defaultValues = useMemo(() => getQuotationDefaultValues(), []);

    // 🧪 Helper to convert API data to Form data
    const mapApiToForm = useCallback((apiData: QuotationFormData): QuotationFormValues => {
        const toFormDate = (dateStr?: string | null) => {
            if (!dateStr) return '';
            // If it contains T, split it. Otherwise use as is.
            return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        };

        return {
            sq_id: String(apiData.sq_id || ''),
            sq_no: apiData.sq_no || '',
            sq_date: toFormDate(apiData.sq_date),
            lead_id: apiData.lead_id || null,
            customer_id: Number(apiData.customer_id || 0),
            branch_id: apiData.branch_id ? Number(apiData.branch_id) : 0,
            currency_code: apiData.currency_code || 'THB',
            isMulticurrency: apiData.isMulticurrency === true || (!!apiData.sq_id && !!apiData.base_currency_code),
            base_currency_code: apiData.base_currency_code && apiData.base_currency_code !== '' ? apiData.base_currency_code : 'THB',
            quote_currency_code: apiData.quote_currency_code && apiData.quote_currency_code !== '' ? apiData.quote_currency_code : 'THB',
            exchange_rate: Number(apiData.exchange_rate || 1),
            exchange_rate_date: toFormDate(apiData.exchange_rate_date),
            status: ((apiData.status || '').toUpperCase() as QuotationFormValues['status']) || 'DRAFT',
            valid_until: toFormDate(apiData.valid_until),
            sub_total: Number(apiData.sub_total || 0),
            discount_expression: apiData.discount_expression || '0',
            discount_amount: Number(apiData.discount_amount || 0),
            vat_amount: Number(apiData.vat_amount || 0),
            total_amount: Number(apiData.total_amount || 0),
            remarks: apiData.remarks || '',
            payment_term_days: Number(apiData.payment_term_days || 0),
            onhold: (apiData.onhold === 'Y' ? 'Y' : 'N') as QuotationFormValues['onhold'],
            tax_code_id: apiData.tax_code_id ? Number(apiData.tax_code_id) : 0,
            item_id: apiData.item_id ? Number(apiData.item_id) : 0,
            sale_area_id: apiData.sale_area_id !== undefined
                ? Number(apiData.sale_area_id)
                : Number((apiData as unknown as Record<string, unknown>).emp_area_id || 0),
            emp_sale_id: apiData.emp_sale_id ? Number(apiData.emp_sale_id) : 0,
            emp_dept_id: apiData.emp_dept_id ? Number(apiData.emp_dept_id) : 0,
            project_id: apiData.project_id ? Number(apiData.project_id) : 0,
            sq_status: apiData.sq_status || '',
            status_remark: apiData.status_remark || '',
            lines: (apiData.lines || []).map(lineRaw => {
                const line = lineRaw as RawQuotationLine;
                const qty = Number(line.qty || 0);
                const unitPrice = Number(line.unit_price || 0);
                const discountInput = line.line_discount_input || line.discount_expression || '0';
                let calcDiscount = Number(line.line_discount || 0);
                
                // Fallback discount calculation if the backend didn't do it
                if (calcDiscount === 0 && discountInput && discountInput !== '0') {
                    if (discountInput.endsWith('%')) {
                        calcDiscount = (qty * unitPrice) * (parseFloat(discountInput) / 100);
                    } else {
                        calcDiscount = parseFloat(discountInput);
                    }
                }
                
                const lineTotal = Number(line.line_total) || ((qty * unitPrice) - calcDiscount);
                
                return {
                    sq_line_id: String(line.sq_line_id || ''),
                    sq_id: String(line.sq_id || ''),
                    item_id: Number(line.item_id || 0),
                    item_code: line.item_code || '',
                    item_name: line.item_name || '',
                    qty: qty,
                    uom_id: Number(line.uom_id || 0),
                    unit_price: unitPrice,
                    discount_expression: discountInput,
                    line_discount: calcDiscount,
                    tax_code_id: line.tax_code_id ? Number(line.tax_code_id) : null,
                    line_total: lineTotal,
                    note: line.note || '',
                    price_source: (line.price_source !== undefined ? Number(line.price_source) : (line.source !== undefined ? Number(line.source) : undefined)),
                    price_source_name: (() => {
                        const name = line.price_source_name || line.source_name || line.sourceName || '';
                        let final = name ? name.toUpperCase().replace(/\s+/g, '_') : '';
                        
                        // Fallback fallback if name is missing but source ID exists
                        if (!final && line.price_source !== undefined) {
                            const v = Number(line.price_source);
                            if (v === 1) final = 'PRICE_LIST';
                            else if (v === 2) final = 'PRICE_LEVEL';
                            else if (v === 3) final = 'MANUAL';
                        }
                        
                        return final || undefined;
                    })(),
                    price_level_priority: (line.price_level_priority || line.priority) ? Number(line.price_level_priority || line.priority) : undefined,
                };
            })
        };
    }, []);
    
    // Data Fetching (Master Data)
    const { data: branches = [] } = useQuery({
        queryKey: ['master-branches'],
        queryFn: MasterDataService.getBranches,
        enabled: isOpen
    });

    const { data: currencies = [] } = useQuery<Currency[]>({
        queryKey: ['master-currencies'],
        queryFn: MasterDataService.getCurrencies,
        enabled: isOpen
    });

    const { data: customerResponse } = useQuery({
        queryKey: ['master-customers'],
        queryFn: () => CustomerService.getList({ limit: 100 }),
        enabled: isOpen
    });
    const customers = customerResponse?.data || [];

    const { data: taxCodes = [] } = useQuery<TaxCode[]>({
        queryKey: ['master-tax-codes'],
        queryFn: TaxCodeService.getTaxCodes,
        enabled: isOpen
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['master-departments'],
        queryFn: MasterDataService.getDepartments,
        enabled: isOpen
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['master-projects'],
        queryFn: MasterDataService.getProjects,
        enabled: isOpen
    });

    const { data: saleAreas = [] } = useQuery({
        queryKey: ['master-sale-areas'],
        queryFn: () => MasterDataService.getSaleAreas(),
        enabled: isOpen,
    });

    const { data: allEmployees = [] } = useQuery({
        queryKey: ['master-employees'],
        queryFn: () => MasterDataService.getEmployees(),
        enabled: isOpen,
    });

    const employees = useMemo(() => 
        allEmployees.filter(emp => emp.emp_type?.toString().trim() === 'S'),
    [allEmployees]);
    
    const { data: priceLevelNames = [] } = useQuery({
        queryKey: ['master-price-level-names'],
        queryFn: () => MasterDataService.getPriceLevelNames(),
        enabled: isOpen,
    });

    const { data: uomResponse } = useQuery({
        queryKey: ['master-units'],
        queryFn: () => UnitService.getAll({ limit: 1000 }),
        enabled: isOpen
    });
    const uoms = useMemo(() => uomResponse?.items || [], [uomResponse]);

    // 🔄 Syncing with Fetched/Initial Data
    useEffect(() => {
        if (!isOpen) {
            // 🧹 Explicit Cleanup: Reset form when modal closes
            if (lastInitializedId.current !== null) {
                logger.info('🧹 [QuotationForm] Modal closed. Resetting form to defaults.');
                reset(getQuotationDefaultValues());
            }
            lastInitializedId.current = null;
            return;
        }

        // 🏗️ Step 0: Ensure critical master data is loaded before initializing form.
        // This prevents dropdowns from showing "-- เลือก --" because the ID has no matching option yet.
        const isMasterDataReady = (
            (branches?.length > 0 || !isOpen) && 
            (taxCodes?.length > 0 || !isOpen) && 
            (departments?.length > 0 || !isOpen) &&
            (uoms?.length > 0 || !isOpen)
        );

        if (isOpen && !isMasterDataReady) {
            logger.debug('⏳ [QuotationForm] Waiting for master data...', { 
                branches: branches?.length, 
                taxCodes: taxCodes?.length, 
                uoms: uoms?.length 
            });
            return;
        }

        // Mode 1: Data-Reuse (Prefer initialData if it includes lines)
        if (hasInitialLines && !quotationDetail) {
            const currentTargetId = id || 'initial';
            if (lastInitializedId.current === currentTargetId) return;

            logger.info('🎯 [QuotationForm] Using Data-Reuse Pattern (from List)');
            
            // 🏗️ Reconstruct full payload using rawData to preserve all fields not in the list interface
            const raw = initialData.rawData || {};
            const linesToUse = initialData.lines || raw.saleQuotationLines || raw.lines || [];
            
            const constructedPayload: QuotationFormData = {
                ...raw, // Spread all hidden fields like branch_id, project_id, etc.
                sq_id: initialData.sq_id,
                sq_no: initialData.sq_no,
                sq_date: initialData.date || (raw.sq_date as string) || '',
                lines: linesToUse as RawQuotationLine[]
            } as QuotationFormData;

            const mappedData = mapApiToForm(constructedPayload);
            logger.info('📦 [QuotationForm] Initial Mapped Data:', mappedData);
            reset(mappedData);
            lastInitializedId.current = currentTargetId;
            // 🕵️ Recovery: Detect price sources for the loaded data
            void recoverMissingPriceSources(mappedData.lines, Number(mappedData.customer_id), Number(mappedData.branch_id));
            // Enrich lines if item_code is missing
            void enrichLinesWithItemData(mappedData.lines || []);
            return;
        }

        // Mode 2: Standard Fetch (If no initial data or when detail data arrives)
        const currentTarget = id || 'new';

        if (isOpen && (lastInitializedId.current !== currentTarget || quotationDetail)) {
            if (id && quotationDetail) {
                const detailId = 'detail-' + currentTarget;
                if (lastInitializedId.current === detailId) return;

                const mappedData = mapApiToForm(quotationDetail);
                reset(mappedData);
                lastInitializedId.current = detailId;
                // 🕵️ Recovery: Detect price sources for the loaded detail
                void recoverMissingPriceSources(mappedData.lines, Number(mappedData.customer_id), Number(mappedData.branch_id));
                // Enrich lines if item_code is missing
                void enrichLinesWithItemData(mappedData.lines || []);
            } else if (!id && lastInitializedId.current !== currentTarget) {
                // 🛡️ Rescue: Ensure types match QuotationFormValues (convert ID strings to numbers)
                const mergedValues: QuotationFormValues = initialData ? { 
                    ...defaultValues, 
                    sq_id: String(initialData.sq_id || ''),
                    sq_no: initialData.sq_no || '',
                    sq_date: initialData.date || defaultValues.sq_date,
                    customer_id: Number(initialData.customer_id || 0),
                    branch_id: Number(initialData.branch_id || 0),
                    status: (initialData.status as QuotationFormValues['status']) || 'DRAFT',
                    valid_until: initialData.expiry_date || defaultValues.valid_until,
                    sale_area_id: Number(initialData.sale_area_id || initialData.emp_area_id || 0),
                    emp_sale_id: Number(initialData.emp_sale_id || 0),
                    emp_dept_id: Number(initialData.emp_dept_id || 0),
                    project_id: Number(initialData.project_id || 0),
                    lines: (initialData.lines || []).map(l => ({
                        ...l,
                        sq_id: String(l.sq_id || ''),
                        sq_line_id: String(l.sq_line_id || ''),
                        item_id: Number(l.item_id || 0),
                        uom_id: Number(l.uom_id || 0),
                    })) as QuotationLineValues[]
                } : defaultValues;

                if (!mergedValues.base_currency_code || mergedValues.base_currency_code === '') mergedValues.base_currency_code = 'THB';
                if (!mergedValues.quote_currency_code || mergedValues.quote_currency_code === '') mergedValues.quote_currency_code = 'THB';
                
                reset(mergedValues);
                lastInitializedId.current = currentTarget;
            }
        }
    }, [
        isOpen, 
        initialData, 
        reset, 
        defaultValues, 
        id, 
        quotationDetail, 
        mapApiToForm, 
        hasInitialLines, 
        setValue, 
        recoverMissingPriceSources, 
        enrichLinesWithItemData,
        branches?.length,
        taxCodes?.length,
        uoms?.length,
        departments?.length,
        projects?.length,
        saleAreas?.length,
        employees?.length,
        user?.employee_id
    ]);

    // ========================================================================
    // CALCULATIONS & SYNC LOGIC
    // ========================================================================

    // 1. Exchange Rate Sync Logic
    const isMulti = useWatch({ control, name: 'isMulticurrency' });
    const sourceCurrency = useWatch({ control, name: 'base_currency_code' });
    const targetCurrency = useWatch({ control, name: 'quote_currency_code' });

    useEffect(() => {
        if (currencies.length > 0) {
            const currentBase = getValues('base_currency_code');
            const currentQuote = getValues('quote_currency_code');

            if (!currentBase || currentBase === '') {
                setValue('base_currency_code', 'THB', { shouldValidate: true, shouldDirty: false });
            }
            if (isMulti && (!currentQuote || currentQuote === '')) {
                setValue('quote_currency_code', 'THB', { shouldValidate: true, shouldDirty: false });
            }
        }

        if (!sourceCurrency || !isMulti) return;

        if (sourceCurrency === 'THB' || sourceCurrency === targetCurrency) {
            setValue('exchange_rate', 1, { shouldDirty: false });
            return;
        }

        const safeCurrencies = Array.isArray(currencies) ? currencies : [];
        const sourceObj = safeCurrencies.find((c: Currency) => c.currency_code === sourceCurrency);
        const targetObj = safeCurrencies.find((c: Currency) => c.currency_code === targetCurrency);

        const fromRate = sourceObj?.exchange_rate || 1;
        const toRate = targetObj?.exchange_rate || (targetCurrency === 'THB' ? 1 : 1);

        const calculatedRate = fromRate / toRate;
        
        if (calculatedRate !== undefined && !isNaN(calculatedRate)) {
            setValue('exchange_rate', Number(calculatedRate.toFixed(6)), { shouldValidate: true });
        }
    }, [currencies, sourceCurrency, targetCurrency, setValue, isMulti, getValues]);

    // 2. Automated Calculations (Subtotal, VAT, Discount, Total)
    const lineIndices = (getValues('lines') || []).map((_, i) => i);
    const watchedLineTotals = useWatch({
        control,
        name: lineIndices.map(i => `lines.${i}.line_total` as Path<QuotationFormValues>)
    });
    
    const discountExpression = useMemo(() => discount_expression || '', [discount_expression]);
    const taxCodeId = useMemo(() => tax_code_id, [tax_code_id]);

    useEffect(() => {
        // Line Totals & Header Subtotal
        const currentSubTotal = getValues('sub_total');
        const calculatedSubTotal = (watchedLineTotals as (string | number | undefined)[] || []).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
        
        if (currentSubTotal !== calculatedSubTotal) {
            setValue('sub_total', calculatedSubTotal, { shouldValidate: true });
        }

        // Header Discount
        const calculatedDiscount = calculateDiscountAmount(calculatedSubTotal, discountExpression);
        if (getValues('discount_amount') !== calculatedDiscount) {
            setValue('discount_amount', calculatedDiscount, { shouldValidate: true });
        }

        // VAT Calculation (Calculated on SubTotal AFTER Discount)
        const safeTaxCodes = Array.isArray(taxCodes) ? taxCodes : [];
        const selectedTaxCode = safeTaxCodes.find(t => String(t.tax_code_id) === String(taxCodeId));
        const taxRate = selectedTaxCode ? (Number(selectedTaxCode.tax_rate) || 0) : 0;
        
        const amountAfterDiscount = calculatedSubTotal - calculatedDiscount;
        const vatAmountValue = calculateVatAmount(amountAfterDiscount, taxRate);
        
        if (getValues('vat_amount') !== vatAmountValue) {
            setValue('vat_amount', vatAmountValue, { shouldValidate: true });
        }

        // Final Total
        const totalAmountValue = calculateNetTotal(calculatedSubTotal, calculatedDiscount, vatAmountValue);
        if (getValues('total_amount') !== totalAmountValue) {
            setValue('total_amount', totalAmountValue, { shouldValidate: true });
        }

    }, [watchedLineTotals, discountExpression, taxCodeId, taxCodes, setValue, getValues]);

    // --------------------------------------------------------
    // Tax Propagation Logic
    // --------------------------------------------------------
    useEffect(() => {
        if (taxCodeId !== undefined) {
             const currentLines = getValues('lines') || [];
             const needsUpdate = currentLines.some(l => Number(l.tax_code_id) !== Number(taxCodeId));
             if (needsUpdate) {
                 const updatedLines = currentLines.map(l => ({
                     ...l,
                     tax_code_id: taxCodeId
                 }));
                 setValue('lines', updatedLines as QuotationLineValues[], { shouldDirty: true });
             }
        }
    }, [taxCodeId, setValue, getValues]);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    const handleAddLine = useCallback(() => {
        const newLine: QuotationLineValues = { 
            item_id: 0, 
            item_code: '', 
            item_name: '', 
            qty: 0, 
            uom_id: 0, 
            unit_price: 0, 
            discount_expression: '',
            line_discount: 0, 
            line_total: 0, 
            tax_code_id: taxCodeId || undefined,
            note: '',
        };
        const currentLines = getValues('lines') || [];
        setValue('lines', [...currentLines, newLine]);
    }, [setValue, getValues, taxCodeId]);

    const handleRemoveLine = useCallback((index: number) => {
        const currentLines = getValues('lines') || [];
        setValue('lines', currentLines.filter((_, i) => i !== index));
    }, [setValue, getValues]);

    const handleLineChange = useCallback((index: number, field: keyof QuotationLineValues, value: string | number) => {
        const path = `lines.${index}.${field}` as const;
        
        // 🛡️ CRITICAL: Don't validate on every keystroke for fields being typed in.
        // This prevents Zod's coerce.number() from "bouncing" (e.g. converting "50." to 50 immediately).
        // Validation will happen on blur because form mode is set to 'onBlur'.
        const noValidateFields = ['qty', 'unit_price', 'discount_expression', 'note'];
        const shouldValidate = !noValidateFields.includes(field);
        
        setValue(path, value as PathValue<QuotationFormValues, typeof path>, { 
            shouldValidate, 
            shouldDirty: true,
            shouldTouch: true
        });

        // Recalculate Line Total if dependent fields change
        if (field === 'qty' || field === 'unit_price' || field === 'discount_expression') {
            const line = getValues(`lines.${index}`);
            if (!line) return;

            const qty = Number(field === 'qty' ? value : line.qty) || 0;
            const price = Number(field === 'unit_price' ? value : line.unit_price) || 0;
            const ldInput = (field === 'discount_expression' ? (value as string) : line.discount_expression) || '';
            
            const calculatedLD = calculateDiscountAmount(qty * price, ldInput);
            const lineTotal = calculateLineTotal(qty, price, calculatedLD);

            // Use targeted updates for dependent fields too
            setValue(`lines.${index}.line_discount`, calculatedLD);
            setValue(`lines.${index}.line_total`, lineTotal);

            // If user manually changed the unit_price, clear the system source
            if (field === 'unit_price') {
                setValue(`lines.${index}.price_source`, undefined);
                setValue(`lines.${index}.price_source_name`, 'MANUAL');
            }
        }
    }, [setValue, getValues]);

    const handleLinePriceSync = useCallback(async (index: number) => {
        const currentLines = getValues('lines') || [];
        const line = currentLines[index];
        const { branch_id, customer_id } = getValues();

        if (!line?.item_id || !line.qty || !branch_id || !customer_id) return;

        setLoadingPriceLines(prev => new Set(prev).add(index));

        try {
            const resolvedPrice = await PricingService.calculatePrice({
                itemId: line.item_id,
                qty: Number(line.qty),
                branchId: branch_id,
                customerId: customer_id
            });

            if (resolvedPrice) {
                const updatedLines = [...(getValues('lines') || [])];
                if (!updatedLines[index]) return;
                
                const updatedLine = { ...updatedLines[index] };
                const newPrice = Number(resolvedPrice.unitPrice);
                const currentPrice = Number(updatedLine.unit_price || 0);

                // 🛡️ Defensive Check: Only overwrite if new price is valid or current is 0
                if (newPrice > 0 || currentPrice === 0) {
                    updatedLine.unit_price = newPrice;
                    updatedLine.price_source = resolvedPrice.source;
                    updatedLine.price_source_name = resolvedPrice.sourceName;
                    updatedLine.price_level_priority = resolvedPrice.priority;

                    // Re-calc line discount and total
                    const qty = Number(updatedLine.qty) || 0;
                    const discExpr = updatedLine.discount_expression || '';
                    const calculatedLD = calculateDiscountAmount(qty * newPrice, discExpr);
                    
                    updatedLine.line_discount = calculatedLD;
                    updatedLine.line_total = calculateLineTotal(qty, newPrice, calculatedLD);

                    updatedLines[index] = updatedLine;
                    setValue('lines', updatedLines, { shouldValidate: true, shouldDirty: true });
                }
            }
        } finally {
            setLoadingPriceLines(prev => {
                const next = new Set(prev);
                next.delete(index);
                return next;
            });
        }
    }, [getValues, setValue]);
    
    /**
     * 🔄 Batch Sync: Refreshes all line prices when Customer or Branch changes
     */
    const refreshAllLinePrices = useCallback(async () => {
        const values = getValues();
        const branch_id = Number(values.branch_id || 0);
        const customer_id = Number(values.customer_id || 0);
        const lines = values.lines || [];

        if (lines.length === 0) return;

        logger.info('🔄 [QuotationForm] Header changed. Synchronizing line prices...', { customer_id, branch_id });
        
        const updatedLines = [...lines];
        let hasChanges = false;

        const promises = updatedLines.map(async (line, index) => {
            if (!line.item_id || line.item_id === 0) return;

            // Case A: Missing Header Data -> Reset system sources
            if (customer_id === 0 || branch_id === 0) {
                if (line.price_source_name && line.price_source_name !== 'MANUAL') {
                    updatedLines[index] = {
                        ...line,
                        price_source: undefined,
                        price_source_name: undefined, // Clears the "Price Level/List" badge
                    };
                    hasChanges = true;
                }
                return;
            }

            // Case B: Header Data Present -> Fetch from Pricing Engine
            try {
                const result = await PricingService.calculatePrice({
                    itemId: line.item_id,
                    qty: Number(line.qty) || 1,
                    branchId: branch_id,
                    customerId: customer_id
                });

                if (result) {
                    const price = Number(result.unitPrice);
                    const qty = Number(line.qty) || 1;
                    const discExpr = line.discount_expression || '';
                    
                    // 🛡️ Defensive Check: Only overwrite if the pricing engine found a valid non-zero price
                    // OR if the current price is already 0. We don't want to overwrite a manual price with 0
                    // if the pricing engine simply doesn't have a rule for this item.
                    const currentPrice = Number(line.unit_price || 0);
                    const isNewPriceValid = price > 0;
                    
                    if (isNewPriceValid || currentPrice === 0) {
                        const calcDiscount = calculateDiscountAmount(qty * price, discExpr);
                        updatedLines[index] = {
                            ...line,
                            unit_price: price,
                            price_source: result.source,
                            price_source_name: result.sourceName,
                            price_level_priority: result.priority,
                            line_discount: calcDiscount,
                            line_total: calculateLineTotal(qty, price, calcDiscount)
                        };
                        hasChanges = true;
                    } else {
                        // Pricing engine returned 0 but we already have a manual/previous price.
                        // We should at least clear the "Price List/Level" source if it was from the OLD customer.
                        if (line.price_source_name && line.price_source_name !== 'MANUAL') {
                            updatedLines[index] = {
                                ...line,
                                price_source: undefined,
                                price_source_name: undefined,
                            };
                            hasChanges = true;
                        }
                    }
                } else {
                    // No specific price found for this customer/branch combination
                    if (line.price_source_name && line.price_source_name !== 'MANUAL') {
                        updatedLines[index] = {
                            ...line,
                            price_source: undefined,
                            price_source_name: undefined,
                        };
                        hasChanges = true;
                    }
                }
            } catch (err) {
                logger.warn(`[QuotationForm] Price refresh failed for line ${index}`, err);
            }
        });

        await Promise.all(promises);

        if (hasChanges) {
            setValue('lines', updatedLines, { shouldValidate: true, shouldDirty: true });
            logger.info('✨ [QuotationForm] Line prices synchronized with header changes');
        }
    }, [getValues, setValue]);

    // 🕵️ Watcher: Trigger price sync when Customer or Branch changes
    const watchedCustomerId = useWatch({ control, name: 'customer_id' });
    const watchedBranchId = useWatch({ control, name: 'branch_id' });

    useEffect(() => {
        const cId = Number(watchedCustomerId || 0);
        const bId = Number(watchedBranchId || 0);

        // Run whenever either field changes from its previous value
        const hasCustomerChanged = lastCustomerRef.current !== null && lastCustomerRef.current !== cId;
        const hasBranchChanged = lastBranchRef.current !== null && lastBranchRef.current !== bId;

        if (hasCustomerChanged || hasBranchChanged) {
            void refreshAllLinePrices();
        }

        // Keep track of current state
        lastCustomerRef.current = cId;
        lastBranchRef.current = bId;
    }, [watchedCustomerId, watchedBranchId, refreshAllLinePrices]);

    const handleSelectCustomer = useCallback((customer: CustomerMaster) => {
        setValue('customer_id', Number(customer.customer_id || customer.id || 0), { shouldValidate: true });
        modals.setIsCustomerSearchOpen(false);
    }, [setValue, modals]);

    const handleSelectLead = useCallback((estimate: EstimateHeader) => {
        setValue('lead_id', estimate.estimate_no || estimate.id || '');
        modals.setIsLeadSearchOpen(false);
    }, [setValue, modals]);

    const handleSelectProduct = useCallback((product: ItemListItem) => {
        if (modals.activeLineIndex !== null) {
            const currentLines = getValues('lines') || [];
            if (!currentLines[modals.activeLineIndex]) return;

            const newLines = [...currentLines];
            const line = newLines[modals.activeLineIndex];
            
            line.item_id = Number(product.item_id || product.id || 0);
            line.item_code = product.item_code || '';
            line.item_name = product.item_name || '';
            
            const productUomId = product.uom_id || product.unit_id;
            const productUomName = product.uom_name || product.base_uom_name || product.unit_name;
            
            const safeUoms = Array.isArray(uoms) ? uoms : [];
            const foundUom = safeUoms.find((u: UnitListItem) => 
                (productUomId && (String(u.id) === String(productUomId) || String(u.unit_id) === String(productUomId))) ||
                (productUomName && (u.unit_name?.trim() === productUomName?.trim() || u.uom_name?.trim() === productUomName?.trim()))
            );

            line.uom_id = foundUom ? Number(foundUom.id || foundUom.unit_id) : Number(productUomId || 0);
            line.unit_price = Number(product.standard_cost || 0);
            line.qty = 1; 
            line.discount_expression = '';
            line.line_discount = 0;
            line.line_total = line.unit_price; 
            line.price_source = undefined;
            line.price_source_name = 'STANDARD_COST';
            
            setValue('lines', newLines, { shouldValidate: true, shouldDirty: true });
            
            // 💰 Trigger price lookup immediately using the new qty and item
            handleLinePriceSync(modals.activeLineIndex);
        }
        modals.setIsProductSearchOpen(false);
    }, [modals, getValues, setValue, uoms, handleLinePriceSync]);

    return {
        isEdit,
        isSubmitting,
        setIsSubmitting,
        isLoadingDetail,
        methods,
        formData,
        // Master Data
        branches,
        currencies,
        customers,
        taxCodes,
        departments,
        projects,
        saleAreas,
        employees,
        uoms,
        // Modal States & Handlers
        ...modals,
        // Handlers
        handleSubmit,
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectCustomer,
        handleSelectLead,
        handleSelectProduct,
        handleLinePriceSync,
        loadingPriceLines,
        priceLevelNames,
    };
};
