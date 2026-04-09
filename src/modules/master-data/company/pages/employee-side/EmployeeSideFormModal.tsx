/**
 * @file EmployeeSideFormModal.tsx
 * @description Modal for creating/editing EmployeeSide data (Formerly Department)
 * @module company
 */

import { useWatch } from 'react-hook-form';
import { Save, X, Building } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { useEmployeeSideForm } from './hooks/useEmployeeSideForm';

interface EmployeeSideFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: string | number | null;
}

export const EmployeeSideFormModal = ({ isOpen, onClose, onSuccess, editId }: EmployeeSideFormModalProps) => {
    const isEdit = !!editId;

    const {
        register,
        errors,
        isSubmitting,
        handleSave,
        setValue,
        control
    } = useEmployeeSideForm(editId ?? null, isOpen, onSuccess);

    const isActive = useWatch({ control, name: 'is_active' });

    // Header Icon
    const TitleIcon = <Building className="w-5 h-5 text-white" />;

    // Footer Actions
    const FormFooter = (
        <div className="flex justify-end gap-3 p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
            <button
                type="button"
                className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl flex items-center gap-2 transition-all border border-gray-200 shadow-sm font-medium"
                onClick={onClose}
            >
                <X className="w-4.5 h-4.5" />
                ยกเลิก
            </button>
            <button
                type="button"
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-200 dark:shadow-none font-medium disabled:opacity-50 active:scale-[0.98]"
                onClick={handleSave}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <span className="loading loading-spinner loading-xs"></span>
                ) : (
                    <Save className="w-4.5 h-4.5" />
                )}
                บันทึก
            </button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'แก้ไขข้อมูลฝ่าย' : 'เพิ่มรหัสฝ่ายใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
            headerColor="bg-blue-600"
        >
            <div className="p-6 space-y-6">
                {/* Header Row: Title & Status Checkbox */}
                <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                        <label className={`${styles.label} flex items-center gap-1`}>
                            รหัสฝ่าย <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                            {...register('emp_side_code')}
                            type="text"
                            placeholder="กรอกรหัสฝ่าย (เช่น FIN, HR, IT)"
                            className={`${styles.input} ${errors.emp_side_code ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                        {errors.emp_side_code && (
                            <p className="text-red-500 text-xs mt-1">{errors.emp_side_code.message}</p>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 pt-10 pl-6">
                        <input
                            id="is_active"
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            checked={isActive}
                            onChange={(e) => setValue('is_active', e.target.checked)}
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                            ใช้งาน (Active)
                        </label>
                    </div>
                </div>

                {/* Side Name (Thai) */}
                <div className="space-y-2">
                    <label className={`${styles.label} flex items-center gap-1`}>
                        ชื่อฝ่าย (ภาษาไทย) <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                        {...register('emp_side_name')}
                        type="text"
                        placeholder="กรอกชื่อฝ่าย"
                        className={`${styles.input} ${errors.emp_side_name ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.emp_side_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.emp_side_name.message}</p>
                    )}
                </div>

                {/* Side Name (English) */}
                <div className="space-y-2">
                    <label className={styles.label}>
                        ชื่อฝ่าย (ภาษาอังกฤษ)
                    </label>
                    <input
                        {...register('emp_side_nameeng')}
                        type="text"
                        placeholder="Enter department name in English"
                        className={`${styles.input} ${errors.emp_side_nameeng ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                </div>
            </div>
        </DialogFormLayout>
    );
};


