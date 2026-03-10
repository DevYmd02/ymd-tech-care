import { useCallback, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { WarehouseService } from '../services/warehouse.service';
import { BranchService } from '@/modules/master-data/company/services/branch.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import type { WarehouseMaster } from '@/modules/master-data/types/master-data-types';

export const warehouseSchema = z.object({
    warehouse_code: z.string().min(1, 'กรุณากรอกรหัสคลังสินค้า').max(20, 'รหัสคลังสินค้าต้องไม่เกิน 20 ตัวอักษร'),
    warehouse_name: z.string().min(1, 'กรุณากรอกชื่อคลังสินค้า').max(200, 'ชื่อคลังสินค้าต้องไม่เกิน 200 ตัวอักษร'),
    branch_id: z.coerce.number().min(1, 'กรุณาเลือกสาขา'),
    address: z.string().optional(),
    is_active: z.boolean(),
});

export type WarehouseFormData = z.infer<typeof warehouseSchema>;

const initialFormData: WarehouseFormData = {
    warehouse_code: '',
    warehouse_name: '',
    branch_id: 0,
    address: '',
    is_active: true,
};

export function useWarehouseForm(editId: number | null, initialData?: WarehouseMaster | null, onSuccess?: () => void) {
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        control,
        setValue,
        formState: { errors }
    } = useForm<WarehouseFormData>({
        resolver: zodResolver(warehouseSchema) as Resolver<WarehouseFormData>,
        defaultValues: initialFormData
    });

    const formData = useWatch({ 
        control,
        defaultValue: initialFormData
    }) as WarehouseFormData;

    // Load branches for dropdown
    const { data: branchData } = useQuery({
        queryKey: ['branches-dropdown'],
        queryFn: async () => {
            const res = await BranchService.getList({ page: 1, limit: 1000 });
            return Array.isArray(res) ? res : (res?.items || []);
        },
        staleTime: 5 * 60 * 1000 // 5 mins
    });

    const branches = useMemo(() => branchData || [], [branchData]);

    // Hydrate form when data is provided
    useEffect(() => {
        if (initialData) {
            reset({
                warehouse_code: initialData.warehouse_code,
                warehouse_name: initialData.warehouse_name,
                branch_id: initialData.branch_id || (branches.length > 0 ? branches[0].branch_id : 0),
                address: initialData.address || '',
                is_active: initialData.is_active ?? true,
            });
        }
    }, [initialData, reset, branches]);

    const saveMutation = useMutation({
        mutationFn: (data: WarehouseFormData) => {
            return editId 
                ? WarehouseService.update({ warehouse_id: editId, ...data })
                : WarehouseService.create(data);
        },
        onSuccess: async (res) => {
            if (res.success) {
                await confirm({
                    title: 'บันทึกสำเร็จ!',
                    description: 'ข้อมูลคลังสินค้าถูกบันทึกเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                
                queryClient.invalidateQueries({ queryKey: ['warehouses'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save warehouse error:', error);
            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const handleSave: SubmitHandler<WarehouseFormData> = (data) => {
        saveMutation.mutate(data);
    };

    const clearForm = useCallback(() => {
        reset(initialFormData);
    }, [reset]);

    return {
        register,
        formData,
        errors,
        branches,
        isSaving: saveMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave),
        setValue,
        clearForm
    };
}
