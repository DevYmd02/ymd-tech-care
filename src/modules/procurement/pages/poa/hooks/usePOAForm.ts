import { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import type { Resolver, SubmitHandler, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { POAService } from '@/modules/procurement/services/poa.service';
import { POAFormSchema, type POAFormData } from '@/modules/procurement/schemas/poa-schemas';
import type { POListItem } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { extractErrorMessage } from '@/core/api/api';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';

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
    const [isPOSearchModalOpen, setIsPOSearchModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentPoId, setCurrentPoId] = useState<number | undefined>(poId);

    useEffect(() => {
        if (poId) setCurrentPoId(poId);
    }, [poId]);

    const { data: detailData, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['poa-detail', currentPoId],
        queryFn: () => POAService.getById(currentPoId!),
        enabled: isOpen && !!currentPoId,
    });

    const { data: currencies = [], isLoading: isLoadingCurrencies } = useQuery({
        queryKey: ['master-currencies'],
        queryFn: MasterDataService.getCurrencies,
        enabled: isOpen,
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
            currency_code: 'THB',
            target_currency: 'THB',
            exchange_rate_date: new Date().toISOString().split('T')[0],
            exchange_rate: 1,
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
        getFieldState,
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
                exchange_rate_date: (source as any).exchange_rate_date ? new Date((source as any).exchange_rate_date).toISOString().split('T')[0] : (new Date().toISOString().split('T')[0]),
                currency_code: source.currency_code || 'THB',
                target_currency: (source as any).target_currency || 'THB',
                exchange_rate: source.exchange_rate || 1,
            } as any);
        } else if (!isOpen) {
            reset();
        }
    }, [isOpen, initialValues, detailData, reset]);

    const watchCurrencyCode    = useWatch({ control, name: 'currency_code' }) as string | undefined;
    const watchTargetCurrency  = useWatch({ control, name: 'target_currency' }) as string | undefined;

    // ── Currency Exchange Rate Auto-Calculation triggers ─────────────────────
    const prevCurrencyId = useRef<string | undefined>(undefined);
    const prevTargetCurrency = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!watchCurrencyCode) return;
        
        // Equal currencies reset Rate to 1
        if (watchCurrencyCode === watchTargetCurrency || !watchTargetCurrency) {
            setValue('exchange_rate', 1, { shouldDirty: false });
            prevCurrencyId.current = watchCurrencyCode;
            prevTargetCurrency.current = watchTargetCurrency;
            return;
        }

        const isSourceChanged = prevCurrencyId.current !== watchCurrencyCode;
        const isTargetChanged = prevTargetCurrency.current !== watchTargetCurrency;

        const { isDirty } = getFieldState('exchange_rate');
        if (isSourceChanged || isTargetChanged || !isDirty) {
            const sourceObj = currencies.find((c: any) => c.currency_code === watchCurrencyCode);
            const targetObj = currencies.find((c: any) => c.currency_code === watchTargetCurrency);

            const fromRate = sourceObj?.exchange_rate || 1;
            const toRate = targetObj?.exchange_rate || 1;

            const calculatedRate = fromRate / toRate;

            if (calculatedRate !== undefined && !isNaN(calculatedRate)) {
                setValue('exchange_rate', Number(calculatedRate.toFixed(6)), { shouldValidate: true, shouldDirty: false });
            }
        }

        prevCurrencyId.current = watchCurrencyCode;
        prevTargetCurrency.current = watchTargetCurrency;
    }, [currencies, watchCurrencyCode, watchTargetCurrency, setValue, getFieldState]);

    const handleConfirmApprove = async () => {
        if (!currentPoId) return;
        try {
            setIsSubmitting(true);
            
            // If form is dirty (qty or remarks changed), update first
            if (isDirty) {
                const data = getValues();
                await POAService.update(currentPoId, data);
            }

            // Approve
            await POAService.approve(currentPoId);
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
        if (!currentPoId) return;
        const reason = getValues('reject_reason');
        if (!reason) {
            toast('กรุณาระบุเหตุผลที่ไม่อนุมัติ', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            await POAService.reject(currentPoId, reason);
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

    const handlePOSelect = (po: POListItem) => {
        if (po.po_id) {
            setCurrentPoId(po.po_id);
            setIsPOSearchModalOpen(false);
        }
    };

    const onSubmit: SubmitHandler<POAFormData> = () => {
        setIsConfirmModalOpen(true);
    };

    const onInvalidSubmit = (errors: FieldErrors<POAFormData>) => {
        logger.error("Form Validation Errors:", errors);
        toast("กรุณาตรวจสอบข้อมูลให้ถูกต้อง", 'error');
    };

    const handleRejectInit = () => {
        const reason = getValues('reject_reason');
        if (!reason?.trim()) {
            toast('กรุณาระบุเหตุผลที่ไม่อนุมัติ', 'error');
            formMethods.setError('reject_reason', { type: 'required', message: 'กรุณาระบุเหตุผลที่ไม่อนุมัติ' });
            formMethods.setFocus('reject_reason');
            return;
        }
        setIsRejectModalOpen(true);
    };

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
        handleRejectInit,
        handleConfirmReject,

        isSubmitting,
        detailData,
        isLoadingDetail,

        isPOSearchModalOpen,
        setIsPOSearchModalOpen,
        handlePOSelect,

        currencies,
        isLoadingCurrencies,
    };
};
