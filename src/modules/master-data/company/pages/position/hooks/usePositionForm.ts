/**
 * @file usePositionForm.ts
 * @description Hook for managing Position form logic with React Query and React Hook Form
 */

import { useEffect } from 'react';
import { useForm, type SubmitHandler, type Resolver, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PositionService } from '@company/services/org-position.service';
import type { PositionFormData, PositionPayload } from '@company/types/position.types';
import { logger } from '@/shared/utils';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { type AxiosError } from 'axios';

export const positionSchema = z.object({
    positionCode: z.string().min(1, 'กรุณากรอกรหัสตำแหน่ง').max(20, 'รหัสตำแหน่งต้องไม่เกิน 20 ตัวอักษร'),
    positionName: z.string().min(1, 'กรุณากรอกชื่อตำแหน่ง').max(100, 'ชื่อตำแหน่งต้องไม่เกิน 100 ตัวอักษร'),
    positionNameEn: z.string().trim().min(1, 'กรุณากรอกชื่อตำแหน่ง (ภาษาอังกฤษ)').max(100, 'ชื่อตำแหน่ง (ภาษาอังกฤษ) ต้องไม่เกิน 100 ตัวอักษร'),
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
    const { toast } = useToast();
    const isEdit = !!editId;

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        setValue,
        control,
        setError,
        clearErrors,
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

    // Real-time Duplicate Check
    const codeValue = useWatch({ control, name: 'positionCode' });
    const debouncedCode = useDebounce(codeValue, 500);

    useEffect(() => {
        let active = true;

        const checkDuplicate = async () => {
            const trimmedCode = debouncedCode?.trim();
            if (!trimmedCode || isEdit) {
                if (!isEdit && active) clearErrors('positionCode');
                return;
            }
            
            try {
                // ค้นหาตำแหน่งทั้งหมดที่มีอยู่เพื่อดูรหัสซ้ำ
                const res = await PositionService.getList();
                
                if (!active) return;
                
                const items = Array.isArray(res) ? res : [];
                const isDuplicate = items.some(pos => pos.position_code?.trim().toLowerCase() === trimmedCode.toLowerCase());
                
                if (isDuplicate) {
                    setError('positionCode', { 
                        type: 'manual', 
                        message: 'รหัสตำแหน่งนี้มีอยู่ในระบบแล้ว' 
                    });
                } else {
                    if (trimmedCode.length >= 1 && trimmedCode.length <= 20) {
                        clearErrors('positionCode');
                    }
                }
            } catch (error) {
                if (active) {
                    logger.error('Error checking duplicate position code:', error);
                }
            }
        };

        void checkDuplicate();

        return () => {
            active = false;
        };
    }, [debouncedCode, isEdit, setError, clearErrors]);

    const saveMutation = useMutation({
        mutationFn: async (data: PositionFormData) => {
            const payload: PositionPayload = {
                position_code: data.positionCode,
                position_name: data.positionName,
                position_nameeng: data.positionNameEn,
                is_active: data.isActive
            };

            if (isEdit && editId) {
                return PositionService.update(editId, payload, { skipToast: true });
            }
            return PositionService.create(payload, { skipToast: true });
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
        onError: (error: AxiosError<{ message?: unknown }>) => {
            logger.error('Error saving position:', error);
            if (error.response?.data) {
                const backendMsg = error.response.data.message;
                logger.error('Backend validation errors:', backendMsg);
                
                const errMsgString = Array.isArray(backendMsg) 
                    ? backendMsg.join(', ') 
                    : typeof backendMsg === 'string' 
                        ? backendMsg 
                        : '';
                        
                const lowerMsg = errMsgString.toLowerCase();
                const isDuplicate = lowerMsg.includes('internal server error') || 
                                    lowerMsg.includes('duplicate') || 
                                    lowerMsg.includes('ซ้ำ') || 
                                    lowerMsg.includes('unique');
                                    
                if (isDuplicate) {
                    setError('positionCode', {
                        type: 'backend',
                        message: 'รหัสตำแหน่งนี้มีอยู่ในระบบแล้ว'
                    });
                    toast('รหัสตำแหน่งซ้ำในระบบ', 'error');
                } else {
                    toast(errMsgString || 'บันทึกไม่สำเร็จ', 'error');
                }
            } else {
                toast('บันทึกไม่สำเร็จ', 'error');
            }
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
