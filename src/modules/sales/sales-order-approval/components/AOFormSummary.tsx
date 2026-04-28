import { Calculator } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { AOFormData } from '../schemas/ao.schema';

export function AOFormSummary() {
  const { watch } = useFormContext<AOFormData>();
  const lines = watch('lines') || [];

  const approvedSubTotal = lines.filter(l => l.is_approved).reduce((sum, l) => sum + (Number(l.approved_net_amount) || 0), 0);

  const baseSubTotal = (watch('sub_total') as number) || 0;
  const baseDiscount = (watch('quote_discount_amount') as number) || (watch('base_discount_amount') as number) || 0;
  const baseVat = (watch('quote_tax_amount') as number) || (watch('base_tax_amount') as number) || 0;
  const baseTotal = (watch('quote_total_amount') as number) || (watch('base_total_amount') as number) || 0;

  const isMulticurrency = watch('isMulticurrency') as boolean;
  const currency = isMulticurrency ? (watch('quote_currency_code') as string) : (watch('base_currency_code') as string) || 'THB';

  const fmt = (val: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(val);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800 text-emerald-600 dark:text-emerald-400">
        <Calculator size={20} strokeWidth={2.5} />
        <h3 className="text-lg font-bold">สรุปยอดรวม (Summary)</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {/* Padding to push to right */}
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400 font-medium">รวมมูลค่าสินค้าที่อนุมัติ</span>
            <span className="font-mono font-bold text-gray-900 dark:text-white">
              {fmt(approvedSubTotal)} <span className="text-xs text-gray-400 ml-1">{currency}</span>
            </span>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">ยอดรวมตามใบสั่งขาย (Sub Total)</span>
              <span className="font-mono text-gray-600">{fmt(baseSubTotal)} {currency}</span>
            </div>
            {baseDiscount > 0 && (
              <div className="flex justify-between items-center text-sm text-red-500">
                <span>ส่วนลดท้ายบิล (Discount)</span>
                <span className="font-mono">-{fmt(baseDiscount)} {currency}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">ภาษีมูลค่าเพิ่ม (VAT)</span>
              <span className="font-mono text-gray-600">{fmt(baseVat)} {currency}</span>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
              <span className="text-base font-bold text-gray-900 dark:text-white">ยอดสุทธิใบสั่งขาย (Total)</span>
              <span className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
                {fmt(baseTotal)} <span className="text-sm font-normal text-gray-500 ml-1">{currency}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
