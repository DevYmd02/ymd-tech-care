import { FileBox, Search, User, ClipboardList } from 'lucide-react';
import { useFormContext, Controller } from 'react-hook-form';
import { MulticurrencyWrapper } from '@/shared/components/forms/MulticurrencyWrapper';
import { CustomDateInput, StatusCheckbox } from '@ui';
import type { ReservationFormData } from '../types/reservation.types';
import type { 
    BranchListItem, 
    Currency, 
    DepartmentListItem, 
    Project, 
    ItemTypeListItem 
} from '@/modules/master-data/types/master-data-types';
import type { CustomerMaster } from '@/modules/master-data/customer/customer-master/types/customer-types';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import type { SaleAreaMaster } from '@/modules/master-data/sales/pages/area/types/area.types';

interface ReservationHeaderFormProps {
    branches: BranchListItem[];
    currencies: Currency[];
    customers: CustomerMaster[];
    taxCodes: TaxCode[];
    departments: DepartmentListItem[];
    projects: Project[];
    itemTypes: ItemTypeListItem[];
    saleAreas: SaleAreaMaster[];
    readOnly?: boolean;
    onSearchCustomer?: () => void;
    onSearchLead?: () => void;
}

export function ReservationHeaderForm({ 
    branches, 
    currencies, 
    customers, 
    taxCodes,
    departments,
    projects,
    itemTypes,
    saleAreas,
    readOnly = false,
    onSearchCustomer,
    onSearchLead
}: ReservationHeaderFormProps) {
    const { register, watch, setValue, control } = useFormContext<ReservationFormData>();
    
    const formData = watch();
    const isLocked = readOnly;

    // Localized premium styles (Purple theme)
    const inputClass = "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    const selectClass = "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white cursor-pointer disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    const labelClass = "block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider";
    const cardSection = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 bg-purple-50/10 dark:bg-purple-900/5 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/20";

    // Find selected customer name for display
    const selectedCustomer = customers.find(c => String(c.customer_id || c.id) === String(formData.customer_id));
    const customerDisplay = selectedCustomer 
        ? `${selectedCustomer.customer_code || selectedCustomer.code || ''} - ${selectedCustomer.customer_name_th || selectedCustomer.customer_name || selectedCustomer.name_th || ''}` 
        : '';

    return (
        <section className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 text-purple-600 dark:text-purple-400">
                <FileBox size={20} strokeWidth={2.5} />
                <h3 className="text-lg font-bold">ข้อมูลส่วนหัวใบสั่งจอง (Header Reservation)</h3>
            </div>

            <div className={cardSection}>
                
                {/* Basic Info Row */}
                <div className="space-y-1">
                    <label className={labelClass}>เลขที่ใบสั่งจอง (reservation_no) <span className="text-red-500">*</span></label>
                    <input 
                        {...register('reservation_no')}
                        readOnly
                        placeholder="RS-AUTO"
                        className={`${inputClass} bg-gray-50 border-gray-200 cursor-not-allowed`}
                    />
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>วันที่จอง (reservation_date) <span className="text-red-500">*</span></label>
                    <Controller
                        name="reservation_date"
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
                    <label className={labelClass}>สาขา (branch_id) <span className="text-red-500">*</span></label>
                    <select
                        {...register('branch_id')}
                        disabled={isLocked}
                        className={selectClass}
                    >
                        <option value="">-- เลือกสาขา --</option>
                        {branches.map(branch => (
                            <option key={branch.branch_id} value={String(branch.branch_id || '')}>
                                {branch.branch_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1 pt-[22px]">
                    <div className="flex items-center h-9">
                        <StatusCheckbox 
                            name="onhold"
                            control={control}
                            label="ON HOLD"
                            disabled={isLocked}
                        />
                    </div>
                </div>

                {/* Customer & Leads Row */}
                <div className="space-y-1 lg:col-span-2">
                    <label className={labelClass}>ลูกค้า (customer_id) <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                            <input 
                                value={customerDisplay}
                                readOnly
                                disabled={isLocked}
                                className={`${inputClass} pl-9 bg-gray-50/50 italic cursor-not-allowed group-hover:border-purple-400 transition-colors`}
                                placeholder="-- คลิกปุ่มแว่นขยายเพื่อเลือกลูกค้า --"
                            />
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <button 
                            type="button" 
                            disabled={isLocked} 
                            onClick={() => onSearchCustomer?.()}
                            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0 w-9 h-9"
                        >
                            <Search size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>อ้างอิงใบเสนอราคา (sq_id)</label>
                    <div className="flex gap-2">
                        <input 
                            {...register('sq_id')}
                            disabled={isLocked}
                            className={inputClass} 
                            placeholder="SQxxxx-xxx (ถ้ามี)"
                        />
                        <button 
                            type="button" 
                            disabled={isLocked} 
                            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0 w-9 h-9"
                        >
                            <ClipboardList size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>Lead/CRM (lead_id)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                             <input 
                                {...register('lead_id')}
                                disabled={isLocked}
                                className={inputClass} 
                                placeholder="Lead ID (ถ้ามี)"
                            />
                        </div>
                        <button 
                            type="button" 
                            disabled={isLocked} 
                            onClick={() => onSearchLead?.()}
                            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0 w-9 h-9"
                        >
                            <ClipboardList size={18} />
                        </button>
                    </div>
                </div>

                {/* Terms Row */}
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
                    <label className={labelClass}>วันที่กำหนดส่ง (ship_date) <span className="text-red-500">*</span></label>
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



                {/* Sales Org Row */}
                <div className="space-y-1">
                    <label className={labelClass}>แผนก (emp_dept_id)</label>
                    <select 
                        {...register('emp_dept_id')}
                        disabled={isLocked}
                        className={selectClass}
                    >
                        <option value="">-- เลือกแผนก --</option>
                        {departments.map(dept => (
                            <option key={dept.emp_dept_id || dept.dept_id || dept.id} value={String(dept.emp_dept_id || dept.dept_id || dept.id || '')}>
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
                        {saleAreas.map(area => (
                            <option key={area.sale_area_id} value={area.sale_area_id}>
                                {area.sale_area_code} - {area.sale_area_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>โครงการ/งาน (job_id)</label>
                    <select 
                        {...register('job_id')}
                        disabled={isLocked}
                        className={selectClass}
                    >
                        <option value="">-- เลือกโครงการ --</option>
                        {projects.map(proj => (
                            <option key={proj.project_id} value={String(proj.project_id || '')}>
                                {proj.project_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>ประเภทสินค้าหลัก (item_id)</label>
                    <select 
                        {...register('item_id')}
                        disabled={isLocked}
                        className={selectClass}
                    >
                        <option value="">-- เลือกประเภทสินค้า --</option>
                        {itemTypes.map(item => (
                            <option key={item.item_type_id} value={String(item.item_type_id || '')}>
                                {item.item_type_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>ประเภทภาษี (tax_code_id)</label>
                    <select 
                        {...register('tax_code_id', {
                            setValueAs: (v) => (v === '' ? null : Number(v)),
                        })}
                        disabled={isLocked}
                        className={selectClass}
                    >
                        <option value="">-- เลือกประเภทภาษี --</option>
                        {taxCodes.map(group => (
                            <option key={group.tax_code_id} value={String(group.tax_code_id || '')}>
                                {group.tax_code}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="lg:col-span-3 space-y-1">
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

             {/* Footer section for status remarks if cancelled/expired */}
             {(formData.status === 'CANCELLED' || formData.status === 'EXPIRED') && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
                    <label className="block text-xs font-bold text-red-600 dark:text-red-400 mb-1 uppercase">
                        เหตุผลการยกเลิก/หมดอายุ (status_remark)
                    </label>
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">{formData.status_remark || '-'}</p>
                </div>
             )}

            {/* Multicurrency Section */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mt-6">
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
                                const today = new Date().toISOString().split('T')[0];
                                setValue('exchange_rate_date', today, { shouldValidate: true, shouldDirty: true });
                            }
                            if (!formData.base_currency_code) {
                                setValue('base_currency_code', 'THB', { shouldValidate: true, shouldDirty: true });
                            }
                            if (!formData.quote_currency_code) {
                                setValue('quote_currency_code', 'THB', { shouldValidate: true, shouldDirty: true });
                            }
                            if (!formData.exchange_rate) {
                                setValue('exchange_rate', 1, { shouldValidate: true, shouldDirty: true });
                            }
                        }
                    }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่อัตราแลกเปลี่ยน</label>
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
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">รหัสสกุลเงิน (Base)</label>
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
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ไปยังสกุลเงิน (Quote)</label>
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
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">อัตราแลกเปลี่ยน</label>
                            <input 
                                type="number"
                                step="0.000001"
                                {...register('exchange_rate', { valueAsNumber: true })}
                                readOnly={formData.base_currency_code === 'THB'}
                                className={`${inputClass} text-right font-semibold ${formData.base_currency_code === 'THB' ? 'bg-gray-100 italic' : ''}`}
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
