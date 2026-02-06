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
import { styles } from '@/shared/constants/styles';
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
                {/* Department Code */}
                <div>
                    <label className={styles.label}>
                        รหัสฝ่าย <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('departmentCode')}
                        type="text"
                        placeholder="กรอกรหัสฝ่าย (เช่น FIN, HR, IT)"
                        className={`${styles.input} ${errors.departmentCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                        disabled={isEdit}
                    />
                    {errors.departmentCode ? (
                        <p className="text-red-500 text-xs mt-1">{errors.departmentCode.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(25) - รหัสฝ่าย</p>
                    )}
                </div>

                {/* Department Name (Thai) */}
                <div>
                    <label className={styles.label}>
                        ชื่อฝ่าย (ภาษาไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('departmentName')}
                        type="text"
                        placeholder="กรอกชื่อฝ่าย"
                        className={`${styles.input} ${errors.departmentName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.departmentName ? (
                        <p className="text-red-500 text-xs mt-1">{errors.departmentName.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(255) - ชื่อฝ่าย</p>
                    )}
                </div>

                {/* Department Name (English) */}
                <div>
                    <label className={styles.label}>
                        ชื่อฝ่าย (ภาษาอังกฤษ)
                    </label>
                    <input
                        {...register('departmentNameEn')}
                        type="text"
                        placeholder="Enter department name in English"
                        className={`${styles.input} ${errors.departmentNameEn ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    <p className="text-gray-400 text-xs mt-1">varchar(255) - ชื่อฝ่าย (Eng)</p>
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
