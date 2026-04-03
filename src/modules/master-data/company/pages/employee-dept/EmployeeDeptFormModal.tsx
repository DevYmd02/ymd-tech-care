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
        setValue,
        control
    } = useEmployeeDeptForm(editId ?? null, isOpen, onSuccess);

    const isActive = useWatch({ control, name: 'isActive' });

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
            title={isEdit ? 'แก้ไขข้อมูลแผนก' : 'เพิ่มแผนกใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                {/* 1. Dept Code (รหัสแผนก) */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        รหัสแผนก <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('deptCode')}
                        type="text"
                        placeholder="กรอกรหัสแผนก (เช่น FIN-TRS, ACC-GL)"
                        className={`${styles.input} ${errors.deptCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                        disabled={isEdit}
                    />
                    {errors.deptCode && (
                        <p className="text-red-500 text-xs mt-1">{errors.deptCode.message}</p>
                    )}
                </div>

                {/* 2. Dept Name Thai (ชื่อแผนก ภาษาไทย) */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        ชื่อแผนก (ภาษาไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('deptName')}
                        type="text"
                        placeholder="กรอกชื่อแผนก"
                        className={`${styles.input} ${errors.deptName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.deptName && (
                        <p className="text-red-500 text-xs mt-1">{errors.deptName.message}</p>
                    )}
                </div>

                {/* 3. Dept Name English (ชื่อแผนก ภาษาอังกฤษ) */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        ชื่อแผนก (ภาษาอังกฤษ)
                    </label>
                    <input
                        {...register('deptNameEn')}
                        type="text"
                        placeholder="Enter department name in English"
                        className={`${styles.input} ${errors.deptNameEn ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.deptNameEn && (
                        <p className="text-red-500 text-xs mt-1">{errors.deptNameEn.message}</p>
                    )}
                </div>

                {/* 4. Select Side (เลือกฝ่าย) */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        เลือกฝ่าย <span className="text-red-500">*</span>
                    </label>
                    <select 
                        className={`${styles.input} cursor-pointer ${errors.sideId ? 'border-red-500 focus:ring-red-200' : ''}`}
                        {...register('sideId')}
                    >
                        <option value="">-- เลือกฝ่าย --</option>
                        {sides.map(side => (
                            <option key={side.side_id || side.department_id} value={side.side_id || side.department_id}>
                                {side.side_code || side.department_code} - {side.side_name || side.department_name}
                            </option>
                        ))}
                    </select>
                    {errors.sideId && (
                        <p className="text-red-500 text-xs mt-1">{errors.sideId.message}</p>
                    )}
                </div>

                {/* 5. Status */}
                <div className="space-y-1">
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
