import { useMemo, useEffect } from 'react';
import { useWatch, type Control, type UseFormSetValue, type UseFormGetValues } from 'react-hook-form';
import { 
    calculateDiscountAmount, 
    calculateVatAmount, 
    calculateNetTotal 
} from '@sales/shared/utils/sales-calculations';
import { logger } from '@/shared/utils';
import type { SalesOrderFormValues } from '../schemas/sales-order.schemas';
import type { TaxCode } from '@master-data/tax/types/tax-types';

interface UseSalesOrderCalculationsProps {
    control: Control<SalesOrderFormValues>;
    setValue: UseFormSetValue<SalesOrderFormValues>;
    getValues: UseFormGetValues<SalesOrderFormValues>;
    taxCodes: TaxCode[];
    id?: string;
    initialData?: Partial<SalesOrderFormValues>;
    isDirty: boolean;
}

export function useSalesOrderCalculations({
    control,
    setValue,
    getValues,
    taxCodes,
    id,
    initialData,
    isDirty
}: UseSalesOrderCalculationsProps) {
    const discount_input = useWatch({ control, name: 'discount_input' });
    const tax_code_id = useWatch({ control, name: 'tax_code_id' });
    
    // Watch all line totals for subtotal calculation
    const rawLines = useWatch({ control, name: 'lines' });
    const lines = useMemo(() => rawLines || [], [rawLines]);
    const watchedLineTotals = useMemo(() => lines.map(l => l.line_total), [lines]);

    const totals = useMemo(() => {
        logger.time('useSalesOrderCalculations [totals_calculation]');
        const isExisting = !!id;
        const hasLines = lines.length > 0;

        // 🛑 Fix Loop: Use initialData (stable) for fallback if lines haven't loaded yet
        if (isExisting && !hasLines && initialData) {
            const data = initialData as Record<string, unknown>;
            const staticTotals = {
                subTotal: Number(data.sub_total || 0),
                discountAmount: Number(data.discount_amount || 0),
                vatAmount: Number(data.vat_amount || 0),
                totalAmount: Number(data.total_amount || 0),
                taxRate: 0, 
                isStatic: true 
            };
            logger.timeEnd('useSalesOrderCalculations [totals_calculation]');
            return staticTotals;
        }

        const subTotal = watchedLineTotals.reduce((sum: number, val: number | string | undefined | null) => sum + (Number(val) || 0), 0);
        const calculatedDiscount = calculateDiscountAmount(subTotal, discount_input ?? '');

        const selectedTaxCode = taxCodes.find(
            (t) => String(t.tax_code_id) === String(tax_code_id)
        );
        const taxRate = selectedTaxCode ? Number(selectedTaxCode.tax_rate) || 0 : 0;
        const vatAmount = calculateVatAmount(subTotal - calculatedDiscount, taxRate);
        const totalAmount = calculateNetTotal(subTotal, calculatedDiscount, vatAmount);

        const activeTotals = {
            subTotal,
            discountAmount: calculatedDiscount,
            vatAmount,
            totalAmount,
            taxRate,
            isStatic: false
        };
        logger.timeEnd('useSalesOrderCalculations [totals_calculation]');
        return activeTotals;
    }, [watchedLineTotals, discount_input, tax_code_id, taxCodes, id, initialData, lines]);

    // Sync calculated totals back to the form
    useEffect(() => {
        if (totals.isStatic) return;

        const currentVals = getValues();
        const currentTotal = Number(currentVals.total_amount || 0);
        
        // 🛡️ Rounding Guard: Preserve backend totals on load if difference is tiny (< 1.0)
        const isRoundingDiff = !isDirty && currentTotal > 0 && Math.abs(currentTotal - totals.totalAmount) < 1;

        if (!isRoundingDiff) {
            if (Number(currentVals.sub_total) !== totals.subTotal) {
                setValue('sub_total', totals.subTotal, { shouldDirty: false });
            }
            if (Number(currentVals.discount_amount) !== totals.discountAmount) {
                setValue('discount_amount', totals.discountAmount, { shouldDirty: false });
            }
            if (Number(currentVals.vat_amount) !== totals.vatAmount) {
                setValue('vat_amount', totals.vatAmount, { shouldDirty: false });
            }
            if (Number(currentVals.total_amount) !== totals.totalAmount) {
                setValue('total_amount', totals.totalAmount, { shouldDirty: false });
            }
        } else {
            logger.debug('🛡️ [useSalesOrderCalculations] Rounding Guard active. Preserving backend totals.');
        }
    }, [totals, setValue, getValues, isDirty]);

    return {
        totals,
        discount_input,
        tax_code_id
    };
}
