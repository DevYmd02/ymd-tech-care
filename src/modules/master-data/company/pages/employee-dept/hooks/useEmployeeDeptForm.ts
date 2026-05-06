/**
 * @file useEmployeeDeptForm.ts
 * @description Hook for managing EmployeeDept form logic with React Query and React Hook Form
 */

import { useEffect, useMemo } from 'react';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmployeeDeptService } from '@company/services/employee-dept.service';
import { EmployeeSideService } from '@company/services/employee-side.service';
import type { EmployeeDeptFormData } from '@company/types/employee-dept.types';
import { logger } from '@/shared/utils';

export const employeeDeptSchema = z.object({
    emp_dept_code: z.string().min(1, 'กรุณากรอกรหัสแผนก').max(25, 'รหัสแผนกต้องไม่เกิน 25 ตัวอักษร'),
    emp_dept_name: z.string().min(1, 'กรุณากรอกชื่อแผนก (ภาษาไทย)').max(255, 'ชื่อแผนกต้องไม่เกิน 255 ตัวอักษร'),
    emp_dept_nameeng: z.string().max(255, 'ชื่อแผนก (English) ต้องไม่เกิน 255 ตัวอักษร'),
    emp_side_id: z.union([z.string(), z.number()]).refine(val => val !== 0 && val !== '', 'กรุณาเลือกฝ่าย'),
    is_active: z.boolean(),
});

export const initialEmployeeDeptData: EmployeeDeptFormData = {
    emp_dept_code: '',
    emp_dept_name: '',
    emp_dept_nameeng: '',
    emp_side_id: '',
    is_active: true,
};

export function useEmployeeDeptForm(editId: string | number | null, isOpen: boolean, onSuccess?: () => void) {
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
    } = useForm<EmployeeDeptFormData>({
        resolver: zodResolver(employeeDeptSchema) as Resolver<EmployeeDeptFormData>,
        defaultValues: initialEmployeeDeptData,
    });

    const watchedCode = useWatch({ control, name: 'emp_dept_code' });

    // Real-time duplicate check
    useEffect(() => {
        if (!watchedCode || watchedCode.length < 1) {
            clearErrors('emp_dept_code');
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const result = await EmployeeDeptService.getList({ 
                    search: watchedCode,
                    limit: 1 
                });

                const isDuplicate = result.items.some(item => 
                    item.emp_dept_code === watchedCode && 
                    String(item.emp_dept_id) !== String(editId)
                );

                if (isDuplicate) {
                    setError('emp_dept_code', {
                        type: 'manual',
                        message: 'รหัสแผนกนี้มีอยู่ในระบบแล้ว'
                    });
                } else {
                    if (errors.emp_dept_code?.type === 'manual') {
                        clearErrors('emp_dept_code');
                    }
                }
            } catch (err) {
                logger.error('Error checking duplicate dept code:', err);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [watchedCode, editId, setError, clearErrors, errors.emp_dept_code?.type]);

    // Fetch Sides for Dropdown
    const { data: sidesData } = useQuery({
        queryKey: ['employee-sides-dropdown'],
        queryFn: () => EmployeeSideService.getList({ page: 1, limit: 1000 }),
        enabled: isOpen,
    });

    const sides = useMemo(() => sidesData?.items || [], [sidesData]);

    // Fetch data for edit
    const { data: initialData, isLoading: isLoadingInitial } = useQuery({
        queryKey: ['employee-dept', editId],
        queryFn: () => (editId ? EmployeeDeptService.get(editId) : null),
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
                    emp_dept_code: initialData.emp_dept_code || initialData.dept_code || initialData.section_code || '',
                    emp_dept_name: initialData.emp_dept_name || initialData.dept_name || initialData.section_name || '',
                    emp_dept_nameeng: initialData.emp_dept_nameeng || initialData.dept_nameeng || initialData.section_name_en || '',
                    emp_side_id: initialData.emp_side_id || initialData.side_id || initialData.department_id || '',
                    is_active: isActive,
                });
            } else if (isLoadingInitial) {
                // While loading, reset to initial to clear stale data from previous edit
                reset(initialEmployeeDeptData);
            }
        } else {
            reset(initialEmployeeDeptData);
        }
    }, [isOpen, isEdit, initialData, isLoadingInitial, reset]);

    const saveMutation = useMutation({
        mutationFn: async (data: EmployeeDeptFormData) => {
            // Ensure emp_side_id is a number
            const payload = {
                ...data,
                emp_side_id: Number(data.emp_side_id)
            };

            if (isEdit && editId) {
                return EmployeeDeptService.update(editId, payload);
            }
            return EmployeeDeptService.create(payload);
        },
        onSuccess: (res) => {
            if (res.success) {
                // Invalidate both the list and the specific detail record
                queryClient.invalidateQueries({ queryKey: ['employee-depts'] });
                if (editId) {
                    queryClient.invalidateQueries({ queryKey: ['employee-dept', editId] });
                }
                
                onSuccess?.();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: (error: Error) => {
            logger.error('Error saving employee-dept:', error);
        }
    });

    const handleSave: SubmitHandler<EmployeeDeptFormData> = (data) => {
        saveMutation.mutate(data);
    };

    return {
        register,
        errors,
        sides,
        isSubmitting: saveMutation.isPending,
        isLoadingInitial,
        handleSave: rhfHandleSubmit(handleSave),
        setValue,
        reset,
        control
    };
}
