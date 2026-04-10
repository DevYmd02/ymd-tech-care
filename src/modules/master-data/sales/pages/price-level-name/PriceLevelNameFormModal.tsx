/**
 * @file PriceLevelNameFormModal.tsx
 * @description Form Modal for Price Level Name Lookup Master Data
 */

import { Tag, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { usePriceLevelNameForm } from './hooks/usePriceLevelNameForm';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: number | string | null;
    onSuccess?: () => void;
}

export default function PriceLevelNameFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        watch,
    } = usePriceLevelNameForm(editId ?? null, onSuccess, isOpen);

    const currentLevelNo = watch('levelNo');



    // ==================== RENDERING ====================

    const TitleIcon = <Tag size={24} className="text-indigo-500 dark:text-indigo-400" />;

    const FormFooter = (
        <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-300 dark:border-gray-600 font-medium"
            >
                <X size={18} />
                ยกเลิก
            </button>
            <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 font-medium"
            >
                <Save size={18} />
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={editId ? 'แก้ไขชื่อระดับราคา' : 'เพิ่มชื่อระดับราคา'}
            titleIcon={TitleIcon}
            footer={FormFooter}
            width="max-w-[480px]"
        >
            <div className="p-6 space-y-5">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 -mt-2">
                    {currentLevelNo ? `กำลังแก้ไข: ระดับที่ ${currentLevelNo}` : 'แก้ไขชื่อสำหรับแต่ละระดับราคาสินค้า (1–10)'}
                </p>



                {/* Name */}
                <div>
                    <label className={styles.label}>
                        ชื่อระดับราคา (Name) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('name')}
                        type="text"
                        className={styles.input}
                        placeholder="เช่น ราคาขายปลีก, ราคาส่ง"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
            </div>
        </DialogFormLayout>
    );
}
