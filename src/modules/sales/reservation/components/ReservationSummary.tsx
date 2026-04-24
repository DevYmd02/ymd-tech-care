import { Calculator, AlertCircle } from 'lucide-react';
import { styles } from '@shared/constants/styles';

interface ReservationSummaryProps {
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

export function ReservationSummary({ 
    subTotal, 
    discountInput, 
    discountAmount,
    taxRate,
    vatAmount, 
    totalAmount, 
    currencySymbol = 'บาท',
    lineCount,
    onDiscountChange 
}: ReservationSummaryProps) {
    const isNegative = totalAmount < 0;

    return (
        <section className="flex flex-col lg:flex-row justify-between gap-8">
            {/* Left side: Notes or other info */}
            <div className="flex-1">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                    <p className="text-gray-400 text-sm italic">หมายเหตุเพิ่มเติม: รายละเอียดเกี่ยวกับการจองสินค้าหรือเงื่อนไขพิเศษจากลูกค้า</p>
                </div>
            </div>

            {/* Right side: Summary Totals */}
            <div className="w-full lg:w-96 space-y-3 bg-gray-50/50 dark:bg-gray-800/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400 font-semibold">
                    <Calculator size={18} />
                    <span>สรุปยอดเงินทั้งหมด (Reservation Summary)</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">จำนวนรายการรวม (line_count):</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{lineCount} รายการ</span>
                </div>

                <div className="flex justify-between items-start text-sm group">
                    <span className="text-gray-500 pt-2">ส่วนลดท้ายบิล (discount_amount):</span>
                    <div className="flex flex-col items-end gap-1">
                        <div className="relative w-40">
                            <input 
                                type="text" 
                                placeholder={discountAmount > 0 ? discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00 หรือ 0%"}
                                value={discountInput ?? ''} 
                                onChange={(e) => onDiscountChange(e.target.value)}
                                maxLength={15}
                                className={`${styles.input} h-9 py-0 text-right bg-white border-purple-200 focus:border-purple-500 font-semibold text-purple-600`}
                            />
                        </div>
                        {String(discountInput || '').includes('%') && discountAmount > 0 && (
                            <span className="text-xs font-bold text-red-500 pr-1 animate-in fade-in slide-in-from-right-1">
                                -{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">รวมราคาบรรทัด (sub_total):</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                    </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">ภาษี VAT {taxRate}% (vat_amount):</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                    </span>
                </div>

                <div className="pt-3 border-t-2 border-white dark:border-gray-800 flex justify-between items-center group">
                    <span className={`text-lg font-bold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-purple-700 dark:text-purple-400'} text-nowrap`}>มูลค่ารวมทั้งสิ้น:</span>
                    <div className="text-right overflow-hidden max-w-[250px]">
                        <span className={`text-2xl font-black truncate block ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-purple-700 dark:text-purple-400'}`}>
                            {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`ml-2 text-sm font-bold ${isNegative ? 'text-red-500/60' : 'text-purple-600/60'}`}>{currencySymbol}</span>
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
