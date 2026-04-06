import { type ChangeEvent } from 'react';
import { FileText, Search, Calendar, User, Briefcase, Clock, Truck } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { QuotationFormData } from '../types/quotation.types';

interface QuotationHeaderFormProps {
    formData: Partial<QuotationFormData>;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function QuotationHeaderForm({ formData, onChange }: QuotationHeaderFormProps) {
    return (
        <section className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 text-blue-600 dark:text-blue-400">
                <FileText size={20} strokeWidth={2.5} />
                <h3 className="text-lg font-bold">ข้อมูลใบเสนอราคา — Header Quotation</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 bg-blue-50/30 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                
                {/* Row 1 */}
                <div className="space-y-1">
                    <label className={styles.label}>เลขที่ใบเสนอราคา (sq_no) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input 
                            name="sq_no" 
                            value={formData.sq_no || 'SQ2024-xxx'} 
                            onChange={onChange} 
                            readOnly
                            className={`${styles.input} bg-gray-50 border-gray-200 cursor-not-allowed`}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={styles.label}>วันที่ (sq_date) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input 
                            type="date"
                            name="sq_date" 
                            value={formData.sq_date || ''} 
                            onChange={onChange} 
                            className={`${styles.input} pl-10`}
                        />
                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={styles.label}>ลูกค้า (customer_id) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <select 
                            name="customer_id" 
                            value={formData.customer_id || ''} 
                            onChange={onChange} 
                            className={`${styles.input} pl-10 appearance-none`}
                        >
                            <option value="">-- เลือกลูกค้า --</option>
                        </select>
                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {/* Row 2 */}
                <div className="space-y-1">
                    <label className={styles.label}>อ้างอิงเลขที่ประมาณการราคา (lead_id)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input 
                                name="lead_id" 
                                value={formData.lead_id || ''} 
                                onChange={onChange} 
                                className={styles.input} 
                                placeholder="EST2024-xxx (ถ้ามี)"
                            />
                        </div>
                        <button type="button" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                            <Search size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={styles.label}>พนักงานขาย (emp_area_id)</label>
                    <div className="relative">
                        <select 
                            name="emp_area_id" 
                            value={formData.emp_area_id || ''} 
                            onChange={onChange} 
                            className={`${styles.input} pl-10 appearance-none`}
                        >
                            <option value="">-- เลือกพนักงานขาย --</option>
                        </select>
                        <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={styles.label}>ยื่นราคาจนถึงวันที่ (valid_until)</label>
                    <div className="relative">
                        <input 
                            type="date"
                            name="valid_until" 
                            value={formData.valid_until || ''} 
                            onChange={onChange} 
                            className={`${styles.input} pl-10`}
                        />
                        <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {/* Row 3 */}
                <div className="space-y-1">
                    <label className={styles.label}>วันที่กำหนดส่งของ (ship_date)</label>
                    <div className="relative">
                        <input 
                            type="date"
                            name="ship_date" 
                            value={formData.ship_date || ''} 
                            onChange={onChange} 
                            className={`${styles.input} pl-10`}
                        />
                        <Truck size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={styles.label}>เครดิตเทอม (วัน) (payment_term_days)</label>
                    <input 
                        type="number"
                        name="payment_term_days" 
                        value={formData.payment_term_days || 0} 
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="เช่น 30 วัน, 60 วัน"
                    />
                </div>

                <div className="space-y-1">
                    <label className={styles.label}>ประเภทสินค้า (item_id)</label>
                    <select 
                        name="item_id" 
                        value={formData.item_id || ''} 
                        onChange={onChange} 
                        className={styles.inputSelect}
                    >
                        <option value="">-- เลือกประเภทสินค้า --</option>
                    </select>
                </div>

                {/* Row 4 */}
                <div className="space-y-1">
                    <label className={styles.label}>กลุ่มภาษี (tax_group_id)</label>
                    <select 
                        name="tax_group_id" 
                        value={formData.tax_group_id || ''} 
                        onChange={onChange} 
                        className={styles.inputSelect}
                    >
                        <option value="">-- เลือกภาษี --</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className={styles.label}>On Hold (onhold)</label>
                    <select 
                        name="onhold" 
                        value={formData.onhold || 'N'} 
                        onChange={onChange} 
                        className={styles.inputSelect}
                    >
                        <option value="N">N - ไม่ระงับ</option>
                        <option value="Y">Y - ระงับ</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className={styles.label}>แผนก (emp_dept_id)</label>
                    <select 
                        name="emp_dept_id" 
                        value={formData.emp_dept_id || ''} 
                        onChange={onChange} 
                        className={styles.inputSelect}
                    >
                        <option value="">-- เลือกแผนก --</option>
                    </select>
                </div>

                {/* Row 5 */}
                <div className="space-y-1">
                    <label className={styles.label}>Job (job_id)</label>
                    <select 
                        name="job_id" 
                        value={formData.job_id || ''} 
                        onChange={onChange} 
                        className={styles.inputSelect}
                    >
                        <option value="">-- เลือกงาน --</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className={styles.label}>สถานะ (status)</label>
                    <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 font-bold border border-gray-200 dark:border-gray-700">
                        {formData.status || 'DRAFT'}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={styles.label}>สกุลเงิน (currency_code)</label>
                    <select 
                        name="currency_code" 
                        value={formData.currency_code || 'THB'} 
                        onChange={onChange} 
                        className={styles.inputSelect}
                    >
                        <option value="THB">THB - บาท</option>
                        <option value="USD">USD - ดอลลาร์</option>
                    </select>
                </div>
            </div>

            {/* Note & Remarks Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className={styles.label}>สถานะเพิ่มเติม (sq_status)</label>
                    <input 
                        name="sq_status" 
                        value={formData.sq_status || ''} 
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="ระบุสถานะงานละเอียด (ถ้ามี)"
                    />
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>หมายเหตุการยกเลิก/เหตุผล (status_remark)</label>
                    <textarea 
                        name="status_remark" 
                        value={formData.status_remark || ''} 
                        onChange={onChange} 
                        rows={2}
                        className={styles.textarea} 
                        placeholder="ระบุเหตุผล (ถ้ามี)"
                    />
                </div>
                <div className="md:col-span-2 space-y-1">
                    <label className={styles.label}>หมายเหตุทั่วไป (remarks)</label>
                    <textarea 
                        name="remarks" 
                        value={formData.remarks || ''} 
                        onChange={onChange} 
                        rows={2}
                        className={styles.textarea} 
                        placeholder="ระบุหมายเหตุเพิ่มเติม"
                    />
                </div>
            </div>
        </section>
    );
}
