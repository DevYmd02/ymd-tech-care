import { useCallback, useEffect } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { z } from 'zod';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ICDocumentLinkService } from '../services/ic-document-link.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils';
import type { ICDocumentLinkMaster, ICDocumentLinkFormData as ICDocumentLinkFormDataInterface } from '@/modules/master-data/types/master-data-types';

export const icDocumentLinkSchema = z.object({
    docu_type_code: z.string()
        .min(1, 'กรุณากรอกรหัสชนิดเอกสารเชื่อม')
        .regex(/^\d{3}$/, 'รหัสต้องเป็นตัวเลข 3 หลัก (เช่น 102, 103)'),
    docu_name_th: z.string().max(200, 'ชื่อภาษาไทยต้องไม่เกิน 200 ตัวอักษร').optional().or(z.literal('')),
    docu_name_en: z.string().min(1, 'กรุณากรอกชื่อภาษาอังกฤษ').max(200, 'ชื่อภาษาอังกฤษต้องไม่เกิน 200 ตัวอักษร'),
    docu_item_no: z.number().optional(),
    docu_item_name: z.string().max(200, 'ชื่อรายการเอกสารต้องไม่เกิน 200 ตัวอักษร').optional().or(z.literal('')),
    docu_desc: z.string().min(1, 'กรุณากรอกคำอธิบาย').max(200, 'คำอธิบายต้องไม่เกิน 200 ตัวอักษร'),
    remark: z.string().min(1, 'กรุณากรอกหมายเหตุ').max(200, 'หมายเหตุต้องไม่เกิน 200 ตัวอักษร'),
    stock_effect_ic: z.coerce.number(),
    is_active: z.coerce.boolean(),
});

export type ICDocumentLinkFormData = z.infer<typeof icDocumentLinkSchema>;

const initialFormData: ICDocumentLinkFormData = {
    docu_type_code: '',
    docu_name_th: '',
    docu_name_en: '',
    docu_item_no: undefined,
    docu_item_name: '',
    docu_desc: '',
    remark: '',
    stock_effect_ic: 0,
    is_active: true,
};

export function useICDocumentLinkForm(editId: string | null, initialData?: ICDocumentLinkMaster | null, onSuccess?: () => void) {
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
    } = useForm<ICDocumentLinkFormData>({
        resolver: zodResolver(icDocumentLinkSchema) as Resolver<ICDocumentLinkFormData>,
        defaultValues: initialFormData
    });

    const codeValue = useWatch({ control, name: 'docu_type_code' });
    const debouncedCode = useDebounce(codeValue, 500);

    // Check duplicate code
    const { data: duplicateCheckData } = useQuery({
        queryKey: ['ic-document-link-check-duplicate', debouncedCode],
        queryFn: async () => {
            if (!debouncedCode) return { items: [] };
            return ICDocumentLinkService.getAll({ docu_type_code: debouncedCode });
        },
        enabled: !!debouncedCode && debouncedCode.trim().length >= 1,
    });

    useEffect(() => {
        if (codeValue !== debouncedCode) return;

        if (duplicateCheckData?.items && debouncedCode) {
            const matches = duplicateCheckData.items;
            const isDuplicate = matches.some(item => 
                item.docu_type_code?.toLowerCase() === debouncedCode.trim().toLowerCase() && 
                item.docu_type_id !== editId
            );

            if (isDuplicate) {
                setError('docu_type_code', { type: 'manual', message: 'รหัสชนิดเอกสารเชื่อมนี้มีอยู่ในระบบแล้ว' });
            } else if (errors.docu_type_code?.message === 'รหัสชนิดเอกสารเชื่อมนี้มีอยู่ในระบบแล้ว') {
                clearErrors('docu_type_code');
            }
        }
    }, [duplicateCheckData, debouncedCode, codeValue, editId, setError, clearErrors, errors.docu_type_code?.message]);

    // Hydrate form when data is provided
    useEffect(() => {
        if (initialData) {
            reset({
                docu_type_code: initialData.docu_type_code,
                docu_name_th: initialData.docu_name_th || '',
                docu_name_en: initialData.docu_name_en,
                docu_item_no: initialData.docu_item_no,
                docu_item_name: initialData.docu_item_name || '',
                docu_desc: initialData.docu_desc,
                remark: initialData.remark,
                stock_effect_ic: initialData.stock_effect_ic,
                is_active: initialData.is_active ?? true,
            });
        } else {
            reset(initialFormData);
        }
    }, [initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: (data: ICDocumentLinkFormData) => {
            return editId 
                ? ICDocumentLinkService.update(editId, data as ICDocumentLinkFormDataInterface)
                : ICDocumentLinkService.create(data as ICDocumentLinkFormDataInterface);
        },
        onSuccess: async (res) => {
            if (res.success) {
                await confirm({
                    title: 'บันทึกสำเร็จ!',
                    description: 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    variant: 'success',
                    hideCancel: true
                });
                
                queryClient.invalidateQueries({ queryKey: ['ic-document-links'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Save IC Document Link error:', error);
            await confirm({
                title: 'เกิดข้อผิดพลาด',
                description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
                confirmText: 'ตกลง',
                variant: 'danger',
                hideCancel: true
            });
        }
    });

    const handleSave: SubmitHandler<ICDocumentLinkFormData> = (data) => {
        saveMutation.mutate(data);
    };

    const clearForm = useCallback(() => {
        reset(initialFormData);
    }, [reset]);

    return {
        register,
        errors,
        control,
        isSaving: saveMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave),
        setValue,
        clearForm
    };
}