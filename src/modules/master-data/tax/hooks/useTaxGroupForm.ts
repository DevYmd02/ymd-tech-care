import { useCallback, useEffect } from 'react';
import { z } from 'zod';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TaxGroupService } from '../services/tax-group.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import type { TaxGroup } from '@/modules/master-data/tax/types/tax-types';

// Zod schema for form validation
export const taxGroupSchema = z.object({
    code: z.string().min(1, 'กรุณากรอกรหัสกลุ่มภาษี').max(20, 'รหัสต้องไม่เกิน 20 ตัวอักษร'),
    taxType: z.string().min(1, 'กรุณากรอกประเภทภาษี').max(200, 'ประเภทภาษีต้องไม่เกิน 200 ตัวอักษร'),
    taxRate: z.string().min(1, 'กรุณากรอกอัตราภาษี').refine((val) => !isNaN(Number(val)), 'กรุณากรอกเป็นตัวเลข'),
    isActive: z.boolean(),
});

export type TaxGroupFormValues = z.infer<typeof taxGroupSchema>;

const initialFormData: TaxGroupFormValues = {
    code: '',
    taxType: '',
    taxRate: '',
    isActive: true,
};

export function useTaxGroupForm(editId: string | number | null, initialData?: TaxGroup | null, onSuccess?: () => void) {
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        formState: { errors }
    } = useForm<TaxGroupFormValues>({
        resolver: zodResolver(taxGroupSchema) as Resolver<TaxGroupFormValues>,
        defaultValues: initialFormData
    });

    useEffect(() => {
        if (initialData) {
            reset({
                code: initialData.tax_group_code || '',
                taxType: initialData.tax_type || '',
                taxRate: String(initialData.tax_rate ?? ''),
                isActive: initialData.is_active ?? true,
            });
        } else {
            reset(initialFormData);
        }
    }, [initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: TaxGroupFormValues) => {
            const payload = {
                tax_group_code: data.code,
                tax_type: data.taxType as any,
                tax_rate: Number(data.taxRate),
                is_active: data.isActive
            };
            return editId 
                ? TaxGroupService.updateTaxGroup(String(editId), payload)
                : TaxGroupService.createTaxGroup(payload);
        },
        onSuccess: async () => {
            // TaxGroupService methods usually return data directly or throw error
            await confirm({ title: 'บันทึกสำเร็จ!', description: 'ข้อมูลกลุ่มภาษีถูกบันทึกเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success', hideCancel: true });
            queryClient.invalidateQueries({ queryKey: ['tax-groups'] });
            if (onSuccess) onSuccess();
        },
        onError: async (error: Error) => {
            logger.error('Save tax group error:', error);
            await confirm({ title: 'เกิดข้อผิดพลาด', description: error.message || 'ไม่สามารถบันทึกข้อมูลได้', confirmText: 'ตกลง', variant: 'danger', hideCancel: true });
        }
    });

    const handleSave: SubmitHandler<TaxGroupFormValues> = (data) => saveMutation.mutate(data);
    const clearForm = useCallback(() => reset(initialFormData), [reset]);

    return {
        register,
        errors,
        isSaving: saveMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave),
        clearForm
    };
}
