import { useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useForm as useRHF, useWatch, type Path, type PathValue, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { logger } from '@/shared/utils/logger';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import { ProductCategoryService } from '@/modules/master-data/inventory/services/product-category.service';
import { ITEM_TAX_CODES } from '@/modules/master-data/inventory/constants/itemConstants';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';

export const itemMasterSchema = z.object({
    item_code: z.string().min(1, 'กรุณากรอกรหัสสินค้า'),
    item_name: z.string().min(1, 'กรุณากรอกชื่อสินค้า'),
    item_name_en: z.string().optional().default(''),
    marketing_name: z.string().optional().default(''),
    billing_name: z.string().optional().default(''),
    category_id: z.coerce.number().optional().default(0),
    good_class_id: z.string().optional().default(''),
    good_brand_id: z.string().optional().default(''),
    good_pattern_id: z.string().optional().default(''),
    good_design_id: z.string().optional().default(''),
    good_size_id: z.string().optional().default(''),
    good_model_id: z.string().optional().default(''),
    good_grade_id: z.string().optional().default(''),
    good_color_id: z.string().optional().default(''),
    base_uom_id: z.coerce.number().min(1, 'กรุณากรอกหน่วยนับหลัก'),
    item_type_code: z.string().optional().default('FG'),
    costing_method: z.string().optional().default('FIFO'),
    default_tax_code: z.string().optional().default('VAT7'),
    tax_rate: z.coerce.number().default(7),
    has_barcode: z.boolean().default(false),
    is_active: z.boolean().default(true),
    is_on_hold: z.boolean().default(false),
    nature_id: z.string().optional().default('LOT'),
    product_subtype_id: z.string().optional().default('NORMAL'),
    commission_type: z.string().optional().default('NONE'),
    std_amount: z.coerce.number().default(0),
    discount_amount: z.string().optional().default(''),
    is_buddy: z.boolean().default(false),
});

export type ItemFormData = z.infer<typeof itemMasterSchema>;

export type ItemFormChangeHandler = (field: keyof ItemFormData, value: string | number | boolean) => void;

const initialFormData: ItemFormData = {
    item_code: '',
    item_name: '',
    item_name_en: '',
    marketing_name: '',
    billing_name: '',
    category_id: 0,
    good_class_id: '',
    good_brand_id: '',
    good_pattern_id: '',
    good_design_id: '',
    good_size_id: '',
    good_model_id: '',
    good_grade_id: '',
    good_color_id: '',
    base_uom_id: 0,
    item_type_code: 'FG',
    costing_method: 'FIFO',
    default_tax_code: 'VAT7',
    tax_rate: 7,
    has_barcode: false,
    is_active: true,
    is_on_hold: false,
    nature_id: 'LOT',
    product_subtype_id: 'NORMAL',
    commission_type: 'NONE',
    std_amount: 0,
    discount_amount: '',
    is_buddy: false,
};

export function useItemForm(editId: number | null, onSuccess?: () => void) {
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        control,
        setValue,
        formState: { errors }
    } = useRHF<ItemFormData>({
        resolver: zodResolver(itemMasterSchema) as Resolver<ItemFormData>,
        defaultValues: initialFormData
    });

    const formData = useWatch({ 
        control,
        defaultValue: initialFormData
    }) as ItemFormData;

    // Real Data Fetching
    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn: async () => {
            const res = await UnitService.getAll();
            return res.items || [];
        }
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['product-categories'],
        queryFn: async () => {
            const res = await ProductCategoryService.getAll();
            return res.items || [];
        }
    });

    // Fetch data if editing
    const { data: existingItem, isLoading } = useQuery<ItemListItem | null>({
        queryKey: ['item-detail', editId],
        queryFn: () => ItemMasterService.getById(editId!),
        enabled: !!editId,
    });

    // Hydrate form
    useEffect(() => {
        if (existingItem) {
            reset({
                item_code: existingItem.item_code,
                item_name: existingItem.item_name,
                item_name_en: existingItem.item_name_en || '',
                marketing_name: existingItem.marketing_name || '',
                billing_name: existingItem.billing_name || '',
                category_id: existingItem.category_id || 0, 
                base_uom_id: existingItem.unit_id || 0,
                item_type_code: existingItem.item_type_code || 'FG',
                product_subtype_id: 'NORMAL',
                costing_method: 'FIFO',
                commission_type: 'NONE',
                nature_id: 'LOT',
                is_active: existingItem.is_active,
                std_amount: existingItem.standard_cost || 0,
                good_brand_id: '',
                good_class_id: '',
                good_pattern_id: '',
                good_design_id: '',
                good_grade_id: '',
                good_model_id: '',
                good_size_id: '',
                good_color_id: '',
                default_tax_code: 'VAT7',
                tax_rate: 7,
                has_barcode: false, 
                discount_amount: '',
                is_buddy: false,
                is_on_hold: false
            });
        }
    }, [existingItem, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: ItemFormData) => {
            return editId 
                ? ItemMasterService.update(editId, data)
                : ItemMasterService.create(data);
        },
        onSuccess: async (success) => {
            if (success) {
                await confirm({
                    title: 'บันทึกสำเร็จ!',
                    description: 'ระบบได้ทำการบันทึกข้อมูลเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                
                queryClient.invalidateQueries({ queryKey: ['items'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error('บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save item error:', error);
            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: error.message || 'เกิดข้อผิดพลาดในการบันทึก',
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const handleInputChange: ItemFormChangeHandler = useCallback((field, value) => {
        const path = field as Path<ItemFormData>;
        
        if (field === 'tax_rate' || field === 'std_amount') {
            const numVal = typeof value === 'number' ? value : Number(value);
            setValue(path, numVal as PathValue<ItemFormData, typeof path>, { shouldDirty: true, shouldValidate: true });
        } else if (typeof value === 'boolean') {
            setValue(path, value as PathValue<ItemFormData, typeof path>, { shouldDirty: true, shouldValidate: true });
        } else {
            setValue(path, String(value) as PathValue<ItemFormData, typeof path>, { shouldDirty: true, shouldValidate: true });
        }

        if (field === 'default_tax_code' && typeof value === 'string') {
            const selectedTax = ITEM_TAX_CODES.find(t => t.code === value);
            if (selectedTax) {
                setValue('tax_rate', selectedTax.rate);
            }
        }
    }, [setValue]);

    const handleSave = rhfHandleSubmit((data) => {
        saveMutation.mutate(data);
    });

    const clearForm = useCallback(() => {
        reset(initialFormData);
    }, [reset]);

    return {
        formData,
        isSaving: saveMutation.isPending || isLoading,
        errors,
        handleInputChange,
        handleSave,
        clearForm,
        register,
        units,
        categories
    };
}
