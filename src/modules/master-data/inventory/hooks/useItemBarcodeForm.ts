import { useCallback, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { ItemBarcodeService } from '../services/item-barcode.service';
import { UnitService } from '../services/unit.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import type { ItemBarcodeListItem } from '../types/product-types';

export const itemBarcodeSchema = z.object({
    item_id: z.coerce.number().min(1, 'กรุณาเลือกสินค้า'),
    item_code: z.string().optional(),
    item_name: z.string().optional(),
    barcode: z.string().min(1, 'กรุณากรอกรหัสบาร์โค้ด').max(50, 'บาร์โค้ดต้องไม่เกิน 50 ตัวอักษร'),
    uom_id: z.string().min(1, 'กรุณาเลือกหน่วย'),
    is_primary: z.boolean().default(false),
    is_active: z.boolean().default(true),
});

export type ItemBarcodeFormData = z.infer<typeof itemBarcodeSchema>;

const initialFormData: ItemBarcodeFormData = {
    item_id: 0,
    item_code: '',
    item_name: '',
    barcode: '',
    uom_id: '',
    is_primary: false,
    is_active: true,
};

export function useItemBarcodeForm(
    editId: number | null, 
    initialData?: ItemBarcodeListItem | null, 
    onSuccess?: () => void,
    preFill?: { item_id?: number; item_code?: string; item_name?: string }
) {
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
    } = useForm<ItemBarcodeFormData>({
        resolver: zodResolver(itemBarcodeSchema) as Resolver<ItemBarcodeFormData>,
        defaultValues: initialFormData
    });

    const formData = useWatch({ 
        control,
        defaultValue: initialFormData
    }) as ItemBarcodeFormData;

    const barcodeValue = formData.barcode;
    const debouncedBarcode = useDebounce(barcodeValue, 500);

    const { data: duplicateCheckData } = useQuery({
        queryKey: ['barcode-check-duplicate', debouncedBarcode],
        queryFn: async () => {
            if (!debouncedBarcode) return { items: [] };
            return ItemBarcodeService.getAll({ barcode: debouncedBarcode });
        },
        enabled: !!debouncedBarcode && debouncedBarcode.trim().length >= 1,
    });

    useEffect(() => {
        if (duplicateCheckData?.items && debouncedBarcode) {
            const matches = duplicateCheckData.items;
            const isDuplicate = matches.some(item => 
                item.barcode?.toLowerCase() === debouncedBarcode.trim().toLowerCase() && 
                item.barcode_id !== editId
            );

            if (isDuplicate) {
                setError('barcode', { type: 'manual', message: 'บาร์โค้ดนี้ถูกใช้งานแล้ว' });
            } else if (errors.barcode?.message === 'บาร์โค้ดนี้ถูกใช้งานแล้ว') {
                clearErrors('barcode');
            }
        }
    }, [duplicateCheckData, debouncedBarcode, editId, setError, clearErrors, errors.barcode?.message]);

    // Load units for dropdown
    const { data: unitData } = useQuery({
        queryKey: ['units-dropdown'],
        queryFn: async () => {
            const res = await UnitService.getAll();
            return res?.items || [];
        },
        staleTime: 5 * 60 * 1000 // 5 mins
    });

    const units = useMemo(() => unitData || [], [unitData]);

    // Hydrate form when data is provided
    useEffect(() => {
        if (initialData) {
            reset({
                item_id: initialData.item_id,
                item_code: initialData.item_code || '',
                item_name: initialData.item_name || '',
                barcode: initialData.barcode || '',
                uom_id: String(initialData.unit_id || ''),
                is_primary: initialData.is_primary ?? false,
                is_active: initialData.is_active ?? true,
            });
        } else if (preFill) {
            reset({
                ...initialFormData,
                item_id: preFill.item_id || 0,
                item_code: preFill.item_code || '',
                item_name: preFill.item_name || '',
            });
        } else {
            reset(initialFormData);
        }
    }, [initialData, preFill, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: ItemBarcodeFormData) => {
            const payload = {
                item_id: data.item_id,
                barcode: data.barcode,
                uom_id: data.uom_id ? Number(data.uom_id) : null,
                is_default: data.is_primary,
            };
            return editId 
                ? ItemBarcodeService.update(editId, payload)
                : ItemBarcodeService.create(payload);
        },
        onSuccess: async (res) => {
            if (res) {
                await confirm({
                    title: 'บันทึกสำเร็จ!',
                    description: 'ข้อมูลบาร์โค้ดถูกบักทึกเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                
                queryClient.invalidateQueries({ queryKey: ['item-barcodes'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error('บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save barcode error:', error);
            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const handleSave: SubmitHandler<ItemBarcodeFormData> = (data) => {
        saveMutation.mutate(data);
    };

    const clearForm = useCallback(() => {
        reset(initialFormData);
    }, [reset]);

    return {
        register,
        formData,
        errors,
        units,
        isSaving: saveMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave),
        setValue,
        clearForm,
        reset
    };
}
