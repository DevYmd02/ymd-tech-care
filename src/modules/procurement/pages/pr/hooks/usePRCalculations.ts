import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import type { PRFormData, PRLineFormData } from '@/modules/procurement/schemas/pr-schemas';

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
  // const watchedTaxCodeId = context?.watch('pr_tax_code_id');
  const watchedDiscountInput = context?.watch('pr_discount_raw');

  const lines = useMemo(() => props?.lines ?? watchedLines ?? [], [props?.lines, watchedLines]);
  // Default to 0% for VAT calculation if tax code is not yet resolved to a percentage
  const vatRate = useMemo(() => props?.vatRate ?? 0, [props?.vatRate]); 
  const globalDiscountInput = useMemo(() => props?.globalDiscountInput ?? watchedDiscountInput ?? '', [props?.globalDiscountInput, watchedDiscountInput]);
  
  // 1. Calculate Line-Level Totals
  const { subtotal, totalGross, totalLineDiscount } = useMemo(() => {
    return (lines || []).reduce((acc: { subtotal: number, totalGross: number, totalLineDiscount: number }, line: PRLineFormData) => {
      const qty = Number(line?.qty);
      const safeQty = isNaN(qty) ? 0 : qty;
      
      const price = Number(line?.est_unit_price);
      const safePrice = isNaN(price) ? 0 : price;
      
      const gross = safeQty * safePrice;
      
      const lineDiscount = Number(line?.discount);
      const safeLineDiscount = isNaN(lineDiscount) ? 0 : lineDiscount;
      
      const lineTotal = gross - safeLineDiscount;

      acc.totalGross += gross;
      acc.subtotal += lineTotal;
      acc.totalLineDiscount += safeLineDiscount;
      
      return acc;
    }, { subtotal: 0, totalGross: 0, totalLineDiscount: 0 });
  }, [lines]);

  // 2. Calculate Global Discount
  const globalDiscountAmount = useMemo(() => {
    let discount = 0;
    const input = String(globalDiscountInput || '').trim();

    if (input.endsWith('%')) {
      const percent = parseFloat(input.replace('%', ''));
      if (!isNaN(percent)) {
        discount = subtotal * (percent / 100);
      }
    } else {
      const fixed = parseFloat(input);
      if (!isNaN(fixed)) {
        discount = fixed;
      }
    }

    // Cap discount at subtotal
    const safeDiscount = isNaN(discount) ? 0 : discount;
    return safeDiscount > subtotal ? subtotal : safeDiscount;
  }, [globalDiscountInput, subtotal]);

  // 3. Final Totals
  const safeVatRate = isNaN(Number(vatRate)) ? 0 : Number(vatRate);
  const afterDiscount = subtotal - globalDiscountAmount;
  const vatAmount = afterDiscount * (safeVatRate / 100);
  const grandTotal = afterDiscount + vatAmount;

  return {
    subtotal: isNaN(subtotal) ? 0 : subtotal,
    totalLineDiscount: isNaN(totalLineDiscount) ? 0 : totalLineDiscount,
    globalDiscountAmount: isNaN(globalDiscountAmount) ? 0 : globalDiscountAmount,
    afterDiscount: isNaN(afterDiscount) ? 0 : afterDiscount,
    vatAmount: isNaN(vatAmount) ? 0 : vatAmount,
    grandTotal: isNaN(grandTotal) ? 0 : grandTotal,
    totalGross: isNaN(totalGross) ? 0 : totalGross
  };
};