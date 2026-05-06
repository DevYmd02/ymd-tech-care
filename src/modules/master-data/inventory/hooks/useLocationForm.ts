import { useCallback, useEffect } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { z } from 'zod';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { LocationService, ShelfService } from '../services/inventory-master.service';
import { WarehouseService } from '@/modules/master-data/inventory/services/warehouse.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils';
import type { Location } from '@/modules/master-data/inventory/types/inventory-master.types';

// Zod schema for form validation
export const locationSchema = z.object({
    code: z.string().min(1, 'กรุณากรอกรหัสที่จัดเก็บ').max(20, 'รหัสต้องไม่เกิน 20 ตัวอักษร'),
    nameTh: z.string().min(1, 'กรุณากรอกชื่อที่จัดเก็บ (ไทย)').max(200, 'ชื่อต้องไม่เกิน 200 ตัวอักษร'),
    nameEn: z.string().max(200, 'ชื่อ (EN) ต้องไม่เกิน 200 ตัวอักษร').optional(),
    isActive: z.boolean(),
    warehouseId: z.coerce.number().min(1, 'กรุณาเลือกคลังสินค้า'),
    shelfId: z.coerce.number().min(1, 'กรุณาเลือกชั้นวาง'),
});

export type LocationFormValues = z.infer<typeof locationSchema>;

const initialFormData: LocationFormValues = {
    code: '',
    nameTh: '',
    nameEn: '',
    isActive: true,
    warehouseId: 0,
    shelfId: 0,
};

export function useLocationForm(editId: number | null, initialData?: Location | null, onSuccess?: () => void) {
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
    } = useForm<LocationFormValues>({
        resolver: zodResolver(locationSchema) as Resolver<LocationFormValues>,
        defaultValues: initialFormData
    });

    const codeValue = useWatch({ control, name: 'code' });
    const debouncedCode = useDebounce(codeValue, 500);

    const { data: duplicateCheckData } = useQuery({
        queryKey: ['location-check-duplicate', debouncedCode],
        queryFn: async () => {
            if (!debouncedCode) return { items: [] };
            return LocationService.getAll({ location_code: debouncedCode });
        },
        enabled: !!debouncedCode && debouncedCode.trim().length >= 1,
    });

    useEffect(() => {
        if (codeValue !== debouncedCode) return;

        if (duplicateCheckData?.items && debouncedCode) {
            const matches = duplicateCheckData.items;
            const isDuplicate = matches.some(item => 
                item.code?.toLowerCase() === debouncedCode.trim().toLowerCase() && 
                item.location_id !== editId
            );

            if (isDuplicate) {
                setError('code', { type: 'manual', message: 'รหัสที่จัดเก็บซ้ำในระบบ' });
            } else if (errors.code?.message === 'รหัสที่จัดเก็บซ้ำในระบบ') {
                clearErrors('code');
            }
        } else if (!debouncedCode && errors.code?.message === 'รหัสที่จัดเก็บซ้ำในระบบ') {
            clearErrors('code');
        }
    }, [duplicateCheckData, debouncedCode, codeValue, editId, setError, clearErrors, errors.code?.message]);

    const { data: warehouseData, isLoading: isLoadingWarehouse } = useQuery({
        queryKey: ['warehouses-lookup'],
        queryFn: async () => {
            const res = await WarehouseService.getAll();
            return res.items || [];
        }
    });

    const { data: shelfData, isLoading: isLoadingShelf } = useQuery({
        queryKey: ['shelves-lookup'],
        queryFn: async () => {
            const res = await ShelfService.getAll();
            return res.items || [];
        }
    });

    const warehouses = warehouseData || [];
    const shelves = shelfData || [];

    useEffect(() => {
        if (initialData) {
            reset({
                code: initialData.code || '',
                nameTh: initialData.name_th || '',
                nameEn: initialData.name_en || '',
                isActive: initialData.is_active ?? true,
                warehouseId: initialData.warehouse_id || 0,
                shelfId: initialData.shelf_id || 0,
            });
        } else {
            reset(initialFormData);
        }
    }, [initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: LocationFormValues) => {
            return editId 
                ? LocationService.update(editId, data)
                : LocationService.create(data);
        },
        onSuccess: async (res) => {
            if (res.success) {
                await confirm({ title: 'บันทึกสำเร็จ!', description: 'ข้อมูลสถานทีจัดเก็บถูกบันทึกเรียบร้อยแล้ว', confirmText: 'ตกลง', variant: 'success', hideCancel: true });
                queryClient.invalidateQueries({ queryKey: ['locations'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save location error:', error);
            const errorMsg = error.message.toLowerCase();
            const isDuplicate = errorMsg.includes('duplicate') || errorMsg.includes('ซ้ำ');
            
            if (isDuplicate) {
                setError('code', { message: 'รหัสที่จัดเก็บซ้ำในระบบ' });
                return;
            }

            await confirm({ title: 'เกิดข้อผิดพลาด', description: error.message || 'ไม่สามารถบันทึกข้อมูลได้', confirmText: 'ตกลง', variant: 'danger', hideCancel: true });
        }
    });

    const handleSave: SubmitHandler<LocationFormValues> = (data) => saveMutation.mutate(data);
    const clearForm = useCallback(() => reset(initialFormData), [reset]);

    return {
        register,
        errors,
        isSaving: saveMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave),
        clearForm,
        warehouses,
        isLoadingWarehouse,
        shelves,
        isLoadingShelf
    };
}