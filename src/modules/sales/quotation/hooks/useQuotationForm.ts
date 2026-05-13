import { useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuotationFormSchema, type QuotationFormValues, getQuotationDefaultValues } from '@sales/quotation/schemas/quotation-schemas';
import type { QuotationHeader } from '@sales/quotation/types/quotation.types';
import { useQuotationModals } from './useQuotationModals';

import { useQuotationMasterData } from './useQuotationMasterData';
import { useQuotationCalculations } from './useQuotationCalculations';
import { useQuotationHydration } from './useQuotationHydration';
import { useQuotationActions } from './useQuotationActions';

export const useQuotationForm = (isOpen: boolean, id?: string, initialData?: QuotationHeader) => {
    const isEdit = !!id;
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 🏷️ Extracted Modal States (Handles isCustomerSearchOpen, isProductSearchOpen, etc.)
    const modals = useQuotationModals();
    
    // 🛡️ Confirmation State (Required by QuotationFormModal)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<QuotationFormValues | null>(null);

    // React Hook Form Setup
    const methods = useForm<QuotationFormValues>({
        resolver: zodResolver(QuotationFormSchema) as Resolver<QuotationFormValues>,
        defaultValues: getQuotationDefaultValues(),
        mode: 'onBlur',
    });

    const { setValue, reset, control, getValues, handleSubmit } = methods;
    const { isDirty } = methods.formState;

    // 1. Master Data Fetching
    const masterData = useQuotationMasterData(isOpen);

    // 2. Hydration & Initial Loading
    useQuotationHydration({
        isOpen,
        id,
        initialData,
        reset,
        setValue,
        getValues,
        isMasterDataReady: masterData.isMasterDataReady,
    });

    // 3. Calculations & Sync
    const { tax_code_id } = useQuotationCalculations({
        control,
        setValue,
        getValues,
        currencies: masterData.currencies,
        taxCodes: masterData.taxCodes,
        isDirty
    });

    // 4. Form Actions
    const actions = useQuotationActions({
        setValue,
        getValues,
        tax_code_id: Number(tax_code_id),
    });

    // 5. Watch for UI (formData)
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
        currency_code, base_currency_code, tax_code_watched_id
    ] = watchedSummary;

    const formData = {
        sq_no, status, sub_total, discount_expression,
        discount_amount, vat_amount, total_amount,
        currency_code, base_currency_code, tax_code_id: tax_code_watched_id
    };

    return {
        // Core
        isEdit,
        isSubmitting,
        setIsSubmitting,
        methods,
        formData,
        handleSubmit,
        
        // Master Data (Flattened for UI compatibility)
        branches: masterData.branches,
        currencies: masterData.currencies,
        customers: masterData.customers,
        taxCodes: masterData.taxCodes,
        departments: masterData.departments,
        projects: masterData.projects,
        saleAreas: masterData.saleAreas,
        employees: masterData.employees,
        uoms: masterData.uoms,
        priceLevelNames: masterData.priceLevelNames,
        
        // Modal States (Spread from modals hook)
        ...modals,
        
        // Confirmation State
        isConfirmOpen,
        setIsConfirmOpen,
        pendingData,
        setPendingData,
        
        // Handlers
        ...actions,
        handleSelectLead: () => { /* Lead selection not fully implemented in previous version */ },
        isLoadingDetail: !masterData.isMasterDataReady, // Simplified loader check
    };
};
