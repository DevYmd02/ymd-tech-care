import { Calculator } from 'lucide-react';
import { styles } from '@/shared/constants/styles';

interface QuotationSummaryProps {
    subTotal: number;
    discountAmount: number;
    vatAmount: number;
    totalAmount: number;
    lineCount: number;
    onDiscountChange: (value: number) => void;
}

export function QuotationSummary({ 
    subTotal, 
    discountAmount, 
    vatAmount, 
    totalAmount, 
    lineCount,
    onDiscountChange 
}: QuotationSummaryProps) {
    return (
        <section className="flex flex-col lg:flex-row justify-between gap-8">
            {/* Left side: Notes or other info if needed */}
            <div className="flex-1">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                    <p className="text-gray-400 text-sm italic">หมายเหตุเพิ่มเติม: สามารถระบุเงื่อนไขการชำระเงินหรือรายละเอียดการส่งมอบเพิ่มเติมได้ที่นี่</p>
                </div>
            </div>

            {/* Right side: Summary Totals */}
            <div className="w-full lg:w-96 space-y-3 bg-gray-50/50 dark:bg-gray-800/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400 font-semibold">
                    <Calculator size={18} />
                    <span>สรุปยอดเงินทั้งหมด</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">จำนวนรายการทั้งหมด:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{lineCount} รายการ</span>
                </div>

                <div className="flex justify-between items-center text-sm group">
                    <span className="text-gray-500">ส่วนลดท้ายบิล (discount_amount):</span>
                    <div className="relative w-32">
                        <input 
                            type="number" 
                            step="0.01"
                            value={discountAmount || 0} 
                            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                            className={`${styles.input} h-9 py-0 text-right pr-8 bg-white border-blue-200 focus:border-blue-500`}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">บาท</span>
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">ยอดก่อนภาษี (sub_total):</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {subTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                    </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">ภาษี VAT 7% (vat_amount):</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                    </span>
                </div>

                <div className="pt-3 border-t-2 border-white dark:border-gray-800 flex justify-between items-center group">
                    <span className="text-lg font-bold text-blue-700 dark:text-blue-400">มูลค่ารวมทั้งสิ้น:</span>
                    <div className="text-right">
                        <span className="text-2xl font-black text-blue-700 dark:text-blue-400">
                            {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="ml-2 text-sm font-bold text-blue-600/60">บาท</span>
                    </div>
                </div>
                
                {/* Helper ID display for developers */}
                <div className="pt-4 text-[10px] text-gray-300 dark:text-gray-600 text-right font-mono uppercase">
                    total_amount field value
                </div>
            </div>
        </section>
    );
}
