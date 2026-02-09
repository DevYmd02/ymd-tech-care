import React from 'react';

interface PRFormSummaryProps {
    subtotal: number;
    discountPercent?: number;
    setDiscountPercent?: (value: number) => void;
    vatRate: number;
    setVatRate: (value: number) => void;
    discountAmount: number;
    vatAmount: number;
    grandTotal: number;

}

export const PRFormSummary: React.FC<PRFormSummaryProps> = ({
    subtotal,
    vatRate,
    setVatRate,
    discountAmount,
    vatAmount,
    grandTotal,

}) => {
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

                {/* ส่วนลด (Discount) */}
                <div className="flex justify-between items-center">
                  <span className={labelClass}>ส่วนลด</span>
                  <div className="flex items-center gap-1">
                    <input 
                      value={discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                      readOnly 
                      className={`w-24 ${inputReadonlyClass}`} 
                    />
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                    <input 
                      value={discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                      readOnly 
                      className={`w-24 ${inputReadonlyClass}`} 
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
                      value={vatRate} 
                      onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)} 
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

