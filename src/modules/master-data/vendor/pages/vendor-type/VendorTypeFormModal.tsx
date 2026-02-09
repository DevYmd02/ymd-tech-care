/**
 * @file VendorTypeFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลประเภทเจ้าหนี้
 * @module vendor
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@/shared/components/layout/DialogFormLayout';
import { logger } from '@/shared/utils/logger';
import { VendorTypeService } from '../../services/vendor-type.service';

// ====================================================================================
// SCHEMA
// ====================================================================================

const vendorTypeSchema = z.object({
    typeCode: z.string()
        .min(1, 'กรุณากรอกรหัสประเภทเจ้าหนี้')
        .max(20, 'รหัสประเภทเจ้าหนี้ต้องไม่เกิน 20 ตัวอักษร'),
    typeName: z.string()
        .min(1, 'กรุณากรอกชื่อประเภทเจ้าหนี้ (ไทย)')
        .max(200, 'ชื่อประเภทเจ้าหนี้ต้องไม่เกิน 200 ตัวอักษร'),
    typeNameEn: z.string()
        .max(200, 'ชื่อประเภทเจ้าหนี้ (Eng) ต้องไม่เกิน 200 ตัวอักษร'),
    isActive: z.boolean(),
});

type VendorTypeFormValues = z.infer<typeof vendorTypeSchema>;

// ====================================================================================
// PROPS
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export function VendorTypeFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        control,
        setValue
    } = useForm<VendorTypeFormValues>({
        resolver: zodResolver(vendorTypeSchema),
        defaultValues: {
            typeCode: '',
            typeName: '',
            typeNameEn: '',
            isActive: true
        }
    });

    const isActive = useWatch({ control, name: 'isActive' });

    // Reset/Load Data
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                VendorTypeService.getById(editId).then(existing => {
                    if (existing) {
                        reset({
                            typeCode: existing.vendor_type_code,
                            typeName: existing.vendor_type_name,
                            typeNameEn: existing.vendor_type_name_en || '',
                            isActive: existing.is_active
                        });
                    }
                });
            } else {
                reset({
                    typeCode: '',
                    typeName: '',
                    typeNameEn: '',
                    isActive: true
                });
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = async (data: VendorTypeFormValues) => {
        try {
            let result;
            if (editId) {
                result = await VendorTypeService.update(editId, data);
            } else {
                result = await VendorTypeService.create(data);
            }

            if (result.success) {
                logger.log('Saved Vendor Type:', data);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(result.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            logger.error('Error saving vendor type:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // ==================== RENDERING ====================
    
    // Header Icon
    const TitleIcon = <Tag size={24} className="text-white" />;

    // Footer Actions
    const FormFooter = (
        <div className="flex justify-end gap-3 p-4">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-300"
            >
                <X size={18} />
                ยกเลิก
            </button>
            <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
                <Save size={18} />
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={editId ? 'แก้ไขข้อมูลประเภทเจ้าหนี้' : 'เพิ่มประเภทเจ้าหนี้ใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                
                {/* Type Code */}
                <div>
                    <label className={styles.label}>
                        รหัสประเภทเจ้าหนี้ <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('typeCode')}
                        type="text"
                        placeholder="กรอกรหัสประเภทเจ้าหนี้ (เช่น MFG, DIS)"
                        className={`${styles.input} ${errors.typeCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.typeCode ? (
                        <p className="text-red-500 text-xs mt-1">{errors.typeCode.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(20), UNIQUE - ต้องไม่ซ้ำ</p>
                    )}
                </div>

                {/* Type Name (Thai) */}
                <div>
                    <label className={styles.label}>
                        ชื่อประเภทเจ้าหนี้ (ไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('typeName')}
                        type="text"
                        placeholder="กรอกชื่อประเภทเจ้าหนี้ (ไทย)"
                        className={`${styles.input} ${errors.typeName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.typeName ? (
                        <p className="text-red-500 text-xs mt-1">{errors.typeName.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(200)</p>
                    )}
                </div>

                {/* Type Name (English) */}
                <div>
                    <label className={styles.label}>
                        ชื่อประเภทเจ้าหนี้ (EN)
                    </label>
                    <input
                        {...register('typeNameEn')}
                        type="text"
                        placeholder="กรอกชื่อประเภทเจ้าหนี้ (English)"
                        className={`${styles.input} ${errors.typeNameEn ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.typeNameEn ? (
                        <p className="text-red-500 text-xs mt-1">{errors.typeNameEn.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(200)</p>
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
}
