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
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { CurrencyService } from '@/modules/master-data/currency/services/currency.service';

interface UsePOAFormOptions {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    poId?: number;
    initialValues?: Partial<POListItem>;
    readOnly?: boolean;
}

export const usePOAForm = ({
    isOpen,
    onClose,
    onSuccess,
    poId,
    initialValues,
    readOnly,
}: UsePOAFormOptions) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user } = useAuth();

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isPOSearchModalOpen, setIsPOSearchModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingRate, setIsFetchingRate] = useState(false);
    const [currentPoId, setCurrentPoId] = useState<number | undefined>(poId);
    
    // Previous refs for change detection
    const prevCurrencyId = useRef<string | undefined>(undefined);
    const prevTargetCurrency = useRef<string | undefined>(undefined);
    const prevRateDate = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (poId) setCurrentPoId(poId);
    }, [poId]);

    const { data: detailData, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['poa-detail', currentPoId],
        queryFn: () => POAService.getById(currentPoId!),
        enabled: isOpen && !!currentPoId,
    });

    const isReadOnly = readOnly || ['APPROVED', 'PARTIAL', 'REJECTED', 'COMPLETED', 'CANCELLED', 'ISSUED'].includes(detailData?.status || initialValues?.status || '');

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
            // Header Sync Fields
            branch_id: undefined,
            branch_name: '',
            payment_term_days: 30,
            delivery_date: '',
            tax_code_id: undefined,
            tax_name: '',
            pr_no: '',
            qc_no: '',
            created_by_name: '',
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
        formState: { errors },
    } = formMethods;

    const { fields } = useFieldArray({ control, name: 'po_lines' });

    useEffect(() => {
        if (isOpen && (initialValues || detailData)) {
            const sourceObj = (detailData || initialValues || {}) as any;
            const initialLines = (sourceObj.po_lines || sourceObj.lines || []).map((l: any) => ({
                ...l,
                is_approved: l.is_approved !== undefined ? l.is_approved : true
            }));

            reset({
                po_no: sourceObj.po_no || '',
                po_date: sourceObj.po_date || '',
                vendor_id: sourceObj.vendor_id,
                vendor_name: sourceObj.vendor_name || '',
                remarks: sourceObj.remarks || '',
                reject_reason: sourceObj.reject_reason || '',
                po_lines: initialLines,
                pr_no: sourceObj.pr_no || '',
                qc_no: sourceObj.qc_no || '',
                branch_id: sourceObj.branch_id,
                branch_name: sourceObj.branch_name || '',
                payment_term_days: Number(sourceObj.payment_term_days || 0),
                delivery_date: sourceObj.delivery_date || '',
                tax_code_id: sourceObj.tax_code_id,
                tax_name: sourceObj.tax_name || '',
                created_by_name: sourceObj.created_by_name || sourceObj.created_by || '',
                exchange_rate_date: sourceObj.exchange_rate_date ? new Date(sourceObj.exchange_rate_date).toISOString().split('T')[0] : (new Date().toISOString().split('T')[0]),
                currency_code: sourceObj.currency_code || 'THB',
                target_currency: sourceObj.target_currency || 'THB',
                exchange_rate: Number(sourceObj.exchange_rate || 1),
                status: sourceObj.status || 'PENDING_APPROVAL',
            });
        } else if (!isOpen) {
            reset();
        }
    }, [isOpen, initialValues, detailData, reset]);

    const watchCurrencyCode    = useWatch({ control, name: 'currency_code' }) as string | undefined;
    const watchTargetCurrency  = useWatch({ control, name: 'target_currency' }) as string | undefined;
    const watchRateDate        = useWatch({ control, name: 'exchange_rate_date' }) as string | undefined;

    // ── Currency Exchange Rate Auto-Calculation triggers ─────────────────────
    useEffect(() => {
        if (!watchCurrencyCode || isReadOnly) return;

        const sameAsBefore =
            prevCurrencyId.current === watchCurrencyCode &&
            prevTargetCurrency.current === watchTargetCurrency &&
            prevRateDate.current === watchRateDate;

        if (sameAsBefore) return;

        const fetchRate = async () => {
            try {
                setIsFetchingRate(true);
                
                // 1. If Same currencies -> Rate is 1
                if (watchCurrencyCode === watchTargetCurrency || !watchTargetCurrency) {
                    setValue('exchange_rate', 1, { shouldDirty: false });
                    return;
                }

                // 2. Fetch latest rate from service (API or Mock)
                // Logic: We fetch rate for watchCurrencyCode (source) at watchRateDate
                // Target is usually base (THB). 
                // If the system supports arbitrary pairs, we'd fetch both and divide.
                // For now, let's try the direct pair or individual fetch.
                
                const res = await CurrencyService.getLatestExchangeRate(watchCurrencyCode, watchRateDate);
                
                if (res && typeof res.rate === 'number') {
                    let finalRate = res.rate;
                    
                    // If target is NOT the base currency (e.g. USD to EUR), 
                    // we might need to fetch target rate and divide.
                    if (watchTargetCurrency !== 'THB') {
                        const targetRes = await CurrencyService.getLatestExchangeRate(watchTargetCurrency, watchRateDate);
                        if (targetRes && typeof targetRes.rate === 'number' && targetRes.rate !== 0) {
                            finalRate = res.rate / targetRes.rate;
                        }
                    }
                    
                    setValue('exchange_rate', Number(finalRate.toFixed(6)), { shouldDirty: false, shouldValidate: true });
                } else {
                    // Fallback to static master data if API fails or returns nothing
                    const sourceObj = currencies.find((c: any) => c.currency_code === watchCurrencyCode);
                    const targetObj = currencies.find((c: any) => c.currency_code === watchTargetCurrency);
                    const fromRate = sourceObj?.exchange_rate || 1;
                    const toRate = targetObj?.exchange_rate || 1;
                    const fallbackRate = fromRate / toRate;
                    setValue('exchange_rate', Number(fallbackRate.toFixed(6)), { shouldDirty: false });
                }
            } catch (error) {
                logger.error('[usePOAForm] Failed to fetch latest exchange rate:', error);
            } finally {
                setIsFetchingRate(false);
                prevCurrencyId.current = watchCurrencyCode;
                prevTargetCurrency.current = watchTargetCurrency;
                prevRateDate.current = watchRateDate;
            }
        };

        fetchRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchCurrencyCode, watchTargetCurrency, watchRateDate, isReadOnly, currencies]);


    const handleConfirmApprove = async () => {
        if (!currentPoId) return;
        try {
            setIsSubmitting(true);
            
            const formData = getValues();
            const now = new Date().toISOString();
            
            // 🎯 NEW: Dynamic Status Calculation (Logic similar to AV/PR)
            const isAllApproved = formData.po_lines.every((l: any, idx: number) => {
                const originalQty = Number(detailData?.po_lines?.[idx]?.qty_ordered || detailData?.po_lines?.[idx]?.qty || 0);
                const approvedQty = Number(l.qty_ordered || l.qty || 0);
                return !!l.is_approved && approvedQty === originalQty && originalQty > 0;
            });
            
            const submissionStatus = isAllApproved ? 'APPROVED' : 'PARTIAL';

            // Prepare enriched unified approval payload
            const payload: any = {
                po_header_id: currentPoId,
                status: submissionStatus,
                remarks: formData.remarks || (submissionStatus === 'PARTIAL' ? 'Partially Approved via POA' : 'Approved via POA'),
                approval_date: now,
                need_by_date: (formData as any).delivery_date || (formData as any).po_date || now,
                approval_emp_id: user?.employee_id || user?.id || 0,
                approval_emp_name: user?.employee?.employee_fullname || user?.username || 'System',
                // After the currency swap fix: form field currency_code = PO/quote currency (e.g. USD)
                // form field target_currency = domestic/base currency (e.g. THB)
                // Backend expects: base_currency_code = THB, quote_currency_code = USD
                base_currency_code: (formData as any).target_currency || 'THB',
                quote_currency_code: formData.currency_code || 'THB',
                exchange_rate: formData.exchange_rate || 1,
                tax_code_id: (formData as any).tax_code_id || 0,
                discount_expression: (formData as any).discount_expression || '0',
                lines: formData.po_lines.map((l: any) => ({
                    po_line_id: l.id || l.po_line_id,
                    approved_qty: Number(l.qty_ordered || l.qty || 0),
                    remarks: l.line_remark || (l.is_approved ? 'Approved' : 'Rejected/Skipped'),
                    approval_date: now,
                    is_approved: !!l.is_approved
                }))
            };

            // Submit using enriched unified endpoint
            await POAService.submitApproval(payload);
            
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
        const formData = getValues();
        const reason = formData.reject_reason;
        const now = new Date().toISOString();

        if (!reason) {
            toast('กรุณาระบุเหตุผลที่ไม่อนุมัติ', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            
            // Prepare enriched unified rejection payload
            const payload: any = {
                po_header_id: currentPoId,
                status: 'REJECTED',
                remarks: reason,
                approval_date: now,
                need_by_date: (formData as any).delivery_date || (formData as any).po_date || now,
                approval_emp_id: user?.employee_id || user?.id || 0,
                approval_emp_name: user?.employee?.employee_fullname || user?.username || 'System',
                // After the currency swap fix: form field currency_code = PO/quote currency (e.g. USD)
                // form field target_currency = domestic/base currency (e.g. THB)
                // Backend expects: base_currency_code = THB, quote_currency_code = USD
                base_currency_code: (formData as any).target_currency || 'THB',
                quote_currency_code: formData.currency_code || 'THB',
                exchange_rate: formData.exchange_rate || 1,
                tax_code_id: (formData as any).tax_code_id || 0,
                discount_expression: (formData as any).discount_expression || '0',
                lines: formData.po_lines.map((l: any) => ({
                    po_line_id: l.id || l.po_line_id,
                    approved_qty: 0, // Reject sets approved qty to 0
                    remarks: reason,
                    approval_date: now
                }))
            };

            await POAService.submitApproval(payload);
            
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
        isFetchingRate,
        detailData,
        isLoadingDetail,

        isPOSearchModalOpen,
        setIsPOSearchModalOpen,
        handlePOSelect,

        currencies,
        isLoadingCurrencies,
        isReadOnly,
    };
};
