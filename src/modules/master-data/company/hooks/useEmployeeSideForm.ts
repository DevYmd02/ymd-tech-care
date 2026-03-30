/**
 * @file useEmployeeSideForm.ts
 * @description Hook for managing EmployeeSide form logic with React Query and React Hook Form
 */

import { useEffect } from 'react';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmployeeSideService } from '../services/employee-side.service';
import type { EmployeeSideFormData } from '../types/employee-side.types';
import { logger } from '@/shared/utils/logger';

export const employeeSideSchema = z.object({
    sideCode: z.string().min(1, 'กรุณากรอกรหัสฝ่าย').max(20, 'รหัสฝ่ายต้องไม่เกิน 20 ตัวอักษร'),
    sideName: z.string().min(1, 'กรุณากรอกชื่อฝ่าย (ภาษาไทย)').max(100, 'ชื่อฝ่ายต้องไม่เกิน 100 ตัวอักษร'),
    sideNameEn: z.string().max(100, 'ชื่อฝ่าย (English) ต้องไม่เกิน 100 ตัวอักษร'),
    isActive: z.boolean(),
});

export const initialEmployeeSideData: EmployeeSideFormData = {
    sideCode: '',
    sideName: '',
    sideNameEn: '',
    isActive: true,
};

export function useEmployeeSideForm(editId: string | number | null, isOpen: boolean, onSuccess?: () => void) {
    const queryClient = useQueryClient();
    const isEdit = !!editId;

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        setValue,
        control,
        formState: { errors }
    } = useForm<EmployeeSideFormData>({
        resolver: zodResolver(employeeSideSchema) as Resolver<EmployeeSideFormData>,
        defaultValues: initialEmployeeSideData,
    });

    // Fetch data for edit
    const { data: initialData, isLoading: isLoadingInitial } = useQuery({
        queryKey: ['employee-side', editId],
        queryFn: () => (editId ? EmployeeSideService.get(editId) : null),
        enabled: isOpen && isEdit && !!editId,
    });

    // Hydrate form when data is fetched
    useEffect(() => {
        if (isOpen && isEdit && initialData) {
            reset({
                sideCode: initialData.side_code || initialData.department_code || '',
                sideName: initialData.side_name || initialData.department_name || '',
                sideNameEn: initialData.side_nameeng || initialData.department_name_en || '',
                isActive: initialData.is_active ?? true,
            });
        } else if (isOpen && !isEdit) {
            reset(initialEmployeeSideData);
        }
    }, [isOpen, isEdit, initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: async (data: EmployeeSideFormData) => {
            if (isEdit && editId) {
                return EmployeeSideService.update(editId, data);
            }
            return EmployeeSideService.create(data);
        },
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['employee-sides'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: (error: Error) => {
            logger.error('Error saving employee-side:', error);
            // Error handling can be managed in the UI or here
        }
    });

    const handleSave: SubmitHandler<EmployeeSideFormData> = (data) => {
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
