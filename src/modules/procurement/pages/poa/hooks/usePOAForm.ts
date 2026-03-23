import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { Resolver, SubmitHandler, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { POAService } from '@/modules/procurement/services/poa.service';
import { POAFormSchema, type POAFormData } from '@/modules/procurement/schemas/poa-schemas';
import type { POListItem } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { extractErrorMessage } from '@/core/api/api';

interface UsePOAFormOptions {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    poId?: number;
    initialValues?: Partial<POListItem>;
}

export const usePOAForm = ({
    isOpen,
    onClose,
    onSuccess,
    poId,
    initialValues,
}: UsePOAFormOptions) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formMethods = useForm<POAFormData>({
        resolver: zodResolver(POAFormSchema) as Resolver<POAFormData>,
        defaultValues: {
            po_no: '',
            po_date: '',
            vendor_id: undefined,
            vendor_name: '',
            remarks: '',
            reject_reason: '',
            po_lines: [],
        },
    });

    const {
        control,
        register,
        handleSubmit,
        reset,
        setValue,
        getValues,
        formState: { errors, isDirty },
    } = formMethods;

    const { fields } = useFieldArray({ control, name: 'po_lines' });

    useEffect(() => {
        if (isOpen && initialValues) {
            // Assume initialValues contains a full PO or we need to fetch it
            // For POAList, the initialValues should ideally be fetched completely if missing lines
            // If the row data doesn't have lines, you might need a useQuery here to fetch detail.
            // But let's assume `initialValues` comes from `useQuery(getById)` in the component.

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const initialLines = (initialValues as any).po_lines || (initialValues as any).lines || [];

            reset({
                po_no: initialValues.po_no || '',
                po_date: initialValues.po_date || '',
                vendor_id: initialValues.vendor_id,
                vendor_name: initialValues.vendor_name || '',
                remarks: initialValues.remarks || '',
                reject_reason: '',
                po_lines: initialLines,
            });
        } else if (!isOpen) {
            reset();
        }
    }, [isOpen, initialValues, reset]);

    const handleConfirmApprove = async () => {
        if (!poId) return;
        try {
            setIsSubmitting(true);
            
            // If form is dirty (qty or remarks changed), update first
            if (isDirty) {
                const data = getValues();
                await POAService.update(poId, data);
            }

            // Approve
            await POAService.approve(poId);
            queryClient.invalidateQueries({ queryKey: ['poa-list'] });
            toast('อนุมัติใบสั่งซื้อสำเร็จ', 'success');
            
            setIsConfirmModalOpen(false);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            logger.error('[usePOAForm] handleConfirmApprove error:', error);
            toast(extractErrorMessage(error), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmReject = async () => {
        if (!poId) return;
        const reason = getValues('reject_reason');
        if (!reason) {
            toast('กรุณาระบุเหตุผลที่ไม่อนุมัติ', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            await POAService.reject(poId, reason);
            queryClient.invalidateQueries({ queryKey: ['poa-list'] });
            toast('ปฏิเสธใบสั่งซื้อสำเร็จ', 'success');
            
            setIsRejectModalOpen(false);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            logger.error('[usePOAForm] handleConfirmReject error:', error);
            toast(extractErrorMessage(error), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSubmit: SubmitHandler<POAFormData> = () => {
        setIsConfirmModalOpen(true);
    };

    const onInvalidSubmit = (errors: FieldErrors<POAFormData>) => {
        logger.error("Form Validation Errors:", errors);
        toast("กรุณาตรวจสอบข้อมูลให้ถูกต้อง", 'error');
    };

    const openRejectModal = () => setIsRejectModalOpen(true);

    return {
        formMethods,
        control,
        register,
        handleSubmit,
        errors,
        fields,
        setValue,
        getValues,
        onSubmit,
        onInvalidSubmit,
        
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        handleConfirmApprove,

        isRejectModalOpen,
        setIsRejectModalOpen,
        openRejectModal,
        handleConfirmReject,

        isSubmitting,
    };
};
