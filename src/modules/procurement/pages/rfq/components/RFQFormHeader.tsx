import React from 'react';
import { FileText } from 'lucide-react';
import type { RFQFormData } from '@/modules/procurement/types/rfq-types';
import type { BranchListItem } from '@/modules/master-data/types/master-data-types';
import { MulticurrencyWrapper } from '@/shared/components/forms/MulticurrencyWrapper';

interface RFQFormHeaderProps {
    formData: RFQFormData;
    branches: BranchListItem[];
    handleChange: (field: keyof RFQFormData, value: string | number | boolean) => void;
    errors: Record<string, string>;
    onOpenPRModal: () => void;
}

export const RFQFormHeader: React.FC<RFQFormHeaderProps> = ({ formData, branches, handleChange, errors, onOpenPRModal }) => {
    const inputStyle = "w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white transition-all";
    const selectStyle = "w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white";
    const labelStyle = "text-sm font-medium text-teal-700 dark:text-teal-300 mb-1 block";
    const hintStyle = "text-xs text-gray-400 dark:text-gray-500 mt-1";
    
    // Validation Styles (Mirroring PRHeader)
    const errorInputClass = "border-red-500 ring-1 ring-red-500 focus:ring-red-500";
    const errorMsgClass = "text-red-500 text-[10px] mt-0.5 font-medium";

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
                    <input type="text" value={formData.rfq_no} readOnly className={inputStyle} />
                    <p className={hintStyle}>เลขที่เอกสาร RFQ (Running จาก sequence_running)</p>
                </div>
                <div>
                    <label className={labelStyle}>วันที่สร้าง RFQ <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        value={formData.rfq_date}
                        onChange={(e) => handleChange('rfq_date', e.target.value)}
                        className={`${inputStyle} ${errors.rfq_date ? errorInputClass : ''}`}
                    />
                    {errors.rfq_date && <p className={errorMsgClass}>{errors.rfq_date}</p>}
                </div>
                <div>
                    <label className={labelStyle}>PR ต้นทาง <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="PR2024-xxx"
                            value={formData.pr_no || ''}
                            onChange={(e) => handleChange('pr_no', e.target.value)}
                            className={`${inputStyle} ${errors.pr_no ? errorInputClass : ''}`}
                        />
                        <button 
                            type="button"
                            onClick={onOpenPRModal}
                            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors shrink-0 font-medium text-sm"
                        >
                            เลือก
                        </button>
                    </div>

                    {errors.pr_no && <p className={errorMsgClass}>{errors.pr_no}</p>}
                    <p className={hintStyle}>อ้างถึง pr_header.pr_id (PR ต้นทาง)</p>
                </div>
            </div>

            {/* Row 2: สถานะ, สาขา, ผู้สร้าง */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className={labelStyle}>สถานะ <span className="text-red-500">*</span></label>
                    <select
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className={`${selectStyle} ${errors.status ? errorInputClass : ''}`}
                    >
                        <option value="DRAFT">DRAFT - แบบร่าง</option>
                        <option value="SENT">SENT - ส่งแล้ว</option>
                        <option value="CLOSED">CLOSED - ปิดแล้ว</option>
                        <option value="CANCELLED">CANCELLED - ยกเลิก</option>
                    </select>
                    {errors.status && <p className={errorMsgClass}>{errors.status}</p>}
                    <p className={hintStyle}>สถานะ: DRAFT/SENT/CLOSED/CANCELLED</p>
                </div>
                <div>
                    <label className={labelStyle}>สาขาที่สร้าง RFQ</label>
                    <select 
                        value={formData.branch_id || ''} 
                        onChange={(e) => handleChange('branch_id', e.target.value)}
                        className={selectStyle}
                    >
                        <option value="">เลือกสาขา</option>
                        {branches.map(branch => (
                            <option key={branch.branch_id} value={branch.branch_id}>
                                {branch.branch_name}
                            </option>
                        ))}
                    </select>
                    <p className={hintStyle}>อ้างถึง branch_id (FK)</p>
                </div>
                <div>
                    <label className={labelStyle}>ผู้สร้าง RFQ</label>
                    <input
                        type="text"
                        value="ระบบจะกรอกอัตโนมัติ"
                        readOnly
                        className={`${inputStyle} bg-gray-200 dark:bg-gray-700`}
                    />
                    <p className={hintStyle}>อ้างถึง user_id (FK)</p>
                </div>
            </div>

            {/* Row 3: กำหนดส่งใบเสนอราคา, สถานที่รับของ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className={labelStyle}>กำหนดส่งใบเสนอราคา <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        value={formData.quote_due_date}
                        onChange={(e) => handleChange('quote_due_date', e.target.value)}
                        className={`${inputStyle} ${errors.quote_due_date ? errorInputClass : ''}`}
                        placeholder="เลือกวันที่"
                    />
                    {errors.quote_due_date && <p className={errorMsgClass}>{errors.quote_due_date}</p>}
                    <p className={hintStyle}>วันหมดอายุการเสนอราคา (quotation_due_date)</p>
                </div>
                <div className="md:col-span-2">
                    <label className={labelStyle}>สถานที่รับของ</label>
                    <input
                        type="text"
                        placeholder="ระบุสถานที่รับของ"
                        value={formData.delivery_location}
                        onChange={(e) => handleChange('delivery_location', e.target.value)}
                        className={inputStyle}
                    />
                    <p className={hintStyle}>สถานที่รับของ (receive_location)</p>
                </div>
            </div>

            {/* Row 4: เงื่อนไขการชำระ, เงื่อนไขส่งมอบ, หมายเหตุ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className={labelStyle}>เงื่อนไขการชำระ</label>
                    <input
                        type="text"
                        placeholder="เช่น Net 30"
                        value={formData.payment_terms}
                        onChange={(e) => handleChange('payment_terms', e.target.value)}
                        className={inputStyle}
                    />
                    <p className={hintStyle}>แนวทางเงื่อนไขที่ต้องการ (payment_term_hint)</p>
                </div>
                <div>
                    <label className={labelStyle}>เงื่อนไขส่งมอบ (Incoterm)</label>
                    <input
                        type="text"
                        placeholder="FOB, CIF, EXW, etc."
                        value={formData.incoterm}
                        onChange={(e) => handleChange('incoterm', e.target.value)}
                        className={inputStyle}
                    />
                    <p className={hintStyle}>เงื่อนไขส่งมอบ (incoterm)</p>
                </div>
                <div>
                    <label className={labelStyle}>หมายเหตุเพิ่มเติม</label>
                    <textarea
                        placeholder="ระบุหมายเหตุ..."
                        value={formData.remarks}
                        onChange={(e) => handleChange('remarks', e.target.value)}
                        rows={1}
                        className={`${inputStyle} h-8 resize-none py-1.5`}
                    />
                </div>
            </div>

            {/* Multicurrency Section */}
            <div className="mb-4">
                <MulticurrencyWrapper 
                    name="isMulticurrency"
                    checked={formData.isMulticurrency} 
                    onCheckedChange={(checked) => {
                        handleChange('isMulticurrency', checked);
                        if (!checked) {
                            handleChange('exchange_rate_date', '');
                            handleChange('currency', 'THB');
                            handleChange('target_currency', '');
                            handleChange('exchange_rate', 1);
                        }
                    }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">วันที่อัตราแลกเปลี่ยน</label>
                            <input 
                                type="date" 
                                value={formData.exchange_rate_date || ''}
                                onChange={(e) => handleChange('exchange_rate_date', e.target.value)}
                                className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-shadow"
                                disabled={!formData.isMulticurrency}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">รหัสสกุลเงิน</label>
                            <select 
                                value={formData.currency}
                                onChange={(e) => handleChange('currency', e.target.value)}
                                className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                disabled={!formData.isMulticurrency}
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
                                value={formData.target_currency || ''}
                                onChange={(e) => handleChange('target_currency', e.target.value)}
                                className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                disabled={!formData.isMulticurrency}
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
                                value={formData.exchange_rate}
                                onChange={(e) => handleChange('exchange_rate', parseFloat(e.target.value) || 0)}
                                readOnly={formData.currency === 'THB'}
                                className={`w-full h-9 px-3 text-sm text-right border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors ${formData.currency === 'THB' ? 'bg-gray-50 dark:bg-gray-800/50 italic text-gray-500' : 'bg-white dark:bg-gray-800 font-semibold'}`}
                                disabled={!formData.isMulticurrency}
                                placeholder="0.0000"
                            />
                            {formData.currency && formData.currency !== 'THB' && (
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-right font-medium">
                                    1 {formData.currency} ≈ {Number(formData.exchange_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} THB
                                </div>
                            )}
                        </div>
                    </div>
                </MulticurrencyWrapper>
            </div>
        </div>
    );
};
