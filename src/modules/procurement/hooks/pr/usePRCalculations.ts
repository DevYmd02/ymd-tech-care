import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import type { ExtendedLine } from './usePRForm';
import type { PRFormData } from '@/modules/procurement/types';

interface UsePRCalculationsProps {
  lines?: ExtendedLine[];
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
    return lines.reduce((acc, line) => {
      const qty = line.qty || 0;
      const price = line.est_unit_price || 0;
      const gross = qty * price;
      const lineTotal = line.est_amount || 0; // est_amount is already (gross - discount)
      const lineDiscount = line.discount || 0;

      acc.totalGross += gross;
      acc.subtotal += lineTotal;
      acc.totalLineDiscount += lineDiscount;
      
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
    return discount > subtotal ? subtotal : discount;
  }, [globalDiscountInput, subtotal]);

  // 3. Final Totals
  const afterDiscount = subtotal - globalDiscountAmount;
  const vatAmount = afterDiscount * (vatRate / 100);
  const grandTotal = afterDiscount + vatAmount;

  return {
    subtotal,
    totalLineDiscount,
    globalDiscountAmount,
    afterDiscount,
    vatAmount,
    grandTotal,
    totalGross
  };
};