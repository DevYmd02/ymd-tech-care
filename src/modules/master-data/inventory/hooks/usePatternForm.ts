import { useCallback, useEffect } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { z } from 'zod';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { PatternService } from '../services/inventory-master.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import type { Pattern } from '@/modules/master-data/inventory/types/inventory-master.types';

// Zod schema for form validation
export const patternSchema = z.object({
    code: z.string().min(1, 'กรุณากรอกรหัสรูปแบบ').max(20, 'รหัสต้องไม่เกิน 20 ตัวอักษร'),
    nameTh: z.string().min(1, 'กรุณากรอกชื่อรูปแบบ (ไทย)').max(200, 'ชื่อต้องไม่เกิน 200 ตัวอักษร'),
    nameEn: z.string().max(200, 'ชื่อ (EN) ต้องไม่เกิน 200 ตัวอักษร').optional(),
    isActive: z.boolean(),
});

export type PatternFormValues = z.infer<typeof patternSchema>;

const initialFormData: PatternFormValues = {
    code: '',
    nameTh: '',
    nameEn: '',
    isActive: true,
};

export function usePatternForm(editId: number | null, initialData?: Pattern | null, onSuccess?: () => void) {
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
    } = useForm<PatternFormValues>({
        resolver: zodResolver(patternSchema) as Resolver<PatternFormValues>,
        defaultValues: initialFormData
    });

    const codeValue = useWatch({ control, name: 'code' });
    const debouncedCode = useDebounce(codeValue, 500);

    const { data: duplicateCheckData } = useQuery({
        queryKey: ['pattern-check-duplicate', debouncedCode],
        queryFn: async () => {
            if (!debouncedCode) return { items: [] };
            return PatternService.getAll({ code: debouncedCode });
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
                setError('code', { type: 'manual', message: 'รหัสรูปแบบสินค้าซ้ำในระบบ' });
            } else if (errors.code?.message === 'รหัสรูปแบบสินค้าซ้ำในระบบ') {
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
        mutationFn: (data: PatternFormValues) => {
            return editId 
                ? PatternService.update(editId, data)
                : PatternService.create(data);
        },
        onSuccess: async (res) => {
            if (res.success) {
                await confirm({ title: 'บันทึกสำเร็จ!', description: 'ข้อมูลรูปแบบถูกบันทึกเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success', hideCancel: true });
                queryClient.invalidateQueries({ queryKey: ['patterns'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save pattern error:', error);
            const errorMsg = error.message.toLowerCase();
            const isDuplicate = errorMsg.includes('duplicate') || errorMsg.includes('ซ้ำ');
            
            if (isDuplicate) {
                setError('code', { message: 'รหัสรูปแบบสินค้าซ้ำในระบบ' });
                return;
            }

            await confirm({ title: 'เกิดข้อผิดพลาด', description: error.message || 'ไม่สามารถบันทึกข้อมูลได้', confirmText: 'ตกลง', variant: 'success', hideCancel: true });
        }
    });

    const handleSave: SubmitHandler<PatternFormValues> = (data) => saveMutation.mutate(data);
    const clearForm = useCallback(() => reset(initialFormData), [reset]);

    return {
        register,
        errors,
        isSaving: saveMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave),
        clearForm
    };
}