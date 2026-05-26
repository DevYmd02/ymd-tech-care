import { useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useForm as useRHF, useWatch, type Path, type PathValue, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/useDebounce';

import { logger } from '@/shared/utils';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { UOMService } from '@/modules/master-data/inventory/services/uom.service';
import { ProductCategoryService } from '@/modules/master-data/inventory/services/product-category.service';
import { UOMConversionService } from '@/modules/master-data/inventory/services/uom-conversion.service';
import { ItemBarcodeService } from '@/modules/master-data/inventory/services/item-barcode.service';
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
        item_uom_id: z.coerce.number().min(1, 'กรุณาเลือกหน่วยนับ'),
        barcode: z.string().min(1, 'กรุณากรอกบาร์โค้ด'),
        is_primary: z.boolean().default(false),
        // is_sales: z.boolean().default(true),
    })).default([]),
    uom_conversions: z.array(z.object({
        conversion_id: z.number().optional(),
        from_uom_id: z.coerce.number().min(1, 'กรุณาเลือกหน่วยต้นทาง'),
        to_uom_id: z.coerce.number().min(1, 'กรุณาเลือกหน่วยปลายทาง'),
        conversion_factor: z.coerce.number().min(0.000001, 'อัตราแปลงต้องมากกว่า 0'),
        is_purchase_unit: z.boolean().default(false),
        is_active: z.boolean().default(true),
        customer_id: z.number().nullable().optional(),
        customer_name: z.string().nullable().optional(),
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
    uom_conversions: [],
};

import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard';

export function useItemForm(editId: number | null, isOpen: boolean, onClose: () => void, onSuccess?: () => void, readOnly: boolean = false) {
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
        enabled: isOpen,
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
        queryKey: ['uoms'],
        queryFn: async () => {
            const res = await UOMService.getAll();
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
        queryFn: async () => {
            const item = await ItemMasterService.getById(editId!);
            if (!item) return null;
            
            // Fetch UOM conversions for this item
            try {
                const uomData = await UOMConversionService.getByItemId(editId!);
                item.uom_conversions = uomData.items.map(c => ({
                    conversion_id: c.conversion_id,
                    item_id: c.item_id,
                    item_code: c.item_code,
                    item_name: c.item_name,
                    from_unit_id: c.from_unit_id,
                    from_unit_name: c.from_unit_name,
                    to_unit_id: c.to_unit_id,
                    to_unit_name: c.to_unit_name,
                    conversion_factor: c.conversion_factor,
                    is_purchase_unit: c.is_purchase_unit,
                    is_active: c.is_active,
                    customer_id: c.customer_id,
                    customer_name: c.customer_name,
                    created_at: c.created_at || '',
                    updated_at: ''
                }));
            } catch (err) {
                logger.error('Failed to fetch UOM conversions', err);
                item.uom_conversions = [];
            }
            
            return item;
        },
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
                base_uom_id: item.base_uom_id || item.uom_id || 0,
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
                barcodes: (item.barcodes || []).map((b) => {
                    const conversion = (item.uom_conversions || []).find(
                        (c) => c.conversion_id === b.item_uom_id
                    );
                    return {
                        barcode_id: b.item_barcode_id,
                        item_uom_id: conversion ? conversion.from_unit_id : (b.item_uom_id || b.uom_id || 0),
                        barcode: b.barcode,
                        is_primary: b.is_primary ?? false,
                    };
                }),
                uom_conversions: (item.uom_conversions || []).map((c) => ({
                    conversion_id: c.conversion_id,
                    from_uom_id: c.from_unit_id || 0,
                    to_uom_id: c.to_unit_id || 0,
                    conversion_factor: c.conversion_factor || 1,
                    is_purchase_unit: c.is_purchase_unit ?? false,
                    is_active: c.is_active ?? true,
                    customer_id: c.customer_id ?? null,
                    customer_name: c.customer_name ?? null,
                })),
            });
        }
    }, [existingItem, reset]);

    const saveMutation = useMutation({
        mutationFn: async (data: ItemFormData) => {
            // Prepare payload for main item update (Tab 1 only)
            const payload: ItemMasterFormData = {
                ...data
            };

            // Omit uom_conversions and barcodes to avoid DTO violations and double-saving
            if ('uom_conversions' in payload) {
                delete payload.uom_conversions;
            }
            if ('barcodes' in payload) {
                delete payload.barcodes;
            }

            const itemResponse = editId 
                ? await ItemMasterService.update(editId, payload)
                : await ItemMasterService.create(payload);

            const itemId = editId || (typeof itemResponse === 'number' ? itemResponse : null);
            if (!itemId) {
                throw new Error('บันทึกสินค้าหลักไม่สำเร็จ');
            }

            return !!itemResponse;
        },
        onSuccess: async (success) => {
            if (success) {
                await confirm({
                    title: 'บันทึกสำเร็จ!',
                    description: 'ระบบได้ทำการบันทึกข้อมูลสินค้าเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                
                queryClient.invalidateQueries({ queryKey: ['items'] });
                if (editId) {
                    queryClient.invalidateQueries({ queryKey: ['item-detail', editId] });
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

    const saveUOMConversionsMutation = useMutation({
        mutationFn: async () => {
            if (!editId) return false;
            const data = getValues();
            const itemId = editId;

            // Sync UOM Conversions individually via UOMConversionService
            const finalConversionIds = new Set(
                (data.uom_conversions || [])
                    .map(c => c.conversion_id)
                    .filter(Boolean)
            );

            // Find deleted conversions
            const originalConversions = existingItem?.uom_conversions || [];
            const deletedConversions = originalConversions.filter(
                c => c.conversion_id && !finalConversionIds.has(c.conversion_id)
            );

            // 1. Delete removed ones
            for (const c of deletedConversions) {
                if (c.conversion_id) {
                    const success = await UOMConversionService.delete(c.conversion_id);
                    if (!success) {
                        throw new Error(`ลบหน่วยนับแปลงไม่สำเร็จ (ID: ${c.conversion_id})`);
                    }
                }
            }

            // 2. Create/Update active ones
            for (const c of data.uom_conversions || []) {
                const convPayload = {
                    item_id: itemId,
                    from_uom_id: Number(c.from_uom_id),
                    to_uom_id: Number(c.to_uom_id),
                    factor: Number(c.conversion_factor),
                    is_purchase_uom: Boolean(c.is_purchase_unit),
                    is_active: Boolean(c.is_active),
                    customer_id: c.customer_id ? Number(c.customer_id) : null,
                };

                if (c.conversion_id) {
                    // Update existing
                    await UOMConversionService.update(c.conversion_id, {
                        item_uom_id: c.conversion_id,
                        ...convPayload
                    });
                } else {
                    // Create new
                    await UOMConversionService.create({
                        item_uom_id: 0,
                        ...convPayload
                    });
                }
            }
            return true;
        },
        onSuccess: async (success) => {
            if (success) {
                await confirm({
                    title: 'บันทึกสำเร็จ!',
                    description: 'ระบบได้ทำการบันทึกข้อมูลแปลงหน่วยเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                queryClient.invalidateQueries({ queryKey: ['items'] });
                if (editId) {
                    queryClient.invalidateQueries({ queryKey: ['item-detail', editId] });
                }
                if (onSuccess) onSuccess();
            }
        },
        onError: async (error: Error) => {
            logger.error('Save UOM Conversions error:', error);
            const apiError = extractErrorMessage(error);
            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: apiError || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลแปลงหน่วย',
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const saveBarcodesMutation = useMutation({
        mutationFn: async () => {
            if (!editId) return false;
            const data = getValues();
            const itemId = editId;

            // Sync Barcodes individually via ItemBarcodeService
            const finalBarcodeIds = new Set(
                (data.barcodes || [])
                    .map(b => b.barcode_id)
                    .filter(Boolean)
            );

            // Find deleted barcodes
            const originalBarcodes = existingItem?.barcodes || [];
            const deletedBarcodes = originalBarcodes.filter(
                b => b.item_barcode_id && !finalBarcodeIds.has(b.item_barcode_id)
            );

            // 1. Delete removed ones
            for (const b of deletedBarcodes) {
                if (b.item_barcode_id) {
                    const success = await ItemBarcodeService.delete(b.item_barcode_id);
                    if (!success) {
                        throw new Error(`ลบรายการบาร์โค้ดไม่สำเร็จ (ID: ${b.item_barcode_id})`);
                    }
                }
            }

            // 2. Create/Update active ones
            for (const b of data.barcodes || []) {
                // ค้นหารายการแปลงหน่วย (conversion) ที่มี from_unit_id ตรงกับหน่วยที่เลือกใน UI
                const conversion = (existingItem?.uom_conversions || []).find(
                    (c) => Number(c.from_unit_id) === Number(b.item_uom_id)
                );
                const dbUomId = conversion ? conversion.conversion_id : Number(b.item_uom_id);

                const barcodePayload = {
                    item_id: itemId,
                    item_uom_id: Number(dbUomId),
                    barcode: String(b.barcode),
                    is_primary: Boolean(b.is_primary),
                    is_active: true
                };

                if (b.barcode_id) {
                    // Update existing
                    const success = await ItemBarcodeService.update(b.barcode_id, barcodePayload);
                    if (!success) {
                        throw new Error(`บันทึกรหัสบาร์โค้ด ${b.barcode} ไม่สำเร็จ`);
                    }
                } else {
                    // Create new
                    const success = await ItemBarcodeService.create(barcodePayload);
                    if (!success) {
                        throw new Error(`เพิ่มรหัสบาร์โค้ด ${b.barcode} ไม่สำเร็จ`);
                    }
                }
            }
            return true;
        },
        onSuccess: async (success) => {
            if (success) {
                await confirm({
                    title: 'บันทึกสำเร็จ!',
                    description: 'ระบบได้ทำการบันทึกข้อมูลบาร์โค้ดเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                queryClient.invalidateQueries({ queryKey: ['items'] });
                if (editId) {
                    queryClient.invalidateQueries({ queryKey: ['item-detail', editId] });
                }
                if (onSuccess) onSuccess();
            }
        },
        onError: async (error: Error) => {
            logger.error('Save Barcodes error:', error);
            const apiError = extractErrorMessage(error);
            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: apiError || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลบาร์โค้ด',
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

    const handleSaveUOMConversions = () => {
        saveUOMConversionsMutation.mutate();
    };

    const handleSaveBarcodes = () => {
        saveBarcodesMutation.mutate();
    };

    const clearForm = useCallback(() => {
        reset(initialFormData);
    }, [reset]);

    return {
        formData,
        isSaving: saveMutation.isPending || isLoading,
        isSavingUOMConversions: saveUOMConversionsMutation.isPending,
        isSavingBarcodes: saveBarcodesMutation.isPending,
        errors,
        handleInputChange,
        handleSave,
        handleSaveUOMConversions,
        handleSaveBarcodes,
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
