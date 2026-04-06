/**
 * @file SaleTargetFormModal.tsx
 * @description Modal สำหรับจัดการข้อมูลเป้าการขายพนักงาน (Sale Target) 
 * ปรับปรุง: ใช้ตัวเลือกพนักงานเพื่อส่ง UUID และส่งยอดเงินเป็น String
 */

import { useEffect, useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Save } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';

// Services
import { SaleTargetService } from '@/modules/master-data/sales/services/target/sale-target.service';
import { SalePeriodService } from '@/modules/master-data/sales/services/target/sale-period.service';
import { OrgEmployeeService } from '@/modules/master-data/company/services/employee.service';

// Types
import type { 
  SalePeriodMaster
} from '@/modules/master-data/sales/types/target/sale-period.types';
import type {
  SaleTargetFormData
} from '@/modules/master-data/sales/types/target/sale-target.types';
import type { EmployeeMaster } from '@/modules/master-data/company/types/employee.types';

const employeeTargetSchema = z.object({
    emp_id: z.string().min(1, 'กรุณาเลือกพนักงาน'),
    period_id: z.string().min(1, 'กรุณาเลือกงวดเป้าหมาย'),
    period_target: z.number().min(0, 'กรุณากรอกยอดเป้าหมาย'),
    list_no: z.number(),
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
    const [employees, setEmployees] = useState<EmployeeMaster[]>([]);
    
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting }
    } = useForm<EmployeeTargetValues>({
        resolver: zodResolver(employeeTargetSchema),
        defaultValues: {
            emp_id: '',
            period_id: '',
            period_target: 0,
            list_no: 1,
        }
    });

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                // Fetch Periods
                const periodRes = await SalePeriodService.getList();
                let periodItems: SalePeriodMaster[] = [];
                if (Array.isArray(periodRes)) {
                    periodItems = periodRes;
                } else if (periodRes && 'items' in periodRes) {
                    periodItems = (periodRes as { items: SalePeriodMaster[] }).items;
                }
                setPeriods(periodItems);

                // Fetch Employees
                const empRes = await OrgEmployeeService.getList({ limit: 100 });
                setEmployees(empRes.items || []);

            } catch (err) {
                console.error('Failed to fetch dropdown data:', err);
            }
        };

        if (isOpen) {
            fetchDropdownData();
            if (editId) {
                const fetchDetail = async () => {
                    try {
                        const data = await SaleTargetService.get(editId);
                        if (data) {
                            reset({
                                emp_id: data.emp_id,
                                period_id: data.period_id,
                                // Handle both string from API or number from internal mapping
                                period_target: Number(data.period_target || data.amount || 0),
                                list_no: data.list_no || 1,
                            });
                        }
                    } catch (error) {
                        console.error('Failed to fetch sale target detail:', error);
                    }
                };
                fetchDetail();
            } else {
                reset({
                    emp_id: '',
                    period_id: '',
                    period_target: 0,
                    list_no: 1,
                });
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = useCallback(async (values: EmployeeTargetValues) => {
        try {
            const payload: SaleTargetFormData = {
                emp_id: values.emp_id,
                period_id: values.period_id,
                period_target: values.period_target.toString(), // Convert to String for API
                list_no: values.list_no
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
                    <label className={styles.label}>พนักงาน <span className="text-red-500">*</span></label>
                    <Controller
                        name="emp_id"
                        control={control}
                        render={({ field }) => (
                            <select
                                {...field}
                                className={`${styles.input} ${errors.emp_id ? 'border-red-500' : ''}`}
                            >
                                <option value="">เลือกพนักงาน</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {`[${emp.employee_code}] ${emp.employee_name}`}
                                    </option>
                                ))}
                            </select>
                        )}
                    />
                    {errors.emp_id && <p className="text-red-500 text-xs mt-1">{errors.emp_id.message}</p>}
                </div>

                {/* Target Period */}
                <div>
                    <label className={styles.label}>งวดเป้าหมาย <span className="text-red-500">*</span></label>
                    <Controller
                        name="period_id"
                        control={control}
                        render={({ field }) => (
                            <select
                                {...field}
                                className={`${styles.input} ${errors.period_id ? 'border-red-500' : ''}`}
                            >
                                <option value="">เลือกงวดเป้าหมาย</option>
                                {periods.map(p => (
                                    <option key={p.period_id} value={p.period_id}>
                                        {`งวดวันที่ ${new Date(p.begin_date).toLocaleDateString('th-TH')} - ${new Date(p.end_date).toLocaleDateString('th-TH')}`}
                                    </option>
                                ))}
                            </select>
                        )}
                    />
                    {errors.period_id && <p className="text-red-500 text-xs mt-1">{errors.period_id.message}</p>}
                </div>

                {/* Amount */}
                <div>
                    <label className={styles.label}>ยอดเป้าหมาย <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        step="0.01"
                        {...register('period_target', { valueAsNumber: true })}
                        className={`${styles.input} ${errors.period_target ? 'border-red-500 focus:ring-red-200' : ''}`}
                        placeholder="0.00"
                    />
                    {errors.period_target && <p className="text-red-500 text-xs mt-1">{errors.period_target.message}</p>}
                </div>
                
                <input type="hidden" {...register('list_no')} />
            </div>
        </DialogFormLayout>
    );
}
