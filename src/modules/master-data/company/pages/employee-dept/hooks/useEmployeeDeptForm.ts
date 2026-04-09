/**
 * @file useEmployeeDeptForm.ts
 * @description Hook for managing EmployeeDept form logic with React Query and React Hook Form
 */

import { useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmployeeDeptService } from '@company/services/org-section.service';
import { EmployeeSideService } from '@company/services/employee-side.service';
import type { EmployeeDeptFormData } from '@company/types/employee-dept.types';
import { logger } from '@/shared/utils/logger';

export const employeeDeptSchema = z.object({
    deptCode: z.string().min(1, 'กรุณากรอกรหัสแผนก').max(25, 'รหัสแผนกต้องไม่เกิน 25 ตัวอักษร'),
    deptName: z.string().min(1, 'กรุณากรอกชื่อแผนก (ภาษาไทย)').max(255, 'ชื่อแผนกต้องไม่เกิน 255 ตัวอักษร'),
    deptNameEn: z.string().max(255, 'ชื่อแผนก (English) ต้องไม่เกิน 255 ตัวอักษร'),
    sideId: z.union([z.string(), z.number()]).refine(val => val !== 0 && val !== '', 'กรุณาเลือกฝ่าย'),
    isActive: z.boolean(),
});

export const initialEmployeeDeptData: EmployeeDeptFormData = {
    deptCode: '',
    deptName: '',
    deptNameEn: '',
    sideId: '',
    isActive: true,
};

export function useEmployeeDeptForm(editId: string | number | null, isOpen: boolean, onSuccess?: () => void) {
    const queryClient = useQueryClient();
    const isEdit = !!editId;

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        setValue,
        control,
        formState: { errors }
    } = useForm<EmployeeDeptFormData>({
        resolver: zodResolver(employeeDeptSchema) as Resolver<EmployeeDeptFormData>,
        defaultValues: initialEmployeeDeptData,
    });

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
        if (isOpen && isEdit && initialData) {
            reset({
                deptCode: initialData.dept_code || initialData.section_code || '',
                deptName: initialData.dept_name || initialData.section_name || '',
                deptNameEn: initialData.dept_nameeng || initialData.section_name_en || '',
                sideId: initialData.side_id || initialData.department_id || '',
                isActive: initialData.is_active ?? true,
            });
        } else if (isOpen && !isEdit) {
            reset(initialEmployeeDeptData);
        }
    }, [isOpen, isEdit, initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: async (data: EmployeeDeptFormData) => {
            if (isEdit && editId) {
                return EmployeeDeptService.update(editId, data);
            }
            return EmployeeDeptService.create(data);
        },
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['employee-depts'] });
                if (onSuccess) onSuccess();
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
