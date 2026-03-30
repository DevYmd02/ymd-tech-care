/**
 * @file useEmployeeForm.ts
 * @description Hook for managing Employee form logic with React Query and React Hook Form
 */

import { useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrgEmployeeService } from '../services/employee.service';
import { EmployeeSideService } from '../services/employee-side.service';
import { PositionService } from '../services/position.service';
import type { EmployeeFormData } from '../types/employee.types';
import { logger } from '@/shared/utils/logger';

export const employeeSchema = z.object({
    employeeCode: z.string().min(1, 'กรุณากรอกรหัสพนักงาน').max(20, 'รหัสพนักงานต้องไม่เกิน 20 ตัวอักษร'),
    firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
    lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
    email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').or(z.literal('')),
    phone: z.string().max(20).or(z.literal('')),
    positionId: z.number().min(1, 'กรุณาเลือกตำแหน่ง'),
    sideId: z.union([z.string(), z.number()]).refine(val => val !== 0 && val !== '', 'กรุณาเลือกฝ่าย'),
    isActive: z.boolean(),
});

export const initialEmployeeData: EmployeeFormData = {
    employeeCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    positionId: 0,
    sideId: 0,
    isActive: true,
};

export function useEmployeeForm(editId: number | null, isOpen: boolean, onSuccess?: () => void) {
    const queryClient = useQueryClient();
    const isEdit = !!editId;

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        setValue,
        control,
        formState: { errors }
    } = useForm<EmployeeFormData>({
        resolver: zodResolver(employeeSchema) as Resolver<EmployeeFormData>,
        defaultValues: initialEmployeeData,
    });

    // Fetch dependencies
    const { data: sidesData } = useQuery({
        queryKey: ['employee-sides-dropdown'],
        queryFn: () => EmployeeSideService.getList({ page: 1, limit: 1000 }),
        enabled: isOpen,
    });

    const { data: positionsData } = useQuery({
        queryKey: ['positions-dropdown'],
        queryFn: () => PositionService.getList({ page: 1, limit: 1000 }),
        enabled: isOpen,
    });

    const sides = useMemo(() => sidesData?.items || [], [sidesData]);
    const positions = useMemo(() => positionsData?.items || [], [positionsData]);

    // Fetch data for edit
    const { data: initialData, isLoading: isLoadingInitial } = useQuery({
        queryKey: ['employee', editId],
        queryFn: () => (editId ? OrgEmployeeService.get(editId) : null),
        enabled: isOpen && isEdit && !!editId,
    });

    // Hydrate form when data is fetched
    useEffect(() => {
        if (isOpen && isEdit && initialData) {
            reset({
                employeeCode: initialData.employee_code,
                firstName: initialData.first_name || '',
                lastName: initialData.last_name || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                positionId: initialData.position_id || 0,
                sideId: initialData.side_id || initialData.department_id || 0,
                isActive: initialData.is_active ?? true,
            });
        } else if (isOpen && !isEdit) {
            reset(initialEmployeeData);
        }
    }, [isOpen, isEdit, initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: async (data: EmployeeFormData) => {
            if (isEdit && editId) {
                return OrgEmployeeService.update(editId, data);
            }
            return OrgEmployeeService.create(data);
        },
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['employees'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: (error: Error) => {
            logger.error('Error saving employee:', error);
        }
    });

    const handleSave: SubmitHandler<EmployeeFormData> = (data) => {
        saveMutation.mutate(data);
    };

    return {
        register,
        errors,
        sides,
        positions,
        isSubmitting: saveMutation.isPending,
        isLoadingInitial,
        handleSave: rhfHandleSubmit(handleSave),
        setValue,
        reset,
        control
    };
}
