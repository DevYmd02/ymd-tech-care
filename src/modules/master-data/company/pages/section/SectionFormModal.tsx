/**
 * @file SectionFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลส่วนงาน (Section) - UI Refactored to match design standards
 * @module company
 */

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, Layers } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@/shared/components/layout/DialogFormLayout';
import { SectionService, DepartmentService } from '@/modules/master-data/company/services/company.service';
import type { DepartmentListItem } from '@/modules/master-data/types/master-data-types';
import { logger } from '@/shared/utils/logger';

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
            DepartmentService.getList().then(response => setDepartments(response.items));
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (isEdit && editId) {
                SectionService.get(editId).then((data) => {
                    if (data) {
                        reset({
                            sectionCode: data.section_code,
                            sectionName: data.section_name,
                            sectionNameEn: data.section_name_en || '',
                            departmentId: data.department_id || '',
                            isActive: data.is_active ?? true,
                        });
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
    }, [isOpen, isEdit, editId, reset]);

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
            logger.error('Error saving section:', error);
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
            title={isEdit ? 'แก้ไขข้อมูลแผนก' : 'เพิ่มแผนกใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                {/* 1. Section Code (รหัสแผนก) */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        รหัสแผนก <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('sectionCode')}
                        type="text"
                        placeholder="กรอกรหัสแผนก (เช่น FIN-TRS, ACC-GL)"
                        className={`${styles.input} ${errors.sectionCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                        disabled={isEdit}
                    />
                    {errors.sectionCode && (
                        <p className="text-red-500 text-xs mt-1">{errors.sectionCode.message}</p>
                    )}
                </div>

                {/* 2. Section Name Thai (ชื่อแผนก ภาษาไทย) */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        ชื่อแผนก (ภาษาไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('sectionName')}
                        type="text"
                        placeholder="กรอกชื่อแผนก"
                        className={`${styles.input} ${errors.sectionName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.sectionName && (
                        <p className="text-red-500 text-xs mt-1">{errors.sectionName.message}</p>
                    )}
                </div>

                {/* 3. Section Name English (ชื่อแผนก ภาษาอังกฤษ) */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        ชื่อแผนก (ภาษาอังกฤษ)
                    </label>
                    <input
                        {...register('sectionNameEn')}
                        type="text"
                        placeholder="Enter department name in English"
                        className={`${styles.input} ${errors.sectionNameEn ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.sectionNameEn && (
                        <p className="text-red-500 text-xs mt-1">{errors.sectionNameEn.message}</p>
                    )}
                </div>

                {/* 4. Select Side/Department (เลือกฝ่าย) */}
                <div className="space-y-1">
                    <label className={styles.label}>
                        เลือกฝ่าย <span className="text-red-500">*</span>
                    </label>
                    <select 
                        className={`${styles.input} cursor-pointer ${errors.departmentId ? 'border-red-500 focus:ring-red-200' : ''}`}
                        {...register('departmentId')}
                    >
                        <option value="">-- เลือกฝ่าย --</option>
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

                {/* 5. Status */}
                <div className="space-y-1">
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
