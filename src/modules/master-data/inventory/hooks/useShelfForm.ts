import { useCallback, useEffect } from 'react';
import { z } from 'zod';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShelfService } from '../services/inventory-master.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import type { Shelf } from '@/modules/master-data/inventory/types/inventory-master.types';

// Zod schema for form validation
export const shelfSchema = z.object({
    code: z.string().min(1, 'กรุณากรอกรหัสชั้นวาง').max(20, 'รหัสต้องไม่เกิน 20 ตัวอักษร'),
    nameTh: z.string().min(1, 'กรุณากรอกชื่อชั้นวาง (ไทย)').max(200, 'ชื่อต้องไม่เกิน 200 ตัวอักษร'),
    nameEn: z.string().max(200, 'ชื่อ (EN) ต้องไม่เกิน 200 ตัวอักษร').optional(),
    isActive: z.boolean(),
});

export type ShelfFormValues = z.infer<typeof shelfSchema>;

const initialFormData: ShelfFormValues = {
    code: '',
    nameTh: '',
    nameEn: '',
    isActive: true,
};

export function useShelfForm(editId: number | null, initialData?: Shelf | null, onSuccess?: () => void) {
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        formState: { errors }
    } = useForm<ShelfFormValues>({
        resolver: zodResolver(shelfSchema) as Resolver<ShelfFormValues>,
        defaultValues: initialFormData
    });

    useEffect(() => {
        if (initialData) {
            reset({
                code: initialData.code || '',
                nameTh: initialData.name_th || '',
                nameEn: initialData.name_en || '',
                isActive: initialData.is_active ?? true,
            });
        } else {
            reset(initialFormData);
        }
    }, [initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: ShelfFormValues) => {
            return editId 
                ? ShelfService.update(editId, data)
                : ShelfService.create(data);
        },
        onSuccess: async (res) => {
            if (res.success) {
                await confirm({ title: 'บันทึกสำเร็จ!', description: 'ข้อมูลชั้นวางสินค้าถูกบันทึกเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success', hideCancel: true });
                queryClient.invalidateQueries({ queryKey: ['shelves'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save shelf error:', error);
            await confirm({ title: 'เกิดข้อผิดพลาด', description: error.message || 'ไม่สามารถบันทึกข้อมูลได้', confirmText: 'ตกลง', variant: 'danger', hideCancel: true });
        }
    });

    const handleSave: SubmitHandler<ShelfFormValues> = (data) => saveMutation.mutate(data);
    const clearForm = useCallback(() => reset(initialFormData), [reset]);

    return {
        register,
        errors,
        isSaving: saveMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave),
        clearForm
    };
}