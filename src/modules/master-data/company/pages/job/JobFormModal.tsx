/**
 * @file JobFormModal.tsx
 * @description Modal for creating/editing Job data (Standarized)
 * @module company
 */

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, X, Briefcase } from 'lucide-react';
import { DialogFormLayout } from '@/shared/components/layout/DialogFormLayout';
import { JobService } from '@/modules/master-data/company/services/company.service';



interface JobFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editId?: string | null;
}

const jobSchema = z.object({
    jobCode: z.string().min(1, 'กรุณากรอกรหัส Job').max(20, 'รหัส Job ต้องไม่เกิน 20 ตัวอักษร'),
    jobName: z.string().min(1, 'กรุณากรอกชื่อ Job').max(100, 'ชื่อ Job ต้องไม่เกิน 100 ตัวอักษร'),
    isActive: z.boolean(),
});

type JobFormValues = z.infer<typeof jobSchema>;

export const JobFormModal = ({ isOpen, onClose, onSuccess, editId }: JobFormModalProps) => {
    const isEdit = !!editId;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm<JobFormValues>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            jobCode: '',
            jobName: '',
            isActive: true,
        },
    });

    const isActive = useWatch({ control, name: 'isActive' });

    useEffect(() => {
        if (isOpen) {
            if (isEdit && editId) {
                // Fetch data for edit
                JobService.get(editId).then((data) => {
                    if (data) {
                        setValue('jobCode', data.job_code);
                        setValue('jobName', data.job_name);
                        setValue('isActive', data.is_active);
                    }
                });
            } else {
                // Reset for create
                reset({
                    jobCode: '',
                    jobName: '',
                    isActive: true,
                });
            }
        }
    }, [isOpen, isEdit, editId, reset, setValue]);

    const onSubmit = async (data: JobFormValues) => {
        try {
            let res;
            if (isEdit && editId) {
                res = await JobService.update(editId, data);
            } else {
                res = await JobService.create(data);
            }

            if (res.success) {
                onSuccess();
                onClose();
            } else {
                alert(res.message || 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            console.error('Error saving job:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    // Header Icon
    const TitleIcon = <Briefcase className="w-5 h-5 text-white" />;

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
            title={isEdit ? 'แก้ไขข้อมูล Job' : 'เพิ่มรหัส Job ใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-4">
                        <div>
                            <label className="label">
                                <span className="label-text text-sm font-medium text-gray-700 dark:text-gray-300">รหัส Job <span className="text-error">*</span></span>
                            </label>
                            <input
                                type="text"
                                className={`input input-bordered w-full bg-white dark:bg-gray-900 ${errors.jobCode ? 'input-error' : ''}`}
                                placeholder="กรอกรหัส Job"
                                {...register('jobCode')}
                                disabled={isEdit}
                            />
                            {errors.jobCode && (
                                <span className="text-error text-sm mt-1">{errors.jobCode.message}</span>
                            )}
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อ Job <span className="text-error">*</span></span>
                            </label>
                            <input
                                type="text"
                                className={`input input-bordered w-full bg-white dark:bg-gray-900 ${errors.jobName ? 'input-error' : ''}`}
                                placeholder="กรอกชื่อ Job"
                                {...register('jobName')}
                            />
                            {errors.jobName && (
                                <span className="text-error text-sm mt-1">{errors.jobName.message}</span>
                            )}
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
