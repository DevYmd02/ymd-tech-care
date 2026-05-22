import { useCallback, useEffect } from 'react';
import { z } from 'zod';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UOMConversionService } from '../services/uom-conversion.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils';
import type { UOMConversionListItem, ItemUOMConversion } from '@/modules/master-data/types/master-data-types';
import { initialUOMConversionFormData } from '@/modules/master-data/types/master-data-types';

export const uomConversionSchema = z.object({
    item_id: z.number().min(1, 'กรุณาเลือกสินค้า'),
    itemCode: z.string().min(1, 'กรุณาเลือกสินค้า'),
    itemName: z.string().optional(),
    from_uom_id: z.number().min(1, 'กรุณาเลือกหน่วยต้นทาง'),
    fromUnit: z.string().min(1, 'กรุณาเลือกหน่วยต้นทาง'),
    to_uom_id: z.number().min(1, 'กรุณาเลือกหน่วยปลายทาง'),
    toUnit: z.string().min(1, 'กรุณาเลือกหน่วยปลายทาง'),
    conversionFactor: z.number().min(0, 'อัตราแปลงต้องไม่น้อยกว่า 0'),
    isPurchaseUnit: z.boolean(),
    isActive: z.boolean(),
});

export type UOMConversionFormValues = z.infer<typeof uomConversionSchema>;

export function useUOMConversionForm(
    editId: number | null, 
    initialData?: UOMConversionListItem | null, 
    onSuccess?: () => void,
    preFill?: { item_id?: number; itemCode?: string; itemName?: string }
) {
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        control,
        setValue,
        formState: { errors }
    } = useForm<UOMConversionFormValues>({
        resolver: zodResolver(uomConversionSchema) as Resolver<UOMConversionFormValues>,
        defaultValues: initialUOMConversionFormData
    });

    const formData = useWatch({ 
        control,
        defaultValue: initialUOMConversionFormData as UOMConversionFormValues
    }) as UOMConversionFormValues;

    // Hydrate form when data is provided (for edit mode)
    useEffect(() => {
        if (initialData) {
            const data = initialData as unknown as ItemUOMConversion;
            reset({
                item_id: data.item_id || 0,
                itemCode: data.item_code || '',
                itemName: data.item_name || '',
                from_uom_id: data.from_unit_id || 0,
                fromUnit: data.from_unit_name || '',
                to_uom_id: data.to_unit_id || 0,
                toUnit: data.to_unit_name || '',
                conversionFactor: data.conversion_factor || 0,
                isPurchaseUnit: data.is_purchase_unit ?? false,
                isActive: data.is_active ?? true,
            });
        } else if (preFill) {
            reset({
                ...initialUOMConversionFormData as UOMConversionFormValues,
                item_id: preFill.item_id || 0,
                itemCode: preFill.itemCode || '',
                itemName: preFill.itemName || '',
            });
        } else if (!editId) {
            reset(initialUOMConversionFormData as UOMConversionFormValues);
        }
    }, [initialData, reset, editId, preFill]);

    const saveMutation = useMutation({
        mutationFn: async (data: UOMConversionFormValues) => {
            // Frontend validation: Check for duplicate Active conversions
            if (data.isActive) {
                const existingData = await UOMConversionService.getAll();
                const items = existingData.items || [];
                const duplicateActive = items.find(c => 
                    c.item_id === data.item_id && 
                    c.from_unit_id === data.from_uom_id && 
                    c.is_active === true &&
                    c.id !== editId // ignore itself in edit mode
                );

                if (duplicateActive) {
                    throw new Error(`ไม่สามารถบันทึกได้ เนื่องจากมีการตั้งค่าแปลงหน่วย "${data.fromUnit}" ของสินค้านี้ในสถานะ "ใช้งาน" อยู่แล้ว`);
                }
            }

            const payload = {
                item_id: data.item_id,
                from_uom_id: data.from_uom_id,
                to_uom_id: data.to_uom_id,
                factor: data.conversionFactor,
                is_purchase_uom: data.isPurchaseUnit,
                is_active: data.isActive,
            };

            return editId 
                ? UOMConversionService.update(editId, { item_uom_id: editId, ...payload })
                : UOMConversionService.create({ item_uom_id: 0, ...payload });
        },
        onSuccess: async (res) => {
            if (res && res.success !== false) {
                await confirm({
                    title: 'บันทึกสำเร็จ!',
                    description: 'ข้อมูลการแปลงหน่วยถูกบันทึกเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                
                queryClient.invalidateQueries({ queryKey: ['uom-conversions'] });
                if (editId) {
                    queryClient.invalidateQueries({ queryKey: ['uom-conversion', editId] });
                }
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save UOM conversion error:', error);
            
            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const handleSave: SubmitHandler<UOMConversionFormValues> = (data) => {
        saveMutation.mutate(data);
    };

    const clearForm = useCallback(() => {
        reset(initialUOMConversionFormData as UOMConversionFormValues);
    }, [reset]);

    return {
        register,
        formData,
        errors,
        isSaving: saveMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave),
        setValue,
        clearForm,
        reset
    };
}
