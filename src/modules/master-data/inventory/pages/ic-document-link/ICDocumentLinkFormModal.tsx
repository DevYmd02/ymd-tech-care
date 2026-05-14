import { ArrowRightLeft, Save, X, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { useICDocumentLinkForm } from '../../hooks/useICDocumentLinkForm';
import type { ICDocumentLinkMaster } from '@/modules/master-data/inventory/types/ic-document-link.types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    initialData?: ICDocumentLinkMaster | null;
    onSuccess?: () => void;
}

const ITEM_NAME_OPTIONS = [
    { value: 'เบิกสินค้า', label: 'เบิกสินค้า' },
    { value: 'ขายสินค้า', label: 'ขายสินค้า' },
    { value: 'เบิกตัวอย่าง', label: 'เบิกตัวอย่าง' },
];

export function ICDocumentLinkFormModal({ isOpen, onClose, editId, initialData, onSuccess }: Props) {
    const {
        register,
        errors,
        isSaving,
        handleSave,
        clearForm
    } = useICDocumentLinkForm(editId || null, initialData, onSuccess);

    const handleClose = () => {
        clearForm();
        onClose();
    };

    const TitleIcon = <ArrowRightLeft size={24} className="text-white" />;

    const FormFooter = (
        <div className="flex items-center justify-between w-full p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
            <div className="flex items-center gap-2 ml-2">
                <input
                    {...register('is_active')}
                    type="checkbox"
                    id="ic_doc_link_is_active"
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer transition-all"
                />
                <label htmlFor="ic_doc_link_is_active" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    สถานะใช้งาน (Active)
                </label>
            </div>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={clearForm}
                    className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-2 transition-all border border-gray-300 dark:border-gray-600 text-sm font-medium"
                >
                    <RotateCcw size={16} />
                    ล้างฟอร์ม
                </button>
                <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-2 transition-all border border-gray-300 dark:border-gray-600 text-sm font-medium"
                >
                    <X size={16} />
                    ยกเลิก
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-md disabled:opacity-50 text-sm font-semibold"
                >
                    <Save size={16} />
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
            </div>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={handleClose}
            title={editId ? 'แก้ไขข้อมูลเอกสารเชื่อม IC' : 'เพิ่มเอกสารเชื่อม IC ใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                
                {/* docu_type_code */}
                <div>
                    <label className={styles.label}>
                        รหัสชนิดเอกสารเชื่อม <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('docu_type_code')}
                        type="text"
                        placeholder="กรอกรหัสชนิดเอกสารเชื่อม (เช่น 102, 103, ...)"
                        className={`${styles.input} ${errors.docu_type_code ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    <p className="text-gray-400 text-[10px] mt-1">varchar(10) - ห้ามเว้นว่าง, ต้องเป็นตัวเลข 3 หลัก</p>
                    {errors.docu_type_code && (
                        <p className="text-red-500 text-xs mt-1">{errors.docu_type_code.message}</p>
                    )}
                </div>

                {/* docu_name_th */}
                <div>
                    <label className={styles.label}>
                        ชื่อเอกสารเชื่อม
                    </label>
                    <input
                        {...register('docu_name_th')}
                        type="text"
                        placeholder="กรอกชื่อเอกสารเชื่อม (ภาษาไทย)"
                        className={styles.input}
                    />
                    <p className="text-gray-400 text-[10px] mt-1">varchar(200) - สามารถเว้นว่างได้</p>
                </div>

                {/* docu_name_en */}
                <div>
                    <label className={styles.label}>
                        ชื่อเอกสารเชื่อม (ภาษาอังกฤษ) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('docu_name_en')}
                        type="text"
                        placeholder="Enter document name in English"
                        className={`${styles.input} ${errors.docu_name_en ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    <p className="text-gray-400 text-[10px] mt-1">varchar(200) - ห้ามเว้นว่าง</p>
                    {errors.docu_name_en && (
                        <p className="text-red-500 text-xs mt-1">{errors.docu_name_en.message}</p>
                    )}
                </div>

                {/* docu_item_name */}
                <div>
                    <label className={styles.label}>
                        ชื่อรายการเอกสาร
                    </label>
                    <select
                        {...register('docu_item_name')}
                        className={styles.input}
                    >
                        <option value="">-- เลือกชื่อรายการเอกสาร --</option>
                        {ITEM_NAME_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <p className="text-gray-400 text-[10px] mt-1">varchar(200) - สามารถเว้นว่างได้</p>
                </div>

                {/* docu_desc */}
                <div>
                    <label className={styles.label}>
                        คำอธิบาย <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        {...register('docu_desc')}
                        placeholder="กรอกคำอธิบายเอกสาร"
                        className={`${styles.input} min-h-[80px] ${errors.docu_desc ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    <p className="text-gray-400 text-[10px] mt-1">varchar(200) - ห้ามเว้นว่าง</p>
                    {errors.docu_desc && (
                        <p className="text-red-500 text-xs mt-1">{errors.docu_desc.message}</p>
                    )}
                </div>

                {/* remark */}
                <div>
                    <label className={styles.label}>
                        หมายเหตุ <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        {...register('remark')}
                        placeholder="กรอกหมายเหตุ"
                        className={`${styles.input} min-h-[80px] ${errors.remark ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    <p className="text-gray-400 text-[10px] mt-1">varchar(200) - ห้ามเว้นว่าง</p>
                    {errors.remark && (
                        <p className="text-red-500 text-xs mt-1">{errors.remark.message}</p>
                    )}
                </div>

                {/* stock_effect_ic */}
                <div>
                    <label className={styles.label}>
                        อ้างอิงผลต่อคลัง (ไม่มีผลต่อคลัง, เพิ่มคลัง, ลดคลัง)
                    </label>
                    <select
                        {...register('stock_effect_ic')}
                        className={styles.input}
                    >
                        <option value="0">ไม่มีผลต่อคลัง</option>
                        <option value="1">เพิ่มคลัง</option>
                        <option value="-1">ลดคลัง</option>
                    </select>
                    <p className="text-gray-400 text-[10px] mt-1">smallint - สามารถเว้นว่างได้</p>
                </div>

            </div>
        </DialogFormLayout>
    );
}
