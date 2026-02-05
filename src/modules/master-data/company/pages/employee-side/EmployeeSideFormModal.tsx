/**
 * @file EmployeeSideFormModal.tsx
 * @description Modal for creating/editing EmployeeSide data (Formerly Department)
 * @module company
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, Building } from 'lucide-react';
import { DialogFormLayout } from '@/shared/components/layout/DialogFormLayout';
import { DepartmentService } from '@/modules/master-data/company/services/company.service';



interface EmployeeSideFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: string | null;
}

const employeeSideSchema = z.object({
    departmentCode: z.string().min(1, 'กรุณากรอกรหัสฝ่าย').max(20, 'รหัสฝ่ายต้องไม่เกิน 20 ตัวอักษร'),
    departmentName: z.string().min(1, 'กรุณากรอกชื่อฝ่าย').max(100, 'ชื่อฝ่ายต้องไม่เกิน 100 ตัวอักษร'),
    departmentNameEn: z.string().max(100, 'ชื่อฝ่าย (English) ต้องไม่เกิน 100 ตัวอักษร'),
    isActive: z.boolean(),
});

type EmployeeSideFormValues = z.infer<typeof employeeSideSchema>;

export const EmployeeSideFormModal = ({ isOpen, onClose, onSuccess, editId }: EmployeeSideFormModalProps) => {
    const isEdit = !!editId;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm<EmployeeSideFormValues>({
        resolver: zodResolver(employeeSideSchema),
        defaultValues: {
            departmentCode: '',
            departmentName: '',
            departmentNameEn: '',
            isActive: true,
        },
    });

    const isActive = useWatch({ control, name: 'isActive' });

    useEffect(() => {
        if (isOpen) {
            if (isEdit && editId) {
                // Fetch data for edit
                DepartmentService.get(editId).then((data) => {
                    if (data) {
                        setValue('departmentCode', data.department_code);
                        setValue('departmentName', data.department_name);
                        setValue('departmentNameEn', data.department_name_en || '');
                        setValue('isActive', data.is_active);
                    }
                });
            } else {
                // Reset for create
                reset({
                    departmentCode: '',
                    departmentName: '',
                    departmentNameEn: '',
                    isActive: true,
                });
            }
        }
    }, [isOpen, isEdit, editId, reset, setValue]);

    const onSubmit = async (data: EmployeeSideFormValues) => {
        try {
            let res;
            if (isEdit && editId) {
                res = await DepartmentService.update(editId, data);
            } else {
                res = await DepartmentService.create(data);
            }

            if (res.success) {
                onSuccess();
                onClose();
            } else {
                alert(res.message || 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            console.error('Error saving employee-side:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // Header Icon
    const TitleIcon = <Building className="w-5 h-5 text-white" />;

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
            title={isEdit ? 'แก้ไขข้อมูลฝ่าย' : 'เพิ่มรหัสฝ่ายใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-4">
                        <div>
                            <label className="label">
                                <span className="label-text text-sm font-medium text-gray-700 dark:text-gray-300">รหัสฝ่าย <span className="text-error">*</span></span>
                            </label>
                            <input
                                type="text"
                                className={`input input-bordered w-full bg-white dark:bg-gray-900 ${errors.departmentCode ? 'input-error' : ''}`}
                                placeholder="กรอกรหัสฝ่าย (เช่น FIN, HR, IT)"
                                {...register('departmentCode')}
                                disabled={isEdit}
                            />
                            <div className="text-[10px] text-gray-400 mt-1">varchar(25) - รหัสฝ่าย</div>
                            {errors.departmentCode && (
                                <span className="text-error text-sm mt-1">{errors.departmentCode.message}</span>
                            )}
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อฝ่าย (ภาษาไทย) <span className="text-error">*</span></span>
                            </label>
                            <input
                                type="text"
                                className={`input input-bordered w-full bg-white dark:bg-gray-900 ${errors.departmentName ? 'input-error' : ''}`}
                                placeholder="กรอกชื่อฝ่าย"
                                {...register('departmentName')}
                            />
                            <div className="text-[10px] text-gray-400 mt-1">varchar(255) - ชื่อฝ่าย</div>
                            {errors.departmentName && (
                                <span className="text-error text-sm mt-1">{errors.departmentName.message}</span>
                            )}
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อฝ่าย (ภาษาอังกฤษ)</span>
                            </label>
                            <input
                                type="text"
                                className={`input input-bordered w-full bg-white dark:bg-gray-900 ${errors.departmentNameEn ? 'input-error' : ''}`}
                                placeholder="Enter department name in English"
                                {...register('departmentNameEn')}
                            />
                            <div className="text-[10px] text-gray-400 mt-1">varchar(255) - ชื่อฝ่าย (Eng)</div>
                        </div>

                        <div className="form-control">
                            <label className="label cursor-pointer justify-start gap-4">
                                <span className="label-text text-sm font-medium text-gray-700 dark:text-gray-300">สถานะการใช้งาน</span>
                                <input
                                    type="checkbox"
                                    className="toggle toggle-success"
                                    {...register('isActive')}
                                />
                                <span className="label-text text-gray-700 dark:text-gray-300">{isActive ? 'ใช้งาน (Active)' : 'ไม่ใช้งาน (Inactive)'}</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </DialogFormLayout>
    );
};
