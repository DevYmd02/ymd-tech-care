/**
 * @file PositionFormModal.tsx
 * @description Modal for creating/editing Position data
 * @module company
 */

import { Save, X, Briefcase } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { usePositionForm } from './hooks/usePositionForm';

interface PositionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: number | null;
}

export const PositionFormModal = ({ isOpen, onClose, onSuccess, editId }: PositionFormModalProps) => {
    const isEdit = !!editId;

    const {
        register,
        errors,
        isSubmitting,
        isLoadingInitial,
        handleSave
    } = usePositionForm(editId ?? null, isOpen, onSuccess);

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
            title={isEdit ? 'แก้ไขข้อมูลตำแหน่ง' : 'เพิ่มตำแหน่งใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                {isLoadingInitial ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <span className="loading loading-spinner loading-lg text-blue-600"></span>
                        <p className="text-gray-500 text-sm animate-pulse">กำลังดึงข้อมูล...</p>
                    </div>
                ) : (
                    <>
                        {/* Position Code */}
                        <div>
                            <label className={styles.label}>
                                รหัสตำแหน่ง <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('positionCode')}
                                type="text"
                                placeholder="กรอกรหัสตำแหน่ง"
                                className={`${styles.input} ${errors.positionCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                                disabled={isEdit}
                            />
                            {errors.positionCode ? (
                                <p className="text-red-500 text-xs mt-1">{errors.positionCode.message}</p>
                            ) : (
                                <p className="text-gray-400 text-xs mt-1">varchar(20) - รหัสตำแหน่ง</p>
                            )}
                        </div>

                        {/* Position Name (Thai) */}
                        <div>
                            <label className={styles.label}>
                                ชื่อตำแหน่ง (ภาษาไทย) <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('positionName')}
                                type="text"
                                placeholder="กรอกชื่อตำแหน่ง"
                                className={`${styles.input} ${errors.positionName ? 'border-red-500 focus:ring-red-200' : ''}`}
                            />
                            {errors.positionName ? (
                                <p className="text-red-500 text-xs mt-1">{errors.positionName.message}</p>
                            ) : (
                                <p className="text-gray-400 text-xs mt-1">varchar(100) - ชื่อตำแหน่ง</p>
                            )}
                        </div>

                        {/* Position Name (English) */}
                        <div>
                            <label className={styles.label}>
                                ชื่อตำแหน่ง (ภาษาอังกฤษ) <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('positionNameEn')}
                                type="text"
                                placeholder="Enter position name in English"
                                className={`${styles.input} ${errors.positionNameEn ? 'border-red-500 focus:ring-red-200' : ''}`}
                            />
                            {errors.positionNameEn ? (
                                <p className="text-red-500 text-xs mt-1">{errors.positionNameEn.message}</p>
                            ) : (
                                <p className="text-gray-400 text-xs mt-1">varchar(100) - ชื่อตำแหน่ง (Eng)</p>
                            )}
                        </div>

                        {/* Status - Checkbox */}
                        <div className="flex items-center gap-2 px-1">
                            <input
                                {...register('isActive')}
                                id="isActive"
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                ใช้งาน (Active)
                            </label>
                        </div>
                    </>
                )}
            </div>
        </DialogFormLayout>
    );
};


