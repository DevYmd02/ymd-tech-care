/**
 * @file AQFormSummary.tsx
 * @description Summary panel for AQ form — shows approval totals
 */

import { Calculator } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { AQFormData } from '../schemas/aq.schema';

export function AQFormSummary() {
  const { watch } = useFormContext<AQFormData>();

  const lines = watch('lines') || [];
  const quoteCurrency = watch('quote_currency_code') || 'THB';
  const exchangeRate = watch('exchange_rate') || 1;
  const subTotal = watch('sub_total') || 0;
  const quoteTotal = watch('quote_total_amount') || 0;
  const quoteTax = watch('quote_tax_amount') || 0;
  const taxRate = watch('tax_rate') || 0;
  const discountAmount = watch('quote_discount_amount') || 0;
  const discountExpr = watch('discount_expression') || '0';

  // 🛡️ SOURCE FIDELITY: If everything is approved exactly as-is, use original totals to avoid rounding discrepancy
  const isFullApproval = lines.length > 0 && lines.every(l => l.is_approved && Number(l.approved_qty) === Number(l.qty));

  const approvedSubTotalDisplay = isFullApproval 
    ? subTotal 
    : lines.reduce((sum, l) => sum + (l.is_approved ? (Number(l.approved_net_amount) || 0) : 0), 0);
  
  const approvedDiscount = discountAmount; 
  const totalAfterDiscount = Math.max(0, approvedSubTotalDisplay - approvedDiscount);

  const approvedTaxRate = taxRate < 1 ? taxRate : taxRate / 100;
  
  const approvedTaxAmountDisplay = isFullApproval ? quoteTax : totalAfterDiscount * approvedTaxRate;
  const finalApprovedTotalDisplay = isFullApproval ? quoteTotal : totalAfterDiscount + approvedTaxAmountDisplay;

  const baseCurrency = watch('base_currency_code') || 'THB';
  const isMC = quoteCurrency !== 'THB' && quoteCurrency !== baseCurrency;

  const fmt = (n: number) =>
    new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

  // Helper for percentage display (e.g. 0.07 -> 7%)
  const fmtPct = (rate: number) => {
    const pct = rate < 1 ? rate * 100 : rate;
    return Number(pct.toFixed(4)).toString(); // Remove floating point artifacts like 7.0000000001
  };

  return (
    <section className="flex flex-col lg:flex-row justify-between gap-8 mt-4">
      {/* Left side: Notes matching SQ style */}
      <div className="flex-1">
        <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <p className="text-gray-400 dark:text-gray-500 text-sm italic leading-relaxed">
            * การคำนวณยอดเงินอนุมัติรวม จะอ้างอิงจากรายการสินค้าที่ถูกทำเครื่องหมาย "อนุมัติ" 
            พร้อมราคาและส่วนลดที่ระบุในแต่ละรายการหลัก ข้อมูลนี้ถูกดึงมาจาก SQ ต้นฉบับ
          </p>
        </div>
      </div>

      {/* Right side: Financial Summary Card matching SQ styling */}
      <div className="w-full lg:w-[400px] space-y-4 bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-sm">
          <Calculator size={18} />
          <span>สรุปมูลค่าการพิจารณา</span>
        </div>

        {/* Original SQ Reference Section */}
        <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70">อ้างอิงยอดเดิม (SQ REFERENCE)</p>
          <div className="space-y-1.5 opacity-60 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">ยอดรวมสินค้า:</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">{fmt(subTotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                <span className="font-medium underline decoration-dotted">ส่วนลดท้ายบิล ({discountExpr}):</span>
                <span className="font-bold">- {fmt(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">ภาษีมูลค่าเพิ่ม ({fmtPct(taxRate)}%):</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">{fmt(quoteTax)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
              <span className="font-black text-slate-600 dark:text-slate-400 uppercase">รวมสุทธิเดิม:</span>
              <span className="font-black text-blue-600 dark:text-blue-500">{fmt(quoteTotal)}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Approval Section */}
        <div className="pt-2 space-y-3">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ยอดพิจารณาอนุมัติ (TOTAL APPROVED)</p>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">ยอดรวมสินค้า:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{fmt(approvedSubTotalDisplay)}</span>
            </div>
            {approvedDiscount > 0 && (
              <div className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                <span className="font-medium underline decoration-dotted italic">ส่วนลดท้ายบิล:</span>
                <span className="font-bold">- {fmt(approvedDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">ภาษีมูลค่าเพิ่ม ({fmtPct(taxRate)}%):</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{fmt(approvedTaxAmountDisplay)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-black text-gray-400 uppercase">NET TOTAL</span>
                <span className="text-3xl font-black text-slate-800 dark:text-emerald-400 tracking-tighter">
                  {fmt(finalApprovedTotalDisplay)}
                </span>
              </div>
              
              <div className="mt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-widest">
                  {quoteCurrency}
                </span>
                {isMC && (
                  <span className="text-[10px] text-gray-400 italic">
                    ( ≈ {fmt(finalApprovedTotalDisplay * exchangeRate)} {baseCurrency} )
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
