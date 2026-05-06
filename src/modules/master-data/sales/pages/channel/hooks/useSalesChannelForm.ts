import { useEffect } from 'react';
import { useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SalesChannelService } from '../services/channel.service';
import type { SalesChannelFormData } from '../types/channel.types';
import { extractErrorMessage } from '@/core/api/api';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils';

export const channelSchema = z.object({
    channelCode: z.string()
        .min(1, 'กรุณากรอกรหัสช่องทางการขาย')
        .max(25, 'รหัสช่องทางการขายต้องไม่เกิน 25 ตัวอักษร'),
    channelName: z.string()
        .min(1, 'กรุณากรอกชื่อช่องทางการขาย (ไทย)')
        .max(255, 'ชื่อช่องทางการขายต้องไม่เกิน 255 ตัวอักษร'),
    channelNameEn: z.string()
        .max(255, 'ชื่อช่องทางการขาย (Eng) ต้องไม่เกิน 255 ตัวอักษร'),
    isActive: z.boolean(),
});

export type ChannelFormValues = z.infer<typeof channelSchema>;

interface UseSalesChannelFormProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

export function useSalesChannelForm({ isOpen, onClose, editId, onSuccess }: UseSalesChannelFormProps) {
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
    } = useForm<ChannelFormValues>({
        resolver: zodResolver(channelSchema) as Resolver<ChannelFormValues>,
        defaultValues: {
            channelCode: '',
            channelName: '',
            channelNameEn: '',
            isActive: true
        }
    });

    // Real-time Duplicate Check
    const codeValue = useWatch({ control, name: 'channelCode' });
    const debouncedCode = useDebounce(codeValue, 500);

    const { data: duplicateCheckData } = useQuery({
        queryKey: ['sales-channel-check-duplicate', debouncedCode, editId],
        queryFn: async () => {
            if (!debouncedCode) return [];
            return SalesChannelService.getList({ channel_code: debouncedCode } as Record<string, string>);
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
                (item as { channel_code?: string }).channel_code?.toLowerCase() === debouncedCode.trim().toLowerCase() && 
                (item as { channel_id?: string | number }).channel_id?.toString() !== editId
            );

            if (isDuplicate && dirtyFields.channelCode) {
                setError('channelCode', { type: 'manual', message: 'รหัสช่องทางการขายซ้ำในระบบ' });
            } else if (errors.channelCode?.message === 'รหัสช่องทางการขายซ้ำในระบบ') {
                clearErrors('channelCode');
            }
        } 
    }, [duplicateCheckData, debouncedCode, codeValue, editId, setError, clearErrors, errors.channelCode?.message, dirtyFields.channelCode]);

    // Reset/Load Data
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                const fetchData = async () => {
                    try {
                        const data = await SalesChannelService.get(editId);
                        if (data) {
                            reset({
                                channelCode: data.channel_code,
                                channelName: data.channel_name,
                                channelNameEn: data.channel_nameeng || '',
                                isActive: data.is_active
                            });
                        }
                    } catch (error) {
                        logger.error('Failed to fetch sales channel details:', error);
                    }
                };
                fetchData();
            } else {
                reset({
                    channelCode: '',
                    channelName: '',
                    channelNameEn: '',
                    isActive: true
                });
            }
        }
    }, [isOpen, editId, reset]);

    const saveMutation = useMutation({
        mutationFn: async (data: ChannelFormValues) => {
            if (editId) {
                return SalesChannelService.update(editId, data);
            }
            return SalesChannelService.create(data as SalesChannelFormData);
        },
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['sales-channels'] });
                if (onSuccess) onSuccess();
                onClose();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: async (error: Error) => {
            logger.error('Failed to save sales channel:', error);
            const msg = extractErrorMessage(error);
            
            // Handle duplicate code error
            if (msg.includes('รหัส') || msg.toLowerCase().includes('duplicate') || msg.includes('ซ้ำ')) {
                setError('channelCode', { 
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

    const onSubmit: SubmitHandler<ChannelFormValues> = (data) => {
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
