/**
 * @file SalesOrderHeaderForm.tsx
 * @description ฟอร์มส่วนหัวใบสั่งขาย (Sales Order Header)
 * @fields ตรงกับ sale_order_header (D9)
 */

import { ShoppingCart, Search, User } from 'lucide-react';
import { useFormContext, Controller } from 'react-hook-form';
import { MulticurrencyWrapper } from '@components/forms/MulticurrencyWrapper';
import { CustomDateInput, StatusCheckbox } from '@ui';
import type { SalesOrderFormData } from '../types/sales-order.types';
import type {
    BranchListItem,
    Currency,
    DepartmentListItem,
    Project,
} from '@master-data/types/master-data-types';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import type { TaxCode } from '@master-data/tax/types/tax-types';
import type { SaleAreaListItem } from '@master-data/sales/pages/area/types/area.types';

interface SalesOrderHeaderFormProps {
    branches: BranchListItem[];
    currencies: Currency[];
    customers: CustomerMaster[];
    taxCodes: TaxCode[];
    departments: DepartmentListItem[];
    projects: Project[];
    saleAreas: SaleAreaListItem[];
    readOnly?: boolean;
    onSearchCustomer?: () => void;
    onSearchEmployee?: () => void;
    onSearchReservation?: () => void;
}

export function SalesOrderHeaderForm({
    branches,
    currencies,
    customers,
    taxCodes,
    departments,
    projects,
    saleAreas,
    readOnly = false,
    onSearchCustomer,
    onSearchEmployee,
    onSearchReservation,
}: SalesOrderHeaderFormProps) {
    const { register, watch, setValue, control } = useFormContext<SalesOrderFormData>();

    const formData = watch();
    const isLocked = readOnly;

    // Indigo theme styles
    const inputClass =
        'h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm';
    const selectClass =
        'h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white cursor-pointer disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm';
    const labelClass =
        'block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider';
    const cardSection =
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 bg-indigo-50/10 dark:bg-indigo-900/5 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/20';

    // Find selected customer name for display
    const selectedCustomer = customers.find(
        (c) => String(c.customer_id || c.id) === String(formData.customer_id)
    );
    const customerDisplay = selectedCustomer
        ? `${selectedCustomer.customer_code || selectedCustomer.code || ''} - ${selectedCustomer.customer_name_th || selectedCustomer.customer_name || selectedCustomer.name_th || ''}`
        : '';

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <ShoppingCart size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">ข้อมูลส่วนหัวใบสั่งขาย (Header Sales Order)</h3>
                </div>
                <div className="flex items-center bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transform scale-90 origin-right">
                    <StatusCheckbox
                        name="onhold"
                        control={control}
                        label="ON HOLD"
                        disabled={isLocked}
                    />
                </div>
            </div>

            <div className={cardSection}>

                {/* Row 1: SO No / Date / Branch / Status */}
                <div className="space-y-1">
                    <label className={labelClass}>
                        เลขที่ใบสั่งขาย (so_no) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('so_no')}
                        readOnly
                        placeholder="ระบบจะกรอกให้อัตโนมัติเมื่อบันทึก"
                        className={`${inputClass} bg-gray-50 border-gray-200 cursor-not-allowed`}
                    />
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>
                        วันที่ SO (so_date) <span className="text-red-500">*</span>
                    </label>
                    <Controller
                        name="so_date"
                        control={control}
                        render={({ field }) => (
                            <CustomDateInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                disabled={isLocked}
                                className={inputClass}
                            />
                        )}
                    />
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>อ้างอิงใบจอง (reservation_id)</label>
                    <div className="flex gap-2">
                        <input
                            {...register('reservation_id')}
                            disabled={isLocked}
                            className={inputClass}
                            placeholder="RS-xxxx (ถ้ามี)"
                        />
                        <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => onSearchReservation?.()}
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0 w-9 h-9"
                        >
                            <Search size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>
                        สาขา (branch_id) <span className="text-red-500">*</span>
                    </label>
                    <select {...register('branch_id')} disabled={isLocked} className={selectClass}>
                        <option value="">-- เลือกสาขา --</option>
                        {branches.map((branch) => (
                            <option key={branch.branch_id} value={String(branch.branch_id || '')}>
                                {branch.branch_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Row 2: Customer / Terms / Ship */}
                <div className="space-y-1 lg:col-span-2">
                    <label className={labelClass}>
                        ลูกค้า (customer_id) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                            <input
                                value={customerDisplay}
                                readOnly
                                disabled={isLocked}
                                className={`${inputClass} pl-9 bg-gray-50/50 italic cursor-not-allowed group-hover:border-indigo-400 transition-colors`}
                                placeholder="-- คลิกปุ่มแว่นขยายเพื่อเลือกลูกค้า --"
                            />
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => onSearchCustomer?.()}
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0 w-9 h-9"
                        >
                            <Search size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>เครดิตเทอม (วัน) (payment_term_days)</label>
                    <input
                        type="number"
                        {...register('payment_term_days', { valueAsNumber: true })}
                        disabled={isLocked}
                        className={inputClass}
                        placeholder="0"
                    />
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>ส่งของภายใน (วัน) (ship_days)</label>
                    <input
                        type="number"
                        {...register('ship_days', { valueAsNumber: true })}
                        disabled={isLocked}
                        className={inputClass}
                        placeholder="0"
                    />
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>วันที่กำหนดส่ง (ship_date)</label>
                    <Controller
                        name="ship_date"
                        control={control}
                        render={({ field }) => (
                            <CustomDateInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                disabled={isLocked}
                                className={inputClass}
                            />
                        )}
                    />
                </div>

                {/* Row 4: Customer PO */}
                <div className="space-y-1">
                    <label className={labelClass}>เลขที่ PO ลูกค้า (cust_po_no)</label>
                    <input
                        {...register('cust_po_no')}
                        disabled={isLocked}
                        className={inputClass}
                        placeholder="PO-xxxx"
                    />
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>วันที่ PO ลูกค้า (cust_po_date)</label>
                    <Controller
                        name="cust_po_date"
                        control={control}
                        render={({ field }) => (
                            <CustomDateInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                disabled={isLocked}
                                className={inputClass}
                            />
                        )}
                    />
                </div>

                {/* Row 5: Org / Sales */}
                <div className="space-y-1">
                    <label className={labelClass}>แผนกขาย (emp_dept_id)</label>
                    <select
                        {...register('emp_dept_id')}
                        disabled={isLocked}
                        className={selectClass}
                    >
                        <option value="">-- เลือกแผนก --</option>
                        {departments.map((dept) => (
                            <option
                                key={dept.emp_dept_id || dept.dept_id || dept.id}
                                value={String(dept.emp_dept_id || dept.dept_id || dept.id || '')}
                            >
                                {dept.emp_dept_name || dept.dept_name || dept.department_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>เขตการขาย (emp_area_id)</label>
                    <select
                        {...register('emp_area_id')}
                        disabled={isLocked}
                        className={selectClass}
                    >
                        <option value="">-- เลือกเขตการขาย --</option>
                        {saleAreas.map((area) => (
                            <option key={area.sale_area_id} value={area.sale_area_id}>
                                {area.sale_area_code} - {area.sale_area_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>โครงการ/งาน (job_id)</label>
                    <select {...register('job_id')} disabled={isLocked} className={selectClass}>
                        <option value="">-- เลือกโครงการ --</option>
                        {projects.map((proj) => (
                            <option key={proj.project_id} value={String(proj.project_id || '')}>
                                {proj.project_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>พนักงานขาย (emp_sale_id)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                            <input
                                value={formData.emp_sale_name || ''}
                                readOnly
                                disabled={isLocked}
                                className={`${inputClass} pl-9 bg-gray-50/50 italic cursor-not-allowed group-hover:border-indigo-400 transition-colors`}
                                placeholder="-- คลิกค้นหาพนักงาน --"
                            />
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => onSearchEmployee?.()}
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0 w-9 h-9"
                        >
                            <Search size={18} />
                        </button>
                    </div>
                </div>

                {/* Row 6: Tax / Remarks */}
                <div className="space-y-1">
                    <label className={labelClass}>ประเภทภาษี (tax_code_id)</label>
                    <select
                        {...register('tax_code_id', {
                            setValueAs: (v) => (v === '' ? undefined : Number(v)),
                        })}
                        disabled={isLocked}
                        className={selectClass}
                    >
                        <option value="">-- เลือกประเภทภาษี --</option>
                        {taxCodes.map((group) => (
                            <option
                                key={group.tax_code_id}
                                value={String(group.tax_code_id || '')}
                            >
                                {group.tax_code}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="lg:col-span-2 space-y-1">
                    <label className={labelClass}>หมายเหตุ (remarks)</label>
                    <textarea
                        {...register('remarks')}
                        disabled={isLocked}
                        rows={1}
                        className={`${inputClass} py-1.5 resize-none`}
                        placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                    />
                </div>
            </div>

            {/* Cancelled / Closed status remark */}
            {(formData.status === 'CANCELLED') && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
                    <label className="block text-xs font-bold text-red-600 dark:text-red-400 mb-1 uppercase">
                        เหตุผลการยกเลิก (status_remark)
                    </label>
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                        {formData.status_remark || '-'}
                    </p>
                </div>
            )}

            {/* Multicurrency Section */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <MulticurrencyWrapper
                    name="isMulticurrency"
                    checked={formData.isMulticurrency}
                    onCheckedChange={(checked) => {
                        if (isLocked) return;
                        setValue('isMulticurrency', checked);
                        if (!checked) {
                            setValue('exchange_rate_date', '');
                            setValue('base_currency_code', 'THB');
                            setValue('quote_currency_code', 'THB');
                            setValue('exchange_rate', 1);
                        } else {
                            if (!formData.exchange_rate_date) {
                                setValue('exchange_rate_date', new Date().toISOString().split('T')[0], {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                });
                            }
                            if (!formData.base_currency_code) setValue('base_currency_code', 'THB');
                            if (!formData.quote_currency_code) setValue('quote_currency_code', 'THB');
                            if (!formData.exchange_rate) setValue('exchange_rate', 1);
                        }
                    }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                วันที่อัตราแลกเปลี่ยน
                            </label>
                            <Controller
                                name="exchange_rate_date"
                                control={control}
                                render={({ field }) => (
                                    <CustomDateInput
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        disabled={!formData.isMulticurrency || isLocked}
                                        className={inputClass}
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                รหัสสกุลเงิน (Base)
                            </label>
                            <select
                                {...register('base_currency_code')}
                                className={selectClass}
                                disabled={!formData.isMulticurrency || isLocked}
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
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                ไปยังสกุลเงิน (Quote)
                            </label>
                            <select
                                {...register('quote_currency_code')}
                                className={selectClass}
                                disabled={!formData.isMulticurrency || isLocked}
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
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                อัตราแลกเปลี่ยน
                            </label>
                            <input
                                type="number"
                                step="0.000001"
                                {...register('exchange_rate', { valueAsNumber: true })}
                                readOnly={formData.base_currency_code === 'THB'}
                                className={`${inputClass} text-right font-semibold ${
                                    formData.base_currency_code === 'THB' ? 'bg-gray-100 italic' : ''
                                }`}
                                disabled={!formData.isMulticurrency || isLocked}
                                placeholder="0.000000"
                            />
                        </div>
                    </div>
                </MulticurrencyWrapper>
            </div>
        </section>
    );
}
