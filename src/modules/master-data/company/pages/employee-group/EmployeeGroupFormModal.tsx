/**
 * @file EmployeeGroupFormModal.tsx
 * @description Modal for creating/editing Employee Group data
 * @module company
 */

import { useWatch } from 'react-hook-form';
import { Save, X, UsersRound } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { useEmployeeGroupForm } from '../../hooks/useEmployeeGroupForm';

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
        handleSave,
        control
    } = useEmployeeGroupForm(editId ?? null, isOpen, onSuccess);

    const isActive = useWatch({ control, name: 'isActive' });

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

                    {errors.employeeGroupCode ? (
                        <p className="text-red-500 text-xs mt-1">{errors.employeeGroupCode.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(20) - รหัสกลุ่มพนักงาน</p>
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
                    {errors.employeeGroupName ? (
                        <p className="text-red-500 text-xs mt-1">{errors.employeeGroupName.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(100) - ชื่อกลุ่มพนักงาน</p>
                    )}
                </div>

                {/* Group Name (English) */}
                <div>
                    <label className={styles.label}>
                        ชื่อกลุ่มพนักงาน (ภาษาอังกฤษ)
                    </label>
                    <input
                        {...register('employeeGroupNameEn')}
                        type="text"
                        placeholder="Enter employee group name in English"
                        className={`${styles.input} ${errors.employeeGroupNameEn ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    <p className="text-gray-400 text-xs mt-1">varchar(100) - ชื่อกลุ่มพนักงาน (Eng)</p>
                </div>

                {/* Status - Checkbox */}
                <div className="flex flex-col gap-2">
                    <label className={styles.label}>สถานะ</label>
                    <label className="flex items-center gap-3 cursor-pointer group bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-sm">
                        <input
                            {...register('isActive')}
                            type="checkbox"
                            className="checkbox checkbox-primary checkbox-sm rounded-md border-gray-400"
                        />
                        <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {isActive ? 'ใช้งาน (Active)' : 'ไม่ใช้งาน (Inactive)'}
                        </span>
                    </label>
                </div>

            </div>
        </DialogFormLayout>
    );
};


