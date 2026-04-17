/**
 * @file SalesOrderSummary.tsx
 * @description สรุปยอดเงินคำสั่งขาย (sub_total, discount_amount, vat_amount, total_amount)
 */

import { Calculator, AlertCircle } from 'lucide-react';
import { styles } from '@/shared/constants/styles';

interface SalesOrderSummaryProps {
    subTotal: number;
    discountInput: string | undefined;
    discountAmount: number;
    taxRate: number;
    vatAmount: number;
    totalAmount: number;
    currencySymbol?: string;
    lineCount: number;
    onDiscountChange: (value: string) => void;
}

export function SalesOrderSummary({
    subTotal,
    discountInput,
    discountAmount,
    taxRate,
    vatAmount,
    totalAmount,
    currencySymbol = 'บาท',
    lineCount,
    onDiscountChange,
}: SalesOrderSummaryProps) {
    const isNegative = totalAmount < 0;

    return (
        <section className="flex flex-col lg:flex-row justify-between gap-8">
            {/* Left side */}
            <div className="flex-1">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                    <p className="text-gray-400 text-sm italic">
                        หมายเหตุเพิ่มเติม: รายละเอียดเพิ่มเติมเกี่ยวกับคำสั่งขายหรือเงื่อนไขพิเศษ
                    </p>
                </div>
            </div>

            {/* Right side: Summary */}
            <div className="w-full lg:w-96 space-y-3 bg-gray-50/50 dark:bg-gray-800/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400 font-semibold">
                    <Calculator size={18} />
                    <span>สรุปยอดเงินทั้งหมด (SO Summary)</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">จำนวนรายการ (line_count):</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                        {lineCount} รายการ
                    </span>
                </div>

                <div className="flex justify-between items-center text-sm group">
                    <span className="text-gray-500">ส่วนลดท้ายบิล (discount_amount):</span>
                    <div className="relative w-40">
                        <input
                            type="text"
                            placeholder={
                                discountAmount > 0
                                    ? discountAmount.toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                      })
                                    : '0.00 หรือ 0%'
                            }
                            value={discountInput ?? ''}
                            onChange={(e) => onDiscountChange(e.target.value)}
                            maxLength={15}
                            className={`${styles.input} h-9 py-0 text-right bg-white border-emerald-200 focus:border-emerald-500 font-semibold text-emerald-600`}
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">รวมราคาบรรทัด (sub_total):</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {subTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}{' '}
                        {currencySymbol}
                    </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">ภาษี VAT {taxRate}% (vat_amount):</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {vatAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}{' '}
                        {currencySymbol}
                    </span>
                </div>

                <div className="pt-3 border-t-2 border-white dark:border-gray-800 flex justify-between items-center">
                    <span className={`text-lg font-bold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'} text-nowrap`}>
                        มูลค่าสุทธิ:
                    </span>
                    <div className="text-right overflow-hidden max-w-[250px]">
                        <span className={`text-2xl font-black truncate block ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                            {totalAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                        <span className={`ml-2 text-sm font-bold ${isNegative ? 'text-red-500/60' : 'text-emerald-600/60'}`}>
                            {currencySymbol}
                        </span>
                    </div>
                </div>

                {isNegative && (
                    <div className="flex items-center gap-1.5 justify-end text-[11px] font-bold text-red-500 animate-pulse">
                        <AlertCircle size={12} />
                        <span>ยอดรวมติดลบ กรุณาตรวจสอบส่วนลด</span>
                    </div>
                )}

                <div className="pt-4 text-[10px] text-gray-300 dark:text-gray-600 text-right font-mono uppercase">
                    total_amount field value
                </div>
            </div>
        </section>
    );
}
