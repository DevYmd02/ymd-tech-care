/**
 * @file useEmployeeSideForm.ts
 * @description Hook for managing EmployeeSide form logic with React Query and React Hook Form
 */

import { useEffect } from 'react';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmployeeSideService } from '@company/services/employee-side.service';
import type { EmployeeSideFormData } from '@company/types/employee-side.types';
import { logger } from '@/shared/utils/logger';

export const employeeSideSchema = z.object({
    emp_side_code: z.string().min(1, 'กรุณากรอกรหัสฝ่าย').max(20, 'รหัสฝ่ายต้องไม่เกิน 20 ตัวอักษร'),
    emp_side_name: z.string().min(1, 'กรุณากรอกชื่อฝ่าย (ภาษาไทย)').max(100, 'ชื่อฝ่ายต้องไม่เกิน 100 ตัวอักษร'),
    emp_side_nameeng: z.string().max(100, 'ชื่อฝ่าย (English) ต้องไม่เกิน 100 ตัวอักษร'),
    is_active: z.boolean(),
});

export const initialEmployeeSideData: EmployeeSideFormData = {
    emp_side_code: '',
    emp_side_name: '',
    emp_side_nameeng: '',
    is_active: true,
};

export function useEmployeeSideForm(editId: string | number | null, isOpen: boolean, onSuccess?: () => void) {
    const queryClient = useQueryClient();
    const isEdit = !!editId;

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        setValue,
        setError,
        clearErrors,
        control,
        formState: { errors }
    } = useForm<EmployeeSideFormData>({
        resolver: zodResolver(employeeSideSchema) as Resolver<EmployeeSideFormData>,
        defaultValues: initialEmployeeSideData,
    });

    const watchedCode = useWatch({ control, name: 'emp_side_code' });

    // Real-time duplicate check
    useEffect(() => {
        if (!watchedCode || watchedCode.length < 2) {
            clearErrors('emp_side_code');
            return;
        }

        const timer = setTimeout(async () => {
            try {
                // Search for the code
                const result = await EmployeeSideService.getList({ 
                    search: watchedCode,
                    limit: 1 
                });

                // Find if there's an exact match that isn't the current record
                const isDuplicate = result.items.some(item => 
                    item.emp_side_code === watchedCode && 
                    String(item.emp_side_id) !== String(editId)
                );

                if (isDuplicate) {
                    setError('emp_side_code', {
                        type: 'manual',
                        message: 'รหัสฝ่ายนี้มีอยู่ในระบบแล้ว'
                    });
                } else {
                    // Only clear if the error was a duplicate error
                    if (errors.emp_side_code?.type === 'manual') {
                        clearErrors('emp_side_code');
                    }
                }
            } catch (err) {
                logger.error('Error checking duplicate code:', err);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [watchedCode, editId, setError, clearErrors, errors.emp_side_code?.type]);

    // Fetch data for edit
    const { data: initialData, isLoading: isLoadingInitial } = useQuery({
        queryKey: ['employee-side', editId],
        queryFn: () => (editId ? EmployeeSideService.get(editId) : null),
        enabled: isOpen && isEdit && !!editId,
    });

    // Hydrate form when data is fetched
    useEffect(() => {
        if (!isOpen) return;

        if (isEdit) {
            if (initialData) {
                // Determine active status from various possible field names/formats
                const rawData = initialData as unknown as Record<string, unknown>;
                const isActive = 
                    rawData.is_active === true || 
                    rawData.is_active === 1 || 
                    rawData.is_active === '1' || 
                    rawData.is_active === 'Y' || 
                    rawData.is_active === 'ACTIVE' ||
                    rawData.active === true;

                reset({
                    emp_side_code: initialData.emp_side_code || initialData.side_code || initialData.department_code || '',
                    emp_side_name: initialData.emp_side_name || initialData.side_name || initialData.department_name || '',
                    emp_side_nameeng: initialData.emp_side_nameeng || initialData.side_nameeng || initialData.department_name_en || '',
                    is_active: isActive,
                });
            } else if (isLoadingInitial) {
                // While loading, reset to initial to clear stale data from previous edit
                reset(initialEmployeeSideData);
            }
        } else {
            reset(initialEmployeeSideData);
        }
    }, [isOpen, isEdit, initialData, isLoadingInitial, reset]);

    const saveMutation = useMutation({
        mutationFn: async (data: EmployeeSideFormData) => {
            if (isEdit && editId) {
                return EmployeeSideService.update(editId, data);
            }
            return EmployeeSideService.create(data);
        },
        onSuccess: (res) => {
            if (res.success) {
                // Invalidate both the list and the specific detail record
                queryClient.invalidateQueries({ queryKey: ['employee-sides'] });
                if (editId) {
                    queryClient.invalidateQueries({ queryKey: ['employee-side', editId] });
                }
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
