import { useCallback, useEffect } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { z } from 'zod';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { UOMService } from '../services/uom.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils';
import type { UOMListItem } from '@/modules/master-data/types/master-data-types';

export const unitSchema = z.object({
    uom_code: z.string().min(1, 'กรุณากรอกรหัสหน่วยนับ').max(20, 'รหัสหน่วยนับต้องไม่เกิน 20 ตัวอักษร'),
    uom_name: z.string().min(1, 'กรุณากรอกชื่อหน่วยนับ').max(200, 'ชื่อหน่วยนับต้องไม่เกิน 200 ตัวอักษร'),
    uom_name_en: z.string().max(200, 'ชื่อภาษาอังกฤษต้องไม่เกิน 200 ตัวอักษร').optional(),
    is_active: z.boolean(),
});

export type UOMFormData = z.infer<typeof unitSchema>;

const initialFormData: UOMFormData = {
    uom_code: '',
    uom_name: '',
    uom_name_en: '',
    is_active: true,
};

export function useUOMForm(editId: number | null, initialData?: UOMListItem | null, onSuccess?: () => void) {
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        control,
        setValue,
        setError,
        clearErrors,
        formState: { errors }
    } = useForm<UOMFormData>({
        resolver: zodResolver(unitSchema) as Resolver<UOMFormData>,
        defaultValues: initialFormData
    });

    const formData = useWatch({ 
        control,
        defaultValue: initialFormData
    }) as UOMFormData;

    const codeValue = formData.uom_code;
    const debouncedCode = useDebounce(codeValue, 500);

    const { data: duplicateCheckData } = useQuery({
        queryKey: ['unit-check-duplicate', debouncedCode],
        queryFn: async () => {
            if (!debouncedCode) return { items: [] };
            return UOMService.getAll({ uom_code: debouncedCode });
        },
        enabled: !!debouncedCode && debouncedCode.trim().length >= 1,
    });

    useEffect(() => {
        if (duplicateCheckData?.items && debouncedCode) {
            const matches = duplicateCheckData.items;
            const isDuplicate = matches.some(item => 
                item.uom_code?.toLowerCase() === debouncedCode.trim().toLowerCase() && 
                item.id !== editId
            );

            if (isDuplicate) {
                setError('uom_code', { type: 'manual', message: 'รหัสหน่วยนับซ้ำในระบบ' });
            } else if (errors.uom_code?.message === 'รหัสหน่วยนับซ้ำในระบบ') {
                clearErrors('uom_code');
            }
        }
    }, [duplicateCheckData, debouncedCode, editId, setError, clearErrors, errors.uom_code?.message]);

    // Hydrate form when data is provided
    useEffect(() => {
        if (initialData) {
            reset({
                uom_code: initialData.uom_code || initialData.uom_code || '',
                uom_name: initialData.uom_name || initialData.uom_name || '',
                uom_name_en: initialData.uom_name_en || initialData.uom_nameeng || '',
                is_active: initialData.is_active ?? true,
            });
        }
    }, [initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: UOMFormData) => {
            return editId 
                ? UOMService.update(editId, { uom_id: editId, ...data })
                : UOMService.create(data);
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
                
                queryClient.invalidateQueries({ queryKey: ['uoms'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save unit error:', error);
            const errorMsg = error.message.toLowerCase();
            const isDuplicate = errorMsg.includes('duplicate') || errorMsg.includes('ซ้ำ');
            
            if (isDuplicate) {
                setError('uom_code', { message: 'รหัสหน่วยนับซ้ำในระบบ' });
                return;
            }

            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const handleSave: SubmitHandler<UOMFormData> = (data) => {
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
