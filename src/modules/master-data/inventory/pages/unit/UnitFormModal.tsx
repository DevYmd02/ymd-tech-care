import { Ruler, Save, X, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { useUnitForm } from '../../hooks/useUnitForm';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: number | null;
    initialData?: UnitListItem | null;
    onSuccess?: () => void;
}

export function UnitFormModal({ isOpen, onClose, editId, initialData, onSuccess }: Props) {
    const {
        register,
        errors,
        isSaving,
        handleSave,
        clearForm
    } = useUnitForm(editId || null, initialData, onSuccess);

    const handleClose = () => {
        clearForm();
        onClose();
    };

    const TitleIcon = <Ruler size={24} className="text-white" />;

    const FormFooter = (
        <div className="flex justify-end gap-3 p-4">
            <button
                type="button"
                onClick={clearForm}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-300"
            >
                <RotateCcw size={18} />
                ล้างฟอร์ม (Clear)
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
            title={editId ? 'แก้ไขข้อมูลหน่วยนับ' : 'เพิ่มหน่วยนับใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Unit Code */}
                    <div>
                        <label className={styles.label}>
                            รหัสหน่วยนับ <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('unit_code')}
                            type="text"
                            placeholder="กรอกรหัสหน่วยนับ"
                            className={`${styles.input} ${errors.unit_code ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                        {errors.unit_code && (
                            <p className="text-red-500 text-xs mt-1">{errors.unit_code.message}</p>
                        )}
                    </div>

                    {/* Status */}
                    <div className="flex items-end pb-2">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 w-full">
                            <input
                                {...register('is_active')}
                                type="checkbox"
                                id="unit_is_active"
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="unit_is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                สถานะใช้งาน (Active)
                            </label>
                        </div>
                    </div>
                </div>

                {/* Unit Name (Thai) */}
                <div>
                    <label className={styles.label}>
                        ชื่อหน่วยนับ (ภาษาไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('unit_name')}
                        type="text"
                        placeholder="กรอกชื่อหน่วยนับ"
                        className={`${styles.input} ${errors.unit_name ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.unit_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.unit_name.message}</p>
                    )}
                </div>

                {/* Unit Name (English) */}
                <div>
                    <label className={styles.label}>
                        ชื่อหน่วยนับ (ภาษาอังกฤษ)
                    </label>
                    <input
                        {...register('unit_name_en')}
                        type="text"
                        placeholder="Unit Name (English)"
                        className={styles.input}
                    />
                    {errors.unit_name_en && (
                        <p className="text-red-500 text-xs mt-1">{errors.unit_name_en.message}</p>
                    )}
                </div>

            </div>
        </DialogFormLayout>
    );
}
