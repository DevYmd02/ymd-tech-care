import { useEffect } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
    SalesOrderFormSchema, 
    type SalesOrderFormValues,
    getSalesOrderDefaultValues 
} from '../schemas/sales-order.schemas';
import type { Currency, UnitListItem } from '@master-data/types/master-data-types';
import type { TaxCode } from '@master-data/tax/types/tax-types';

import { useSalesOrderCalculations } from './useSalesOrderCalculations';
import { useSalesOrderFormActions } from './useSalesOrderFormActions';
import { useSalesOrderHydration } from './useSalesOrderHydration';
import { useUnsavedChangesGuard } from '@/shared/hooks/useUnsavedChangesGuard';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { logger } from '@/shared/utils';
import type { FieldErrors } from 'react-hook-form';

interface UseSalesOrderFormProps {
    isOpen: boolean;
    id?: string;
    initialData?: Partial<SalesOrderFormValues>;
    currencies: Currency[];
    taxCodes: TaxCode[];
    uoms: UnitListItem[];
    onClose: () => void;
    readOnly?: boolean;
}

export function useSalesOrderForm({
    isOpen,
    id,
    initialData,
    currencies,
    taxCodes,
    uoms,
    onClose,
    readOnly = false,
}: UseSalesOrderFormProps) {
    const methods = useForm<SalesOrderFormValues>({
        resolver: zodResolver(SalesOrderFormSchema) as Resolver<SalesOrderFormValues>,
        defaultValues: {
            ...getSalesOrderDefaultValues(),
            ...(initialData || {}),
        } as SalesOrderFormValues,
        mode: 'onBlur',
    });

    const { toast } = useToast();

    const { setValue, control, reset, getValues, handleSubmit } = methods;
    const { isDirty, errors } = methods.formState;

    // 🛡️ Unsaved Changes Guard
    const { handleCloseAttempt, blocker } = useUnsavedChangesGuard({
        isDirty: isDirty && !readOnly,
        enabled: isOpen,
        onSafeClose: onClose
    });

    // 1. Hydration & Recovery
    const { recoverSalesOrderPriceSources } = useSalesOrderHydration({
        isOpen,
        id,
        initialData,
        reset,
        setValue
    });

    // 2. Calculations
    const { totals, discount_input, tax_code_id } = useSalesOrderCalculations({
        control,
        setValue,
        getValues,
        taxCodes,
        id,
        initialData,
        isDirty
    });

    // 3. Form Actions
    const {
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectCustomer,
        handleSelectProduct,
        handleSelectReservation
    } = useSalesOrderFormActions({
        setValue,
        getValues,
        uoms,
        tax_code_id: Number(tax_code_id),
        recoverPriceSources: recoverSalesOrderPriceSources
    });

    // 4. Shared Watches for UI
    const isMulticurrency = useWatch({ control, name: 'isMulticurrency' });
    const base_currency_code = useWatch({ control, name: 'base_currency_code' });
    const quote_currency_code = useWatch({ control, name: 'quote_currency_code' });
    const status = useWatch({ control, name: 'status' });
    const discount_amount_watched = useWatch({ control, name: 'discount_amount' });

    // --------------------------------------------------------
    // Currency & Exchange Rate Logic (Keep in main or move to useSalesOrderCurrency)
    // --------------------------------------------------------
    useEffect(() => {
        if (!base_currency_code || !isMulticurrency) return;
        if (base_currency_code === 'THB' || base_currency_code === quote_currency_code) {
            setValue('exchange_rate', 1, { shouldDirty: false });
            return;
        }
        const sourceObj = currencies?.find((c) => c.currency_code === base_currency_code);
        const targetObj = currencies?.find((c) => c.currency_code === quote_currency_code);
        const fromRate = sourceObj?.exchange_rate || 1;
        const toRate = targetObj?.exchange_rate || 1;
        const calculatedRate = fromRate / toRate;
        
        if (calculatedRate !== undefined && !isNaN(calculatedRate)) {
            setValue('exchange_rate', Number(calculatedRate.toFixed(6)), { shouldValidate: true, shouldDirty: false });
        }
    }, [currencies, base_currency_code, quote_currency_code, setValue, isMulticurrency]);

    // --------------------------------------------------------
    // Tax Propagation Logic
    // --------------------------------------------------------
    useEffect(() => {
        if (tax_code_id !== undefined) {
             const currentLines = getValues('lines') || [];
             const needsUpdate = currentLines.some(l => Number(l.tax_code_id) !== Number(tax_code_id));
             if (needsUpdate) {
                  const updatedLines = currentLines.map(l => ({
                      ...l,
                      tax_code_id
                  }));
                  setValue('lines', updatedLines as never, { shouldDirty: false });
              }
        }
    }, [tax_code_id, setValue, getValues]);

    const onInvalidSubmit = (errors: FieldErrors<SalesOrderFormValues>) => {
        logger.error("Sales Order Validation Errors:", errors);
        
        const errorCount = Object.keys(errors).length;
        if (errorCount > 0) {
            toast(`พบข้อผิดพลาด ${errorCount} จุด กรุณาตรวจสอบข้อมูลให้ครบถ้วน`, 'error');
        }

        const firstErrorKey = Object.keys(errors)[0] as keyof SalesOrderFormValues;
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
        methods,
        discount_input,
        discount_amount: discount_amount_watched,
        tax_code_id,
        isMulticurrency,
        base_currency_code,
        status,
        totals,
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectCustomer,
        handleSelectProduct,
        handleSelectReservation,
        handleSubmit,
        onInvalidSubmit,
        onClose: handleCloseAttempt,
        blocker,
        isDirty,
        errors,
    };
}
