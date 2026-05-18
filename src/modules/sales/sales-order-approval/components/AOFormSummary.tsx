import { Calculator } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { AOFormData } from '../schemas/ao.schema';
import { formatNumber } from '@/shared/utils';
import { calculateDiscountAmount, calculateVatAmount, calculateNetTotal } from '@sales/shared/utils/sales-calculations';

export function AOFormSummary() {
  const { watch } = useFormContext<AOFormData>();
  const lines = watch('lines') || [];

  const approvedSubTotal = lines.filter(l => l.is_approved).reduce((sum, l) => sum + (Number(l.approved_net_amount) || 0), 0);

  const discountExpression = watch('discount_expression') || '0';
  const taxRate = Number(watch('tax_rate')) || 0;

  const approvedDiscount = approvedSubTotal > 0 ? calculateDiscountAmount(approvedSubTotal, discountExpression) : 0;
  const approvedTaxable = Math.max(0, approvedSubTotal - approvedDiscount);
  const approvedVat = calculateVatAmount(approvedTaxable, taxRate);
  const approvedNetTotal = Math.max(0, calculateNetTotal(approvedSubTotal, approvedDiscount, approvedVat));

  const baseSubTotal = (watch('sub_total') as number) || 0;
  const baseDiscount = (watch('quote_discount_amount') as number) || (watch('base_discount_amount') as number) || 0;
  const baseVat = (watch('quote_tax_amount') as number) || (watch('base_tax_amount') as number) || 0;
  const baseTotal = (watch('quote_total_amount') as number) || (watch('base_total_amount') as number) || 0;

  const currency = (watch('base_currency_code') as string) || 'THB';

  return (
    <section className="flex flex-col lg:flex-row justify-between gap-8 mt-6">
      {/* Left side: Notes matching premium style */}
      <div className="flex-1">
        <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <p className="text-gray-400 dark:text-gray-500 text-sm italic leading-relaxed">
            * การคำนวณยอดเงินอนุมัติรวม จะอ้างอิงจากรายการสินค้าที่ถูกทำเครื่องหมาย "อนุมัติ" 
            พร้อมราคาและส่วนลดที่ระบุในแต่ละรายการ ข้อมูลนี้ถูกดึงมาจาก Sales Order ต้นฉบับ
          </p>
        </div>
      </div>

      {/* Right side: Financial Summary Card matching AQ styling */}
      <div className="w-full lg:w-[400px] space-y-4 bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-sm">
          <Calculator size={18} />
          <span>สรุปมูลค่าการพิจารณา</span>
        </div>

        {/* Original SO Reference Section */}
        <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70">อ้างอิงยอดเดิม (SO REFERENCE)</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
              <span className="font-medium">ยอดรวมสินค้า:</span>
              <span className="font-bold">{formatNumber(baseSubTotal)}</span>
            </div>
            {baseDiscount > 0 && (
              <div className="flex justify-between items-center text-red-500 dark:text-red-400">
                <span className="font-medium">ส่วนลดท้ายบิล:</span>
                <span className="font-bold">- {formatNumber(baseDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
              <span className="font-medium">ภาษีมูลค่าเพิ่ม (VAT):</span>
              <span className="font-bold">{formatNumber(baseVat)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
              <span className="font-black text-slate-600 dark:text-slate-400 uppercase">รวมสุทธิเดิม:</span>
              <span className="font-black text-blue-600 dark:text-blue-500">{formatNumber(baseTotal)} {currency}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Approval Section */}
        <div className="pt-2 space-y-3">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ยอดพิจารณาอนุมัติ (TOTAL APPROVED)</p>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
              <span className="font-medium">รวมมูลค่าสินค้าที่อนุมัติ:</span>
              <span className="font-bold">{formatNumber(approvedSubTotal)}</span>
            </div>
            
            {approvedDiscount > 0 && (
              <div className="flex justify-between items-center text-red-500 dark:text-red-400">
                <span className="font-medium">ส่วนลดท้ายบิลที่อนุมัติ:</span>
                <span className="font-bold">- {formatNumber(approvedDiscount)}</span>
              </div>
            )}
            
            {(watch('tax_rate') as number) > 0 && (
              <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                <span className="font-medium">ภาษีมูลค่าเพิ่ม (VAT):</span>
                <span className="font-bold">{formatNumber(approvedVat)}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-black text-gray-400 uppercase">APPROVED TOTAL</span>
                <span className="text-3xl font-black text-slate-800 dark:text-emerald-400 tracking-tighter">
                  {formatNumber(approvedNetTotal)}
                </span>
              </div>
              
              <div className="mt-1">
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-widest">
                  {currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

