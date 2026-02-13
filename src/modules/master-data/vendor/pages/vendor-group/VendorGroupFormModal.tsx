/**
 * @file VendorGroupFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลกลุ่มเจ้าหนี้
 * @module vendor
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { logger } from '@/shared/utils/logger';
import { VendorGroupService } from '../../services/vendor-group.service';

// ====================================================================================
// SCHEMA
// ====================================================================================

const vendorGroupSchema = z.object({
    groupCode: z.string()
        .min(1, 'กรุณากรอกรหัสกลุ่มเจ้าหนี้')
        .max(20, 'รหัสกลุ่มเจ้าหนี้ต้องไม่เกิน 20 ตัวอักษร'),
    groupName: z.string()
        .min(1, 'กรุณากรอกชื่อกลุ่มเจ้าหนี้ (ไทย)')
        .max(200, 'ชื่อกลุ่มเจ้าหนี้ต้องไม่เกิน 200 ตัวอักษร'),
    groupNameEn: z.string()
        .max(200, 'ชื่อกลุ่มเจ้าหนี้ (Eng) ต้องไม่เกิน 200 ตัวอักษร'),
    isActive: z.boolean(),
});

type VendorGroupFormValues = z.infer<typeof vendorGroupSchema>;

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

export function VendorGroupFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        control,
        setValue
    } = useForm<VendorGroupFormValues>({
        resolver: zodResolver(vendorGroupSchema),
        defaultValues: {
            groupCode: '',
            groupName: '',
            groupNameEn: '',
            isActive: true
        }
    });

    const isActive = useWatch({ control, name: 'isActive' });

    // Reset/Load Data
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                VendorGroupService.getById(editId).then(existing => {
                    if (existing) {
                        reset({
                            groupCode: existing.vendor_group_code,
                            groupName: existing.vendor_group_name,
                            groupNameEn: existing.vendor_group_name_en || '',
                            isActive: existing.is_active
                        });
                    }
                });
            } else {
                reset({
                    groupCode: '',
                    groupName: '',
                    groupNameEn: '',
                    isActive: true
                });
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = async (data: VendorGroupFormValues) => {
        try {
            let result;
            if (editId) {
                result = await VendorGroupService.update(editId, data);
            } else {
                result = await VendorGroupService.create(data);
            }

            if (result.success) {
                logger.log('Saved Vendor Group:', data);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(result.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            logger.error('Error saving vendor group:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // ==================== RENDERING ====================
    
    // Header Icon
    const TitleIcon = <Users size={24} className="text-white" />;

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
            title={editId ? 'แก้ไขข้อมูลกลุ่มเจ้าหนี้' : 'เพิ่มกลุ่มเจ้าหนี้ใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                
                {/* Group Code */}
                <div>
                    <label className={styles.label}>
                        รหัสกลุ่มเจ้าหนี้ <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('groupCode')}
                        type="text"
                        placeholder="กรอกรหัสกลุ่มเจ้าหนี้ (เช่น FUR, STA)"
                        className={`${styles.input} ${errors.groupCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.groupCode ? (
                        <p className="text-red-500 text-xs mt-1">{errors.groupCode.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(20), UNIQUE - ต้องไม่ซ้ำ</p>
                    )}
                </div>

                {/* Group Name (Thai) */}
                <div>
                    <label className={styles.label}>
                        ชื่อกลุ่มเจ้าหนี้ (ไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('groupName')}
                        type="text"
                        placeholder="กรอกชื่อกลุ่มเจ้าหนี้ (ไทย)"
                        className={`${styles.input} ${errors.groupName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.groupName ? (
                        <p className="text-red-500 text-xs mt-1">{errors.groupName.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(200)</p>
                    )}
                </div>

                {/* Group Name (English) */}
                <div>
                    <label className={styles.label}>
                        ชื่อกลุ่มเจ้าหนี้ (EN)
                    </label>
                    <input
                        {...register('groupNameEn')}
                        type="text"
                        placeholder="กรอกชื่อกลุ่มเจ้าหนี้ (English)"
                        className={`${styles.input} ${errors.groupNameEn ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.groupNameEn ? (
                        <p className="text-red-500 text-xs mt-1">{errors.groupNameEn.message}</p>
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

