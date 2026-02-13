/**
 * @file EmployeeGroupFormModal.tsx
 * @description Modal for creating/editing Employee Group data
 * @module company
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, UsersRound } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { EmployeeGroupService } from '@/modules/master-data/company/services/company.service';

interface EmployeeGroupFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: string | null;
}

const employeeGroupSchema = z.object({
    groupCode: z.string().min(1, 'กรุณากรอกรหัสกลุ่มพนักงาน').max(20, 'รหัสกลุ่มพนักงานต้องไม่เกิน 20 ตัวอักษร'),
    groupName: z.string().min(1, 'กรุณากรอกชื่อกลุ่มพนักงาน').max(100, 'ชื่อกลุ่มพนักงานต้องไม่เกิน 100 ตัวอักษร'),
    groupNameEn: z.string().max(100, 'ชื่อกลุ่มพนักงาน (English) ต้องไม่เกิน 100 ตัวอักษร'),
    isActive: z.boolean(),
});

type EmployeeGroupFormValues = z.infer<typeof employeeGroupSchema>;

export const EmployeeGroupFormModal = ({ isOpen, onClose, onSuccess, editId }: EmployeeGroupFormModalProps) => {
    const isEdit = !!editId;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm<EmployeeGroupFormValues>({
        resolver: zodResolver(employeeGroupSchema),
        defaultValues: {
            groupCode: '',
            groupName: '',
            groupNameEn: '',
            isActive: true,
        },
    });

    const isActive = useWatch({ control, name: 'isActive' });

    useEffect(() => {
        if (isOpen) {
            if (isEdit && editId) {
                // Fetch data for edit
                EmployeeGroupService.get(editId).then((data) => {
                    if (data) {
                        setValue('groupCode', data.group_code);
                        setValue('groupName', data.group_name);
                        setValue('groupNameEn', data.group_name_en || '');
                        setValue('isActive', data.is_active);
                    }
                });
            } else {
                // Reset for create
                reset({
                    groupCode: '',
                    groupName: '',
                    groupNameEn: '',
                    isActive: true,
                });
            }
        }
    }, [isOpen, isEdit, editId, reset, setValue]);

    const onSubmit = async (data: EmployeeGroupFormValues) => {
        try {
            let res;
            if (isEdit && editId) {
                res = await EmployeeGroupService.update(editId, data);
            } else {
                res = await EmployeeGroupService.create(data);
            }

            if (res.success) {
                onSuccess();
                onClose();
            } else {
                alert(res.message || 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            console.error('Error saving employee group:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // Header Icon
    const TitleIcon = <UsersRound className="w-5 h-5 text-white" />;

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
            title={isEdit ? 'แก้ไขข้อมูลกลุ่มพนักงาน' : 'เพิ่มกลุ่มพนักงานใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                {/* Group Code */}
                <div>
                    <label className={styles.label}>
                        รหัสกลุ่มพนักงาน <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('groupCode')}
                        type="text"
                        placeholder="กรอกรหัสกลุ่มพนักงาน"
                        className={`${styles.input} ${errors.groupCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                        disabled={isEdit}
                    />
                    {errors.groupCode ? (
                        <p className="text-red-500 text-xs mt-1">{errors.groupCode.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(20) - รหัสกลุ่มพนักงาน</p>
                    )}
                </div>

                {/* Group Name (Thai) */}
                <div>
                    <label className={styles.label}>
                        ชื่อกลุ่มพนักงาน (ภาษาไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('groupName')}
                        type="text"
                        placeholder="กรอกชื่อกลุ่มพนักงาน"
                        className={`${styles.input} ${errors.groupName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.groupName ? (
                        <p className="text-red-500 text-xs mt-1">{errors.groupName.message}</p>
                    ) : (
                        <p className="text-gray-400 text-xs mt-1">varchar(100) - ชื่อกลุ่มพนักงาน</p>
                    )}
                </div>

                {/* Group Name (English) */}
                <div>
                    <label className={styles.label}>
                        ชื่อกลุ่มพนักงาน (ภาษาอังกฤษ)
                    </label>
                    <input
                        {...register('groupNameEn')}
                        type="text"
                        placeholder="Enter employee group name in English"
                        className={`${styles.input} ${errors.groupNameEn ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    <p className="text-gray-400 text-xs mt-1">varchar(100) - ชื่อกลุ่มพนักงาน (Eng)</p>
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


