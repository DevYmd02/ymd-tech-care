import { useCallback, useEffect } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { z } from 'zod';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { DesignService } from '../services/inventory-master.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import type { Design } from '@/modules/master-data/inventory/types/inventory-master.types';

// Zod schema for form validation
export const designSchema = z.object({
    code: z.string().min(1, 'กรุณากรอกรหัสการออกแบบ').max(20, 'รหัสต้องไม่เกิน 20 ตัวอักษร'),
    nameTh: z.string().min(1, 'กรุณากรอกชื่อการออกแบบ (ไทย)').max(200, 'ชื่อต้องไม่เกิน 200 ตัวอักษร'),
    nameEn: z.string().max(200, 'ชื่อ (EN) ต้องไม่เกิน 200 ตัวอักษร').optional(),
    isActive: z.boolean(),
});

export type DesignFormValues = z.infer<typeof designSchema>;

const initialFormData: DesignFormValues = {
    code: '',
    nameTh: '',
    nameEn: '',
    isActive: true,
};

export function useDesignForm(editId: number | null, initialData?: Design | null, onSuccess?: () => void) {
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        control,
        setError,
        clearErrors,
        formState: { errors }
    } = useForm<DesignFormValues>({
        resolver: zodResolver(designSchema) as Resolver<DesignFormValues>,
        defaultValues: initialFormData
    });

    const codeValue = useWatch({ control, name: 'code' });
    const debouncedCode = useDebounce(codeValue, 500);

    const { data: duplicateCheckData } = useQuery({
        queryKey: ['design-check-duplicate', debouncedCode],
        queryFn: async () => {
            if (!debouncedCode) return { items: [] };
            return DesignService.getAll({ code: debouncedCode });
        },
        enabled: !!debouncedCode && debouncedCode.trim().length >= 1,
    });

    useEffect(() => {
        if (duplicateCheckData?.items && debouncedCode) {
            const matches = duplicateCheckData.items;
            const isDuplicate = matches.some(item => 
                item.code?.toLowerCase() === debouncedCode.trim().toLowerCase() && 
                item.id !== editId
            );

            if (isDuplicate) {
                setError('code', { type: 'manual', message: 'รหัสการออกแบบสินค้าซ้ำในระบบ' });
            } else if (errors.code?.message === 'รหัสการออกแบบสินค้าซ้ำในระบบ') {
                clearErrors('code');
            }
        }
    }, [duplicateCheckData, debouncedCode, editId, setError, clearErrors, errors.code?.message]);

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
        mutationFn: (data: DesignFormValues) => {
            return editId 
                ? DesignService.update(editId, data)
                : DesignService.create(data);
        },
        onSuccess: async (res) => {
            if (res.success) {
                await confirm({ title: 'บันทึกสำเร็จ!', description: 'ข้อมูลการออกแบบถูกบันทึกเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success', hideCancel: true });
                queryClient.invalidateQueries({ queryKey: ['designs'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save design error:', error);
            const errorMsg = error.message.toLowerCase();
            const isDuplicate = errorMsg.includes('duplicate') || errorMsg.includes('ซ้ำ');
            
            if (isDuplicate) {
                setError('code', { message: 'รหัสการออกแบบสินค้าซ้ำในระบบ' });
                return;
            }

            await confirm({ title: 'เกิดข้อผิดพลาด', description: error.message || 'ไม่สามารถบันทึกข้อมูลได้', confirmText: 'ตกลง', variant: 'success', hideCancel: true });
        }
    });

    const handleSave: SubmitHandler<DesignFormValues> = (data) => saveMutation.mutate(data);
    const clearForm = useCallback(() => reset(initialFormData), [reset]);

    return {
        register,
        errors,
        isSaving: saveMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave),
        clearForm
    };
}