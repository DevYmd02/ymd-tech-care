import { useState, useEffect, useRef } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuotationFormSchema, type QuotationFormValues, getQuotationDefaultValues } from '@sales/quotation/schemas/quotation-schemas';
import type { QuotationHeader } from '@sales/quotation/types/quotation.types';
import { useQuotationModals } from './useQuotationModals';

import { useQuotationMasterData } from './useQuotationMasterData';
import { useQuotationCalculations } from './useQuotationCalculations';
import { useQuotationHydration } from './useQuotationHydration';
import { useQuotationActions } from './useQuotationActions';
import { useUnsavedChangesGuard } from '@/shared/hooks/useUnsavedChangesGuard';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { logger } from '@/shared/utils';
import type { FieldErrors } from 'react-hook-form';

export const useQuotationForm = (isOpen: boolean, onClose: () => void, id?: string, initialData?: QuotationHeader, readOnly = false) => {
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
    const { isDirty, errors } = methods.formState;

    const { toast } = useToast();

    // 🛡️ Unsaved Changes Guard
    const { handleCloseAttempt, blocker } = useUnsavedChangesGuard({
        isDirty: isDirty && !readOnly,
        enabled: isOpen,
        onSafeClose: onClose
    });

    // 1. Master Data Fetching
    const watchedCustomerId = useWatch({ control, name: 'customer_id' });
    const watchedBranchId = useWatch({ control, name: 'branch_id' });
    const masterData = useQuotationMasterData(isOpen, Number(watchedCustomerId || 0));

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
        uoms: masterData.uoms,
    });

    const { handleLinePriceSync } = actions;
    const lastCustomerAndBranchRef = useRef<{ 
        customerId: string | number | undefined; 
        branchId: string | number | undefined; 
    }>({
        customerId: undefined,
        branchId: undefined
    });

    // 4.5. Dynamic Price Recalculation on Customer or Branch change
    useEffect(() => {
        // If the form is clean (initial load/hydration), update ref and skip sync
        // to avoid overwriting existing transaction prices with engine defaults.
        if (!isDirty) {
            lastCustomerAndBranchRef.current = {
                customerId: watchedCustomerId,
                branchId: watchedBranchId
            };
            return;
        }

        const customerId = Number(watchedCustomerId || 0);
        const branchId = Number(watchedBranchId || 0);

        if (customerId > 0 && branchId > 0) {
            const hasChanged = 
                lastCustomerAndBranchRef.current.customerId !== watchedCustomerId ||
                lastCustomerAndBranchRef.current.branchId !== watchedBranchId;
                
            if (hasChanged) {
                lastCustomerAndBranchRef.current = {
                    customerId: watchedCustomerId,
                    branchId: watchedBranchId
                };
                
                const lines = getValues('lines') || [];
                lines.forEach((_, index) => {
                    handleLinePriceSync(index);
                });
            }
        }
    }, [watchedCustomerId, watchedBranchId, isDirty, handleLinePriceSync, getValues]);

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

    const onInvalidSubmit = (errors: FieldErrors<QuotationFormValues>) => {
        logger.error("Quotation Validation Errors:", errors);
        
        const errorCount = Object.keys(errors).length;
        if (errorCount > 0) {
            toast(`พบข้อผิดพลาด ${errorCount} จุด กรุณาตรวจสอบข้อมูลให้ครบถ้วน`, 'error');
        }

        const firstErrorKey = Object.keys(errors)[0] as keyof QuotationFormValues;
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
        selectedCustomer: masterData.selectedCustomer,
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
        onInvalidSubmit,
        onClose: handleCloseAttempt,
        blocker,
        isDirty,
        errors,
        handleSelectLead: () => { /* Lead selection not fully implemented in previous version */ },
        isLoadingDetail: !masterData.isMasterDataReady, // Simplified loader check
    };
};
