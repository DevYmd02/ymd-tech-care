import { useMemo } from 'react';
import { useWatch, Controller, type Control } from 'react-hook-form';
import { calculatePricingSummary, parseDiscountAmount } from '@/modules/procurement/utils/pricing.utils';
import type { POFormData, POLine } from '@/modules/procurement/schemas/po-schemas';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';

interface POSummaryPanelProps {
    control: Control<POFormData>;
    taxCodes: TaxCode[];
    isView: boolean;
}

export const POSummaryPanel = ({ control, taxCodes, isView }: POSummaryPanelProps) => {
    // 🎯 Watch everything needed for calculation
    const currentLines = useWatch({ control, name: 'po_lines' });
    const taxCodeId = useWatch({ control, name: 'tax_code_id' });
    const headerDiscountExpr = useWatch({ control, name: 'discount_expression' });

    const { taxAmount, totalAmount, taxRate, totalDiscount, grossTotal } = useMemo(() => {
        const lines = currentLines || [];
        const items = (lines as POLine[]).map((l) => {
            const qty = Number(l.qty_ordered ?? l.qty ?? 0);
            const price = Number(l.unit_price ?? 0);
            const disc = parseDiscountAmount(l.discount_expression ?? '0', qty * price);
            return {
                qty,
                unit_price: price,
                discount: disc,
            };
        });

        const selectedTax = (Array.isArray(taxCodes) ? taxCodes : []).find(t => Number(t.tax_code_id) === Number(taxCodeId));
        const taxRate = selectedTax ? Number(selectedTax.tax_rate) : 0;

        const lineDiscountTotal = items.reduce((sum: number, item: { discount: number }) => sum + (item.discount || 0), 0);
        const grossTotal = items.reduce((sum: number, item: { qty: number; unit_price: number }) => sum + (item.qty * item.unit_price), 0);

        const subtotalBeforeGlobal = Math.max(0, grossTotal - lineDiscountTotal);
        const globalDiscountAmount = parseDiscountAmount(headerDiscountExpr || '0', subtotalBeforeGlobal);

        const summary = calculatePricingSummary(items, taxRate, false, globalDiscountAmount);
        const fullTotalDiscount = lineDiscountTotal + globalDiscountAmount;

        return {
            ...summary,
            taxRate,
            totalDiscount: fullTotalDiscount,
            grossTotal
        };
    }, [currentLines, taxCodeId, taxCodes, headerDiscountExpr]);

    return (
        <div className="w-80 space-y-2 bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm transition-all">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">รวมเป็นเงิน</span>
                <span className="font-medium text-gray-900 dark:text-white">
                    {grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-slate-400">ส่วนลดท้ายบิล</span>
                <div className="flex items-center gap-2">
                    <Controller
                        control={control}
                        name="discount_expression"
                        render={({ field }) => (
                            <input
                                {...field}
                                type="text"
                                className="w-20 h-7 text-right px-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                                placeholder="0 หรือ 5%"
                                readOnly={isView}
                                onChange={(e) => {
                                    field.onChange(e.target.value);
                                }}
                            />
                        )}
                    />
                </div>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">รวมส่วนลด</span>
                <span className={`font-medium ${totalDiscount > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {totalDiscount > 0 ? '-' : ''}{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">
                    ภาษีมูลค่าเพิ่ม {taxRate ? `(${taxRate}%)` : ''}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                    {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
            <div className="border-t border-gray-200 dark:border-slate-700 pt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-gray-800 dark:text-slate-200">รวมสุทธิ</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    );
};
