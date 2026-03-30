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
    editId?: number | null;
}

export const EmployeeGroupFormModal = ({ isOpen, onClose, onSuccess, editId }: EmployeeGroupFormModalProps) => {
    const isEdit = !!editId;

    const {
        register,
        errors,
        isSubmitting,
        handleSave,
        setValue,
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
                        {...register('groupCode')}
                        type="text"
                        placeholder="กรอกรหัสกลุ่มพนักงาน"
                        className={`${styles.input} ${errors.groupCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                        disabled={isEdit}
                    />
                    {errors.groupCode ? (
                        <p className="text-red-500 text-xs mt-1">{errors.groupCode.message}</p>
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
                        {...register('groupName')}
                        type="text"
                        placeholder="กรอกชื่อกลุ่มพนักงาน"
                        className={`${styles.input} ${errors.groupName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.groupName ? (
                        <p className="text-red-500 text-xs mt-1">{errors.groupName.message}</p>
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
                        {...register('groupNameEn')}
                        type="text"
                        placeholder="Enter employee group name in English"
                        className={`${styles.input} ${errors.groupNameEn ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    <p className="text-gray-400 text-xs mt-1">varchar(100) - ชื่อกลุ่มพนักงาน (Eng)</p>
                </div>

                {/* Status - Dropdown Select */}
                <div>
                    <label className={styles.label}>
                        สถานะ <span className="text-red-500">*</span>
                    </label>
                    <select
                        className={`${styles.input} cursor-pointer`}
                        value={isActive ? 'true' : 'false'}
                        onChange={(e) => setValue('isActive', e.target.value === 'true')}
                    >
                        <option value="true">ใช้งาน (Active)</option>
                        <option value="false">ไม่ใช้งาน (Inactive)</option>
                    </select>
                </div>
            </div>
        </DialogFormLayout>
    );
};


