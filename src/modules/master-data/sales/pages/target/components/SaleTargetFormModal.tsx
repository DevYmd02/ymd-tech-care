/**
 * @file SaleTargetFormModal.tsx
 * @description Modal สำหรับจัดการข้อมูลเป้าการขายพนักงาน (Sale Target) 
 * ปรับปรุง: ใช้ตัวเลือกพนักงานเพื่อส่ง UUID และส่งยอดเงินเป็น String
 */

import { useEffect, useCallback, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { logger, handleError } from '@/shared/utils';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';

// Services
import { SaleTargetService } from '../services/sale-target.service';
import { SalePeriodService } from '../services/sale-period.service';
import { OrgEmployeeService } from '@/modules/master-data/company/services/employee.service';

// Types
import type { 
  SalePeriodMaster
} from '../types/sale-period.types';
import type {
  SaleTargetFormData,
  SaleTargetMaster
} from '../types/sale-target.types';
import type { EmployeeMaster } from '@/modules/master-data/company/types/employee.types';

const employeeTargetSchema = z.object({
    emp_id: z.number().min(1, 'กรุณาเลือกพนักงาน'),
    period_id: z.number().min(1, 'กรุณาเลือกงวดเป้าหมาย'),
    period_target: z.number().min(0.01, 'ยอดเป้าหมายต้องมากกว่า 0 บาท'),
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
    const [existingTargets, setExistingTargets] = useState<SaleTargetMaster[]>([]);
    
    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting }
    } = useForm<EmployeeTargetValues>({
        resolver: zodResolver(employeeTargetSchema),
        defaultValues: {
            emp_id: 0,
            period_id: 0,
            period_target: 0,
            list_no: 1,
        }
    });

    const currentPeriodId = useWatch({
        control,
        name: 'period_id',
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
                
                // 🎯 Robust extraction: Handle both array and paginated object formats
                const allEmployees = Array.isArray(empRes) ? empRes : (empRes?.items || (empRes as unknown as { data: EmployeeMaster[] })?.data || []);
                
                // 🎯 Robust filtering: Case-insensitive and trim whitespace
                const salesEmployees = allEmployees.filter(emp => {
                    const type = emp.emp_type?.toString().trim().toUpperCase();
                    return type === 'S';
                });
                
                setEmployees(salesEmployees);

                // Fetch Existing Targets to check duplicates
                const targetRes = await SaleTargetService.getList({ limit: 1000 });
                const allTargets = Array.isArray(targetRes) ? targetRes : (targetRes?.items || (targetRes as unknown as { data: SaleTargetMaster[] })?.data || []);
                setExistingTargets(allTargets);

            } catch (err) {
                logger.error('Failed to fetch dropdown data:', err);
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
                                emp_id: Number(data.emp_id),
                                period_id: Number(data.period_id),
                                // Handle both string from API or number from internal mapping
                                period_target: Number(data.period_target || data.amount || 0),
                                list_no: data.list_no || 1,
                            });
                        }
                    } catch (error) {
                        logger.error('Failed to fetch sale target detail:', error);
                    }
                };
                fetchDetail();
            } else {
                reset({
                    emp_id: 0,
                    period_id: 0,
                    period_target: 0,
                    list_no: 1,
                });
            }
        }
    }, [isOpen, editId, reset]);

    const onSubmit = useCallback(async (values: EmployeeTargetValues) => {
        // ตรวจสอบข้อมูลเป้าการขายพนักงานซ้ำซ้อนในงวดเดียวกัน
        const isDuplicate = existingTargets.some(t => {
            const tId = t.target_id || t.id;
            if (editId && String(tId) === String(editId)) {
                return false; // ข้ามการเช็คตัวมันเองตอนกำลังแก้ไข
            }
            return Number(t.emp_id) === Number(values.emp_id) && Number(t.period_id) === Number(values.period_id);
        });

        if (isDuplicate) {
            toast.error('พนักงานคนนี้ได้รับการตั้งเป้าหมายการขายในงวดนี้ไปแล้ว ไม่สามารถตั้งเป้าหมายซ้ำได้');
            return;
        }

        try {
            const payload: SaleTargetFormData = {
                emp_id: values.emp_id,
                period_id: values.period_id,
                period_target: values.period_target, 
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
            handleError(error, 'บันทึกเป้าหมายการขายพนักงาน');
        }
    }, [editId, onSuccess, onClose, existingTargets]);

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
                                value={field.value || 0}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className={`${styles.input} ${errors.emp_id ? 'border-red-500' : ''}`}
                            >
                                <option value="0">เลือกพนักงาน</option>
                                {employees.map(emp => {
                                    const displayName = emp.employee_name || 
                                                       `${emp.employee_firstname_th || ''} ${emp.employee_lastname_th || ''}`.trim() || 
                                                       emp.employee_code;
                                    const val = Number(emp.employee_id || emp.id);
                                    return (
                                        <option key={val} value={val}>
                                            {`[${emp.employee_code}] ${displayName}`}
                                        </option>
                                    );
                                })}
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
                                value={field.value || 0}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                className={`${styles.input} ${errors.period_id ? 'border-red-500' : ''}`}
                            >
                                <option value="0">เลือกงวดเป้าหมาย</option>
                                {periods
                                    .filter(p => {
                                        const pVal = Number(p.period_id || (p as unknown as { id: number }).id);
                                        return !p.close_status || pVal === currentPeriodId;
                                    })
                                    .map(p => {
                                        const pVal = Number(p.period_id || (p as unknown as { id: number }).id);
                                        return (
                                            <option key={pVal} value={pVal}>
                                                {`งวดวันที่ ${new Date(p.begin_date).toLocaleDateString('th-TH')} - ${new Date(p.end_date).toLocaleDateString('th-TH')}`}
                                            </option>
                                        );
                                    })}
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
