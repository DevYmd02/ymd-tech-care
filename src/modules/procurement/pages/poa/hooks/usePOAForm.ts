import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { Resolver, SubmitHandler, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

    const { data: detailData, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['poa-detail', poId],
        queryFn: () => POAService.getById(poId!),
        enabled: isOpen && !!poId,
    });

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
        if (isOpen && (initialValues || detailData)) {
            const source = detailData || initialValues || {};
            const initialLines = ((source as any).po_lines || (source as any).lines || []).map((l: any) => ({
                ...l,
                is_approved: l.is_approved !== undefined ? l.is_approved : true
            }));

            reset({
                po_no: source.po_no || '',
                po_date: source.po_date || '',
                vendor_id: source.vendor_id,
                vendor_name: source.vendor_name || '',
                remarks: source.remarks || '',
                reject_reason: '',
                po_lines: initialLines,
                // Add fields that might not be in defaults but are useful for display
                pr_no: (source as any).pr_no || '',
                qc_no: (source as any).qc_no || '',
                branch_id: (source as any).branch_id,
                ship_to_warehouse_id: (source as any).ship_to_warehouse_id,
                payment_term_days: (source as any).payment_term_days,
                delivery_date: (source as any).delivery_date || '',
                tax_code_id: (source as any).tax_code_id,
                created_by_name: (source as any).created_by_name || (source as any).created_by || '',
                exchange_rate_date: (source as any).exchange_rate_date || '',
                currency_code: source.currency_code || 'THB',
                exchange_rate: source.exchange_rate || 1,
            } as any);
        } else if (!isOpen) {
            reset();
        }
    }, [isOpen, initialValues, detailData, reset]);

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
        detailData,
        isLoadingDetail,
    };
};
