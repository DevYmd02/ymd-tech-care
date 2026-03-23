import React, { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { usePRCalculations } from '@/modules/procurement/pages/pr/hooks';
import type { AVFormData, AVLineFormData } from '../schemas/av.schema';

interface AVFormSummaryProps {
    isViewMode?: boolean;
}

export const AVFormSummary: React.FC<AVFormSummaryProps> = () => {
    const { control, register, setValue } = useFormContext<AVFormData>();
    
    const rawLines = useWatch({ control, name: 'lines' }) as AVLineFormData[] | undefined;
    const vatRate = Number(useWatch({ control, name: 'pr_tax_rate' }) ?? 0);
    const discountInput = useWatch({ control, name: 'pr_discount_raw' }) ?? '';
    
    // Map lines to use approved_qty as the qty for calculation
    const approvedLinesForCalc = (rawLines || []).map(line => ({
        ...line,
        qty: line.is_approved ? line.approved_qty : 0
    })) as any;

    const {
        subtotal,
        totalLineDiscount,
        globalDiscountAmount,
        vatAmount,
        grandTotal
    } = usePRCalculations({
        lines: approvedLinesForCalc,
        vatRate,
        globalDiscountInput: discountInput
    });

    // Update form values with calculated totals so they are perfectly synced on submit
    useEffect(() => {
        setValue('pr_sub_total', subtotal);
        setValue('pr_discount_amount', globalDiscountAmount);
        setValue('pr_tax_amount', vatAmount);
        setValue('total_amount', grandTotal);
    }, [subtotal, globalDiscountAmount, vatAmount, grandTotal, setValue]);

    const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden';
    const inputReadonlyClass = 'h-7 px-2 text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-white';
    const labelClass = 'text-gray-600 dark:text-gray-400 min-w-16';

    return (
        <div className={cardClass}>
          <div className="p-3 bg-white dark:bg-gray-900">
            <div className="flex justify-end">
              <div className="w-[400px] space-y-2 text-sm">

                {/* รวม (Subtotal) */}
                <div className="flex justify-between items-center">
                  <span className={labelClass}>ยอดรวมอนุมัติ</span>
                  <input 
                    {...register('pr_sub_total')}
                    value={subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    readOnly 
                    className={`w-32 ${inputReadonlyClass} bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600 text-gray-900 dark:text-yellow-200`} 
                  />
                </div>
                
                {/* ส่วนลดท้ายบิล (Global Discount) — 3 fields */}
                <div className="flex justify-between items-center">
                  <span className={labelClass}>ส่วนลด</span>
                  <div className="flex items-center gap-1">
                    {/* Field 1: Read-only for AV */}
                    <input 
                      type="text"
                      {...register('pr_discount_raw')}
                      placeholder="0 or 5%"
                      readOnly
                      className={`w-24 px-2 text-center h-7 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-white cursor-not-allowed`} 
                    />
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                    {/* Field 2: Read-only — calculated discount amount from this input */}
                    <input 
                      {...register('pr_discount_amount')}
                      value={globalDiscountAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      readOnly 
                      className={`w-24 ${inputReadonlyClass}`} 
                    />
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                    {/* Field 3: Read-only — total discount (line discounts + global discount) */}
                    <input 
                      value={(globalDiscountAmount + totalLineDiscount).toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                      readOnly 
                      className={`w-28 ${inputReadonlyClass} text-red-500 dark:text-red-400 font-medium`} 
                    />
                  </div>
                </div>

                {/* ภาษี VAT */}
                <div className="flex justify-between items-center">
                  <span className={labelClass}>ภาษี VAT</span>
                  <div className="flex items-center gap-1">
                    {vatRate > 0 && (
                        <div className="relative flex items-center">
                            <input 
                              value={vatRate} 
                              readOnly 
                              className={`w-12 text-center ${inputReadonlyClass} pr-4`} 
                            />
                            <span className="absolute right-1.5 text-gray-400 dark:text-gray-500 text-[10px]">%</span>
                        </div>
                    )}
                    {vatRate > 0 && <span className="text-gray-400 dark:text-gray-500">-</span>}
                    <input 
                      value={vatAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                      readOnly 
                      className={`w-28 ${inputReadonlyClass}`} 
                    />
                  </div>
                </div>

                {/* รวมทั้งสิ้น (Grand Total) */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                  <span className="font-bold text-gray-700 dark:text-gray-300">รวมทั้งสิ้น</span>
                  <input 
                    {...register('total_amount')}
                    value={grandTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    readOnly 
                    className="w-32 h-8 px-2 text-right font-bold bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-400 dark:border-yellow-600 rounded text-blue-600 dark:text-yellow-200" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
    );
};
