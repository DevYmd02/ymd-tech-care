import React from 'react';

interface PRFormSummaryProps {
    subtotal: number;
    discountPercent: number;
    setDiscountPercent: (value: number) => void;
    vatRate: number;
    setVatRate: (value: number) => void;
    discountAmount: number;
    vatAmount: number;
    grandTotal: number;
}

export const PRFormSummary: React.FC<PRFormSummaryProps> = ({
    subtotal,
    discountPercent,
    setDiscountPercent,
    vatRate,
    setVatRate,
    discountAmount,
    vatAmount,
    grandTotal
}) => {
    const summaryRowClass = "flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0";
    const labelStyle = "text-sm text-gray-600 dark:text-gray-400";
    const valueStyle = "text-sm font-semibold text-gray-800 dark:text-white";

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm p-4 w-full md:w-80 ml-auto shadow-sm">
            <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-3 border-b border-blue-100 dark:border-blue-900/50 pb-2">สรุปยอดรวม (Summary)</h3>
            <div className="space-y-1">
                <div className={summaryRowClass}>
                    <span className={labelStyle}>รวมเป็นเงิน:</span>
                    <span className={valueStyle}>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className={summaryRowClass}>
                    <div className="flex items-center gap-2">
                        <span className={labelStyle}>ส่วนลด:</span>
                        <input 
                            type="number" 
                            value={discountPercent} 
                            onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                            className="w-12 h-6 text-xs text-center border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800"
                        />
                        <span className="text-xs text-gray-400">%</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">-{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className={summaryRowClass}>
                    <div className="flex items-center gap-2">
                        <span className={labelStyle}>ภาษีมูลค่าเพิ่ม:</span>
                        <input 
                            type="number" 
                            value={vatRate} 
                            onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                            className="w-12 h-6 text-xs text-center border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800"
                        />
                        <span className="text-xs text-gray-400">%</span>
                    </div>
                    <span className={valueStyle}>{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-blue-100 dark:border-blue-900">
                    <span className="text-base font-bold text-gray-900 dark:text-white">ยอดเงินสุทธิ:</span>
                    <span className="text-lg font-bold text-blue-700 dark:text-blue-400 underline decoration-double">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>
    );
};
