import { FileText, Search, User } from 'lucide-react';
import { useFormContext, Controller } from 'react-hook-form';
import { MulticurrencyWrapper } from '@/shared/components/forms/MulticurrencyWrapper';
import { CustomDateInput, StatusCheckbox } from '@ui';
import type { QuotationFormData } from '../types/quotation.types';
import type { 
    BranchListItem, 
    Currency, 
    DepartmentListItem, 
    Project, 
    ItemTypeListItem 
} from '@/modules/master-data/types/master-data-types';
import type { CustomerMaster } from '@/modules/master-data/customer/customer-master/types/customer-types';
import type { TaxGroup } from '@/modules/master-data/tax/types/tax-types';

interface QuotationHeaderFormProps {
    branches: BranchListItem[];
    currencies: Currency[];
    customers: CustomerMaster[];
    taxGroups: TaxGroup[];
    departments: DepartmentListItem[];
    projects: Project[];
    itemTypes: ItemTypeListItem[];
    readOnly?: boolean;
}

export function QuotationHeaderForm({ 
    branches, 
    currencies, 
    customers, 
    taxGroups,
    departments,
    projects,
    itemTypes,
    readOnly = false 
}: QuotationHeaderFormProps) {
    const { register, watch, setValue, control } = useFormContext<QuotationFormData>();
    
    const formData = watch();
    const isLocked = readOnly;

    // Compact styles for balancing
    const inputClass = "h-9 w-full px-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-colors disabled:bg-gray-50 dark:disabled:bg-gray-800/50";
    const selectClass = "h-9 w-full px-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white cursor-pointer disabled:bg-gray-50 dark:disabled:bg-gray-800/50";
    const labelClass = "block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1";

    return (
        <section className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 text-blue-600 dark:text-blue-400">
                <FileText size={20} strokeWidth={2.5} />
                <h3 className="text-lg font-bold">ข้อมูลใบเสนอราคา — Header Quotation</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 bg-blue-50/30 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                
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
                                className={inputClass}
                            />
                        )}
                    />
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>ลูกค้า (customer_id) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <select 
                            {...register('customer_id')}
                            disabled={isLocked}
                            className={`${selectClass} pl-10`}
                        >
                            <option value="">-- เลือกลูกค้า --</option>
                            {customers.map(customer => (
                                <option key={customer.customer_id} value={customer.customer_id.toString()}>
                                    {customer.customer_code} - {customer.customer_name_th}
                                </option>
                            ))}
                        </select>
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>On Hold (onhold)</label>
                    <div className="flex items-center h-9">
                        <StatusCheckbox 
                            name="onhold"
                            control={control}
                            label={formData.onhold === 'Y' ? 'ระงับ (Hold)' : 'ปกติ (Active)'}
                            disabled={isLocked}
                        />
                    </div>
                </div>

                {/* Row 2 */}
                <div className="space-y-1">
                    <label className={labelClass}>อ้างอิงเลขที่ประมาณการราคา (lead_id)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input 
                                {...register('lead_id')}
                                disabled={isLocked}
                                className={inputClass} 
                                placeholder="EST2024-xxx (ถ้ามี)"
                            />
                        </div>
                        <button type="button" disabled={isLocked} className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
                            <Search size={16} />
                        </button>
                    </div>
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
                            <option key={branch.branch_id} value={branch.branch_id.toString()}>
                                {branch.branch_name}
                            </option>
                        ))}
                    </select>
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
                        {...register('item_id')}
                        disabled={isLocked}
                        className={selectClass}
                    >
                        <option value="">-- เลือกประเภทสินค้า --</option>
                        {itemTypes.map(item => (
                            <option key={item.item_type_id} value={item.item_type_id.toString()}>
                                {item.item_type_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Row 4 */}
                <div className="space-y-1">
                    <label className={labelClass}>กลุ่มภาษี (tax_group_id)</label>
                    <select 
                        {...register('tax_group_id')}
                        disabled={isLocked}
                        className={selectClass}
                    >
                        <option value="">-- เลือกภาษี --</option>
                        {taxGroups.map(group => (
                            <option key={group.tax_group_id} value={group.tax_group_id.toString()}>
                                {group.tax_group_name || group.tax_group_code}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>แผนก (emp_dept_id)</label>
                    <select 
                        {...register('emp_dept_id')}
                        disabled={isLocked}
                        className={selectClass}
                    >
                        <option value="">-- เลือกแผนก --</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id.toString()}>
                                {dept.side_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Row 5 */}
                <div className="space-y-1">
                    <label className={labelClass}>Job (job_id)</label>
                    <select 
                        {...register('job_id')}
                        disabled={isLocked}
                        className={selectClass}
                    >
                        <option value="">-- เลือกงาน --</option>
                        {projects.map(proj => (
                            <option key={proj.project_id} value={proj.project_id.toString()}>
                                {proj.project_name}
                            </option>
                        ))}
                    </select>
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
