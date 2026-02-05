/**
 * @file SectionFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลส่วนงาน (Section)
 */

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, Layers } from 'lucide-react';
import { DialogFormLayout } from '@/components/layout/DialogFormLayout';
import { SectionService, DepartmentService } from '@/services/core/company.service';
import type { DepartmentListItem } from '@project-types/master-data-types';



interface SectionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: string | null;
}

const sectionSchema = z.object({
    sectionCode: z.string().min(1, 'กรุณากรอกรหัสแผนก').max(20, 'รหัสแผนกต้องไม่เกิน 20 ตัวอักษร'),
    sectionName: z.string().min(1, 'กรุณากรอกชื่อแผนก (ภาษาไทย)').max(100, 'ชื่อแผนกต้องไม่เกิน 100 ตัวอักษร'),
    sectionNameEn: z.string().max(100, 'ชื่อแผนก (English) ต้องไม่เกิน 100 ตัวอักษร'),
    departmentId: z.string().min(1, 'กรุณาเลือกฝ่าย'),
    isActive: z.boolean(),
});

type SectionFormValues = z.infer<typeof sectionSchema>;

export const SectionFormModal = ({ isOpen, onClose, onSuccess, editId }: SectionFormModalProps) => {
    const isEdit = !!editId;
    const [departments, setDepartments] = useState<DepartmentListItem[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm<SectionFormValues>({
        resolver: zodResolver(sectionSchema),
        defaultValues: {
            sectionCode: '',
            sectionName: '',
            sectionNameEn: '',
            departmentId: '',
            isActive: true,
        },
    });

    const isActive = useWatch({ control, name: 'isActive' });

    // Fetch Departments for Dropdown
    useEffect(() => {
        if (isOpen) {
            DepartmentService.getList().then(setDepartments);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (isEdit && editId) {
                SectionService.get(editId).then((data) => {
                    if (data) {
                        setValue('sectionCode', data.section_code);
                        setValue('sectionName', data.section_name);
                        setValue('sectionNameEn', data.section_name_en || '');
                        setValue('departmentId', data.department_id || '');
                        setValue('isActive', data.is_active);
                    }
                });
            } else {
                reset({
                    sectionCode: '',
                    sectionName: '',
                    sectionNameEn: '',
                    departmentId: '',
                    isActive: true,
                });
            }
        }
    }, [isOpen, isEdit, editId, reset, setValue]);

    const onSubmit = async (data: SectionFormValues) => {
        try {
            let res;
            if (isEdit && editId) {
                res = await SectionService.update(editId, data);
            } else {
                res = await SectionService.create(data);
            }

            if (res.success) {
                onSuccess();
                onClose();
            } else {
                alert(res.message || 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            console.error('Error saving section:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // Header Icon
    const TitleIcon = <Layers className="w-5 h-5 text-white" />;

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
            title={isEdit ? 'แก้ไขข้อมูลแผนก' : 'เพิ่มรหัสแผนกใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-4">
                        {/* Parent Department Selector */}
                        <div>
                            <label className="label">
                                <span className="label-text text-sm font-medium text-gray-700 dark:text-gray-300">สังกัดฝ่าย <span className="text-error">*</span></span>
                            </label>
                            <select 
                                className={`select select-bordered w-full bg-white dark:bg-gray-900 ${errors.departmentId ? 'select-error' : ''}`}
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
                                <span className="text-error text-sm mt-1">{errors.departmentId.message}</span>
                            )}
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text text-sm font-medium text-gray-700 dark:text-gray-300">รหัสแผนก <span className="text-error">*</span></span>
                            </label>
                            <input
                                type="text"
                                className={`input input-bordered w-full bg-white dark:bg-gray-900 ${errors.sectionCode ? 'input-error' : ''}`}
                                placeholder="กรอกรหัสแผนก"
                                {...register('sectionCode')}
                                disabled={isEdit}
                            />
                            <div className="text-[10px] text-gray-400 mt-1">varchar(25) - รหัสแผนก</div>
                            {errors.sectionCode && (
                                <span className="text-error text-sm mt-1">{errors.sectionCode.message}</span>
                            )}
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อแผนก (ภาษาไทย) <span className="text-error">*</span></span>
                            </label>
                            <input
                                type="text"
                                className={`input input-bordered w-full bg-white dark:bg-gray-900 ${errors.sectionName ? 'input-error' : ''}`}
                                placeholder="กรอกชื่อแผนก"
                                {...register('sectionName')}
                            />
                            <div className="text-[10px] text-gray-400 mt-1">varchar(255) - ชื่อแผนก</div>
                            {errors.sectionName && (
                                <span className="text-error text-sm mt-1">{errors.sectionName.message}</span>
                            )}
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อแผนก (ภาษาอังกฤษ)</span>
                            </label>
                            <input
                                type="text"
                                className={`input input-bordered w-full bg-white dark:bg-gray-900 ${errors.sectionNameEn ? 'input-error' : ''}`}
                                placeholder="Enter section name in English"
                                {...register('sectionNameEn')}
                            />
                            <div className="text-[10px] text-gray-400 mt-1">varchar(255) - ชื่อแผนก (Eng)</div>
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
