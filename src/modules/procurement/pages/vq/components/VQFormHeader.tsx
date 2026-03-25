import React from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Search, X as XIcon, FileText } from 'lucide-react';
import { CustomDateInput } from '@/shared/components/forms/CustomDateInput';
import { MulticurrencyWrapper } from '@/shared/components/forms/MulticurrencyWrapper';
import type { QuotationFormData } from '@/modules/procurement/schemas/vq-schemas';

export interface VQFormHeaderProps {
    forceViewMode: boolean;
    isPending: boolean;
    isMasterLoading: boolean;
    currencyOptions: { label: string; value: string | number }[];
    purchaseTaxOptions: { label: string; value: string | number; original?: unknown }[];
    watchVendorCode: string;
    watchVendorName: string;
    watchVendorId: number;
    watchRfqNo: string;
    watchCurrency: string;
    watchExchangeRate: number;
    onOpenVendorModal: () => void;
    onClearVendor: () => void;
    onOpenRFQModal: () => void;
    onClearRFQ: () => void;
}

export const VQFormHeader: React.FC<VQFormHeaderProps> = ({
    forceViewMode,
    isPending,
    isMasterLoading,
    currencyOptions,
    purchaseTaxOptions,
    watchVendorCode,
    watchVendorName,
    watchVendorId,
    watchRfqNo,
    watchCurrency,
    watchExchangeRate,
    onOpenVendorModal,
    onClearVendor,
    onOpenRFQModal,
    onClearRFQ
}) => {
    const { register, control, formState: { errors } } = useFormContext<QuotationFormData>();
    const watchTargetCurrency = useWatch({ control, name: 'target_currency' });

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
            <div className="p-4">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                    <FileText size={18} />
                    <span className="font-semibold">ส่วนหัวเอกสาร - Header VQ (Vendor Quotation)</span>
                </div>

                {/* Row 1: Document Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">เลขที่ VQ</label>
                        <input type="text" {...register('vq_no')} className="w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed" readOnly disabled={forceViewMode} />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">ระบบจะแสดงอัตโนมัติเมื่อบันทึก</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">เลขที่ใบเสนอราคาจากผู้ขาย</label>
                        <input type="text" {...register('quotation_no')} placeholder="ระบุเลขที่เอกสาร (ถ้ามี)" className="w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed" disabled={forceViewMode} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">วันที่ใบเสนอราคา <span className="text-red-500">*</span></label>
                        <div className="h-8">
                            <Controller
                                name="quotation_date"
                                control={control}
                                render={({ field }) => (
                                    <CustomDateInput
                                        value={field.value || ""}
                                        onChange={field.onChange}
                                        disabled={forceViewMode}
                                        className={`w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed ${errors.quotation_date ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : ''}`}
                                    />
                                )}
                            />
                        </div>
                        {errors.quotation_date && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.quotation_date.message}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">วันที่ใช้ได้ถึง (Valid Until) <span className="text-red-500">*</span></label>
                        <div className="h-8">
                            <Controller
                                name="valid_until"
                                control={control}
                                render={({ field }) => (
                                    <CustomDateInput
                                        value={field.value || ""}
                                        onChange={field.onChange}
                                        disabled={forceViewMode}
                                        className={`w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed ${errors.valid_until ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : ''}`}
                                    />
                                )}
                            />
                        </div>
                        {errors.valid_until && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.valid_until.message}</p>}
                    </div>
                </div>

                {/* Row 2: Reference & Terms */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">เลขที่ RFQ อ้างอิง</label>
                        <div className="flex gap-2">
                            <input 
                                {...register('rfq_no')} 
                                className={`flex-1 h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border ${errors.rfq_no ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed`} 
                                readOnly 
                                disabled={forceViewMode} 
                            />
                            <button 
                                type="button"
                                onClick={onOpenRFQModal}
                                disabled={forceViewMode}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shrink-0 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <Search size={14} /> เลือก
                            </button>
                                {watchRfqNo && !forceViewMode && !isPending && (
                            <button 
                                type="button"
                                onClick={onClearRFQ}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800/50"
                                title="ล้างข้อมูล RFQ อ้างอิง"
                            >
                                <XIcon size={14} />
                            </button>
                            )}
                        </div>
                        {errors.rfq_no && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.rfq_no.message}</p>}
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">ระยะเวลานำส่ง (Lead Time / Days)</label>
                        <input type="number" {...register('delivery_days')} className="w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed" disabled={forceViewMode} />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">เงื่อนไขการชำระ (Payment Terms)</label>
                        <input type="text" {...register('payment_terms')} placeholder="เช่น 30 วัน, เงินสด" className="w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed" disabled={forceViewMode} />
                    </div>
                </div>

                {/* Row 3: Vendor Main Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">ชื่อผู้ขาย (Vendor) <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                            <input type="hidden" {...register('vendor_id')} />
                            <input 
                                value={watchVendorCode || ''}
                                placeholder="รหัสผู้ขาย" 
                                className={`w-32 h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border ${errors.vendor_id ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed`} 
                                disabled={forceViewMode} 
                                readOnly 
                            />
                            <input 
                                type="text" 
                                value={watchVendorName || ''} 
                                readOnly 
                                className={`flex-1 h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border ${errors.vendor_id ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed`} 
                                placeholder="ชื่อบริษัท/ผู้ขาย" 
                            />
                            <div className="relative">
                                <button 
                                    type="button" 
                                    onClick={onOpenVendorModal}
                                    disabled={forceViewMode}
                                    className="px-4 py-1.5 h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shrink-0 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                >
                                    <Search size={14} /> เลือก
                                </button>
                                {errors.vendor_id && (
                                    <p className="absolute left-1/2 transform -translate-x-1/2 top-9 text-red-500 text-[10px] font-medium whitespace-nowrap">
                                        {errors.vendor_id.message}
                                    </p>
                                )}
                            </div>
                            {!!watchVendorId && !forceViewMode && (
                            <button
                                type="button"
                                onClick={onClearVendor}
                                className="flex items-center justify-center w-8 h-8 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors focus:outline-none shrink-0"
                                title="ล้างค่าผู้ขาย"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                            )}
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">ผู้ติดต่อ (Contact Person)</label>
                        <input type="text" {...register('contact_person')} className="w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed" disabled={forceViewMode} />
                    </div>
                </div>

                {/* Row 4: Vendor Contact Info & Tax Selection */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="md:col-span-1">
                        <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">โทรศัพท์ (Phone)</label>
                        <input type="text" {...register('contact_phone')} className="w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed" disabled={forceViewMode} />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">อีเมล (Email)</label>
                        <input type="email" {...register('contact_email')} className="w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed" disabled={forceViewMode} />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">ภาษี VAT <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Controller
                                name="tax_code_id"
                                control={control}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        value={field.value ? String(field.value) : ''}
                                        disabled={forceViewMode}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const selected = purchaseTaxOptions.find(t => String(t.value) === val);
                                            field.onChange(selected ? selected.value : val);
                                        }}
                                        className={`w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border ${errors.tax_code_id ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer ${forceViewMode ? 'bg-gray-100/70 dark:bg-gray-800/70 cursor-not-allowed opacity-70' : ''}`}
                                    >
                                        <option value="">เลือกภาษี</option>
                                        {purchaseTaxOptions.map((tax) => (
                                            <option key={tax.value} value={tax.value}>
                                                {tax.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            />
                            {errors.tax_code_id && (
                                <p className="text-red-500 text-[10px] absolute top-full left-0 mt-0.5 font-medium whitespace-nowrap z-10 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {errors.tax_code_id?.message}
                                </p>
                            )}
                         </div>
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1 block">ผู้จัดทำ</label>
                        <input type="text" {...register('created_by_name')} className="w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed font-medium disabled:opacity-70 disabled:cursor-not-allowed" readOnly disabled={forceViewMode} />
                    </div>
                </div>
                
                {/* Multicurrency Control Panel */}
                <div className="pt-6 border-t border-gray-100 dark:border-slate-800/50">
                    <MulticurrencyWrapper 
                        control={control}
                        name="isMulticurrency"
                        disabled={forceViewMode}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่อัตราแลกเปลี่ยน</label>
                                <div className="h-9">
                                    <Controller
                                        name="exchange_rate_date"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomDateInput
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                                disabled={forceViewMode}
                                                className={`w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow ${errors.exchange_rate_date ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : ''}`}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">รหัสสกุลเงิน</label>
                                <Controller 
                                    name="currency"
                                    control={control}
                                    render={({ field }) => (
                                        <select 
                                            {...field} 
                                            className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                            disabled={forceViewMode || isMasterLoading}
                                        >
                                            {isMasterLoading && <option value="">กำลังโหลด...</option>}
                                            {!isMasterLoading && currencyOptions.map(curr => (
                                                <option key={curr.value} value={curr.value}>{curr.label}</option>
                                            ))}
                                        </select>
                                    )}
                                />
                                {errors.currency && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.currency.message}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">ไปยังสกุลเงิน (Target)</label>
                                <Controller 
                                    name="target_currency"
                                    control={control}
                                    render={({ field }) => (
                                        <select 
                                            {...field} 
                                            className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                            disabled={forceViewMode || isMasterLoading}
                                        >
                                            <option value="">(เลือก)</option>
                                            {!isMasterLoading && currencyOptions.map(curr => (
                                                    <option key={curr.value} value={curr.value}>{curr.label}</option>
                                            ))}
                                        </select>
                                    )}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">อัตราแลกเปลี่ยน</label>
                                <input 
                                    type="number" 
                                    step="0.0001"
                                    {...register('exchange_rate', { valueAsNumber: true })} 
                                    className={`w-full h-9 px-3 text-sm text-right border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${watchCurrency === watchTargetCurrency || forceViewMode ? 'bg-gray-50 dark:bg-gray-800/50 italic text-gray-500' : 'bg-white dark:bg-gray-800 font-semibold'}`}
                                    disabled={forceViewMode || watchCurrency === watchTargetCurrency}
                                    placeholder="1.0000"
                                />
                                {watchCurrency && watchTargetCurrency && watchCurrency !== watchTargetCurrency && (
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-right font-medium">
                                    1 {watchCurrency} ≈ {(Number(watchExchangeRate) || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {watchTargetCurrency}
                                </div>
                                )}
                                {errors.exchange_rate && <p className="text-red-500 text-[10px] mt-0.5 font-medium">{errors.exchange_rate.message}</p>}
                            </div>
                        </div>
                    </MulticurrencyWrapper>
                </div>
            </div>
        </div>
    );
};
