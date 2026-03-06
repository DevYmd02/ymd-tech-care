import { useCallback, useEffect } from 'react';
import { z } from 'zod';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BranchService } from '../services/branch.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import type { BranchListItem } from '@/modules/master-data/types/master-data-types';

export const branchSchema = z.object({
    branch_code: z.string().min(1, 'กรุณากรอกรหัสสาขา').max(20, 'รหัสสาขาต้องไม่เกิน 20 ตัวอักษร'),
    branch_name: z.string().min(1, 'กรุณากรอกชื่อสาขา').max(200, 'ชื่อสาขาต้องไม่เกิน 200 ตัวอักษร'),
    is_active: z.boolean(),
});

export type BranchFormData = z.infer<typeof branchSchema>;

const initialFormData: BranchFormData = {
    branch_code: '',
    branch_name: '',
    is_active: true,
};

export function useBranchForm(editId: string | null, initialData?: BranchListItem | null, onSuccess?: () => void) {
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        control,
        setValue,
        formState: { errors }
    } = useForm<BranchFormData>({
        resolver: zodResolver(branchSchema) as Resolver<BranchFormData>,
        defaultValues: initialFormData
    });

    const formData = useWatch({ 
        control,
        defaultValue: initialFormData
    }) as BranchFormData;

    // Hydrate form when data is provided
    useEffect(() => {
        if (initialData) {
            reset({
                branch_code: initialData.branch_code,
                branch_name: initialData.branch_name,
                is_active: initialData.is_active,
            });
        }
    }, [initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: BranchFormData) => {
            return editId 
                ? BranchService.update({ branch_id: editId, ...data })
                : BranchService.create(data);
        },
        onSuccess: async (res) => {
            if (res.success) {
                await confirm({
                    title: 'บันทึกสำเร็จ!',
                    description: 'ข้อมูลสาขาถูกบันทึกเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                
                queryClient.invalidateQueries({ queryKey: ['branches'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save branch error:', error);
            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const handleSave: SubmitHandler<BranchFormData> = (data) => {
        saveMutation.mutate(data);
    };

    const clearForm = useCallback(() => {
        reset(initialFormData);
    }, [reset]);

    return {
        register,
        formData,
        errors,
        isSaving: saveMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave),
        setValue,
        clearForm
    };
}
