import { useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { POFormData } from '@/modules/procurement/schemas/po-schemas';
import type { Currency } from '@/modules/master-data/types/master-data-types';

interface UsePOCalculationsProps {
    formMethods: UseFormReturn<POFormData>;
    currencies: Currency[];
    watchIsMulticurrency: boolean;
    watchCurrencyCode: string | undefined;
    watchTargetCurrency: string | undefined;
    watchHeaderTaxCodeId: number | undefined;
}

/**
 * Hook to handle all PO-related calculations:
 * 1. Currency Exchange Rate calculation
 * 2. Header-to-Line Tax propagation
 * 3. Future: Pricing summary calculations
 */
export const usePOCalculations = ({
    formMethods,
    currencies,
    watchIsMulticurrency,
    watchCurrencyCode,
    watchTargetCurrency,
    watchHeaderTaxCodeId
}: UsePOCalculationsProps) => {
    const { setValue, getValues, getFieldState } = formMethods;
    
    // ── Enforce THB when Multicurrency is OFF ─────────────────────────────────
    useEffect(() => {
        if (!watchIsMulticurrency) {
            setValue('currency_code', 'THB', { shouldDirty: false });
            setValue('exchange_rate', 1, { shouldDirty: false });
            setValue('target_currency', 'THB', { shouldDirty: false });
        }
    }, [watchIsMulticurrency, setValue]);

    // ── Propagate Header Tax to all Lines ─────────────────────────────────────
    useEffect(() => {
        if (watchHeaderTaxCodeId !== undefined) {
             const currentLines = getValues('po_lines') || [];
             const needsUpdate = currentLines.some(l => Number(l.tax_code_id) !== Number(watchHeaderTaxCodeId));
             if (needsUpdate) {
                 const updatedLines = currentLines.map(l => ({
                     ...l,
                     tax_code_id: watchHeaderTaxCodeId
                 }));
                setValue('po_lines', updatedLines as POFormData['po_lines'], { shouldDirty: false });
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
            const safeCurrencies = Array.isArray(currencies) ? currencies : [];
            const sourceObj = safeCurrencies.find((c: Currency) => c.currency_code === watchCurrencyCode);
            const targetObj = safeCurrencies.find((c: Currency) => c.currency_code === watchTargetCurrency);

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

    return {};
};
