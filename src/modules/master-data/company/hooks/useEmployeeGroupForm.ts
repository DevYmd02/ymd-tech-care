/**
 * @file useEmployeeGroupForm.ts
 * @description Hook for managing EmployeeGroup form logic with React Query and React Hook Form
 */

import { useEffect } from 'react';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmployeeGroupService } from '../services/employee-group.service';
import type { EmployeeGroupFormData } from '../types/employee-group.types';
import { logger } from '@/shared/utils/logger';
import { extractErrorMessage } from '@/core/api/api';

export const employeeGroupSchema = z.object({
    employeeGroupCode: z.string().min(1, 'กรุณากรอกรหัสกลุ่มพนักงาน').max(20, 'รหัสกลุ่มพนักงานต้องไม่เกิน 20 ตัวอักษร'),
    employeeGroupName: z.string().min(1, 'กรุณากรอกชื่อกลุ่มพนักงาน').max(100, 'ชื่อกลุ่มพนักงานต้องไม่เกิน 100 ตัวอักษร'),
    employeeGroupNameEn: z.string().max(100, 'ชื่อกลุ่มพนักงาน (English) ต้องไม่เกิน 100 ตัวอักษร'),
    isActive: z.boolean(),
});

export const initialEmployeeGroupData: EmployeeGroupFormData = {
    employeeGroupCode: '',
    employeeGroupName: '',
    employeeGroupNameEn: '',
    isActive: true,
};

export function useEmployeeGroupForm(editId: string | null, isOpen: boolean, onSuccess?: () => void) {
    const queryClient = useQueryClient();
    const isEdit = !!editId;

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        setValue,
        setError,
        control,
        formState: { errors }
    } = useForm<EmployeeGroupFormData>({
        resolver: zodResolver(employeeGroupSchema) as Resolver<EmployeeGroupFormData>,
        defaultValues: initialEmployeeGroupData,
    });

    // Fetch data for edit
    const { data: initialData, isLoading: isLoadingInitial } = useQuery({
        queryKey: ['employee-group', editId],
        queryFn: () => (editId ? EmployeeGroupService.get(editId) : null),
        enabled: isOpen && isEdit && !!editId,
    });

    // Hydrate form when data is fetched
    useEffect(() => {
        if (isOpen && isEdit && initialData) {
            reset({
                employeeGroupCode: initialData.employee_group_code,
                employeeGroupName: initialData.employee_group_name,
                employeeGroupNameEn: initialData.employee_group_nameeng || '',
                isActive: initialData.is_active ?? true,
            });
        } else if (isOpen && !isEdit) {
            reset(initialEmployeeGroupData);
        }
    }, [isOpen, isEdit, initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: async (data: EmployeeGroupFormData) => {
            if (isEdit && editId) {
                return EmployeeGroupService.update(editId, data);
            }
            return EmployeeGroupService.create(data);
        },
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['employee-groups'] });
                if (onSuccess) onSuccess();
            } else {
                // This branch might not be hit if API returns 400, but kept for safety
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },

        onError: (error: Error) => {
            logger.error('Error saving employee-group:', error);
            const msg = extractErrorMessage(error);
            
            // 1. Set field-level error for duplicate codes
            if (msg.includes('รหัส') || msg.toLowerCase().includes('duplicate') || msg.includes('ซ้ำ')) {
                setError('employeeGroupCode', { 
                    type: 'manual', 
                    message: msg 
                });
            }

            // 2. Alert the user immediately so they know what happened
            alert(`ไม่สามารถบันทึกได้: ${msg}`);
        }
    });

    const handleSave: SubmitHandler<EmployeeGroupFormData> = (data) => {
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

