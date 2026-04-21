import { FileText, User, Search, ClipboardList, Calendar } from 'lucide-react';
import { useFormContext, Controller } from 'react-hook-form';
import { MulticurrencyWrapper } from '@/shared/components/forms/MulticurrencyWrapper';
import type { AQFormData } from '../schemas/aq.schema';
import { SQStatusBadge } from '@/modules/sales/shared/components/SQStatusBadge';
import type { Currency } from '@/modules/master-data/types/master-data-types';

const formatDate = (val?: string): string => {
  if (!val) return '-';
  const cleaned = val.split('T')[0];
  if (!cleaned || cleaned === '-') return '-';
  const [y, m, d] = cleaned.split('-');
  if (!y || !m || !d) return cleaned;
  return `${d}/${m}/${y}`;
};

interface AQHeaderProps {
  onSearch?: () => void;
  showSearch?: boolean;
  currencies?: Currency[];
  readOnly?: boolean;
}

export function AQHeader({ onSearch, showSearch, currencies = [], readOnly = false }: AQHeaderProps) {
  const { watch, control, setValue, register } = useFormContext<AQFormData>();

  const sqNo = watch('sq_no');
  const sqDate = watch('sq_date');
  const customerName = watch('customer_name');
  const customerCode = watch('customer_code');
  const status = watch('status');
  const validUntil = watch('valid_until');
  const paymentTermDays = watch('payment_term_days');
  const remarks = watch('remarks');

  // New fields
  const branchName = watch('branch_name');
  const leadId = watch('lead_id');
  const empDeptName = watch('emp_dept_name');
  const projectName = watch('project_name');
  const saleAreaName = watch('sale_area_name');
  const empSaleName = watch('emp_sale_name');
  const taxCode = watch('tax_code');

  const inputClass = "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder-gray-400 transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm italic cursor-not-allowed";
  const labelClass = "block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider";
  const cardSection = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 bg-emerald-50/10 dark:bg-emerald-900/5 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/20";

  const customerDisplay = customerName || customerCode 
    ? `${customerCode ? `${customerCode} - ` : ''}${customerName || ''}` 
    : '';

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <FileText size={20} strokeWidth={2.5} />
          <h3 className="text-lg font-bold">ข้อมูลใบเสนอราคา — Header Quotation</h3>
        </div>
        <SQStatusBadge status={status} />
      </div>

      <div className={cardSection}>
        {/* Row 1: Main Identification */}
        <div className="space-y-1">
          <label className={labelClass}>เลขที่ใบเสนอราคา (SQ_NO)</label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={sqNo || ''}
              readOnly
              placeholder={showSearch ? "คลิกไอคอนเพื่อเลือก..." : "ระบบออกให้อัตโนมัติ"}
              className={`${inputClass} font-bold text-emerald-700 dark:text-emerald-300 flex-1`}
            />
            {showSearch && onSearch && (
              <button
                type="button"
                onClick={onSearch}
                className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center shadow-sm transition-all active:scale-95 flex-shrink-0"
              >
                <Search size={16} className="stroke-[3]" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelClass}>วันที่ (SQ_DATE)</label>
          <input
            type="text"
            value={formatDate(sqDate)}
            readOnly
            className={`${inputClass} bg-gray-50`}
          />
        </div>

        <div className="lg:col-span-2 space-y-1">
          <label className={labelClass}>ลูกค้า (CUSTOMER)</label>
          <div className="relative group">
            <input
              type="text"
              value={customerDisplay}
              readOnly
              className={`${inputClass} pl-9 bg-gray-50/50 italic`}
              placeholder="-- ยังไม่ได้เลือกคู่ค้า --"
            />
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Row 2: Lead & Branch */}
        <div className="lg:col-span-2 space-y-1">
          <label className={labelClass}>อ้างอิงเลขที่ Lead (LEAD_ID)</label>
          <div className="relative">
            <input
              type="text"
              value={leadId || ''}
              readOnly
              className={`${inputClass} pl-9`}
              placeholder="ไม่มีการอ้างอิง Lead"
            />
            <ClipboardList size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-1">
          <label className={labelClass}>สาขา (BRANCH_ID)</label>
          <input
            type="text"
            value={branchName || '-'}
            readOnly
            className={inputClass}
          />
        </div>

        {/* Row 3: Terms & Tax */}
        <div className="space-y-1">
          <label className={labelClass}>ยื่นราคาจนถึงวันที่ (VALID_UNTIL)</label>
          <input
            type="text"
            value={formatDate(validUntil)}
            readOnly
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>เครดิตเทอม (วัน)</label>
          <input
            type="text"
            value={paymentTermDays ?? 0}
            readOnly
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>ประเภทภาษี (TAX_CODE)</label>
          <input
            type="text"
            value={taxCode || '-'}
            readOnly
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>แผนก (DEPT)</label>
          <input
            type="text"
            value={empDeptName || '-'}
            readOnly
            className={inputClass}
          />
        </div>

        {/* Row 4: Project & Area */}
        <div className="space-y-1">
          <label className={labelClass}>JOB (PROJECT_ID)</label>
          <input
            type="text"
            value={projectName || '-'}
            readOnly
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>เขตการขาย (SALE AREA)</label>
          <input
            type="text"
            value={saleAreaName || '-'}
            readOnly
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>พนักงานขาย (SALES PERSON)</label>
          <input
            type="text"
            value={empSaleName || '-'}
            readOnly
            className={inputClass}
          />
        </div>

        <div className="lg:col-span-2 space-y-1">
          <label className={labelClass}>หมายเหตุทั่วไป (REMARKS)</label>
          <input
            type="text"
            value={remarks || ''}
            readOnly
            className={`${inputClass} resize-none`}
            placeholder="ไม่มีหมายเหตุ"
          />
        </div>
      </div>

      {/* 💹 Multicurrency Section — Integrated into Header Flow */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <MulticurrencyWrapper
          name="isMulticurrency"
          label="ระบุสกุลเงินต่างประเทศ (Multicurrency)"
          checked={watch('isMulticurrency')}
          onCheckedChange={(val) => {
            if (readOnly) return;
            setValue('isMulticurrency', val);

            // 🚀 Smart Filling: When activated, ensure fields are not empty
            if (val) {
              const currentData = watch();
              if (!currentData.base_currency_code) setValue('base_currency_code', 'THB');
              if (!currentData.quote_currency_code) setValue('quote_currency_code', 'THB');
              if (!currentData.exchange_rate) setValue('exchange_rate', 1);
              if (!currentData.exchange_rate_date) {
                setValue('exchange_rate_date', new Date().toISOString());
              }
            }
          }}
          alwaysVisible={!!watch('sq_id')}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start mt-2">
            <div>
              <label className={labelClass}>วันที่อัตราแลกเปลี่ยน</label>
              <Controller
                name="exchange_rate_date"
                control={control}
                render={({ field }) => (
                  <div className="relative group">
                    <input
                      type="text"
                      value={formatDate(field.value)}
                      readOnly
                      className={`${inputClass} bg-gray-50/50 italic pr-10`}
                    />
                    <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                )}
              />
            </div>

            <div>
              <label className={labelClass}>สกุลเงิน (Currency)</label>
              <select
                {...register('base_currency_code')}
                disabled
                className="h-9 w-full px-3 text-sm bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white cursor-not-allowed shadow-sm"
              >
                <option value="">เลือกสกุลเงิน</option>
                {currencies.map((c) => (
                  <option key={c.currency_id} value={c.currency_code}>
                    {c.currency_code} - {c.name_th}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>ไปยังสกุลเงิน (Quote)</label>
              <select
                {...register('quote_currency_code')}
                disabled
                className="h-9 w-full px-3 text-sm bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white cursor-not-allowed shadow-sm"
              >
                <option value="">เลือกสกุลเงิน</option>
                {currencies.map((c) => (
                  <option key={c.currency_id} value={c.currency_code}>
                    {c.currency_code} - {c.name_th}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>อัตราแลกเปลี่ยน</label>
              <div className="relative">
                <input
                  type="number"
                  {...register('exchange_rate')}
                  readOnly
                  className="h-9 w-full px-3 text-right bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white font-mono font-bold cursor-not-allowed shadow-sm focus:ring-0"
                />
              </div>
            </div>
          </div>
        </MulticurrencyWrapper>
      </div>
    </section>
  );
}
