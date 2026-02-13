/**
 * @file BranchFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลสาขา (Refactored to Standard)
 * @module company
 */

/**
 * @file BranchFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลสาขา (Refactored to Standard)
 * @module company
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { BranchService } from '@/core/api/branch.service';
import { DialogFormLayout } from '@ui';
import { logger } from '@/shared/utils/logger';

// ====================================================================================
// SCHEMA
// ====================================================================================

const branchSchema = z.object({
    branchCode: z.string()
        .min(1, 'กรุณากรอกรหัสสาขา')
        .max(20, 'รหัสสาขาต้องไม่เกิน 20 ตัวอักษร'),
    branchName: z.string()
        .min(1, 'กรุณากรอกชื่อสาขา')
        .max(200, 'ชื่อสาขาต้องไม่เกิน 200 ตัวอักษร'),
    isActive: z.boolean(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

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

export function BranchFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        control,
        setValue
    } = useForm<BranchFormValues>({
        resolver: zodResolver(branchSchema),
        defaultValues: {
            branchCode: '',
            branchName: '',
            isActive: true
        }
    });

    const isActive = useWatch({ control, name: 'isActive' });

    // Reset/Load Data
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                BranchService.getById(editId).then(existing => {
                    if (existing) {
                        reset({
                            branchCode: existing.branch_code,
                            branchName: existing.branch_name,
                            isActive: existing.is_active
                        });
                    }
                });
            } else {
                reset({
                    branchCode: '',
                    branchName: '',
                    isActive: true
                });
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = async (data: BranchFormValues) => {
        try {
            let res;
            if (editId) {
                res = await BranchService.update({
                    branch_id: editId,
                    branch_code: data.branchCode,
                    branch_name: data.branchName,
                    is_active: data.isActive
                });
            } else {
                res = await BranchService.create({
                    branch_code: data.branchCode,
                    branch_name: data.branchName,
                    is_active: data.isActive
                });
            }

            if (res.success) {
                logger.log('Saved Branch:', data);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(res.message || 'เกิดข้อผิดพลาดในการบันทึก');
            }
        } catch (error) {
            logger.error('Error saving branch:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // ==================== RENDERING ====================
    
    // Header Icon
    const TitleIcon = <Building2 size={24} className="text-white" />;

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
            title={editId ? 'แก้ไขข้อมูลสาขา' : 'เพิ่มสาขาใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                
                {/* Branch Code */}
                <div>
                    <label className={styles.label}>
                        รหัสสาขา <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('branchCode')}
                        type="text"
                        placeholder="กรอกรหัสสาขา (เช่น BKK001)"
                        className={`${styles.input} ${errors.branchCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.branchCode ? (
                        <p className="text-red-500 text-xs mt-1">{errors.branchCode.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(20), UNIQUE - ต้องไม่ซ้ำ</p>
                    )}
                </div>

                {/* Branch Name */}
                <div>
                    <label className={styles.label}>
                        ชื่อสาขา <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('branchName')}
                        type="text"
                        placeholder="กรอกชื่อสาขา"
                        className={`${styles.input} ${errors.branchName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.branchName ? (
                        <p className="text-red-500 text-xs mt-1">{errors.branchName.message}</p>
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


