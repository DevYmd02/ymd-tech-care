/**
 * @file EmployeeFormModal.tsx
 * @description Modal for creating/editing Employee data (Standarized)
 */

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, User } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@/shared/components/layout/DialogFormLayout';
import { EmployeeService, DepartmentService, PositionService } from '@/modules/master-data/company/services/company.service';
import type { DepartmentListItem, PositionListItem } from '@/modules/master-data/types/master-data-types';



interface EmployeeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: string | null;
}

const employeeSchema = z.object({
    employeeCode: z.string().min(1, 'กรุณากรอกรหัสพนักงาน').max(20, 'รหัสพนักงานต้องไม่เกิน 20 ตัวอักษร'),
    firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
    lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
    email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').or(z.literal('')),
    phone: z.string().max(20).or(z.literal('')),
    positionId: z.string().min(1, 'กรุณาเลือกตำแหน่ง'),
    departmentId: z.string().min(1, 'กรุณาเลือกฝ่าย'),
    isActive: z.boolean(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const EmployeeFormModal = ({ isOpen, onClose, onSuccess, editId }: EmployeeFormModalProps) => {
    const isEdit = !!editId;
    const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
    const [positions, setPositions] = useState<PositionListItem[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            employeeCode: '',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            positionId: '',
            departmentId: '',
            isActive: true,
        },
    });

    const isActive = useWatch({ control, name: 'isActive' });

    useEffect(() => {
        if (isOpen) {
            // Fetch dependencies
            Promise.all([
                DepartmentService.getList(),
                PositionService.getList()
            ]).then(([deptData, posData]) => {
                setDepartments(deptData);
                setPositions(posData);
            });

            if (isEdit && editId) {
                // Fetch data for edit
                EmployeeService.get(editId).then((data) => {
                    if (data) {
                        setValue('employeeCode', data.employee_code);
                        setValue('firstName', data.first_name || '');
                        setValue('lastName', data.last_name || '');
                        setValue('email', data.email || '');
                        setValue('phone', data.phone || '');
                        setValue('positionId', data.position_id || '');
                        setValue('departmentId', data.department_id || '');
                        setValue('isActive', data.is_active);
                    }
                });
            } else {
                // Reset for create
                reset({
                    employeeCode: '',
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    positionId: '',
                    departmentId: '',
                    isActive: true,
                });
            }
        }
    }, [isOpen, isEdit, editId, reset, setValue]);

    const onSubmit = async (data: EmployeeFormValues) => {
        try {
            let res;
            if (isEdit && editId) {
                res = await EmployeeService.update(editId, data);
            } else {
                res = await EmployeeService.create(data);
            }

            if (res.success) {
                onSuccess();
                onClose();
            } else {
                alert(res.message || 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            console.error('Error saving employee:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // Header Icon
    const TitleIcon = <User className="w-5 h-5 text-white" />;

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
            title={isEdit ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มรหัสพนักงานใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                {/* Employee Code */}
                <div>
                    <label className={styles.label}>
                        รหัสพนักงาน <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('employeeCode')}
                        type="text"
                        placeholder="กรอกรหัสพนักงาน"
                        className={`${styles.input} ${errors.employeeCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                        disabled={isEdit}
                    />
                    {errors.employeeCode ? (
                        <p className="text-red-500 text-xs mt-1">{errors.employeeCode.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(20) - รหัสพนักงาน</p>
                    )}
                </div>

                {/* Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                        <label className={styles.label}>
                            ชื่อ <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('firstName')}
                            type="text"
                            placeholder="ชื่อ"
                            className={`${styles.input} ${errors.firstName ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                        {errors.firstName && (
                            <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                        )}
                    </div>

                    {/* Last Name */}
                    <div>
                        <label className={styles.label}>
                            นามสกุล <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('lastName')}
                            type="text"
                            placeholder="นามสกุล"
                            className={`${styles.input} ${errors.lastName ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                        {errors.lastName && (
                            <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                        )}
                    </div>
                </div>

                {/* Contact Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                        <label className={styles.label}>
                            อีเมล
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="example@company.com"
                            className={`${styles.input} ${errors.email ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className={styles.label}>
                            เบอร์โทรศัพท์
                        </label>
                        <input
                            {...register('phone')}
                            type="text"
                            placeholder="08x-xxx-xxxx"
                            className={`${styles.input} ${errors.phone ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                    </div>
                </div>

                {/* Department & Position Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Department Dropdown */}
                    <div>
                        <label className={styles.label}>
                            ฝ่าย <span className="text-red-500">*</span>
                        </label>
                        <select
                            className={`${styles.input} cursor-pointer ${errors.departmentId ? 'border-red-500 focus:ring-red-200' : ''}`}
                            {...register('departmentId')}
                        >
                            <option value="">เลือกฝ่าย</option>
                            {departments.map(dept => (
                                <option key={dept.department_id} value={dept.department_id}>
                                    {dept.department_code} - {dept.department_name}
                                </option>
                            ))}
                        </select>
                        {errors.departmentId && (
                            <p className="text-red-500 text-xs mt-1">{errors.departmentId.message}</p>
                        )}
                    </div>

                    {/* Position Dropdown */}
                    <div>
                        <label className={styles.label}>
                            ตำแหน่ง <span className="text-red-500">*</span>
                        </label>
                        <select
                            className={`${styles.input} cursor-pointer ${errors.positionId ? 'border-red-500 focus:ring-red-200' : ''}`}
                            {...register('positionId')}
                        >
                            <option value="">เลือกตำแหน่ง</option>
                            {positions.map(pos => (
                                <option key={pos.position_id} value={pos.position_id}>
                                    {pos.position_code} - {pos.position_name}
                                </option>
                            ))}
                        </select>
                        {errors.positionId && (
                            <p className="text-red-500 text-xs mt-1">{errors.positionId.message}</p>
                        )}
                    </div>
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
};