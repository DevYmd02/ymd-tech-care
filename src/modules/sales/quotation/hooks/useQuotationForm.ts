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

    // 🛡️ Initialization Guard to prevent reset loops
    const lastInitializedId = useRef<string | null | 'new'>(null);
    const defaultValues = useMemo(() => getQuotationDefaultValues(), []);
    
    useEffect(() => {
        const currentTarget = id || 'new';
        if (isOpen && lastInitializedId.current !== currentTarget) {
            reset(initialData ? { ...defaultValues, ...initialData } : defaultValues);
            lastInitializedId.current = currentTarget;
        } else if (!isOpen) {
            lastInitializedId.current = null;
        }
    }, [isOpen, initialData, reset, defaultValues, id]);

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

    const { data: itemTypes = [] } = useQuery({
        queryKey: ['master-item-types'],
        queryFn: MasterDataService.getItemTypes,
        enabled: isOpen
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
    }, [currencies, sourceCurrency, targetCurrency, setValue, isMulti]);

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

        // VAT Calculation
        const selectedTaxCode = taxCodes.find(t => String(t.tax_code_id) === String(taxCodeId));
        const taxRate = selectedTaxCode ? (Number(selectedTaxCode.tax_rate) || 0) : 0;
        const vatAmountValue = taxCodeId ? (calculatedSubTotal * (taxRate / 100)) : 0;
        
        if (getValues('vat_amount') !== vatAmountValue) {
            setValue('vat_amount', vatAmountValue);
        }

        // Final Total
        const totalAmountValue = (calculatedSubTotal + vatAmountValue) - calculatedDiscount;
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
        methods,
        formData,
        // Master Data
        branches,
        currencies,
        customers,
        taxCodes,
        departments,
        projects,
        itemTypes,
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
