import { useCallback, useEffect } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { z } from 'zod';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ProductCategoryService } from '../services/product-category.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import type { ProductCategoryListItem, ProductCategoryCreateRequest } from '@/modules/master-data/types/master-data-types';

// Zod schema for form validation
export const categorySchema = z.object({
    category_code: z.string().min(1, 'กรุณากรอกรหัสหมวดสินค้า').max(20, 'รหัสต้องไม่เกิน 20 ตัวอักษร'),
    category_name: z.string().min(1, 'กรุณากรอกชื่อหมวดสินค้า').max(200, 'ชื่อต้องไม่เกิน 200 ตัวอักษร'),
    category_name_en: z.string().max(200, 'ชื่อภาษาอังกฤษต้องไม่เกิน 200 ตัวอักษร').optional(),
    is_active: z.boolean(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

const initialFormData: CategoryFormData = {
    category_code: '',
    category_name: '',
    category_name_en: '',
    is_active: true,
};

export function useCategoryForm(editId: number | null, initialData?: ProductCategoryListItem | null, onSuccess?: () => void) {
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
    } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema) as Resolver<CategoryFormData>,
        defaultValues: initialFormData
    });

    const codeValue = useWatch({ control, name: 'category_code' });
    const debouncedCode = useDebounce(codeValue, 500);

    const { data: duplicateCheckData } = useQuery({
        queryKey: ['category-check-duplicate', debouncedCode],
        queryFn: async () => {
            if (!debouncedCode) return { items: [] };
            return ProductCategoryService.getAll({ category_code: debouncedCode } as any);
        },
        enabled: !!debouncedCode && debouncedCode.trim().length >= 1,
    });

    useEffect(() => {
        if (duplicateCheckData?.items && debouncedCode) {
            const matches = duplicateCheckData.items;
            const isDuplicate = matches.some(item => 
                item.category_code?.toLowerCase() === debouncedCode.trim().toLowerCase() && 
                item.id !== editId
            );

            if (isDuplicate) {
                setError('category_code', { type: 'manual', message: 'รหัสหมวดสินค้าซ้ำในระบบ' });
            } else if (errors.category_code?.message === 'รหัสหมวดสินค้าซ้ำในระบบ') {
                clearErrors('category_code');
            }
        }
    }, [duplicateCheckData, debouncedCode, editId, setError, clearErrors, errors.category_code?.message]);

    // Hydrate form when data is provided for editing
    useEffect(() => {
        if (initialData) {
            reset({
                category_code: initialData.category_code || '',
                category_name: initialData.category_name || '',
                category_name_en: String(initialData.category_name_en || ''),
                is_active: initialData.is_active ?? true,
            });
        } else {
            reset(initialFormData);
        }
    }, [initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: CategoryFormData) => {
            return editId
                ? ProductCategoryService.update(editId, data)
                : ProductCategoryService.create(data as ProductCategoryCreateRequest);
        },
        onSuccess: async (res) => {
            if (res.success) {
                await confirm({ title: 'บันทึกสำเร็จ!', description: 'ข้อมูลหมวดสินค้าถูกบันทึกเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success', hideCancel: true });
                queryClient.invalidateQueries({ queryKey: ['product-categories'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save product category error:', error);
            const errorMsg = error.message.toLowerCase();
            const isDuplicate = errorMsg.includes('duplicate') || errorMsg.includes('ซ้ำ');
            
            if (isDuplicate) {
                setError('category_code', { message: 'รหัสหมวดสินค้าซ้ำในระบบ' });
                return;
            }

            await confirm({ title: 'เกิดข้อผิดพลาด', description: error.message || 'ไม่สามารถบันทึกข้อมูลได้', confirmText: 'ตกลง', variant: 'danger', hideCancel: true });
        }
    });

    const handleSave: SubmitHandler<CategoryFormData> = (data) => {
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