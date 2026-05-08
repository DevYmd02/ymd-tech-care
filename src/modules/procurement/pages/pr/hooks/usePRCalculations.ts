import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import type { PRFormData, PRLineFormData } from '@/modules/procurement/schemas/pr-schemas';
import { calculatePricingSummary, parseDiscountAmount, calculateLineTotal } from '@/modules/procurement/utils/pricing.utils';

interface UsePRCalculationsProps {
  lines?: PRLineFormData[];
  vatRate?: number;
  globalDiscountInput?: string;
}

interface PRCalculationsResult {
  subtotal: number;
  totalLineDiscount: number;
  globalDiscountAmount: number;
  afterDiscount: number;
  vatAmount: number;
  grandTotal: number;
  totalGross: number;
}

/**
 * Hook for PR Totals Calculations
 * Can be used with explicit props OR inside FormProvider (via useFormContext)
 */
export const usePRCalculations = (props?: UsePRCalculationsProps): PRCalculationsResult => {
  const context = useFormContext<PRFormData>();

  // Watch values or use props
  const watchedLines = context?.watch('lines');
  const watchedDiscountInput = context?.watch('pr_discount_raw');

  const lines = useMemo(() => props?.lines ?? watchedLines ?? [], [props?.lines, watchedLines]);
  // Default to 0% for VAT calculation if tax code is not yet resolved to a percentage
  const vatRate = useMemo(() => props?.vatRate ?? 0, [props?.vatRate]); 
  const globalDiscountInput = useMemo(() => props?.globalDiscountInput ?? watchedDiscountInput ?? '', [props?.globalDiscountInput, watchedDiscountInput]);
  
  // 1. Calculate Line-Level Totals
  const { subtotal, totalGross, totalLineDiscount } = useMemo(() => {
    return (lines || []).reduce((acc, line) => {
      const qty = Number(line?.qty) || 0;
      const price = Number(line?.est_unit_price) || 0;
      const gross = qty * price;
      
      const lineDiscount = parseDiscountAmount(line?.line_discount_raw, gross);
      const lineTotal = calculateLineTotal(qty, price, lineDiscount);

      acc.totalGross += gross;
      acc.subtotal += lineTotal;
      acc.totalLineDiscount += lineDiscount;
      
      return acc;
    }, { subtotal: 0, totalGross: 0, totalLineDiscount: 0 });
  }, [lines]);

  // 2. Calculate Global Discount
  const globalDiscountAmount = useMemo(() => {
    const discount = parseDiscountAmount(globalDiscountInput, subtotal);
    // Cap discount at subtotal
    return discount > subtotal ? subtotal : discount;
  }, [globalDiscountInput, subtotal]);

  // 3. Final Totals
  const summary = useMemo(() => {
    // Map items to PricingItem interface for the utility
    const pricingItems = lines.map(l => ({
        qty: Number(l.qty) || 0,
        unit_price: Number(l.est_unit_price) || 0,
        discount: Number(l.discount) || 0
    }));

    return calculatePricingSummary(
        pricingItems,
        Number(vatRate),
        false, // PR is usually exclusive VAT in this UI
        globalDiscountAmount
    );
  }, [lines, vatRate, globalDiscountAmount]);

  return {
    subtotal: summary.subtotal,
    totalLineDiscount: totalLineDiscount,
    globalDiscountAmount: globalDiscountAmount,
    afterDiscount: summary.beforeTax,
    vatAmount: summary.taxAmount,
    grandTotal: summary.totalAmount,
    totalGross: totalGross
  };
};