/**
 * @file UnitFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลหน่วยนับ (Unit of Measure) - Refactored to Standard
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, Ruler } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import { logger } from '@/shared/utils/logger';

interface UnitFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: string | null;
}

const unitSchema = z.object({
    unitCode: z.string().min(1, 'กรุณากรอกรหัสหน่วยนับ').max(20, 'รหัสหน่วยนับต้องไม่เกิน 20 ตัวอักษร'),
    unitName: z.string().min(1, 'กรุณากรอกชื่อหน่วยนับ (ภาษาไทย)').max(100, 'ชื่อหน่วยนับต้องไม่เกิน 100 ตัวอักษร'),
    unitNameEn: z.string().max(100, 'ชื่อหน่วยนับ (English) ต้องไม่เกิน 100 ตัวอักษร').optional(),
    isActive: z.boolean(),
});

type UnitFormValues = z.infer<typeof unitSchema>;

export const UnitFormModal = ({ isOpen, onClose, onSuccess, editId }: UnitFormModalProps) => {
    const isEdit = !!editId;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm<UnitFormValues>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            unitCode: '',
            unitName: '',
            unitNameEn: '',
            isActive: true,
        },
    });

    const isActive = useWatch({ control, name: 'isActive' });

    useEffect(() => {
        if (isOpen) {
            if (isEdit && editId) {
                UnitService.get(editId).then((data) => {
                    if (data) {
                        reset({
                            unitCode: data.unit_code,
                            unitName: data.unit_name,
                            unitNameEn: data.unit_name_en || '',
                            isActive: data.is_active ?? true,
                        });
                    }
                });
            } else {
                reset({
                    unitCode: '',
                    unitName: '',
                    unitNameEn: '',
                    isActive: true,
                });
            }
        }
    }, [isOpen, isEdit, editId, reset]);

    const onSubmit = async (data: UnitFormValues) => {
        try {
            let res;
            const payload = {
                unit_code: data.unitCode,
                unit_name: data.unitName,
                unit_name_en: data.unitNameEn,
                is_active: data.isActive,
            };

            if (isEdit && editId) {
                res = await UnitService.update(editId, payload);
            } else {
                res = await UnitService.create(payload);
            }

            if (res.success) {
                onSuccess();
                onClose();
            } else {
                alert(res.message || 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            logger.error('Error saving unit:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // Header Icon
    const TitleIcon = <Ruler className="w-5 h-5 text-white" />;

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
            title={isEdit ? 'แก้ไขข้อมูลหน่วยนับ' : 'เพิ่มหน่วยนับใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                {/* 1. Unit Code */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        รหัสหน่วยนับ <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('unitCode')}
                        type="text"
                        placeholder="กรอกรหัสหน่วยนับ (เช่น PCS, BOX, KG)"
                        className={`${styles.input} ${errors.unitCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                        disabled={isEdit}
                    />
                    {errors.unitCode && (
                        <p className="text-red-500 text-xs mt-1">{errors.unitCode.message}</p>
                    )}
                </div>

                {/* 2. Unit Name Thai */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        ชื่อหน่วยนับ (ภาษาไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('unitName')}
                        type="text"
                        placeholder="กรอกชื่อหน่วยนับ (ภาษาไทย)"
                        className={`${styles.input} ${errors.unitName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.unitName && (
                        <p className="text-red-500 text-xs mt-1">{errors.unitName.message}</p>
                    )}
                </div>

                {/* 3. Unit Name English */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        ชื่อหน่วยนับ (English)
                    </label>
                    <input
                        {...register('unitNameEn')}
                        type="text"
                        placeholder="Enter unit of measure name in English"
                        className={`${styles.input} ${errors.unitNameEn ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.unitNameEn && (
                        <p className="text-red-500 text-xs mt-1">{errors.unitNameEn.message}</p>
                    )}
                </div>

                {/* 4. Status */}
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


