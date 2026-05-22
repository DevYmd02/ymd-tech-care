/**
 * @file useEmployeeGroupForm.ts
 * @description Hook for managing EmployeeGroup form logic with React Query and React Hook Form
 */

import { useEffect } from 'react';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmployeeGroupService } from '@company/services/employee-group.service';
import type { EmployeeGroupFormData } from '@company/types/employee-group.types';
import { logger } from '@/shared/utils';
import { extractErrorMessage } from '@/core/api/api';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { type TableFilters } from '@/shared/hooks/useTableFilters';

export const employeeGroupSchema = z.object({
    employeeGroupCode: z.string().min(1, 'กรุณากรอกรหัสกลุ่มพนักงาน').max(20, 'รหัสกลุ่มพนักงานต้องไม่เกิน 20 ตัวอักษร'),
    employeeGroupName: z.string().min(1, 'กรุณากรอกชื่อกลุ่มพนักงาน').max(100, 'ชื่อกลุ่มพนักงานต้องไม่เกิน 100 ตัวอักษร'),
    employeeGroupNameEn: z.string().trim().min(1, 'กรุณากรอกชื่อกลุ่มพนักงาน (ภาษาอังกฤษ)').max(100, 'ชื่อกลุ่มพนักงาน (ภาษาอังกฤษ) ต้องไม่เกิน 100 ตัวอักษร'),
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
        clearErrors,
        control,
        formState: { errors, dirtyFields }
    } = useForm<EmployeeGroupFormData>({
        resolver: zodResolver(employeeGroupSchema) as Resolver<EmployeeGroupFormData>,
        defaultValues: initialEmployeeGroupData,
    });

    const { confirm } = useConfirmation();

    // Real-time Duplicate Check
    const codeValue = useWatch({ control, name: 'employeeGroupCode' });
    const debouncedCode = useDebounce(codeValue, 500);

    const { data: duplicateCheckData } = useQuery({
        queryKey: ['employee-group-check-duplicate', debouncedCode, editId],
        queryFn: async () => {
            if (!debouncedCode) return { items: [] };
            const params = { 
                page: 1, 
                limit: 10, 
                employee_group_code: debouncedCode 
            };
            return EmployeeGroupService.getList(params as unknown as Partial<TableFilters>);
        },
        enabled: isOpen && !!debouncedCode && debouncedCode.trim().length >= 1,
    });

    useEffect(() => {
        if (codeValue !== debouncedCode) return;

        if (duplicateCheckData && debouncedCode) {
            const matches = Array.isArray(duplicateCheckData) 
                ? duplicateCheckData 
                : (duplicateCheckData as { items?: unknown[] }).items || [];

            const isDuplicate = matches.some((item: unknown) => 
                (item as { employee_group_code?: string }).employee_group_code?.toLowerCase() === debouncedCode.trim().toLowerCase() && 
                (item as { employee_group_id?: string | number }).employee_group_id?.toString() !== editId
            );

            if (isDuplicate && dirtyFields.employeeGroupCode) {
                setError('employeeGroupCode', { type: 'manual', message: 'รหัสกลุ่มพนักงานซ้ำในระบบ' });
            } else if (errors.employeeGroupCode?.message === 'รหัสกลุ่มพนักงานซ้ำในระบบ') {
                clearErrors('employeeGroupCode');
            }
        } else if (!debouncedCode && errors.employeeGroupCode?.message === 'รหัสกลุ่มพนักงานซ้ำในระบบ') {
            clearErrors('employeeGroupCode');
        }
    }, [duplicateCheckData, debouncedCode, codeValue, editId, setError, clearErrors, errors.employeeGroupCode?.message, dirtyFields.employeeGroupCode]);

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
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },

        onError: async (error: Error) => {
            logger.error('Error saving employee-group:', error);
            const msg = extractErrorMessage(error);
            
            // 1. Set field-level error for duplicate codes
            if (msg.includes('รหัส') || msg.toLowerCase().includes('duplicate') || msg.includes('ซ้ำ')) {
                setError('employeeGroupCode', { 
                    type: 'manual', 
                    message: msg 
                });
            }

            // 2. Alert the user with themed confirmation
            await confirm({
                title: 'ไม่สามารถบันทึกได้',
                description: msg,
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
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
