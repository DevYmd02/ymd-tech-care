/**
 * @file ModelFormModal.tsx
 */
import { Box, Save, X, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { useModelForm } from '../../hooks/useModelForm';
import type { Model } from '@/modules/master-data/inventory/types/inventory-master.types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: number | null;
    initialData?: Model | null;
    onSuccess?: () => void;
}

export function ModelFormModal({ isOpen, onClose, editId, initialData, onSuccess }: Props) {
    const {
        register,
        errors,
        isSaving,
        handleSave,
        clearForm
    } = useModelForm(editId ?? null, initialData, onSuccess);

    const handleClose = () => {
        clearForm();
        onClose();
    };

    const TitleIcon = <Box size={24} className="text-white" />;

    const FormFooter = (
        <div className="flex justify-end gap-3 p-4">
            <button
                type="button"
                onClick={clearForm}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-300"
            >
                <RotateCcw size={18} />
                ล้างฟอร์ม
            </button>
            <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-300"
            >
                <X size={18} />
                ยกเลิก
            </button>
            <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
                <Save size={18} />
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={handleClose}
            title={editId ? 'แก้ไขข้อมูลรุ่นสินค้า' : 'เพิ่มรุ่นสินค้าใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={styles.label}>รหัสรุ่น <span className="text-red-500">*</span></label>
                        <input {...register('code')} type="text" placeholder="กรอกรหัสรุ่น" className={`${styles.input} ${errors.code ? 'border-red-500' : ''}`} />
                        {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
                    </div>
                    <div className="flex items-end pb-2">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 w-full">
                            <input {...register('isActive')} type="checkbox" id="model_is_active" className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                            <label htmlFor="model_is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">สถานะใช้งาน</label>
                        </div>
                    </div>
                </div>
                <div>
                    <label className={styles.label}>ชื่อรุ่น (ไทย) <span className="text-red-500">*</span></label>
                    <input {...register('nameTh')} type="text" placeholder="กรอกชื่อรุ่น (ไทย)" className={`${styles.input} ${errors.nameTh ? 'border-red-500' : ''}`} />
                    {errors.nameTh && <p className="text-red-500 text-xs mt-1">{errors.nameTh.message}</p>}
                </div>
                <div>
                    <label className={styles.label}>ชื่อรุ่น (EN)</label>
                    <input {...register('nameEn')} type="text" placeholder="กรอกชื่อรุ่น (English)" className={`${styles.input} ${errors.nameEn ? 'border-red-500' : ''}`} />
                    {errors.nameEn && <p className="text-red-500 text-xs mt-1">{errors.nameEn.message}</p>}
                </div>
            </div>
        </DialogFormLayout>
    );
}
