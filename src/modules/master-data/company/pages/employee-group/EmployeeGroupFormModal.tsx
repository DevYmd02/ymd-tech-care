/**
 * @file EmployeeGroupFormModal.tsx
 * @description Modal for creating/editing Employee Group data
 * @module company
 */

import { Save, X, UsersRound } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { useEmployeeGroupForm } from './hooks/useEmployeeGroupForm';

interface EmployeeGroupFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: string | null;
}

export const EmployeeGroupFormModal = ({ isOpen, onClose, onSuccess, editId }: EmployeeGroupFormModalProps) => {
    const isEdit = !!editId;

    const {
        register,
        errors,
        isSubmitting,
        handleSave
    } = useEmployeeGroupForm(editId ?? null, isOpen, onSuccess);


    // Header Icon
    const TitleIcon = <UsersRound className="w-5 h-5 text-white" />;

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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
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
            title={isEdit ? 'แก้ไขข้อมูลกลุ่มพนักงาน' : 'เพิ่มกลุ่มพนักงานใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                {/* Group Code */}
                <div>
                    <label className={styles.label}>
                        รหัสกลุ่มพนักงาน <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('employeeGroupCode')}
                        type="text"
                        placeholder="กรอกรหัสกลุ่มพนักงาน"
                        className={`${styles.input} ${errors.employeeGroupCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />

                    {errors.employeeGroupCode && (
                        <p className="text-red-500 text-xs mt-1">{errors.employeeGroupCode.message}</p>
                    )}
                </div>

                {/* Group Name (Thai) */}
                <div>
                    <label className={styles.label}>
                        ชื่อกลุ่มพนักงาน (ภาษาไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('employeeGroupName')}
                        type="text"
                        placeholder="กรอกชื่อกลุ่มพนักงาน"
                        className={`${styles.input} ${errors.employeeGroupName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.employeeGroupName && (
                        <p className="text-red-500 text-xs mt-1">{errors.employeeGroupName.message}</p>
                    )}
                </div>

                {/* Group Name (English) */}
                <div>
                    <label className={styles.label}>
                        ชื่อกลุ่มพนักงาน (ภาษาอังกฤษ) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('employeeGroupNameEn')}
                        type="text"
                        placeholder="Enter employee group name in English"
                        className={`${styles.input} ${errors.employeeGroupNameEn ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.employeeGroupNameEn && (
                        <p className="text-red-500 text-xs mt-1">{errors.employeeGroupNameEn.message}</p>
                    )}
                </div>

                {/* Status - Pattern: Styled Checkbox */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors group cursor-pointer mt-2">
                    <input
                        {...register('isActive')}
                        type="checkbox"
                        id="employee_group_is_active"
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <label 
                        htmlFor="employee_group_is_active" 
                        className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
                    >
                        สถานะใช้งาน (Active)
                    </label>
                </div>

            </div>
        </DialogFormLayout>
    );
};


