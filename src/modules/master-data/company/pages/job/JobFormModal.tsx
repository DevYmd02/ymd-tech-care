/**
 * @file JobFormModal.tsx
 * @description Modal for creating/editing Job data (Standarized)
 * @module company
 */

import { useWatch } from 'react-hook-form';
import { Save, X, Briefcase } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { useJobForm } from './hooks/useJobForm';

interface JobFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: number | null;
}

export const JobFormModal = ({ isOpen, onClose, onSuccess, editId }: JobFormModalProps) => {
    const isEdit = !!editId;

    const {
        register,
        errors,
        isSubmitting,
        handleSave,
        setValue,
        control
    } = useJobForm(editId ?? null, isOpen, onSuccess);

    const isActive = useWatch({ control, name: 'isActive' });

    // Header Icon
    const TitleIcon = <Briefcase className="w-5 h-5 text-white" />;

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
            title={isEdit ? 'แก้ไขข้อมูล Job' : 'เพิ่มรหัส Job ใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                {/* Job Code */}
                <div>
                    <label className={styles.label}>
                        รหัส Job <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('jobCode')}
                        type="text"
                        placeholder="กรอกรหัส Job"
                        className={`${styles.input} ${errors.jobCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                        disabled={isEdit}
                    />
                    {errors.jobCode ? (
                        <p className="text-red-500 text-xs mt-1">{errors.jobCode.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(20) - รหัส Job</p>
                    )}
                </div>

                {/* Job Name */}
                <div>
                    <label className={styles.label}>
                        ชื่อ Job <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('jobName')}
                        type="text"
                        placeholder="กรอกชื่อ Job"
                        className={`${styles.input} ${errors.jobName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.jobName ? (
                        <p className="text-red-500 text-xs mt-1">{errors.jobName.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(100) - ชื่อ Job</p>
                    )}
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


