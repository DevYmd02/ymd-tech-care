/**
 * @file VendorTypeFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลประเภทเจ้าหนี้
 * @module vendor
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag, Save, X, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { logger } from '@/shared/utils/logger';
import { VendorTypeService } from '@/modules/master-data/vendor/services/vendor-type.service';

// ====================================================================================
// SCHEMA
// ====================================================================================

const vendorTypeSchema = z.object({
    vendor_type_code: z.string()
        .min(1, 'กรุณากรอกรหัสประเภทเจ้าหนี้')
        .max(20, 'รหัสประเภทเจ้าหนี้ต้องไม่เกิน 20 ตัวอักษร'),
    vendor_type_name: z.string()
        .min(1, 'กรุณากรอกชื่อประเภทเจ้าหนี้ (ไทย)')
        .max(200, 'ชื่อประเภทเจ้าหนี้ต้องไม่เกิน 200 ตัวอักษร'),
    vendor_type_nameeng: z.string()
        .max(200, 'ชื่อประเภทเจ้าหนี้ (Eng) ต้องไม่เกิน 200 ตัวอักษร')
        .optional()
        .or(z.literal('')),
    is_active: z.boolean(),
});

type VendorTypeFormValues = z.infer<typeof vendorTypeSchema>;

// ====================================================================================
// PROPS
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: number | null;
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
            vendor_type_code: '',
            vendor_type_name: '',
            vendor_type_nameeng: '',
            is_active: true
        }
    });

    const isActive = useWatch({ control, name: 'is_active' });

    const clearForm = () => {
        reset({
            vendor_type_code: '',
            vendor_type_name: '',
            vendor_type_nameeng: '',
            is_active: true
        });
    };

    // Reset/Load Data
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                VendorTypeService.getById(editId).then(existing => {
                    if (existing) {
                        reset({
                            vendor_type_code: existing.vendor_type_code || '',
                            vendor_type_name: existing.vendor_type_name || '',
                            vendor_type_nameeng: existing.vendor_type_nameeng || '',
                            is_active: existing.is_active ?? true
                        });
                    }
                });
            } else {
                clearForm();
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = async (data: VendorTypeFormValues) => {
        try {
            const payload = {
                vendor_type_code: data.vendor_type_code,
                vendor_type_name: data.vendor_type_name,
                vendor_type_nameeng: data.vendor_type_nameeng || '',
                is_active: data.is_active
            };

            let result;
            if (editId) {
                result = await VendorTypeService.update(editId, payload as any);
            } else {
                result = await VendorTypeService.create(payload as any);
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
                onClick={clearForm}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-300"
            >
                <RotateCcw size={18} />
                ล้างฟอร์ม
            </button>
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
        title={editId ? 'แก้ไขประเภทเจ้าหนี้' : 'เพิ่มประเภทเจ้าหนี้'}
        titleIcon={TitleIcon}
        footer={FormFooter}
    >
        <div className="p-6 space-y-6">

            {/* Section Header */}
            <div className="border-b pb-2">
                <h3 className="text-sm font-semibold text-gray-700">
                    ข้อมูลประเภทเจ้าหนี้
                </h3>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Vendor Type Code */}
                <div>
                    <label className={styles.label}>
                        รหัสประเภทเจ้าหนี้ <span className="text-red-500">*</span>
                    </label>

                    <input
                        {...register('vendor_type_code')}
                        type="text"
                        placeholder="เช่น MFG / DIS"
                        className={`${styles.input} ${
                            errors.vendor_type_code
                                ? 'border-red-500 focus:ring-red-200'
                                : ''
                        }`}
                    />

                    {errors.vendor_type_code ? (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.vendor_type_code.message}
                        </p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">
                            varchar(20) - ต้องไม่ซ้ำ
                        </p>
                    )}
                </div>

                {/* Vendor Type Name TH */}
                <div>
                    <label className={styles.label}>
                        ชื่อประเภทเจ้าหนี้ (ไทย) <span className="text-red-500">*</span>
                    </label>

                    <input
                        {...register('vendor_type_name')}
                        type="text"
                        placeholder="ชื่อประเภทเจ้าหนี้"
                        className={`${styles.input} ${
                            errors.vendor_type_name
                                ? 'border-red-500 focus:ring-red-200'
                                : ''
                        }`}
                    />

                    {errors.vendor_type_name && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.vendor_type_name.message}
                        </p>
                    )}
                </div>

                {/* Vendor Type Name ENG */}
                <div>
                    <label className={styles.label}>
                        ชื่อประเภทเจ้าหนี้ (English)
                    </label>

                    <input
                        {...register('vendor_type_nameeng')}
                        type="text"
                        placeholder="Vendor Type Name"
                        className={`${styles.input} ${
                            errors.vendor_type_nameeng
                                ? 'border-red-500 focus:ring-red-200'
                                : ''
                        }`}
                    />

                    {errors.vendor_type_nameeng && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.vendor_type_nameeng.message}
                        </p>
                    )}
                </div>

                {/* Status */}
                <div>
                    <label className={styles.label}>
                        สถานะ
                    </label>

                    <div className="flex items-center gap-3 mt-2">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) =>
                                setValue('is_active', e.target.checked)
                            }
                            className="toggle toggle-primary"
                        />

                        <span className="text-sm text-gray-600">
                            {isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </DialogFormLayout>
);
}
