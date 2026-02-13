/**
 * @file SalesTargetFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลเป้าการขาย (Sales Target)
 * @module sales
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Target, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { SalesTargetService } from '@/modules/master-data/company/services/company.service';
import type { SalesTargetFormData } from '@/modules/master-data/types/master-data-types';

// ====================================================================================
// SCHEMA
// ====================================================================================

const targetSchema = z.object({
    targetCode: z.string()
        .min(1, 'กรุณากรอกรหัสเป้าการขาย')
        .max(20, 'รหัสเป้าการขายต้องไม่เกิน 20 ตัวอักษร'),
    targetName: z.string()
        .min(1, 'กรุณากรอกชื่อเป้าการขาย')
        .max(200, 'ชื่อเป้าการขายต้องไม่เกิน 200 ตัวอักษร'),
    amount: z.number()
        .min(0, 'จำนวนเงินต้องไม่ติดลบ'),
    year: z.number()
        .min(2000, 'ปีต้องมากกว่า 2000')
        .max(2100, 'ปีต้องน้อยกว่า 2100'),
    period: z.number()
        .min(1, 'งวดต้องอยู่ระหว่าง 1-12')
        .max(12, 'งวดต้องอยู่ระหว่าง 1-12'),
    isActive: z.boolean(),
});

type TargetFormValues = z.infer<typeof targetSchema>;

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

export function SalesTargetFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        control,
        setValue
    } = useForm<TargetFormValues>({
        resolver: zodResolver(targetSchema),
        defaultValues: {
            targetCode: '',
            targetName: '',
            amount: 0,
            year: new Date().getFullYear(),
            period: 1,
            isActive: true
        }
    });

    const isActive = useWatch({ control, name: 'isActive' });

    // Reset/Load Data
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                const fetchData = async () => {
                    const data = await SalesTargetService.get(editId);
                    if (data) {
                        reset({
                            targetCode: data.target_code,
                            targetName: data.target_name,
                            amount: data.amount,
                            year: data.year,
                            period: data.period,
                            isActive: data.is_active
                        });
                    }
                };
                fetchData();
            } else {
                reset({
                    targetCode: '',
                    targetName: '',
                    amount: 0,
                    year: new Date().getFullYear(),
                    period: 1,
                    isActive: true
                });
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = async (data: TargetFormValues) => {
        try {
            if (editId) {
                await SalesTargetService.update(editId, data);
            } else {
                await SalesTargetService.create(data as SalesTargetFormData);
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save sales target:', error);
        }
    };

    // ==================== RENDERING ====================
    
    // Header Icon
    const TitleIcon = <Target size={24} className="text-white" />;

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
            title={editId ? 'แก้ไขเป้าการขาย' : 'เพิ่มเป้าการขายใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                
                {/* Code */}
                <div>
                    <label className={styles.label}>
                        รหัสเป้าการขาย <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('targetCode')}
                        type="text"
                        placeholder="กรอกรหัสเป้าการขาย"
                        className={`${styles.input} ${errors.targetCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.targetCode ? (
                        <p className="text-red-500 text-xs mt-1">{errors.targetCode.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(20), UNIQUE</p>
                    )}
                </div>

                {/* Name/Description */}
                <div>
                    <label className={styles.label}>
                        ชื่อเป้าการขาย/รายละเอียด <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('targetName')}
                        type="text"
                        placeholder="กรอกชื่อเป้าการขาย"
                        className={`${styles.input} ${errors.targetName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.targetName && (
                        <p className="text-red-500 text-xs mt-1">{errors.targetName.message}</p>
                    )}
                </div>

                {/* Amount */}
                <div>
                    <label className={styles.label}>
                        ยอดเป้าหมาย (บาท) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('amount', { valueAsNumber: true })}
                        type="number"
                        placeholder="0.00"
                        className={`${styles.input} ${errors.amount ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.amount && (
                        <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Year */}
                    <div>
                        <label className={styles.label}>
                            ปี (Year) <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('year', { valueAsNumber: true })}
                            type="number"
                            placeholder={new Date().getFullYear().toString()}
                            className={`${styles.input} ${errors.year ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                        {errors.year && (
                            <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>
                        )}
                    </div>

                    {/* Period */}
                    <div>
                        <label className={styles.label}>
                            งวด (Period 1-12) <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('period', { valueAsNumber: true })}
                            type="number"
                            min={1}
                            max={12}
                            placeholder="1"
                            className={`${styles.input} ${errors.period ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                        {errors.period && (
                            <p className="text-red-500 text-xs mt-1">{errors.period.message}</p>
                        )}
                    </div>
                </div>

                {/* Status */}
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

