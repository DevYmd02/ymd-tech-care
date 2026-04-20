/**
 * @file AQFormSummary.tsx
 * @description Summary panel for AQ form — shows approval totals
 */

import { Calculator } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { AQFormData } from '../schemas/aq.schema';

interface AQFormSummaryProps {
  /** Override: computed approved total from parent (optional) */
  approvedTotal?: number;
}

export function AQFormSummary({ approvedTotal }: AQFormSummaryProps) {
  const { watch } = useFormContext<AQFormData>();

  const lines = watch('lines') || [];
  const quoteCurrency = watch('quote_currency_code') || 'THB';
  const exchangeRate = watch('exchange_rate') || 1;
  const subTotal = watch('sub_total') || 0;
  const quoteTotal = watch('quote_total_amount') || 0;
  const quoteTax = watch('quote_tax_amount') || 0;
  const taxRate = watch('tax_rate') || 0;

  // Compute approved totals from lines
  const computedApprovedTotal = approvedTotal ??
    lines.reduce((sum, l) => sum + (l.is_approved ? (l.approved_net_amount || 0) : 0), 0);

  const baseCurrency = watch('base_currency_code') || 'THB';
  const isMC = quoteCurrency !== 'THB' && quoteCurrency !== baseCurrency;

  const fmt = (n: number) =>
    new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

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
      <div className="w-full lg:w-96 space-y-4 bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-sm">
          <Calculator size={18} />
          <span>สรุปมูลค่าการพิจารณา</span>
        </div>

        {/* Original SQ Reference Section */}
        <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-800">
          <p className="text-[12px] font-black text-slate-400 uppercase tracking-tighter">อ้างอิงยอดเดิม (SQ REFERENCE)</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-base">
              <span className="text-gray-500 font-medium">ยอดขายก่อนภาษี:</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">{fmt(subTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-base">
              <span className="text-gray-500 font-medium">ภาษีมูลค่าเพิ่ม ({taxRate}%):</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">{fmt(quoteTax)}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-base font-black text-slate-600 dark:text-slate-400">มูลค่ารวมสุทธิ (SQ):</span>
              <span className="text-base font-black text-blue-600 dark:text-blue-500">{fmt(quoteTotal)}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Approval Section */}
        <div className="pt-2">
          <p className="text-[12px] font-black text-emerald-500 uppercase tracking-tighter mb-4">ยอดพิจารณาอนุมัติสุทธิ (TOTAL APPROVED)</p>
          
          <div className="flex flex-col items-end">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-black text-gray-400 uppercase">NET TOTAL</span>
              <span className="text-3xl font-black text-slate-800 dark:text-emerald-400 tracking-tighter">
                {fmt(computedApprovedTotal)}
              </span>
            </div>
            
            <div className="mt-1 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-widest">
                {quoteCurrency}
              </span>
              {isMC && (
                <span className="text-[10px] text-gray-400 italic">
                  ( ≈ {fmt(computedApprovedTotal * exchangeRate)} {baseCurrency} )
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
