/**
 * @file SalePeriodFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลช่วงเวลาการขาย (Sale Period)
 */

import { useEffect, useCallback } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Target, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout, CustomDateInput } from '@ui';
import { logger } from '@/shared/utils';
import { SalePeriodService } from '../services/sale-period.service';
import { handleError } from '@/shared/utils';
import type { 
  SalePeriodFormData 
} from '../types/sale-period.types';

const targetSchema = z.object({
    begin_date: z.string().min(1, 'กรุณาเลือกวันที่เริ่มต้น'),
    end_date: z.string().min(1, 'กรุณาเลือกวันที่สิ้นสุด'),
    period_target: z.number().min(0, 'กรุณากรอกยอดเป้าหมาย'),
    close_status: z.boolean(),
}).refine((data) => {
    if (!data.begin_date || !data.end_date) return true;
    return new Date(data.end_date) >= new Date(data.begin_date);
}, {
    message: 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น',
    path: ['end_date'],
});

type TargetFormValues = z.infer<typeof targetSchema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | number | null;
    onSuccess?: () => void;
}

export function SalePeriodFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        control,
        setValue,
    } = useForm<TargetFormValues>({
        resolver: zodResolver(targetSchema),
        defaultValues: {
            begin_date: new Date().toISOString().slice(0, 10),
            end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10),
            period_target: 0,
            close_status: false,
        }
    });

    const closeStatus = useWatch({
        control,
        name: 'close_status',
    });

    useEffect(() => {
        if (isOpen) {
            if (editId) {
                const fetchData = async () => {
                    try {
                        const data = await SalePeriodService.get(editId);
                        if (data) {
                            reset({
                                begin_date: data.begin_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                                end_date: data.end_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                                period_target: Number(data.period_target) || 0, // Convert string back to number for form
                                close_status: data.close_status,
                            });
                        }
                    } catch (error) {
                        logger.error('Failed to fetch sale period detail:', error);
                    }
                };
                fetchData();
            } else {
                reset({
                    begin_date: new Date().toISOString().slice(0, 10),
                    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10),
                    period_target: 0,
                    close_status: false,
                });
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = useCallback(async (data: TargetFormValues) => {
        try {
            const payload: SalePeriodFormData = {
                begin_date: new Date(data.begin_date).toISOString(),
                end_date: new Date(data.end_date).toISOString(),
                period_target: String(data.period_target), // Backend expects string
                close_status: data.close_status,
            };

            if (editId) {
                await SalePeriodService.update(editId, payload);
            } else {
                await SalePeriodService.create(payload);
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            handleError(error, 'บันทึกเป้าหมายการขาย');
        }
    }, [editId, onSuccess, onClose]);

    const TitleIcon = <Target size={24} className="text-white" />;

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
            title={editId ? 'แก้ไขเป้าการขาย (Sale Period)' : 'เพิ่มเป้าการขายใหม่ (Sale Period)'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-5">

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={styles.label}>วันที่เริ่มต้น <span className="text-red-500">*</span></label>
                        <Controller
                            name="begin_date"
                            control={control}
                            render={({ field }) => (
                                <CustomDateInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    className={`${styles.input} ${errors.begin_date ? 'border-red-500' : ''}`}
                                />
                            )}
                        />
                        {errors.begin_date && <p className="text-red-500 text-xs mt-1">{errors.begin_date.message}</p>}
                    </div>

                    <div>
                        <label className={styles.label}>วันที่สิ้นสุด <span className="text-red-500">*</span></label>
                        <Controller
                            name="end_date"
                            control={control}
                            render={({ field }) => (
                                <CustomDateInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    className={`${styles.input} ${errors.end_date ? 'border-red-500' : ''}`}
                                />
                            )}
                        />
                        {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
                    </div>
                </div>

                <div>
                    <label className={styles.label}>ยอดเป้าหมาย <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">฿</span>
                        <input
                            {...register('period_target', { valueAsNumber: true })}
                            type="number"
                            placeholder="0.00"
                            className={`${styles.input} pl-8 ${errors.period_target ? 'border-red-500' : ''}`}
                        />
                    </div>
                    {errors.period_target && <p className="text-red-500 text-xs mt-1">{errors.period_target.message}</p>}
                </div>

                <div 
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-red-200 transition-colors group cursor-pointer"
                    onClick={() => setValue('close_status', !closeStatus)}
                >
                    <input
                        type="checkbox"
                        checked={closeStatus}
                        onChange={(e) => setValue('close_status', e.target.checked)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                        ปิดงวด (Close Status)
                    </label>
                </div>
            </div>
        </DialogFormLayout>
    );
}
