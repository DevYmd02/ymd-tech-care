import { FileText, Search, User, ClipboardList} from 'lucide-react';
import { useFormContext, Controller } from 'react-hook-form';
import { MulticurrencyWrapper } from '@/shared/components/forms/MulticurrencyWrapper';
import { CustomDateInput, StatusCheckbox } from '@ui';
import type { QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';
import type { 
    BranchListItem, 
    Currency, 
    DepartmentListItem, 
    Project, 
    ItemTypeListItem 
} from '@/modules/master-data/types/master-data-types';
import type { CustomerMaster } from '@/modules/master-data/customer/customer-master/types/customer-types';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';

interface QuotationHeaderFormProps {
    branches: BranchListItem[];
    currencies: Currency[];
    customers: CustomerMaster[];
    taxCodes: TaxCode[];
    departments: DepartmentListItem[];
    projects: Project[];
    itemTypes: ItemTypeListItem[];
    readOnly?: boolean;
    onSearchCustomer?: () => void;
    onSearchLead?: () => void;
}

export function QuotationHeaderForm({ 
    branches, 
    currencies, 
    customers, 
    taxCodes,
    departments,
    projects,
    itemTypes,
    readOnly = false,
    onSearchCustomer,
    onSearchLead
}: QuotationHeaderFormProps) {
    const { register, watch, setValue, control, formState: { errors } } = useFormContext<QuotationFormValues>();
    
    const formData = watch();
    const isLocked = readOnly;

    // Premium localized styles
    const inputClass = "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    const selectClass = "h-9 w-full px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white cursor-pointer disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";
    const labelClass = "block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider";
    const cardSection = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 bg-blue-50/10 dark:bg-blue-900/5 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20";
    
    const getErrorClass = (fieldName: keyof QuotationFormValues) => 
        errors[fieldName] ? "border-red-500 focus:ring-red-500 ring-2 ring-red-500/50" : "";

    // Find selected customer name for display (Direct numeric comparison preferred)
    const currentCustomerId = Number(formData.customer_id || 0);
    const selectedCustomer = currentCustomerId > 0 
        ? customers.find(c => Number(c.customer_id || c.id) === currentCustomerId)
        : undefined;

    const customerDisplay = selectedCustomer 
        ? `${selectedCustomer.customer_code || selectedCustomer.code || ''} - ${selectedCustomer.customer_name_th || selectedCustomer.customer_name || selectedCustomer.name_th || ''}` 
        : '';

    return (
        <section className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 text-blue-600 dark:text-blue-400">
                <FileText size={20} strokeWidth={2.5} />
                <h3 className="text-lg font-bold">ข้อมูลใบเสนอราคา — Header Quotation</h3>
            </div>

            <div className={cardSection}>
                
                {/* Row 1 */}
                <div className="space-y-1">
                    <label className={labelClass}>เลขที่ใบเสนอราคา (sq_no) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input 
                            {...register('sq_no')}
                            readOnly
                            placeholder="ระบบออกให้อัตโนมัติ"
                            className={`${inputClass} bg-gray-50 border-gray-200 cursor-not-allowed`}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>วันที่ (sq_date) <span className="text-red-500">*</span></label>
                    <Controller
                        name="sq_date"
                        control={control}
                        render={({ field }) => (
                            <CustomDateInput
                                value={field.value || ''}
                                onChange={field.onChange}
                                disabled={isLocked}
                                className={`${inputClass} ${getErrorClass('sq_date')}`}
                            />
                        )}
                    />
                    {errors.sq_date && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">กรุณาระบุวันที่</span>}
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>ลูกค้า (customer_id) <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                            <input 
                                value={customerDisplay}
                                readOnly
                                disabled={isLocked}
                                className={`${inputClass} pl-9 bg-gray-50/50 italic cursor-not-allowed group-hover:border-blue-400 transition-colors ${getErrorClass('customer_id')}`}
                                placeholder="-- คลิกเพื่อค้นหาลูกค้า --"
                            />
                            <User size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.customer_id ? 'text-red-500' : 'text-gray-400'}`} />
                        </div>
                        <button 
                            type="button" 
                            disabled={isLocked} 
                            onClick={() => onSearchCustomer?.()}
                            className={`p-2 ${errors.customer_id ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0 w-9 h-9`}
                        >
                            <Search size={18} />
                        </button>
                    </div>
                    {errors.customer_id && <span className="text-[10px] text-red-500 font-medium">กรุณาเลือกลูกค้า</span>}
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>&nbsp;</label>
                    <div className="flex items-center h-9">
                        <StatusCheckbox 
                            name="onhold"
                            control={control}
                            label="ON HOLD"
                            disabled={isLocked}
                        />
                    </div>
                </div>

                {/* Row 2 */}
                <div className="space-y-1">
                    <label className={labelClass}>อ้างอิงเลขที่ Lead (lead_id)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input 
                                {...register('lead_id')}
                                disabled={isLocked}
                                className={inputClass} 
                                placeholder="LEAD-xxx (ถ้ามี)"
                            />
                        </div>
                        <button 
                            type="button" 
                            disabled={isLocked} 
                            onClick={() => onSearchLead?.()}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0 w-9 h-9"
                        >
                            <ClipboardList size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>สาขา (branch_id) <span className="text-red-500">*</span></label>
                    <select
                        {...register('branch_id', {
                            setValueAs: (v) => (v === '' ? null : Number(v)),
                        })}
                        disabled={isLocked}
                        className={`${selectClass} ${getErrorClass('branch_id')}`}
                    >
                        <option value="">-- เลือกสาขา --</option>
                        {branches.map(branch => (
                            <option key={branch.branch_id} value={String(branch.branch_id || '')}>
                                {branch.branch_name}
                            </option>
                        ))}
                    </select>
                    {errors.branch_id && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">กรุณาเลือกสาขา</span>}
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>ยื่นราคาจนถึงวันที่ (valid_until)</label>
                    <Controller
                        name="valid_until"
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

                {/* Row 3 */}
                <div className="space-y-1">
                    <label className={labelClass}>วันที่กำหนดส่งของ (ship_date)</label>
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

                <div className="space-y-1">
                    <label className={labelClass}>เครดิตเทอม (วัน) (payment_term_days)</label>
                    <input 
                        type="number"
                        {...register('payment_term_days', { valueAsNumber: true })}
                        disabled={isLocked}
                        className={inputClass} 
                        placeholder="เช่น 30 วัน, 60 วัน"
                    />
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>ประเภทสินค้า (item_id)</label>
                    <select 
                        {...register('item_id', {
                            setValueAs: (v) => (v === '' ? null : Number(v)),
                        })}
                        disabled={isLocked}
                        className={`${selectClass} ${getErrorClass('item_id')}`}
                    >
                        <option value="">-- เลือกประเภทสินค้า --</option>
                        {itemTypes.map(item => (
                            <option key={item.item_type_id} value={String(item.item_type_id || '')}>
                                {item.item_type_name}
                            </option>
                        ))}
                    </select>
                    {errors.item_id && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">ข้อมูลประเภทสินค้าไม่ถูกต้อง</span>}
                </div>

                {/* Row 4 */}
                <div className="space-y-1">
                    <label className={labelClass}>ประเภทภาษี (tax_code_id)</label>
                    <select 
                        {...register('tax_code_id', {
                            setValueAs: (v) => (v === '' ? null : Number(v)),
                        })}
                        disabled={isLocked}
                        className={`${selectClass} ${getErrorClass('tax_code_id')}`}
                    >
                        <option value="">-- เลือกประเภทภาษี --</option>
                        {taxCodes.map(group => (
                            <option key={group.tax_code_id} value={String(group.tax_code_id || '')}>
                                {group.tax_code}
                            </option>
                        ))}
                    </select>
                    {errors.tax_code_id && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">ข้อมูลประเภทภาษีไม่ถูกต้อง</span>}
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>แผนก (emp_dept_id)</label>
                    <select 
                        {...register('emp_dept_id', {
                            setValueAs: (v) => (v === '' ? null : Number(v)),
                        })}
                        disabled={isLocked}
                        className={`${selectClass} ${getErrorClass('emp_dept_id')}`}
                    >
                        <option value="">-- เลือกแผนก --</option>
                        {departments.map(dept => (
                            <option key={dept.emp_dept_id || dept.dept_id || dept.id} value={String(dept.emp_dept_id || dept.dept_id || dept.id || '')}>
                                {(dept.emp_dept_code || dept.dept_code) ? `${dept.emp_dept_code || dept.dept_code} - ` : ''}
                                {dept.emp_dept_name || dept.dept_name || dept.department_name}
                                {dept.emp_side_name ? ` (${dept.emp_side_name})` : ''}
                            </option>
                        ))}
                    </select>
                    {errors.emp_dept_id && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">ข้อมูลแผนกไม่ถูกต้อง</span>}
                </div>

                {/* Row 5 */}
                <div className="space-y-1">
                    <label className={labelClass}>Job/Project (project_id)</label>
                    <select 
                        {...register('project_id', {
                            setValueAs: (v) => (v === '' ? null : Number(v)),
                        })}
                        disabled={isLocked}
                        className={`${selectClass} ${getErrorClass('project_id')}`}
                    >
                        <option value="">-- เลือกโครงการ --</option>
                        {projects.map(proj => (
                            <option key={proj.project_id} value={String(proj.project_id || '')}>
                                {proj.project_name}
                            </option>
                        ))}
                    </select>
                    {errors.project_id && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">ข้อมูลโครงการไม่ถูกต้อง</span>}
                </div>

                <div className="lg:col-span-3 space-y-1">
                    <label className={labelClass}>หมายเหตุทั่วไป (remarks)</label>
                    <textarea 
                        {...register('remarks')}
                        disabled={isLocked}
                        rows={1}
                        className={`${inputClass} py-1.5 resize-none`}
                        placeholder="ระบุหมายเหตุเพิ่มเติม"
                    />
                </div>


            </div>

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
                                const today = new Date().toISOString().split('T')[0];
                                setValue('exchange_rate_date', today, { shouldValidate: true, shouldDirty: true });
                            }
                            // Default to THB when enabled if no currency is selected
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
