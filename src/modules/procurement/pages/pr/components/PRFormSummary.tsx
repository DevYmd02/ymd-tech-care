import React from 'react';
import { useFormContext } from 'react-hook-form';
import { usePRCalculations } from '@/modules/procurement/hooks/usePRCalculations';
import type { PRFormData } from '@/modules/procurement/types/pr-types';

export const PRFormSummary: React.FC = () => {
    const { watch, setValue } = useFormContext<PRFormData>();
    
    // Watch values needed for calculations
    const lines = watch('lines');
    const taxRate = watch('tax_rate') ?? 7;
    const discountInput = watch('discount_input') ?? '';

    // Use self-sufficient calculation hook
    const {
        subtotal,
        globalDiscountAmount,
        vatAmount,
        grandTotal,
        totalLineDiscount
    } = usePRCalculations({
        lines,
        vatRate: taxRate,
        globalDiscountInput: discountInput
    });

    const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden';
    const inputReadonlyClass = 'h-7 px-2 text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-white';
    const inputEditableClass = 'h-7 px-2 text-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500';
    const labelClass = 'text-gray-600 dark:text-gray-400 min-w-16';

    return (
        <div className={cardClass}>
          <div className="p-3 bg-white dark:bg-gray-900">
            <div className="flex justify-end">
              <div className="w-[400px] space-y-2 text-sm">

                {/* รวม (Subtotal) */}
                <div className="flex justify-between items-center">
                  <span className={labelClass}>รวม</span>
                  <input 
                    value={subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                    readOnly 
                    className={`w-32 ${inputReadonlyClass} bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600 text-gray-900 dark:text-yellow-200`} 
                  />
                </div>
                
                {/* ส่วนลดท้ายบิล (Global Discount) — 3 fields */}
                <div className="flex justify-between items-center">
                  <span className={labelClass}>ส่วนลด</span>
                  <div className="flex items-center gap-1">
                    {/* Field 1: Editable — user types number or % */}
                    <input 
                      type="text"
                      value={discountInput} 
                      onChange={(e) => setValue('discount_input', e.target.value)} 
                      placeholder="0 or 5%"
                      className={`w-24 ${inputEditableClass}`} 
                    />
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                    {/* Field 2: Read-only — calculated discount amount from this input */}
                    <input 
                      value={globalDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                      readOnly 
                      className={`w-24 ${inputReadonlyClass}`} 
                    />
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                    {/* Field 3: Read-only — total discount (line discounts + global discount) */}
                    <input 
                      value={(totalLineDiscount + globalDiscountAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                      readOnly 
                      className={`w-28 ${inputReadonlyClass} text-red-500 dark:text-red-400 font-medium`} 
                    />
                  </div>
                </div>

                {/* ภาษี VAT */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">ภาษี VAT</span>
                  <div className="flex items-center gap-1">
                    <input 
                      value={vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                      readOnly 
                      className={`w-20 ${inputReadonlyClass}`} 
                    />
                    <span className="text-gray-400 dark:text-gray-500 text-xs">ภาษี%</span>
                    <input 
                      type="number" 
                      value={taxRate} 
                      onChange={(e) => setValue('tax_rate', parseFloat(e.target.value) || 0)} 
                      className={`w-14 ${inputEditableClass}`} 
                    />
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                    <input 
                      value={vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                      readOnly 
                      className={`w-24 ${inputReadonlyClass}`} 
                    />
                  </div>
                </div>

                {/* รวมทั้งสิ้น (Grand Total) */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                  <span className="font-bold text-gray-700 dark:text-gray-300">รวมทั้งสิ้น</span>
                  <input 
                    value={grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
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

