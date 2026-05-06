/**
 * @file useJobForm.ts
 * @description Hook for managing Job form logic with React Query and React Hook Form
 */

import { useEffect } from 'react';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { JobService } from '@company/services/org-job.service';
import type { JobFormData } from '@company/types/job.types';
import { logger } from '@/shared/utils';

export const jobSchema = z.object({
    jobCode: z.string().min(1, 'กรุณากรอกรหัส Job').max(20, 'รหัส Job ต้องไม่เกิน 20 ตัวอักษร'),
    jobName: z.string().min(1, 'กรุณากรอกชื่อ Job').max(100, 'ชื่อ Job ต้องไม่เกิน 100 ตัวอักษร'),
    isActive: z.boolean(),
});

export const initialJobData: JobFormData = {
    jobCode: '',
    jobName: '',
    isActive: true,
};

export function useJobForm(editId: number | null, isOpen: boolean, onSuccess?: () => void) {
    const queryClient = useQueryClient();
    const isEdit = !!editId;

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        setValue,
        control,
        formState: { errors }
    } = useForm<JobFormData>({
        resolver: zodResolver(jobSchema) as Resolver<JobFormData>,
        defaultValues: initialJobData,
    });

    // Fetch data for edit
    const { data: initialData, isLoading: isLoadingInitial } = useQuery({
        queryKey: ['job', editId],
        queryFn: () => (editId ? JobService.get(editId) : null),
        enabled: isOpen && isEdit && !!editId,
    });

    // Hydrate form when data is fetched
    useEffect(() => {
        if (isOpen && isEdit && initialData) {
            reset({
                jobCode: initialData.job_code,
                jobName: initialData.job_name,
                isActive: initialData.is_active ?? true,
            });
        } else if (isOpen && !isEdit) {
            reset(initialJobData);
        }
    }, [isOpen, isEdit, initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: async (data: JobFormData) => {
            if (isEdit && editId) {
                return JobService.update(editId, data);
            }
            return JobService.create(data);
        },
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['jobs'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: (error: Error) => {
            logger.error('Error saving job:', error);
        }
    });

    const handleSave: SubmitHandler<JobFormData> = (data) => {
        saveMutation.mutate(data);
    };

    return {
        register,
        errors,
        isSubmitting: saveMutation.isPending,
        isLoadingInitial,
        handleSave: rhfHandleSubmit(handleSave),
        setValue,
        reset,
        control
    };
}
