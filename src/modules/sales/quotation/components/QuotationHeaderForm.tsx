import { FileText, Search, User, ClipboardList} from 'lucide-react';
import { useFormContext, Controller } from 'react-hook-form';
import { MulticurrencyWrapper } from '@components/forms/MulticurrencyWrapper';
import { CustomDateInput, StatusCheckbox } from '@ui';
import { SQStatusBadge } from '@sales/shared/components/SQStatusBadge';
import type { QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';
import type { 
    BranchListItem, 
    Currency, 
    DepartmentListItem, 
    Project,
    EmployeeListItem
} from '@master-data/types/master-data-types';
import type { CustomerMaster } from '@customer/customer-master/types/customer-types';
import type { TaxCode } from '@master-data/tax/types/tax-types';
import type { SaleAreaListItem } from '@master-data/sales/pages/area/types/area.types';

interface QuotationHeaderFormProps {
    branches: BranchListItem[];
    currencies: Currency[];
    customers: CustomerMaster[];
    selectedCustomer?: CustomerMaster | null;
    taxCodes: TaxCode[];
    departments: DepartmentListItem[];
    projects: Project[];
    saleAreas: SaleAreaListItem[];
    employees: EmployeeListItem[];
    readOnly?: boolean;
    onSearchCustomer?: () => void;
    onSearchLead?: () => void;
}

// Helper for consistent employee name formatting
const formatEmployeeName = (emp: EmployeeListItem) => {
    if (emp.employee_fullname) return emp.employee_fullname;
    
    const title = emp.employee_title_th || emp.title_name || '';
    const firstName = emp.employee_firstname_th || emp.first_name || '';
    const lastName = emp.employee_lastname_th || emp.last_name || '';
    
    const combined = `${title} ${firstName} ${lastName}`.trim();
    return combined || emp.employee_name || '-';
};

export function QuotationHeaderForm({ 
    branches, 
    currencies, 
    customers, 
    selectedCustomer,
    taxCodes,
    departments,
    projects,
    saleAreas,
    employees,
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
    
    // 🎯 Resolve selected customer: First try from the single query, then fallback to preloaded master list
    const selectedCustomerObj = (selectedCustomer && Number(selectedCustomer.customer_id || selectedCustomer.id) === currentCustomerId)
        ? selectedCustomer
        : (currentCustomerId > 0 ? customers.find(c => Number(c.customer_id || c.id) === currentCustomerId) : undefined);

    const customerDisplay = selectedCustomerObj 
        ? `${selectedCustomerObj.customer_code || selectedCustomerObj.code || ''} - ${selectedCustomerObj.customer_name_th || selectedCustomerObj.customer_name || selectedCustomerObj.name_th || ''}` 
        : '';

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <FileText size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">ข้อมูลใบเสนอราคา — Header Quotation</h3>
                    {(formData.status && formData.sq_no) && (
                        <SQStatusBadge 
                            status={formData.status} 
                            className="ml-2 py-0.5 px-2 text-[10px] font-bold uppercase tracking-wider shadow-sm" 
                        />
                    )}
                </div>
                
                {/* 🛡️ Strategic Placement: ON HOLD moves to the header row for maximum visibility and better layout balance */}
                <div className="flex items-center h-9 px-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-900/30">
                    <StatusCheckbox 
                        name="onhold"
                        control={control}
                        label="ON HOLD"
                        disabled={isLocked}
                    />
                </div>
            </div>

            <div className={cardSection}>
                
                {/* Row 1: Main Identification */}
                <div className="space-y-1">
                    <label className={labelClass}>เลขที่ใบเสนอราคา <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input 
                            {...register('sq_no')}
                            readOnly
                            placeholder="ระบบจะกรอกให้อัตโนมัติเมื่อบันทึก"
                            className={`${inputClass} bg-gray-50 border-gray-200 cursor-not-allowed ${!watch('sq_no') ? 'italic text-gray-500/70' : 'font-bold text-blue-600'}`}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>วันที่ <span className="text-red-500">*</span></label>
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

                <div className="lg:col-span-2 space-y-1">
                    <label className={labelClass}>ลูกค้า <span className="text-red-500">*</span></label>
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
                    {errors.customer_id && <span className="text-[10px] text-red-500 font-medium tracking-tight">กรุณาเลือกลูกค้า</span>}
                </div>

                {/* Row 2: Secondary Tracking - Now balanced with 2:2 ratio */}
                <div className="lg:col-span-2 space-y-1">
                    <label className={labelClass}>อ้างอิงเลขที่ Lead </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                            <input 
                                {...register('lead_id')}
                                disabled={isLocked}
                                className={`${inputClass} group-hover:border-blue-400 transition-colors`} 
                                placeholder="LEAD-xxx (ถ้ามีชื่อ Lead อ้างอิง)"
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

                <div className="lg:col-span-2 space-y-1">
                    <label className={labelClass}>สาขา <span className="text-red-500">*</span></label>
                    <select
                        {...register('branch_id', {
                            setValueAs: (v) => (v === '' || v === '0' ? null : Number(v)),
                        })}
                        disabled={isLocked}
                        className={`${selectClass} ${getErrorClass('branch_id')}`}
                    >
                        <option value="0">-- เลือกสาขา --</option>
                        {branches.map(branch => (
                            <option key={branch.branch_id} value={String(branch.branch_id || '')}>
                                {branch.branch_name}
                            </option>
                        ))}
                    </select>
                    {errors.branch_id && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">กรุณาเลือกสาขา</span>}
                </div>

                {/* Row 3: Terms and Classification */}
                <div className="space-y-1">
                    <label className={labelClass}>ยื่นราคาจนถึงวันที่ </label>
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

                <div className="space-y-1">
                    <label className={labelClass}>เครดิตเทอม (วัน) (PAYMENT_TERM_DAYS)</label>
                    <input 
                        type="number"
                        {...register('payment_term_days', { valueAsNumber: true })}
                        disabled={isLocked}
                        className={inputClass} 
                        placeholder="0"
                    />
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>ประเภทภาษี (TAX_CODE_ID) <span className="text-red-500">*</span></label>
                    <select 
                        {...register('tax_code_id', {
                            setValueAs: (v) => (v === '' || v === '0' ? null : Number(v)),
                        })}
                        disabled={isLocked}
                        className={`${selectClass} ${getErrorClass('tax_code_id')}`}
                    >
                        <option value="0">-- เลือกประเภทภาษี --</option>
                        {taxCodes.map(group => (
                            <option key={group.tax_code_id} value={String(group.tax_code_id || '')}>
                                {group.tax_code}
                            </option>
                        ))}
                    </select>
                    {errors.tax_code_id && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">กรุณาเลือกประเภทภาษี</span>}
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>แผนก (EMP_DEPT_ID) <span className="text-red-500">*</span></label>
                    <select 
                        {...register('emp_dept_id', {
                            setValueAs: (v) => (v === '' || v === '0' ? null : Number(v)),
                        })}
                        disabled={isLocked}
                        className={`${selectClass} ${getErrorClass('emp_dept_id')}`}
                    >
                        <option value="0">-- เลือกแผนก --</option>
                        {departments.map(dept => (
                            <option key={dept.emp_dept_id || dept.dept_id || dept.id} value={String(dept.emp_dept_id || dept.dept_id || dept.id || '')}>
                                {(dept.emp_dept_code || dept.dept_code) ? `${dept.emp_dept_code || dept.dept_code} - ` : ''}
                                {dept.emp_dept_name || dept.dept_name || dept.department_name}
                            </option>
                        ))}
                    </select>
                    {errors.emp_dept_id && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">กรุณาเลือกแผนก</span>}
                </div>

                {/* Row 4: Project and Notes */}
                <div className="space-y-1">
                    <label className={labelClass}>JOB (PROJECT_ID) <span className="text-red-500">*</span></label>
                    <select 
                        {...register('project_id', {
                            setValueAs: (v) => (v === '' || v === '0' ? null : Number(v)),
                        })}
                        disabled={isLocked}
                        className={`${selectClass} ${getErrorClass('project_id')}`}
                    >
                        <option value="0">-- เลือกโครงการ --</option>
                        {projects.map(proj => (
                            <option key={proj.project_id} value={String(proj.project_id || '')}>
                                {proj.project_name}
                            </option>
                        ))}
                    </select>
                    {errors.project_id && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">กรุณาเลือกโครงการ</span>}
                </div>
                
                <div className="space-y-1">
                    <label className={labelClass}>เขตการขาย (SALE AREA) <span className="text-red-500">*</span></label>
                    <select 
                        {...register('sale_area_id', {
                            setValueAs: (v) => (v === '' || v === '0' ? null : Number(v)),
                        })}
                        disabled={isLocked}
                        className={`${selectClass} ${getErrorClass('sale_area_id')}`}
                    >
                        <option value="0">-- เลือกเขตการขาย --</option>
                        {saleAreas.map(area => (
                            <option key={area.sale_area_id} value={String(area.sale_area_id || '')}>
                                {area.sale_area_code} - {area.sale_area_name}
                            </option>
                        ))}
                    </select>
                    {errors.sale_area_id && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">กรุณาเลือกเขตการขาย</span>}
                </div>

                <div className="lg:col-span-2 space-y-1">
                    <label className={labelClass}>พนักงานขาย (SALES PERSON) <span className="text-red-500">*</span></label>
                    <select 
                        {...register('emp_sale_id', {
                            setValueAs: (v) => (v === '' || v === '0' ? null : Number(v)),
                        })}
                        disabled={isLocked}
                        className={`${selectClass} ${getErrorClass('emp_sale_id')}`}
                    >
                        <option value="0">-- เลือกพนักงานขาย --</option>
                        {employees.map(emp => (
                            <option key={emp.employee_id} value={String(emp.employee_id || '')}>
                                {emp.employee_code} - {formatEmployeeName(emp)}
                            </option>
                        ))}
                    </select>
                    {errors.emp_sale_id && <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">กรุณาเลือกพนักงานขาย</span>}
                </div>

                <div className="lg:col-span-4 space-y-1">
                    <label className={labelClass}>หมายเหตุทั่วไป (REMARKS)</label>
                    <textarea 
                        {...register('remarks')}
                        disabled={isLocked}
                        rows={2}
                        className={`${inputClass} py-2 resize-none h-auto min-h-[60px]`}
                        placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                    />
                </div>
            </div>


            {/* Multicurrency Section */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <MulticurrencyWrapper 
                    name="isMulticurrency"
                    alwaysVisible={!!formData.sq_id || isLocked}
                    checked={formData.isMulticurrency} 
                    onCheckedChange={(checked) => {
                        if (isLocked) return;
                        setValue('isMulticurrency', checked);
                        if (!checked) {
                            setValue('exchange_rate_date', '');
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
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">สกุลเงิน (Currency)</label>
                            <Controller
                                name="base_currency_code"
                                control={control}
                                render={({ field }) => (
                                    <select 
                                        {...field}
                                        className={selectClass}
                                        disabled={isLocked}
                                    >
                                        <option value="">เลือกสกุลเงิน</option>
                                        {currencies.map((c) => (
                                            <option key={c.currency_id} value={c.currency_code}>
                                                {c.currency_code} - {c.name_th}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ไปยังสกุลเงิน (Quote)</label>
                            <Controller
                                name="quote_currency_code"
                                control={control}
                                render={({ field }) => (
                                    <select 
                                        {...field}
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
                                )}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">อัตราแลกเปลี่ยน</label>
                            <input 
                                type="number"
                                step="0.000001"
                                {...register('exchange_rate', { valueAsNumber: true })}
                                readOnly={formData.base_currency_code === 'THB' || !formData.isMulticurrency}
                                className={`${inputClass} text-right font-semibold ${(formData.base_currency_code === 'THB' || !formData.isMulticurrency) ? 'bg-gray-100 italic' : ''}`}
                                disabled={isLocked}
                                placeholder="0.000000"
                            />
                        </div>
                    </div>
                </MulticurrencyWrapper>
            </div>


        </section>
    );
}
