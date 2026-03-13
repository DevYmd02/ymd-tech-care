import React from 'react';
import { FileText, Calendar } from 'lucide-react';
import { useFormContext, Controller } from 'react-hook-form';
import type { RFQFormValues } from '@/modules/procurement/schemas/rfq-schemas';
import type { BranchListItem } from '@/modules/master-data/types/master-data-types';
import { MulticurrencyWrapper } from '@/shared/components/forms/MulticurrencyWrapper';

interface RFQFormHeaderProps {
    branches: BranchListItem[];
    onOpenPRModal: () => void;
    readOnly?: boolean;
    isInviteMode?: boolean;
}

export const RFQFormHeader: React.FC<RFQFormHeaderProps> = ({ branches, onOpenPRModal, readOnly, isInviteMode }) => {
    const { register, watch, setValue, formState: { errors } } = useFormContext<RFQFormValues>();
    
    const formData = watch();
    const isLocked = readOnly || isInviteMode;

    const inputStyle = "w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed";
    const selectStyle = "w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-50";
    const labelStyle = "text-sm font-medium text-teal-700 dark:text-teal-300 mb-1 block";
    const hintStyle = "text-xs text-gray-400 dark:text-gray-500 mt-1";
    
    const errorInputClass = "border-red-500 ring-1 ring-red-500 focus:ring-red-500";
    const errorMsgClass = "text-red-500 text-[10px] mt-0.5 font-medium";

    // Format yyyy-mm-dd → dd/mm/yyyy for display
    const formatDisplayDate = (val?: string) => {
        if (!val) return '';
        if (val.includes('-') && val.length >= 10) {
            const [y, m, d] = val.split('-');
            return `${d.substring(0, 2)}/${m}/${y}`;
        }
        return val;
    };

    return (
        <div className="p-4">
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                <FileText size={18} />
                <span className="font-semibold">ส่วนหัวเอกสาร - Header RFQ (Request for Quotation)</span>
            </div>

            {/* Row 1: เลขที่ RFQ, วันที่สร้าง, PR ต้นทาง */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className={labelStyle}>เลขที่ RFQ <span className="text-red-500">*</span></label>
                    <input type="text" {...register('rfq_no')} readOnly className={inputStyle} disabled={isLocked} />
                    <p className={hintStyle}>ระบบจะสร้างรหัสอัตโนมัติเมื่อบันทึกเอกสารใหม่</p>
                </div>
                <div>
                    <label className={labelStyle}>วันที่สร้าง RFQ <span className="text-red-500">*</span></label>
                    <Controller
                        name="rfq_date"
                        render={({ field: { value, onChange, onBlur, ref } }) => (
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="dd/mm/yyyy"
                                    value={formatDisplayDate(value)}
                                    disabled={isLocked}
                                    onClick={(e) => { try { (e.currentTarget.nextElementSibling as HTMLInputElement)?.showPicker(); } catch { /* noop */ } }}
                                    className={`${inputStyle} cursor-pointer pr-8 ${errors.rfq_date ? errorInputClass : ''}`}
                                />
                                <input
                                    type="date"
                                    value={value || ''}
                                    onChange={(e) => onChange(e.target.value)}
                                    onBlur={onBlur}
                                    ref={ref}
                                    disabled={isLocked}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                            </div>
                        )}
                    />
                    {errors.rfq_date && <p className={errorMsgClass}>{errors.rfq_date.message}</p>}
                </div>
                <div>
                    <label className={labelStyle}>PR ต้นทาง <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="PR2024-xxx"
                            {...register('pr_no')}
                            readOnly={Boolean(formData.pr_id) || isLocked}
                            className={`${inputStyle} ${errors.pr_no ? errorInputClass : ''} ${formData.pr_id ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-medium cursor-default' : ''}`}
                            disabled={isLocked}
                        />
                        <button
                            type="button"
                            onClick={onOpenPRModal}
                            disabled={isLocked}
                            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors shrink-0 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            เลือก
                        </button>
                    </div>
                    {errors.pr_no && <p className={errorMsgClass}>{errors.pr_no.message}</p>}
                </div>
            </div>

            {/* Row 2: สถานะ, สาขา, ผู้สร้าง */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className={labelStyle}>สถานะ <span className="text-red-500">*</span></label>
                    <select
                        {...register('status')}
                        className={`${selectStyle} ${errors.status ? errorInputClass : ''}`}
                        disabled={isLocked}
                    >
                        <option value="DRAFT">DRAFT - แบบร่าง</option>
                        <option value="SENT">SENT - ส่งแล้ว</option>
                        <option value="CLOSED">CLOSED - ปิดแล้ว</option>
                        <option value="CANCELLED">CANCELLED - ยกเลิก</option>
                    </select>
                    {errors.status && <p className={errorMsgClass}>{errors.status.message}</p>}
                    <p className={hintStyle}>สถานะ: DRAFT/SENT/CLOSED/CANCELLED</p>
                </div>
                <div>
                    <label className={labelStyle}>สาขาที่สร้าง RFQ <span className="text-red-500">*</span></label>
                    <select
                        {...register('branch_id', { valueAsNumber: true })}
                        className={`${selectStyle} ${errors.branch_id ? errorInputClass : ''}`}
                        disabled={isLocked}
                    >
                        <option value="">เลือกสาขา</option>
                        {branches.map(branch => (
                            <option key={branch.branch_id} value={branch.branch_id}>
                                {branch.branch_name}
                            </option>
                        ))}
                    </select>
                    {errors.branch_id && <p className={errorMsgClass}>{errors.branch_id.message}</p>}
                </div>
                <div>
                    <label className={labelStyle}>ผู้สร้าง RFQ</label>
                    <input
                        type="text"
                        value="ระบบจะกรอกอัตโนมัติ"
                        readOnly
                        className={`${inputStyle} bg-gray-200 dark:bg-gray-700`}
                        disabled={isLocked}
                    />
                </div>
            </div>

            {/* Row 3: วันครบกำหนดส่งใบเสนอราคา, สถานที่รับของ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className={labelStyle}>วันครบกำหนดใบเสนอราคา <span className="text-red-500">*</span></label>
                    <Controller
                        name="quotation_due_date"
                        render={({ field: { value, onChange, onBlur, ref } }) => (
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="dd/mm/yyyy"
                                    value={formatDisplayDate(value)}
                                    disabled={isLocked}
                                    onClick={(e) => { try { (e.currentTarget.nextElementSibling as HTMLInputElement)?.showPicker(); } catch { /* noop */ } }}
                                    className={`${inputStyle} cursor-pointer pr-8 ${errors.quotation_due_date ? errorInputClass : ''}`}
                                />
                                <input
                                    type="date"
                                    value={value || ''}
                                    onChange={(e) => onChange(e.target.value)}
                                    onBlur={onBlur}
                                    ref={ref}
                                    disabled={isLocked}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                            </div>
                        )}
                    />
                    {errors.quotation_due_date && <p className={errorMsgClass}>{errors.quotation_due_date.message}</p>}
                </div>
                <div className="md:col-span-2">
                    <label className={labelStyle}>สถานที่รับของ</label>
                    <input
                        type="text"
                        placeholder="ระบุสถานที่รับของ"
                        {...register('receive_location')}
                        className={inputStyle}
                        disabled={isLocked}
                    />
                </div>
            </div>

            {/* Row 4: เงื่อนไขการชำระ, เงื่อนไขส่งมอบ, หมายเหตุ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className={labelStyle}>เงื่อไขการชำระ</label>
                    <input
                        type="text"
                        placeholder="เช่น Net 30"
                        {...register('payment_term_hint')}
                        className={inputStyle}
                        disabled={isLocked}
                    />
                </div>
                <div>
                    <label className={labelStyle}>เงื่อนไขส่งมอบ (Incoterm)</label>
                    <input
                        type="text"
                        placeholder="FOB, CIF, EXW, etc."
                        {...register('incoterm')}
                        className={inputStyle}
                        disabled={isLocked}
                    />
                </div>
                <div>
                    <label className={labelStyle}>หมายเหตุเพิ่มเติม</label>
                    <textarea
                        placeholder="ระบุหมายเหตุ..."
                        {...register('remarks')}
                        rows={1}
                        className={`${inputStyle} h-8 resize-none py-1.5`}
                        disabled={isLocked}
                    />
                </div>
            </div>

            {/* Multicurrency Section */}
            <div className="mb-4">
                <MulticurrencyWrapper 
                    name="isMulticurrency"
                    checked={formData.isMulticurrency} 
                    onCheckedChange={(checked) => {
                        if (isLocked) return;
                        setValue('isMulticurrency', checked);
                        if (!checked) {
                            setValue('rfq_exchange_rate_date', '');
                            setValue('rfq_base_currency_code', 'THB');
                            setValue('rfq_quote_currency_code', '');
                            setValue('rfq_exchange_rate', 1);
                        }
                    }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่อัตราแลกเปลี่ยน</label>
                            <Controller
                                name="rfq_exchange_rate_date"
                                render={({ field: { value, onChange, onBlur, ref } }) => (
                                    <div className="relative w-full">
                                        <input
                                            type="text"
                                            readOnly
                                            placeholder="dd/mm/yyyy"
                                            value={formatDisplayDate(value)}
                                            disabled={!formData.isMulticurrency || isLocked}
                                            onClick={(e) => { try { (e.currentTarget.nextElementSibling as HTMLInputElement)?.showPicker(); } catch { /* noop */ } }}
                                            className="w-full h-9 px-3 pr-8 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                                        />
                                        <input
                                            type="date"
                                            value={value || ''}
                                            onChange={(e) => onChange(e.target.value)}
                                            onBlur={onBlur}
                                            ref={ref}
                                            disabled={!formData.isMulticurrency || isLocked}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <Calendar size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                                    </div>
                                )}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">รหัสสกุลเงิน</label>
                            <select 
                                {...register('rfq_base_currency_code')}
                                className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-50"
                                disabled={!formData.isMulticurrency || isLocked}
                            >
                                <option value="THB">THB - บาท</option>
                                <option value="USD">USD - ดอลลาร์สหรัฐ</option>
                                <option value="EUR">EUR - ยูโร</option>
                                <option value="JPY">JPY - เยน</option>
                                <option value="CNY">CNY - หยวน</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ไปยังสกุลเงิน (Target)</label>
                            <select 
                                {...register('rfq_quote_currency_code')}
                                className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-50"
                                disabled={!formData.isMulticurrency || isLocked}
                            >
                                <option value="">เลือกสกุลเงิน</option>
                                <option value="THB">THB - บาท</option>
                                <option value="USD">USD - ดอลลาร์สหรัฐ</option>
                                <option value="EUR">EUR - ยูโร</option>
                                <option value="JPY">JPY - เยน</option>
                                <option value="CNY">CNY - หยวน</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">อัตราแลกเปลี่ยน</label>
                            <input 
                                type="number"
                                step="0.0001"
                                {...register('rfq_exchange_rate', { valueAsNumber: true })}
                                readOnly={formData.rfq_base_currency_code === 'THB'}
                                className={`w-full h-9 px-3 text-sm text-right border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${formData.rfq_base_currency_code === 'THB' ? 'bg-gray-50 dark:bg-gray-800/50 italic text-gray-500' : 'bg-white dark:bg-gray-800 font-semibold'}`}
                                disabled={!formData.isMulticurrency || isLocked}
                                placeholder="0.0000"
                            />
                            {formData.rfq_base_currency_code && formData.rfq_base_currency_code !== 'THB' && (
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-right font-medium">
                                    1 {formData.rfq_base_currency_code} ≈ {Number(formData.rfq_exchange_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} THB
                                </div>
                            )}
                        </div>
                    </div>
                </MulticurrencyWrapper>
            </div>
        </div>
    );
};
