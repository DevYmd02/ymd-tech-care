import { useCallback, useEffect } from 'react';
import { z } from 'zod';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CostCenterService } from '../services/cost-center.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import type { CostCenter } from '@/modules/master-data/types/master-data-types';

export const costCenterSchema = z.object({
    cost_center_code: z.string().min(1, 'กรุณากรอกรหัสศูนย์ต้นทุน'),
    cost_center_name: z.string().min(1, 'กรุณากรอกชื่อศูนย์ต้นทุน'),
    description: z.string(),
    budget_amount: z.number().min(0, 'งบประมาณต้องไม่ต่ำกว่า 0'),
    manager_name: z.string().min(1, 'กรุณากรอกชื่อผู้รับผิดชอบ'),
    is_active: z.boolean(),
});

export type CostCenterFormData = z.infer<typeof costCenterSchema>;

const initialFormData: CostCenterFormData = {
    cost_center_code: '',
    cost_center_name: '',
    description: '',
    budget_amount: 0,
    manager_name: '',
    is_active: true,
};

export function useCostCenterForm(editId: number | null, initialData?: CostCenter | null, onSuccess?: () => void) {
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        control,
        setValue,
        formState: { errors }
    } = useForm<CostCenterFormData>({
        resolver: zodResolver(costCenterSchema) as Resolver<CostCenterFormData>,
        defaultValues: initialFormData
    });

    const formData = useWatch({ 
        control,
        defaultValue: initialFormData
    }) as CostCenterFormData;

    // Hydrate form when data is provided
    useEffect(() => {
        if (initialData) {
            reset({
                cost_center_code: initialData.cost_center_code,
                cost_center_name: initialData.cost_center_name,
                description: initialData.description || '',
                budget_amount: initialData.budget_amount,
                manager_name: initialData.manager_name,
                is_active: initialData.is_active,
            });
        }
    }, [initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: CostCenterFormData) => {
            return editId 
                ? CostCenterService.update(editId, data)
                : CostCenterService.create(data);
        },
        onSuccess: async (res) => {
            if (res.success) {
                await confirm({
                    title: 'บันทึกสำเร็จ!',
                    description: 'ข้อมูลศูนย์ต้นทุนถูกบันทึกเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                
                queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save cost center error:', error);
            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const handleSave: SubmitHandler<CostCenterFormData> = (data) => {
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
