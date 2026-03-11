import { useCallback, useEffect } from 'react';
import { z } from 'zod';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ItemTypeService } from '../services/item-type.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import type { ItemTypeListItem } from '@/modules/master-data/types/master-data-types';

// Zod schema for form validation
export const itemTypeSchema = z.object({
    item_type_code: z.string().min(1, 'กรุณากรอกรหัสประเภทสินค้า').max(20, 'รหัสต้องไม่เกิน 20 ตัวอักษร'),
    item_type_name: z.string().min(1, 'กรุณากรอกชื่อประเภทสินค้า').max(200, 'ชื่อต้องไม่เกิน 200 ตัวอักษร'),
    item_type_nameeng: z.string().max(200, 'ชื่อภาษาอังกฤษต้องไม่เกิน 200 ตัวอักษร').optional(),
    is_active: z.boolean(),
});

export type ItemTypeFormData = z.infer<typeof itemTypeSchema>;

const initialFormData: ItemTypeFormData = {
    item_type_code: '',
    item_type_name: '',
    item_type_nameeng: '',
    is_active: true,
};

export function useItemTypeForm(editId: string | null, initialData?: ItemTypeListItem | null, onSuccess?: () => void) {
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        formState: { errors }
    } = useForm<ItemTypeFormData>({
        resolver: zodResolver(itemTypeSchema) as Resolver<ItemTypeFormData>,
        defaultValues: initialFormData
    });

    // Hydrate form when data is provided for editing
    useEffect(() => {
        if (initialData) {
            reset({
                item_type_code: initialData.item_type_code || '',
                item_type_name: initialData.item_type_name || '',
                item_type_nameeng: initialData.item_type_nameeng || '',
                is_active: initialData.is_active ?? true,
            });
        } else {
            reset(initialFormData);
        }
    }, [initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: ItemTypeFormData) => {
            return editId
                ? ItemTypeService.update(editId, data)
                : ItemTypeService.create(data)
        },
        onSuccess: async (res: { success: boolean, message?: string }) => {
            if (res.success) {
                await confirm({ title: 'บันทึกสำเร็จ!', description: 'ข้อมูลประเภทสินค้าถูกบันทึกเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success', hideCancel: true });
                queryClient.invalidateQueries({ queryKey: ['item-types'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save item type error:', error);
            await confirm({ title: 'เกิดข้อผิดพลาด', description: error.message || 'ไม่สามารถบันทึกข้อมูลได้', confirmText: 'ตกลง', variant: 'danger', hideCancel: true });
        }
    });

    const handleSave: SubmitHandler<ItemTypeFormData> = (data) => {
        saveMutation.mutate(data);
    };

    const clearForm = useCallback(() => reset(initialFormData), [reset]);

    return {
        register,
        errors,
        isSaving: saveMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave),
        clearForm
    };
}