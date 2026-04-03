/**
 * @file SaleTargetFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลเป้าการขายพนักงาน (Sale Target)
 */

import { useEffect, useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Save } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { SaleTargetService } from '@/modules/master-data/sales/services/target/sale-target.service';
import { SalePeriodService } from '@/modules/master-data/sales/services/target/sale-period.service';
import type { 
  SalePeriodMaster
} from '@/modules/master-data/sales/types/target/sale-period.types';
import type {
  SaleTargetFormData
} from '@/modules/master-data/sales/types/target/sale-target.types';

const employeeTargetSchema = z.object({
    employeeId: z.string().min(1, 'กรุณาเลือกพนักงาน'),
    targetId: z.string().min(1, 'กรุณาเลือกงวดเป้าหมาย'),
    amount: z.number().min(0, 'กรุณากรอกยอดเป้าหมาย'),
});

type EmployeeTargetValues = z.infer<typeof employeeTargetSchema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | number | null;
    onSuccess?: () => void;
}

export function SaleTargetFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const [periods, setPeriods] = useState<SalePeriodMaster[]>([]);
    
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting }
    } = useForm<EmployeeTargetValues>({
        resolver: zodResolver(employeeTargetSchema),
        defaultValues: {
            employeeId: '',
            targetId: '',
            amount: 0,
        }
    });

    useEffect(() => {
        const fetchPeriods = async () => {
            try {
                const res = await SalePeriodService.getList();
                setPeriods(res.items || []);
            } catch (err) {
                console.error('Failed to fetch periods:', err);
            }
        };

        if (isOpen) {
            fetchPeriods();
            if (editId) {
                const fetchDetail = async () => {
                    try {
                        const data = await SaleTargetService.get(editId);
                        if (data) {
                            reset({
                                employeeId: data.employee_id,
                                targetId: data.target_id,
                                amount: data.amount,
                            });
                        }
                    } catch (error) {
                        console.error('Failed to fetch sale target detail:', error);
                    }
                };
                fetchDetail();
            } else {
                reset({
                    employeeId: '',
                    targetId: '',
                    amount: 0,
                });
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = useCallback(async (values: EmployeeTargetValues) => {
        try {
            const payload: SaleTargetFormData = {
                employeeId: values.employeeId,
                targetId: values.targetId,
                amount: values.amount
            };

            if (editId) {
                await SaleTargetService.update(editId, payload);
            } else {
                await SaleTargetService.create(payload);
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save sale target:', error);
        }
    }, [editId, onSuccess, onClose]);

    const FormFooter = (
        <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
            >
                ยกเลิก
            </button>
            <button
                onClick={handleSubmit(onSubmit)}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                disabled={isSubmitting}
            >
                <Save size={18} />
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={editId ? 'แก้ไขเป้าการขายพนักงาน' : 'เพิ่มเป้าการขายพนักงาน'}
            titleIcon={<User className="text-indigo-600" size={24} />}
            footer={FormFooter}
        >
            <div className="p-6 space-y-5">
                {/* Employee Selection */}
                <div>
                    <label className={styles.label}>รหัสพนักงาน <span className="text-red-500">*</span></label>
                    <input
                        {...register('employeeId')}
                        className={`${styles.input} ${errors.employeeId ? 'border-red-500' : ''}`}
                        placeholder="กรอกรหัสพนักงาน (UUID)"
                    />
                    {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId.message}</p>}
                </div>

                {/* Target Period */}
                <div>
                    <label className={styles.label}>งวดเป้าหมาย <span className="text-red-500">*</span></label>
                    <Controller
                        name="targetId"
                        control={control}
                        render={({ field }) => (
                            <select
                                {...field}
                                className={`${styles.input} ${errors.targetId ? 'border-red-500' : ''}`}
                            >
                                <option value="">เลือกงวดเป้าหมาย</option>
                                {periods.map(p => (
                                    <option key={p.period_id} value={p.period_id}>({p.begin_date} - {p.end_date})</option>
                                ))}
                            </select>
                        )}
                    />
                    {errors.targetId && <p className="text-red-500 text-xs mt-1">{errors.targetId.message}</p>}
                </div>

                {/* Amount */}
                <div>
                    <label className={styles.label}>ยอดเป้าหมาย <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        step="0.01"
                        {...register('amount', { valueAsNumber: true })}
                        className={`${styles.input} ${errors.amount ? 'border-red-500 focus:ring-red-200' : ''}`}
                        placeholder="0.00"
                    />
                    {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
                </div>
            </div>
        </DialogFormLayout>
    );
}
