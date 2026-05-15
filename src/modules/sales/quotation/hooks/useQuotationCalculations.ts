import { useMemo, useEffect } from 'react';
import { useWatch, type Control, type UseFormSetValue, type UseFormGetValues } from 'react-hook-form';
import { 
    calculateDiscountAmount, 
    calculateVatAmount, 
    calculateNetTotal 
} from '@sales/shared/utils/sales-calculations';
import { logger } from '@utils';
import type { QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';
import type { Currency } from '@master-data/types/master-data-types';
import type { TaxCode } from '@master-data/tax/types/tax-types';

interface UseQuotationCalculationsProps {
    control: Control<QuotationFormValues>;
    setValue: UseFormSetValue<QuotationFormValues>;
    getValues: UseFormGetValues<QuotationFormValues>;
    currencies: Currency[];
    taxCodes: TaxCode[];
    isDirty: boolean;
}

export function useQuotationCalculations({
    control,
    setValue,
    getValues,
    currencies,
    taxCodes,
    isDirty
}: UseQuotationCalculationsProps) {
    // 1. Exchange Rate Logic
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
        const toRate = targetObj?.exchange_rate || 1;

        const calculatedRate = fromRate / toRate;
        
        if (calculatedRate !== undefined && !isNaN(calculatedRate)) {
            setValue('exchange_rate', Number(calculatedRate.toFixed(6)), { shouldValidate: true, shouldDirty: false });
        }
    }, [currencies, sourceCurrency, targetCurrency, setValue, isMulti, getValues]);

    // 2. Automated Calculations
    const watchedLines = useWatch({ control, name: 'lines' });
    const discount_expression = useWatch({ control, name: 'discount_expression' });
    const tax_code_id = useWatch({ control, name: 'tax_code_id' });

    const watchedLineTotals = useMemo(
        () => (watchedLines || []).map(l => Number(l?.line_total) || 0),
        [watchedLines]
    );

    useEffect(() => {
        const calculatedSubTotal = watchedLineTotals.reduce((sum, val) => sum + val, 0);
        const calculatedDiscount = calculateDiscountAmount(calculatedSubTotal, discount_expression || '0');

        const safeTaxCodes = Array.isArray(taxCodes) ? taxCodes : [];
        const selectedTaxCode = safeTaxCodes.find(t => String(t.tax_code_id) === String(tax_code_id));
        const taxRate = selectedTaxCode ? (Number(selectedTaxCode.tax_rate) || 0) : 0;
        
        const amountAfterDiscount = calculatedSubTotal - calculatedDiscount;
        const vatAmountValue = calculateVatAmount(amountAfterDiscount, taxRate);
        const totalAmountValue = calculateNetTotal(calculatedSubTotal, calculatedDiscount, vatAmountValue);

        const currentTotal = getValues('total_amount') || 0;
        const currentSubTotal = getValues('sub_total') || 0;
        const currentVat = getValues('vat_amount') || 0;
        const currentDiscount = getValues('discount_amount') || 0;

        const isRoundingDiff = !isDirty && currentTotal > 0 && Math.abs(currentTotal - totalAmountValue) < 0.1;
        
        // 🔄 FORCE SYNC: If sub_total is missing (0) but lines exist, we MUST fill it.
        const needsHydration = (currentSubTotal === 0 && calculatedSubTotal > 0) || 
                               (currentDiscount === 0 && calculatedDiscount > 0) ||
                               (currentVat === 0 && vatAmountValue > 0);

        if (!isRoundingDiff || needsHydration) {
            if (currentSubTotal !== calculatedSubTotal) setValue('sub_total', calculatedSubTotal, { shouldValidate: true, shouldDirty: false });
            if (currentDiscount !== calculatedDiscount) setValue('discount_amount', calculatedDiscount, { shouldValidate: true, shouldDirty: false });
            if (currentVat !== vatAmountValue) setValue('vat_amount', vatAmountValue, { shouldValidate: true, shouldDirty: false });
            if (currentTotal !== totalAmountValue) setValue('total_amount', totalAmountValue, { shouldValidate: true, shouldDirty: false });
            
            if (needsHydration) {
                logger.debug('💧 [QuotationCalculations] Summary fields hydrated from lines.');
            }
        } else {
            logger.debug('🛡️ [QuotationCalculations] Rounding Guard active. Preserving backend totals.');
        }

    }, [watchedLineTotals, discount_expression, tax_code_id, taxCodes, setValue, getValues, isDirty]);

    return {
        isMulti,
        sourceCurrency,
        targetCurrency,
        tax_code_id
    };
}

