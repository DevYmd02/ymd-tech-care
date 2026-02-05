import React from 'react';
import { FileText } from 'lucide-react';
import type { RFQFormData } from '@/modules/procurement/types/rfq-types';
import type { BranchListItem } from '@/modules/master-data/types/master-data-types';

interface RFQFormHeaderProps {
    formData: RFQFormData;
    branches: BranchListItem[];
    handleChange: (field: keyof RFQFormData, value: string | number) => void;
}

export const RFQFormHeader: React.FC<RFQFormHeaderProps> = ({ formData, branches, handleChange }) => {
    const inputStyle = "w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white transition-all";
    const selectStyle = "w-full h-8 px-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white";
    const labelStyle = "text-sm font-medium text-teal-700 dark:text-teal-300 mb-1 block";
    const hintStyle = "text-xs text-gray-400 dark:text-gray-500 mt-1";

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
                        className={inputStyle}
                    />
                </div>
                <div>
                    <label className={labelStyle}>PR ต้นทาง <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="PR2024-xxx"
                            value={formData.pr_no || ''}
                            onChange={(e) => handleChange('pr_no', e.target.value)}
                            className={inputStyle}
                        />
                        <button className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors shrink-0 font-medium text-sm">
                            เลือก
                        </button>
                    </div>
                    <p className={hintStyle}>อ้างถึง pr_header.pr_id (PR ต้นทาง)</p>
                </div>
            </div>

            {/* Row 2: สาขา, ผู้สร้าง, สถานะ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                </div>
                <div>
                    <label className={labelStyle}>ผู้สร้าง RFQ</label>
                    <input
                        type="text"
                        value="ระบบจะกรอกอัตโนมัติ"
                        readOnly
                        className={`${inputStyle} bg-gray-200 dark:bg-gray-700`}
                    />
                </div>
                <div>
                    <label className={labelStyle}>สถานะ <span className="text-red-500">*</span></label>
                    <select
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className={selectStyle}
                    >
                        <option value="DRAFT">DRAFT - แบบร่าง</option>
                        <option value="SENT">SENT - ส่งแล้ว</option>
                        <option value="CLOSED">CLOSED - ปิดแล้ว</option>
                        <option value="CANCELLED">CANCELLED - ยกเลิก</option>
                    </select>
                </div>
            </div>

            {/* Row 3: ใช้ได้ถึงวันที่, สกุลเงิน, อัตราแลกเปลี่ยน */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className={labelStyle}>ใช้ได้ถึงวันที่ <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        value={formData.quote_due_date}
                        onChange={(e) => handleChange('quote_due_date', e.target.value)}
                        className={inputStyle}
                    />
                </div>
                <div>
                    <label className={labelStyle}>สกุลเงิน</label>
                    <select
                        value={formData.currency}
                        onChange={(e) => handleChange('currency', e.target.value)}
                        className={selectStyle}
                    >
                        <option value="THB">THB - บาท</option>
                        <option value="USD">USD - ดอลลาร์สหรัฐ</option>
                        <option value="EUR">EUR - ยูโร</option>
                    </select>
                </div>
                <div>
                    <label className={labelStyle}>อัตราแลกเปลี่ยน</label>
                    <input
                        type="number"
                        step="0.000001"
                        value={formData.exchange_rate}
                        onChange={(e) => handleChange('exchange_rate', parseFloat(e.target.value) || 1)}
                        className={inputStyle}
                    />
                </div>
            </div>

            {/* Row 4: สถานที่จัดส่ง, เงื่อนไขการชำระ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className={labelStyle}>สถานที่จัดส่ง/ส่งมอบ</label>
                    <input
                        type="text"
                        placeholder="ระบุสถานที่ส่งมอบ"
                        value={formData.delivery_location}
                        onChange={(e) => handleChange('delivery_location', e.target.value)}
                        className={inputStyle}
                    />
                </div>
                <div>
                    <label className={labelStyle}>เงื่อนไขการชำระ</label>
                    <input
                        type="text"
                        placeholder="เช่น Net 30"
                        value={formData.payment_terms}
                        onChange={(e) => handleChange('payment_terms', e.target.value)}
                        className={inputStyle}
                    />
                </div>
            </div>

            {/* Row 5: เงื่อนไขส่งมอบ, หมายเหตุ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelStyle}>เงื่อนไขส่งมอบ (Incoterm)</label>
                    <input
                        type="text"
                        placeholder="FOB, CIF, EXW, etc."
                        value={formData.incoterm}
                        onChange={(e) => handleChange('incoterm', e.target.value)}
                        className={inputStyle}
                    />
                </div>
                <div>
                    <label className={labelStyle}>หมายเหตุเพิ่มเติม</label>
                    <textarea
                        placeholder="ระบุหมายเหตุ..."
                        value={formData.remarks}
                        onChange={(e) => handleChange('remarks', e.target.value)}
                        rows={2}
                        className={`${inputStyle} h-auto resize-none`}
                    />
                </div>
            </div>
        </div>
    );
};
