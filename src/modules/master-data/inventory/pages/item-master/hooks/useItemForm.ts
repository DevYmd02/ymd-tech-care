import { useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useForm as useRHF, useWatch, type Path, type PathValue, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/useDebounce';

import { logger } from '@/shared/utils';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import { ProductCategoryService } from '@/modules/master-data/inventory/services/product-category.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import type { ItemMaster, ItemMasterFormData } from '@/modules/master-data/types/master-data-types';
import { extractErrorMessage } from '@/core/api/api';

export const itemMasterSchema = z.object({
    item_code: z.string().min(1, 'กรุณากรอกรหัสสินค้า'),
    item_name: z.string().min(1, 'กรุณากรอกชื่อสินค้า'),
    item_name_en: z.string().optional().default(''),
    marketing_name: z.string().optional().default(''),
    billing_name: z.string().optional().default(''),

    // UOMs
    base_uom_id: z.coerce.number().min(1, 'กรุณากรอกหน่วยนับหลัก'),
    purchase_uom_id: z.coerce.number().optional(),
    sale_uom_id: z.coerce.number().optional(),

    // Tax
    tax_code_id: z.coerce.number().optional(),
    tax_rate: z.coerce.number().optional().default(0), // Used for UI calculation, not sent

    // Attributes
    item_type_id: z.coerce.number().optional(),
    item_type_code: z.string().optional(),
    item_category_id: z.coerce.number().optional(),
    item_category_code: z.string().optional(),
    item_brand_id: z.coerce.number().optional(),
    item_brand_code: z.string().optional(),
    item_pattern_id: z.coerce.number().optional(),
    item_pattern_code: z.string().optional(),
    item_design_id: z.coerce.number().optional(),
    item_design_code: z.string().optional(),
    item_class_id: z.coerce.number().optional(), // Model
    item_class_code: z.string().optional(),
    item_size_id: z.coerce.number().optional(),
    item_size_code: z.string().optional(),
    item_group_id: z.coerce.number().optional(), // Good Group
    item_group_code: z.string().optional(),
    item_grade_id: z.coerce.number().optional(),
    item_grade_code: z.string().optional(),
    item_color_id: z.coerce.number().optional(),
    item_color_code: z.string().optional(),

    // Stock Policy
    default_issue_policy: z.string().optional().default('FEFO'),
    lot_tracking_level: z.string().optional().default('REQUIRED'),
    serial_tracking_level: z.string().optional().default('NONE'),
    shelf_life_days: z.coerce.number().optional().default(0),

    // Other fields
    barcode_default: z.string().optional().default(''),
    barcodes: z.array(z.object({
        barcode_id: z.number().optional(),
        uom_id: z.coerce.number().min(1, 'กรุณาเลือกหน่วยนับ'),
        barcode: z.string().min(1, 'กรุณากรอกบาร์โค้ด'),
        is_primary: z.boolean().default(false),
        // is_purchase: z.boolean().default(true),
        // is_sales: z.boolean().default(true),
    })).default([]),
    is_active: z.boolean().default(true),
    
    is_batch_control: z.boolean().default(false),
    is_expiry_control: z.boolean().default(false),
    is_serial_control: z.boolean().default(false),

    standard_cost: z.coerce.number().default(0),
    discount_amount: z.string().optional().default(''),
    is_buddy: z.boolean().default(false),
    is_on_hold: z.boolean().default(false),
    costing_method: z.string().optional().default('FIFO'),
});

export type ItemFormData = z.infer<typeof itemMasterSchema>;

export type ItemFormChangeHandler = (field: keyof ItemFormData, value: string | number | boolean) => void;

const initialFormData: ItemFormData = {
    item_code: '',
    item_name: '',
    item_name_en: '',
    marketing_name: '',
    billing_name: '',
    base_uom_id: 0,
    purchase_uom_id: 0,
    sale_uom_id: 0,
    tax_code_id: 0,
    tax_rate: 0,
    item_type_id: 0,
    item_type_code: '',
    item_category_id: 0,
    item_category_code: '',
    item_brand_id: 0,
    item_brand_code: '',
    item_pattern_id: 0,
    item_pattern_code: '',
    item_design_id: 0,
    item_design_code: '',
    item_class_id: 0,
    item_class_code: '',
    item_size_id: 0,
    item_size_code: '',
    item_group_id: 0,
    item_group_code: '',
    item_grade_id: 0,
    item_grade_code: '',
    item_color_id: 0,
    item_color_code: '',
    default_issue_policy: 'FEFO',
    lot_tracking_level: 'REQUIRED',
    serial_tracking_level: 'NONE',
    shelf_life_days: 0,
    barcode_default: '',
    is_active: true,
    
    is_batch_control: false,
    is_expiry_control: false,
    is_serial_control: false,

    standard_cost: 0,
    discount_amount: '',
    is_buddy: false,
    is_on_hold: false,
    costing_method: 'FIFO',
    barcodes: [],
};

import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard';

export function useItemForm(editId: number | null, onClose: () => void, onSuccess?: () => void, readOnly: boolean = false) {
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        control,
        setValue,
        getValues,
        setError,
        clearErrors,
        formState: { errors, isDirty }
    } = useRHF<ItemFormData>({
        resolver: zodResolver(itemMasterSchema) as Resolver<ItemFormData>,
        defaultValues: initialFormData
    });

    // 🛡️ Unsaved Changes Guard
    const { handleCloseAttempt, blocker } = useUnsavedChangesGuard({
        isDirty: isDirty && !readOnly,
        onSafeClose: onClose
    });

    const formData = useWatch({ 
        control,
        defaultValue: initialFormData
    }) as ItemFormData;

    const codeValue = formData.item_code;
    const debouncedCode = useDebounce(codeValue, 500);

    const { data: duplicateCheckData } = useQuery({
        queryKey: ['item-check-duplicate', debouncedCode],
        queryFn: async () => {
            if (!debouncedCode) return { items: [] };
            return ItemMasterService.getAll({ q: debouncedCode, limit: 100 });
        },
        enabled: !!debouncedCode && debouncedCode.trim().length >= 1,
    });

    useEffect(() => {
        if (duplicateCheckData?.items && debouncedCode) {
            const matches = duplicateCheckData.items;
            const isDuplicate = matches.some(item => 
                item.item_code?.toLowerCase() === debouncedCode.trim().toLowerCase() && 
                item.item_id !== editId
            );

            if (isDuplicate) {
                setError('item_code', { type: 'manual', message: 'รหัสสินค้าซ้ำในระบบ' });
            } else if (errors.item_code?.message === 'รหัสสินค้าซ้ำในระบบ') {
                clearErrors('item_code');
            }
        }
    }, [duplicateCheckData, debouncedCode, editId, setError, clearErrors, errors.item_code?.message]);


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
    const { data: existingItem, isLoading } = useQuery<ItemMaster | null>({
        queryKey: ['item-detail', editId],
        queryFn: () => ItemMasterService.getById(editId!),
        enabled: !!editId,
    });

    // Hydrate form
    useEffect(() => {
        if (existingItem) {
            const item = existingItem;
            reset({
                item_code: item.item_code,
                item_name: item.item_name,
                item_name_en: item.item_name_en || '',
                marketing_name: item.marketing_name || '',
                billing_name: item.billing_name || '',
                base_uom_id: item.base_uom_id || item.unit_id || 0,
                purchase_uom_id: item.purchase_uom_id || item.purchasing_unit_id || 0,
                sale_uom_id: item.sale_uom_id || item.sales_unit_id || 0,
                tax_code_id: item.tax_code_id || 0,
                tax_rate: item.tax_rate || 7,
                item_type_id: item.item_type_id || 0,
                item_type_code: item.item_type_code || '',
                item_category_id: item.item_category_id || item.category_id || 0,
                item_category_code: item.item_category_code || '',
                item_brand_id: item.item_brand_id || 0,
                item_brand_code: item.item_brand_code || '',
                item_pattern_id: item.item_pattern_id || 0,
                item_pattern_code: item.item_pattern_code || '',
                item_design_id: item.item_design_id || 0,
                item_design_code: item.item_design_code || '',
                item_class_id: item.item_class_id || 0,
                item_class_code: item.item_class_code || '',
                item_size_id: item.item_size_id || 0,
                item_size_code: item.item_size_code || '',
                item_group_id: item.item_group_id || 0,
                item_group_code: item.item_group_code || '',
                item_grade_id: item.item_grade_id || 0,
                item_grade_code: item.item_grade_code || '',
                item_color_id: item.item_color_id || 0,
                item_color_code: item.item_color_code || '',
                default_issue_policy: item.default_issue_policy || 'FEFO',
                lot_tracking_level: item.lot_tracking_level || 'REQUIRED',
                serial_tracking_level: item.serial_tracking_level || 'NONE',
                shelf_life_days: item.shelf_life_days || 0,
                is_active: item.is_active,
                standard_cost: item.standard_cost || 0,
                barcode_default: item.barcode_default || '',
                discount_amount: item.discount_amount || '',
                is_buddy: item.is_buddy || false,
                is_on_hold: item.is_on_hold || false,
                is_batch_control: item.is_batch_control || false,
                is_expiry_control: item.is_expiry_control || false,
                is_serial_control: item.is_serial_control || false,
                costing_method: item.costing_method || 'FIFO',
                barcodes: (item.barcodes || []).map((b) => ({
                    barcode_id: b.item_barcode_id,
                    uom_id: b.uom_id || 0,
                    barcode: b.barcode,
                    is_primary: b.is_primary ?? false,
                    // is_purchase: b.is_purchase ?? true,
                    // is_sales: b.is_sales ?? true
                })),
            });
        }
    }, [existingItem, reset]);

    // Redundant barcode query removed as barcodes are now nested in item-detail

    const saveMutation = useMutation({
        mutationFn: async (data: ItemFormData) => {
            // Prepare payload with nested barcodes
            const payload: ItemMasterFormData = {
                ...data,
                barcodes: (data.barcodes || []).map((b) => ({
                    item_barcode_id: b.barcode_id,
                    barcode: b.barcode,
                    uom_id: b.uom_id,
                    is_primary: b.is_primary,
                    // is_purchase: b.is_purchase,
                    // is_sales: b.is_sales
                }))
            };

            // If updating, handle "deleted" barcodes by ensuring they are NOT in the barcodes array
            // If the backend handles relation sync, omitting removed barcodes will suffice.
            // If the backend developer told you to send them with a specific property (like is_active), 
            // we should re-verify that property name. For now, removing it to fix the 400 error.
            if (editId && existingItem?.barcodes) {
                // If the backend doesn't allow is_active, we simply DON'T include them in the barcodes array.
                // Most Sync Relations will delete anything that isn't sent.
            }

            const itemResponse = editId 
                ? await ItemMasterService.update(editId, payload)
                : await ItemMasterService.create(payload);

            return !!itemResponse;
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
                if (editId) {
                    queryClient.invalidateQueries({ queryKey: ['item-detail', editId] });
                    queryClient.invalidateQueries({ queryKey: ['item-barcodes', editId] });
                }
                if (onSuccess) onSuccess();
                onClose();
            } else {
                throw new Error('บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save item error:', error);
            const apiError = extractErrorMessage(error);
            const errorMsg = apiError.toLowerCase();
            const isDuplicate = errorMsg.includes('duplicate') || errorMsg.includes('ซ้ำ') || errorMsg.includes('unique constraint');
            
            if (isDuplicate) {
                setError('item_code', { message: 'รหัสสินค้าซ้ำในระบบ' });
                return;
            }

            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: apiError || 'เกิดข้อผิดพลาดในการบันทึก',
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const handleInputChange: ItemFormChangeHandler = useCallback((field, value) => {
        const path = field as Path<ItemFormData>;
        
        if (field === 'tax_rate' || field === 'standard_cost') {
            const numVal = typeof value === 'number' ? value : Number(value);
            setValue(path, numVal as PathValue<ItemFormData, typeof path>, { shouldDirty: true, shouldValidate: true });
        } else if (typeof value === 'boolean') {
            setValue(path, value as PathValue<ItemFormData, typeof path>, { shouldDirty: true, shouldValidate: true });
        } else {
            setValue(path, String(value) as PathValue<ItemFormData, typeof path>, { shouldDirty: true, shouldValidate: true });
        }
    }, [setValue]);

    const handleSave = rhfHandleSubmit((data) => {
        logger.debug('Data being sent to API:', data);
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
        categories,
        control,
        setValue,
        getValues,
        onClose: handleCloseAttempt,
        blocker
    };
}
