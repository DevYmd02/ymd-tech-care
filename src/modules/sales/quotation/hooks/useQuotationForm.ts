import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { MasterDataService } from '@/modules/master-data';
import { CustomerService } from '@/modules/master-data/customer/customer-master/services/customer.service';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import { TaxCodeService } from '@/modules/master-data/tax/services/tax-code.service';
import type { Currency } from '@/modules/master-data/types/master-data-types';
import type { CustomerMaster } from '@/modules/master-data/customer/customer-master/types/customer-types';
import type { ItemListItem, UnitListItem } from '@/modules/master-data/inventory/types/product-types';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import { QuotationFormSchema, type QuotationFormValues, type QuotationLineValues, getQuotationDefaultValues } from '@sales/quotation/schemas/quotation-schemas';
import type { EstimateHeader } from '@/modules/sales/estimate/services/estimate.service';
import { PricingService } from '@sales/quotation/services/pricing.service';
import { QuotationService } from '@sales/quotation/services/quotation.service';
import type { QuotationFormData, RawQuotationLine } from '@sales/quotation/types/quotation.types';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { logger } from '@/shared/utils/logger';

export const useQuotationForm = (isOpen: boolean, id?: string, initialData?: Partial<QuotationFormValues>) => {
    const isEdit = !!id;
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Search Modals State
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [isLeadSearchOpen, setIsLeadSearchOpen] = useState(false);
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
    
    // Confirmation Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<QuotationFormValues | null>(null);
    
    // Pricing State
    const [loadingPriceLines, setLoadingPriceLines] = useState<Set<number>>(new Set());
    
    // React Hook Form Setup
    const methods = useForm<QuotationFormValues>({
        resolver: zodResolver(QuotationFormSchema) as Resolver<QuotationFormValues>,
        defaultValues: initialData ? { ...getQuotationDefaultValues(), ...initialData } : getQuotationDefaultValues(),
        mode: 'onBlur',
    });

    const { setValue, reset, control, getValues, handleSubmit } = methods;
    const formData = useWatch({ control });

    // 🏗️ Check if we already have sufficient data to skip fetching
    const hasInitialLines = !!(isOpen && initialData && initialData.lines && (initialData.lines as QuotationLineValues[]).length > 0);

    // Data Fetching (Detail)
    const { 
        data: quotationDetail, 
        isLoading: isLoadingDetail,
        isError: isDetailError,
        error: detailError
    } = useQuery({
        queryKey: ['quotation-detail', id],
        queryFn: () => id ? QuotationService.getById(id) : null,
        enabled: !!id && isOpen, // Allow detail query to run!
        staleTime: 1000 * 60 * 5,
    });

    // 🧪 Diagnostic logging for the USER
    useEffect(() => {
        if (isDetailError) {
            logger.error(`❌ [QuotationForm] Failed to fetch ID: ${id}`, detailError);
            console.error('❌ [QuotationForm] Fetch Error Detail:', detailError);
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
                            price_source_name: result.sourceName
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
            sq_date: toFormDate(apiData.sq_date || ((apiData as unknown as Record<string, unknown>).date as string)),
            lead_id: apiData.lead_id || null,
            customer_id: Number(apiData.customer_id || 0),
            branch_id: apiData.branch_id ? Number(apiData.branch_id) : 0,
            currency_code: apiData.currency_code || ((apiData as unknown as Record<string, unknown>).currency as string) || 'THB',
            isMulticurrency: !!apiData.isMulticurrency,
            base_currency_code: apiData.base_currency_code && apiData.base_currency_code !== '' ? apiData.base_currency_code : 'THB',
            quote_currency_code: apiData.quote_currency_code && apiData.quote_currency_code !== '' ? apiData.quote_currency_code : 'THB',
            exchange_rate: Number(apiData.exchange_rate || 1),
            exchange_rate_date: toFormDate(apiData.exchange_rate_date),
            status: ((apiData.status || '').toUpperCase() as QuotationFormValues['status']) || 'DRAFT',
            valid_until: toFormDate(apiData.valid_until || ((apiData as unknown as Record<string, unknown>).expiry_date as string)),
            sub_total: Number(apiData.sub_total || 0),
            discount_expression: apiData.discount_input || ((apiData as unknown as Record<string, unknown>).discount_expression as string) || '0',
            discount_amount: Number(apiData.discount_amount || 0),
            vat_amount: Number(apiData.vat_amount || 0),
            total_amount: Number(apiData.total_amount || ((apiData as unknown as Record<string, unknown>).total_amount as number) || 0),
            remarks: apiData.remarks || (apiData as unknown as { remark?: string }).remark || '',
            payment_term_days: Number(apiData.payment_term_days || 0),
            onhold: (apiData.onhold === 'Y' ? 'Y' : 'N') as QuotationFormValues['onhold'],
            tax_code_id: apiData.tax_code_id ? Number(apiData.tax_code_id) : 0,
            item_id: apiData.item_id ? Number(apiData.item_id) : 0,
            emp_area_id: apiData.emp_area_id ? Number(apiData.emp_area_id) : 0,
            emp_dept_id: apiData.emp_dept_id ? Number(apiData.emp_dept_id) : 0,
            project_id: apiData.project_id ? Number(apiData.project_id) : 0,
            sq_status: apiData.sq_status || ((apiData as unknown as Record<string, unknown>).workflow_status as string) || '',
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
                };
            })
        };
    }, []);
    
    // 🔄 Syncing with Fetched/Initial Data
    useEffect(() => {
        if (!isOpen) {
            lastInitializedId.current = null;
            return;
        }

        // Mode 1: Data-Reuse (Prefer initialData if it includes lines)
        if (hasInitialLines && !quotationDetail) {
            const currentTargetId = id || 'initial';
            if (lastInitializedId.current === currentTargetId) return;

            logger.info('🎯 [QuotationForm] Using Data-Reuse Pattern (from List)');
            
            // 🏗️ Reconstruct full payload using rawData to preserve all fields not in the list interface
            const raw = (initialData as unknown as Record<string, unknown>).rawData as Record<string, unknown> || {};
            const linesToUse = (initialData as unknown as Record<string, unknown>).lines || raw.saleQuotationLines || raw.lines || [];
            
            const constructedPayload: QuotationFormData = {
                ...raw, // Spread all hidden fields like branch_id, project_id, etc.
                sq_id: initialData?.sq_id || (raw.sq_id as string | number),
                sq_no: initialData?.sq_no || (raw.sq_no as string),
                sq_date: (initialData as unknown as Record<string, unknown>).date as string || (raw.sq_date as string),
                lines: linesToUse as QuotationLineValues[]
            } as unknown as QuotationFormData;

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
                console.log('✅ [QuotationForm] Resetting with Full Detail Data:', mappedData);
                reset(mappedData);
                lastInitializedId.current = detailId;
                // 🕵️ Recovery: Detect price sources for the loaded detail
                void recoverMissingPriceSources(mappedData.lines, Number(mappedData.customer_id), Number(mappedData.branch_id));
                // Enrich lines if item_code is missing
                void enrichLinesWithItemData(mappedData.lines || []);
            } else if (!id && lastInitializedId.current !== currentTarget) {
                console.log('✨ [QuotationForm] Resetting with Defaults');
                // 🛡️ Rescue: Ensure 'THB' is set if initialData has empty strings
                const mergedValues = initialData ? { ...defaultValues, ...initialData } : defaultValues;
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
        enrichLinesWithItemData
    ]);

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

    const { data: uomResponse } = useQuery({
        queryKey: ['master-units'],
        queryFn: () => UnitService.getAll({ limit: 1000 }),
        enabled: isOpen
    });
    const uoms = useMemo(() => uomResponse?.items || [], [uomResponse]);

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

        const sourceObj = currencies?.find((c: Currency) => c.currency_code === sourceCurrency);
        const targetObj = currencies?.find((c: Currency) => c.currency_code === targetCurrency);

        const fromRate = sourceObj?.exchange_rate || 1;
        const toRate = targetObj?.exchange_rate || (targetCurrency === 'THB' ? 1 : 1);

        const calculatedRate = fromRate / toRate;
        
        if (calculatedRate !== undefined && !isNaN(calculatedRate)) {
            setValue('exchange_rate', Number(calculatedRate.toFixed(6)), { shouldValidate: true });
        }
    }, [currencies, sourceCurrency, targetCurrency, setValue, isMulti, getValues]);

    // 2. Automated Calculations (Subtotal, VAT, Discount, Total)
    const watchedLines = useWatch({ control, name: 'lines' });
    const lines = useMemo(() => watchedLines || [], [watchedLines]);
    
    const watchedDiscountExpression = useWatch({ control, name: 'discount_expression' });
    const discountExpression = useMemo(() => watchedDiscountExpression || '', [watchedDiscountExpression]);
    
    const taxCodeId = useWatch({ control, name: 'tax_code_id' });

    useEffect(() => {
        // Line Totals & Header Subtotal
        const currentSubTotal = getValues('sub_total');
        const calculatedSubTotal = lines.reduce((sum, line) => sum + (line.line_total || 0), 0);
        if (currentSubTotal !== calculatedSubTotal) {
            setValue('sub_total', calculatedSubTotal);
        }

        // Header Discount
        let calculatedDiscount = 0;
        if (discountExpression.endsWith('%')) {
            const percent = parseFloat(discountExpression.replace('%', '')) || 0;
            calculatedDiscount = calculatedSubTotal * (percent / 100);
        } else {
            calculatedDiscount = parseFloat(discountExpression) || 0;
        }
        
        if (getValues('discount_amount') !== calculatedDiscount) {
            setValue('discount_amount', calculatedDiscount);
        }

        // VAT Calculation (Calculated on SubTotal AFTER Discount)
        const selectedTaxCode = taxCodes.find(t => String(t.tax_code_id) === String(taxCodeId));
        const taxRate = selectedTaxCode ? (Number(selectedTaxCode.tax_rate) || 0) : 0;
        
        const amountAfterDiscount = calculatedSubTotal - calculatedDiscount;
        const vatAmountValue = taxCodeId ? (amountAfterDiscount * (taxRate / 100)) : 0;
        
        if (getValues('vat_amount') !== vatAmountValue) {
            setValue('vat_amount', vatAmountValue);
        }

        // Final Total
        const totalAmountValue = amountAfterDiscount + vatAmountValue;
        if (getValues('total_amount') !== totalAmountValue) {
            setValue('total_amount', totalAmountValue);
        }

    }, [lines, discountExpression, taxCodeId, taxCodes, setValue, getValues]);

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
        const currentLines = getValues('lines') || [];
        if (!currentLines[index]) return;

        const newLines = [...currentLines];
        const updatedLine = { ...newLines[index], [field]: value };
        
        // Recalculate Line Total if dependent fields change
        if (field === 'qty' || field === 'unit_price' || field === 'discount_expression') {
            const qty = Number(field === 'qty' ? value : updatedLine.qty) || 0;
            const price = Number(field === 'unit_price' ? value : updatedLine.unit_price) || 0;
            
            const ldInput = (field === 'discount_expression' ? (value as string) : updatedLine.discount_expression) || '';
            let calculatedLD = 0;
            if (ldInput.endsWith('%')) {
                const percent = parseFloat(ldInput.replace('%', '')) || 0;
                calculatedLD = (qty * price) * (percent / 100);
            } else {
                calculatedLD = parseFloat(ldInput) || 0;
            }
            
            updatedLine.line_discount = calculatedLD;
            updatedLine.line_total = (qty * price) - calculatedLD;

            // If user manually changed the unit_price, clear the system source
            if (field === 'unit_price') {
                updatedLine.price_source = undefined;
                updatedLine.price_source_name = 'MANUAL';
            }
        }
        
        newLines[index] = updatedLine;
        setValue('lines', newLines, { shouldValidate: true });
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
                updatedLine.unit_price = resolvedPrice.unitPrice;
                updatedLine.price_source = resolvedPrice.source;
                updatedLine.price_source_name = resolvedPrice.sourceName;

                // Re-calc line discount and total
                const qty = Number(updatedLine.qty) || 0;
                const price = resolvedPrice.unitPrice;
                const ldInput = updatedLine.discount_expression || '';
                let calculatedLD = 0;
                if (ldInput.endsWith('%')) {
                    const percent = parseFloat(ldInput.replace('%', '')) || 0;
                    calculatedLD = (qty * price) * (percent / 100);
                } else {
                    calculatedLD = parseFloat(ldInput) || 0;
                }
                
                updatedLine.line_discount = calculatedLD;
                updatedLine.line_total = (qty * price) - calculatedLD;

                updatedLines[index] = updatedLine;
                setValue('lines', updatedLines, { shouldValidate: true, shouldDirty: true });
            }
        } finally {
            setLoadingPriceLines(prev => {
                const next = new Set(prev);
                next.delete(index);
                return next;
            });
        }
    }, [getValues, setValue]);

    const handleSelectCustomer = useCallback((customer: CustomerMaster) => {
        setValue('customer_id', Number(customer.customer_id || customer.id || 0));
        setIsCustomerSearchOpen(false);
    }, [setValue]);

    const handleSelectLead = useCallback((estimate: EstimateHeader) => {
        setValue('lead_id', estimate.estimate_no || estimate.id || '');
        setIsLeadSearchOpen(false);
    }, [setValue]);

    const handleSelectProduct = useCallback((product: ItemListItem) => {
        if (activeLineIndex !== null) {
            const currentLines = getValues('lines') || [];
            if (!currentLines[activeLineIndex]) return;

            const newLines = [...currentLines];
            const line = newLines[activeLineIndex];
            
            line.item_id = Number(product.item_id || product.id || 0);
            line.item_code = product.item_code || '';
            line.item_name = product.item_name || '';
            
            const productUomId = product.uom_id || product.unit_id;
            const productUomName = product.uom_name || product.base_uom_name || product.unit_name;
            
            const foundUom = uoms.find((u: UnitListItem) => 
                (productUomId && (u.id === productUomId || u.unit_id === productUomId)) ||
                (productUomName && (u.unit_name === productUomName || u.uom_name === productUomName))
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
            handleLinePriceSync(activeLineIndex);
        }
        setIsProductSearchOpen(false);
    }, [activeLineIndex, getValues, setValue, uoms, handleLinePriceSync]);

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
        uoms,
        // Search Modals State
        isCustomerSearchOpen,
        setIsCustomerSearchOpen,
        isLeadSearchOpen,
        setIsLeadSearchOpen,
        isProductSearchOpen,
        setIsProductSearchOpen,
        activeLineIndex,
        setActiveLineIndex,
        // Confirmation State
        isConfirmOpen,
        setIsConfirmOpen,
        pendingData,
        setPendingData,
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
    };
};
