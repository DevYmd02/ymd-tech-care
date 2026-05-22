import { useEffect } from 'react';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SaleAreaService } from '../services/area.service';
import type { SaleAreaFormData } from '../types/area.types';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { logger } from '@/shared/utils';

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
    const { toast } = useToast();

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
                toast('บันทึกสำเร็จ', 'success');
                if (onSuccess) onSuccess();
                onClose();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: (error: Error) => {
            logger.error('Failed to save sales area:', error);
            const msg = error.message || 'บันทึกไม่สำเร็จ';
            
            const lowerMsg = msg.toLowerCase();
            const isDuplicate = lowerMsg.includes('internal server error') || 
                                lowerMsg.includes('status code 500') ||
                                lowerMsg.includes('duplicate') || 
                                lowerMsg.includes('ซ้ำ') || 
                                lowerMsg.includes('unique');
            
            if (isDuplicate) {
                setError('saleAreaCode', { 
                    type: 'manual',
                    message: 'รหัสเขตการขายซ้ำในระบบ' 
                });
                toast('รหัสเขตการขายซ้ำในระบบ', 'error');
            } else {
                let thaiMsg = msg;
                if (lowerMsg.includes('network error') || lowerMsg.includes('connect')) {
                    thaiMsg = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต';
                } else if (lowerMsg.includes('status code 400') || lowerMsg.includes('bad request')) {
                    thaiMsg = 'คำขอไม่ถูกต้อง (400)';
                } else if (lowerMsg.includes('status code 403') || lowerMsg.includes('forbidden')) {
                    thaiMsg = 'คุณไม่มีสิทธิ์ดำเนินการนี้ (403)';
                } else if (lowerMsg.includes('status code 404') || lowerMsg.includes('not found')) {
                    thaiMsg = 'ไม่พบข้อมูลที่ต้องการ (404)';
                } else if (lowerMsg.includes('status code 500')) {
                    thaiMsg = 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (500)';
                }
                toast(thaiMsg, 'error');
            }
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
