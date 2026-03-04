import { useCallback, useEffect } from 'react';
import { z } from 'zod';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UnitService } from '../services/unit.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import type { UnitListItem } from '@/modules/master-data/types/master-data-types';

export const unitSchema = z.object({
    unit_code: z.string().min(1, 'กรุณากรอกรหัสหน่วยนับ').max(20, 'รหัสหน่วยนับต้องไม่เกิน 20 ตัวอักษร'),
    unit_name: z.string().min(1, 'กรุณากรอกชื่อหน่วยนับ').max(200, 'ชื่อหน่วยนับต้องไม่เกิน 200 ตัวอักษร'),
    unit_name_en: z.string().max(200, 'ชื่อภาษาอังกฤษต้องไม่เกิน 200 ตัวอักษร').optional(),
    is_active: z.boolean(),
});

export type UnitFormData = z.infer<typeof unitSchema>;

const initialFormData: UnitFormData = {
    unit_code: '',
    unit_name: '',
    unit_name_en: '',
    is_active: true,
};

export function useUnitForm(editId: string | null, initialData?: UnitListItem | null, onSuccess?: () => void) {
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        control,
        setValue,
        formState: { errors }
    } = useForm<UnitFormData>({
        resolver: zodResolver(unitSchema) as Resolver<UnitFormData>,
        defaultValues: initialFormData
    });

    const formData = useWatch({ 
        control,
        defaultValue: initialFormData
    }) as UnitFormData;

    // Hydrate form when data is provided
    useEffect(() => {
        if (initialData) {
            reset({
                unit_code: initialData.unit_code || initialData.uom_code || '',
                unit_name: initialData.unit_name || initialData.uom_name || '',
                unit_name_en: initialData.unit_name_en || initialData.uom_nameeng || '',
                is_active: initialData.is_active ?? true,
            });
        }
    }, [initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: UnitFormData) => {
            return editId 
                ? UnitService.update(editId, { unit_id: editId, ...data })
                : UnitService.create(data);
        },
        onSuccess: async (res) => {
            if (res.success) {
                await confirm({
                    title: 'บันทึกสำเร็จ!',
                    description: 'ข้อมูลหน่วยนับถูกบันทึกเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                
                queryClient.invalidateQueries({ queryKey: ['units'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save unit error:', error);
            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const handleSave: SubmitHandler<UnitFormData> = (data) => {
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
