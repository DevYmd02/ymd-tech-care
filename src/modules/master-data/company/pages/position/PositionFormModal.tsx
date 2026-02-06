/**
 * @file PositionFormModal.tsx
 * @description Modal for creating/editing Position data
 * @module company
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, Briefcase } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@/shared/components/layout/DialogFormLayout';
import { PositionService } from '@/modules/master-data/company/services/company.service';

interface PositionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: string | null;
}

const positionSchema = z.object({
    positionCode: z.string().min(1, 'กรุณากรอกรหัสตำแหน่ง').max(20, 'รหัสตำแหน่งต้องไม่เกิน 20 ตัวอักษร'),
    positionName: z.string().min(1, 'กรุณากรอกชื่อตำแหน่ง').max(100, 'ชื่อตำแหน่งต้องไม่เกิน 100 ตัวอักษร'),
    positionNameEn: z.string().max(100, 'ชื่อตำแหน่ง (English) ต้องไม่เกิน 100 ตัวอักษร'),
    isActive: z.boolean(),
});

type PositionFormValues = z.infer<typeof positionSchema>;

export const PositionFormModal = ({ isOpen, onClose, onSuccess, editId }: PositionFormModalProps) => {
    const isEdit = !!editId;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm<PositionFormValues>({
        resolver: zodResolver(positionSchema),
        defaultValues: {
            positionCode: '',
            positionName: '',
            positionNameEn: '',
            isActive: true,
        },
    });

    const isActive = useWatch({ control, name: 'isActive' });

    useEffect(() => {
        if (isOpen) {
            if (isEdit && editId) {
                // Fetch data for edit
                PositionService.get(editId).then((data) => {
                    if (data) {
                        setValue('positionCode', data.position_code);
                        setValue('positionName', data.position_name);
                        setValue('positionNameEn', data.position_name_en || '');
                        setValue('isActive', data.is_active);
                    }
                });
            } else {
                // Reset for create
                reset({
                    positionCode: '',
                    positionName: '',
                    positionNameEn: '',
                    isActive: true,
                });
            }
        }
    }, [isOpen, isEdit, editId, reset, setValue]);

    const onSubmit = async (data: PositionFormValues) => {
        try {
            let res;
            if (isEdit && editId) {
                res = await PositionService.update(editId, data);
            } else {
                res = await PositionService.create(data);
            }

            if (res.success) {
                onSuccess();
                onClose();
            } else {
                alert(res.message || 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            console.error('Error saving position:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

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
                onClick={handleSubmit(onSubmit)}
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
                        ชื่อตำแหน่ง (ภาษาอังกฤษ)
                    </label>
                    <input
                        {...register('positionNameEn')}
                        type="text"
                        placeholder="Enter position name in English"
                        className={`${styles.input} ${errors.positionNameEn ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    <p className="text-gray-400 text-xs mt-1">varchar(100) - ชื่อตำแหน่ง (Eng)</p>
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
