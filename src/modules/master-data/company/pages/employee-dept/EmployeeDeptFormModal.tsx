/**
 * @file EmployeeDeptFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลแผนก (Employee Dept)
 * @module company
 */

import { useWatch } from 'react-hook-form';
import { Save, X, Layers } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { useEmployeeDeptForm } from './hooks/useEmployeeDeptForm';

interface EmployeeDeptFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: string | number | null;
}

export const EmployeeDeptFormModal = ({ isOpen, onClose, onSuccess, editId }: EmployeeDeptFormModalProps) => {
    const isEdit = !!editId;

    const {
        register,
        errors,
        sides,
        isSubmitting,
        handleSave,
        control
    } = useEmployeeDeptForm(editId ?? null, isOpen, onSuccess);

    const isActive = useWatch({ control, name: 'is_active' });

    // Header Icon
    const TitleIcon = <Layers className="w-5 h-5 text-white" />;

    // Footer Actions
    const FormFooter = (
        <div className="flex justify-end gap-3 p-4">
            <button
                type="button"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-300"
                onClick={onClose}
            >
                <X className="w-4 h-4" />
                ยกเลิก
            </button>
            <button
                type="button"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                onClick={handleSave}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <span className="loading loading-spinner loading-xs"></span>
                ) : (
                    <Save className="w-4 h-4" />
                )}
                บันทึก
            </button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'แก้ไขข้อมูลแผนก' : 'เพิ่มแผนกใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                {/* 1. Select Side & Status Row */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                        <label className={styles.label}>
                            เลือกฝ่าย <span className="text-red-500">*</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                {...register('is_active')}
                                type="checkbox"
                                checked={isActive}
                                className="checkbox checkbox-sm checkbox-primary border-indigo-400 checked:bg-indigo-600"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                ใช้งาน (Active)
                            </span>
                        </label>
                    </div>
                    <select 
                        className={`${styles.input} cursor-pointer ${errors.emp_side_id ? 'border-red-500 focus:ring-red-200' : ''}`}
                        {...register('emp_side_id')}
                    >
                        <option value="">-- เลือกฝ่าย --</option>
                        {sides.map(side => (
                            <option key={side.emp_side_id || side.side_id} value={side.emp_side_id || side.side_id}>
                                {side.emp_side_code || side.side_code} - {side.emp_side_name || side.side_name}
                            </option>
                        ))}
                    </select>
                    {errors.emp_side_id && (
                        <p className="text-red-500 text-xs mt-1">{errors.emp_side_id.message}</p>
                    )}
                </div>

                {/* 2. Dept Code */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        รหัสแผนก <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('emp_dept_code')}
                        type="text"
                        placeholder="กรอกรหัสแผนก (เช่น FIN-TRS, ACC-GL)"
                        className={`${styles.input} ${errors.emp_dept_code ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.emp_dept_code && (
                        <p className="text-red-500 text-xs mt-1">{errors.emp_dept_code.message}</p>
                    )}
                </div>

                {/* 3. Dept Name Thai (ชื่อแผนก ภาษาไทย) */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        ชื่อแผนก (ภาษาไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('emp_dept_name')}
                        type="text"
                        placeholder="กรอกชื่อแผนก"
                        className={`${styles.input} ${errors.emp_dept_name ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.emp_dept_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.emp_dept_name.message}</p>
                    )}
                </div>

                {/* 4. Dept Name English (ชื่อแผนก ภาษาอังกฤษ) */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        ชื่อแผนก (ภาษาอังกฤษ)
                    </label>
                    <input
                        {...register('emp_dept_nameeng')}
                        type="text"
                        placeholder="Enter department name in English"
                        className={`${styles.input} ${errors.emp_dept_nameeng ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.emp_dept_nameeng && (
                        <p className="text-red-500 text-xs mt-1">{errors.emp_dept_nameeng.message}</p>
                    )}
                </div>
            </div>
        </DialogFormLayout>
    );
};
