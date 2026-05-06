/**
 * @file usePositionForm.ts
 * @description Hook for managing Position form logic with React Query and React Hook Form
 */

import { useEffect } from 'react';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PositionService } from '@company/services/org-position.service';
import type { PositionFormData, PositionPayload } from '@company/types/position.types';
import { logger } from '@/shared/utils';

export const positionSchema = z.object({
    positionCode: z.string().min(1, 'กรุณากรอกรหัสตำแหน่ง').max(20, 'รหัสตำแหน่งต้องไม่เกิน 20 ตัวอักษร'),
    positionName: z.string().min(1, 'กรุณากรอกชื่อตำแหน่ง').max(100, 'ชื่อตำแหน่งต้องไม่เกิน 100 ตัวอักษร'),
    positionNameEn: z.string().max(100, 'ชื่อตำแหน่ง (English) ต้องไม่เกิน 100 ตัวอักษร'),
    isActive: z.boolean(),
});

export const initialPositionData: PositionFormData = {
    positionCode: '',
    positionName: '',
    positionNameEn: '',
    isActive: true,
};

export function usePositionForm(editId: number | null, isOpen: boolean, onSuccess?: () => void) {
    const queryClient = useQueryClient();
    const isEdit = !!editId;

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        setValue,
        control,
        formState: { errors }
    } = useForm<PositionFormData>({
        resolver: zodResolver(positionSchema) as Resolver<PositionFormData>,
        defaultValues: initialPositionData,
    });

    // Fetch data for edit
    const { data: initialData, isLoading: isLoadingInitial } = useQuery({
        queryKey: ['position', editId],
        queryFn: () => (editId ? PositionService.get(editId) : null),
        enabled: isOpen && isEdit && !!editId,
    });

    // Hydrate form when data is fetched
    useEffect(() => {
        if (isOpen && isEdit && initialData) {
            reset({
                positionCode: initialData.position_code,
                positionName: initialData.position_name,
                positionNameEn: initialData.position_nameeng || '',
                isActive: initialData.is_active === true || String(initialData.is_active) === '1' || String(initialData.is_active) === 'true',
            });
        } else if (isOpen && !isEdit) {
            reset(initialPositionData);
        }
    }, [isOpen, isEdit, initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: async (data: PositionFormData) => {
            const payload: PositionPayload = {
                position_code: data.positionCode,
                position_name: data.positionName,
                position_nameeng: data.positionNameEn,
                is_active: data.isActive
            };

            if (isEdit && editId) {
                return PositionService.update(editId, payload);
            }
            return PositionService.create(payload);
        },
        onSuccess: (res: unknown) => {
            const result = res as Record<string, unknown>;
            if (result && result.success !== false) {
                queryClient.invalidateQueries({ queryKey: ['positions'] });
                if (editId) {
                    queryClient.invalidateQueries({ queryKey: ['position', editId] });
                }
                if (onSuccess) onSuccess();
            } else {
                throw new Error((result?.message as string) || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: (error: Error) => {
            logger.error('Error saving position:', error);
        }
    });

    const handleSave: SubmitHandler<PositionFormData> = (data) => {
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
