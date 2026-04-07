import { useEffect } from 'react';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SaleAreaService } from '../services/area.service';
import type { SaleAreaFormData } from '../types/area.types';
import { extractErrorMessage } from '@/core/api/api';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';

export const areaSchema = z.object({
    saleAreaCode: z.string()
        .min(1, 'กรุณากรอกรหัสเขตการขาย')
        .max(20, 'รหัสเขตการขายต้องไม่เกิน 20 ตัวอักษร'),
    saleAreaName: z.string()
        .min(1, 'กรุณากรอกชื่อเขตการขาย (ไทย)')
        .max(200, 'ชื่อเขตการขายต้องไม่เกิน 200 ตัวอักษร'),
    saleAreaNameEng: z.string()
        .max(200, 'ชื่อเขตการขาย (Eng) ต้องไม่เกิน 200 ตัวอักษร'),
    isActive: z.boolean(),
});

export type AreaFormValues = z.infer<typeof areaSchema>;

interface UseSalesAreaFormProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

export function useSalesAreaForm({ isOpen, onClose, editId, onSuccess }: UseSalesAreaFormProps) {
    const queryClient = useQueryClient();
    const { confirm } = useConfirmation();

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        setError,
        clearErrors,
        control,
        formState: { errors, dirtyFields }
    } = useForm<AreaFormValues>({
        resolver: zodResolver(areaSchema) as Resolver<AreaFormValues>,
        defaultValues: {
            saleAreaCode: '',
            saleAreaName: '',
            saleAreaNameEng: '',
            isActive: true
        }
    });

    // Real-time Duplicate Check
    const codeValue = useWatch({ control, name: 'saleAreaCode' });
    const debouncedCode = useDebounce(codeValue, 500);

    const { data: duplicateCheckData } = useQuery({
        queryKey: ['sales-area-check-duplicate', debouncedCode, editId],
        queryFn: async () => {
            if (!debouncedCode) return [];
            return SaleAreaService.getList({ sale_area_code: debouncedCode } as Record<string, string>);
        },
        enabled: isOpen && !!debouncedCode && debouncedCode.trim().length >= 1,
    });

    useEffect(() => {
        if (codeValue !== debouncedCode) return;

        if (duplicateCheckData && debouncedCode) {
            const matches = Array.isArray(duplicateCheckData) 
                ? duplicateCheckData 
                : (duplicateCheckData as { items?: unknown[] }).items || [];

            const isDuplicate = matches.some((item: unknown) => 
                (item as { sale_area_code?: string }).sale_area_code?.toLowerCase() === debouncedCode.trim().toLowerCase() && 
                (item as { sale_area_id?: string | number }).sale_area_id?.toString() !== editId
            );

            if (isDuplicate && dirtyFields.saleAreaCode) {
                setError('saleAreaCode', { type: 'manual', message: 'รหัสเขตการขายซ้ำในระบบ' });
            } else if (errors.saleAreaCode?.message === 'รหัสเขตการขายซ้ำในระบบ') {
                clearErrors('saleAreaCode');
            }
        } 
    }, [duplicateCheckData, debouncedCode, codeValue, editId, setError, clearErrors, errors.saleAreaCode?.message, dirtyFields.saleAreaCode]);

    // Reset/Load Data
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                const fetchData = async () => {
                    try {
                        const data = await SaleAreaService.get(editId);
                        if (data) {
                            reset({
                                saleAreaCode: data.sale_area_code,
                                saleAreaName: data.sale_area_name,
                                saleAreaNameEng: data.sale_area_nameeng || '',
                                isActive: data.is_active
                            });
                        }
                    } catch (error) {
                        logger.error('Failed to fetch sales area details:', error);
                    }
                };
                fetchData();
            } else {
                reset({
                    saleAreaCode: '',
                    saleAreaName: '',
                    saleAreaNameEng: '',
                    isActive: true
                });
            }
        }
    }, [isOpen, editId, reset]);

    const saveMutation = useMutation({
        mutationFn: async (data: AreaFormValues) => {
            if (editId) {
                return SaleAreaService.update(editId, data);
            }
            return SaleAreaService.create(data as SaleAreaFormData);
        },
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['sales-areas'] });
                if (onSuccess) onSuccess();
                onClose();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Failed to save sales area:', error);
            const msg = extractErrorMessage(error);
            
            // Handle duplicate code error
            if (msg.includes('รหัส') || msg.toLowerCase().includes('duplicate') || msg.includes('ซ้ำ')) {
                setError('saleAreaCode', { 
                    type: 'manual',
                    message: msg 
                });
            }
            
            await confirm({
                title: 'ไม่สามารถบันทึกได้',
                description: msg,
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const onSubmit: SubmitHandler<AreaFormValues> = (data) => {
        saveMutation.mutate(data);
    };

    return {
        register,
        handleSubmit: rhfHandleSubmit(onSubmit),
        errors,
        isSubmitting: saveMutation.isPending,
        control
    };
}
