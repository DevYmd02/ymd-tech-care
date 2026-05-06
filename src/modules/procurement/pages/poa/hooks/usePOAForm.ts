import { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import type { Resolver, SubmitHandler, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { POAService } from '@/modules/procurement/services/poa.service';
import { POAFormSchema, type POAFormData } from '@/modules/procurement/schemas/poa-schemas';
import type { POListItem, POLine } from '@/modules/procurement/types';
import { logger } from '@/shared/utils';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { extractErrorMessage } from '@/core/api/api';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import { useAuth } from '@/core/auth/contexts/AuthContext';

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
    const [currentPoId, setCurrentPoId] = useState<number | string | undefined>(poId);
    const [isPartialApproval, setIsPartialApproval] = useState(false);
    const isInitialLoad = useRef(true);
    
    // Previous refs for change detection
    const prevCurrencyId = useRef<string | undefined>(undefined);
    const prevTargetCurrency = useRef<string | undefined>(undefined);
    const prevRateDate = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (poId) setCurrentPoId(poId);
    }, [poId]);

    const { data: detailData, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['poa-detail', currentPoId, !!(initialValues?.poa_no && initialValues.poa_no !== '-')],
        queryFn: () => POAService.getById(
            currentPoId!, 
            (initialValues?.poa_no && initialValues.poa_no !== '-') ? 'POA' : 'PO'
        ),
        enabled: isOpen && !!currentPoId,
    });

    const currentStatus = detailData?.status || initialValues?.status || '';
    const currentPoaNo  = detailData?.poa_no || initialValues?.poa_no || '-';
    
    // 🎯 Logic: Is Read Only ONLY if it's a historical record with a POA Number
    // PENDING_APPROVAL status should ALWAYS be editable (it's waiting for approval action)
    // PARTIAL without POA number means it's a new round waiting for approval -> editable
    // 🛡️ CRITICAL: PENDING_APPROVAL must NEVER be read-only (it's the approval action state)
    const isReadOnly = currentStatus === 'PENDING_APPROVAL' ? false : !!(readOnly || (
        ['APPROVED', 'PARTIAL', 'REJECTED', 'COMPLETED', 'CANCELLED', 'ISSUED'].includes(currentStatus) &&
        (currentPoaNo && currentPoaNo !== '-')
    ));

    const { data: currencies = [], isLoading: isLoadingCurrencies } = useQuery({
        queryKey: ['master-currencies'],
        queryFn: MasterDataService.getCurrencies,
        enabled: isOpen,
    });

    const formMethods = useForm<POAFormData>({
        mode: 'all',
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
        clearErrors,
        formState: { errors },
    } = formMethods;

    const { fields } = useFieldArray({ control, name: 'po_lines' });

    useEffect(() => {
        if (isOpen && (initialValues || detailData)) {
            const sourceObj = (detailData || initialValues || {}) as POListItem;
            
            // 🎯 Logic: Map PO lines to form state with robust quantity fallbacks
            const initialLines = (sourceObj.po_lines || []).map((l: POLine) => {
                // Try multiple field names to find the absolute original PO quantity
                const originalQty = Number(l.qty || l.qty_ordered || (l as any).qty_total || (l as any).quantity || 0);
                let remQty = l.remaining_qty !== undefined ? Number(l.remaining_qty) : originalQty;

                // 🎯 SAFETY RESTORE: If it's a new POA and remQty is 0 but originalQty exists, use originalQty
                // This prevents items from being hidden if the service calculation still has gaps.
                const isNewRound = !sourceObj.poa_no || sourceObj.poa_no === '-';
                if (isNewRound && remQty === 0 && originalQty > 0) {
                    remQty = originalQty;
                }

                const isProcessed = remQty <= 0 && originalQty > 0;
                const existingQty = Number(l.approved_qty ?? l.qty_approved ?? l.qty_ordered ?? 0);
                
                // 🎯 AV PATTERN: Force full remaining quantity for new rounds or items with zero existing approved qty
                const defaultQty = (isNewRound || existingQty === 0) 
                    ? (isProcessed ? 0 : remQty) 
                    : existingQty;

                return {
                    ...l,
                    qty: originalQty,
                    qty_ordered: defaultQty,
                    remaining_qty: remQty,
                    is_processed: isProcessed,
                    // 🎯 AV PATTERN: Processed items are UNCHECKED by default in new rounds
                    is_approved: l.is_approved !== undefined ? !!l.is_approved : (!isProcessed && defaultQty > 0)
                };
            });

            reset({
                ...sourceObj,
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
                branch_name: (sourceObj.branch_name && sourceObj.branch_name !== '-') ? sourceObj.branch_name : '',
                payment_term_days: Number(sourceObj.payment_term_days ?? 0),
                delivery_date: sourceObj.delivery_date || '',
                tax_code_id: sourceObj.tax_code_id,
                tax_name: (sourceObj.tax_name && sourceObj.tax_name !== '-' && sourceObj.tax_name !== 'undefined') ? sourceObj.tax_name : 
                          (sourceObj.tax_code as any)?.tax_name || 
                          (sourceObj.tax_code as any)?.name || '-',
                created_by_name: (sourceObj.created_by_name && sourceObj.created_by_name !== '-' && sourceObj.created_by_name !== 'undefined') ? sourceObj.created_by_name : 
                                 (sourceObj.approval_emp_name && sourceObj.approval_emp_name !== '-' && sourceObj.approval_emp_name !== 'undefined') ? sourceObj.approval_emp_name : '-',
                exchange_rate_date: sourceObj.exchange_rate_date ? new Date(sourceObj.exchange_rate_date).toISOString().split('T')[0] : (new Date().toISOString().split('T')[0]),
                currency_code: sourceObj.quote_currency_code || sourceObj.currency_code || 'THB',
                target_currency: sourceObj.base_currency_code || sourceObj.target_currency || 'THB',
                exchange_rate: Number(sourceObj.exchange_rate || 1),
            });

            // Sync refs to prevent loop
            prevCurrencyId.current = sourceObj.quote_currency_code || sourceObj.currency_code || 'THB';
            prevTargetCurrency.current = sourceObj.base_currency_code || sourceObj.target_currency || 'THB';
            prevRateDate.current = sourceObj.exchange_rate_date ? new Date(sourceObj.exchange_rate_date).toISOString().split('T')[0] : (new Date().toISOString().split('T')[0]);
            isInitialLoad.current = false;
        } else if (!isOpen) {
            reset();
            isInitialLoad.current = true;
            prevCurrencyId.current = undefined;
            prevTargetCurrency.current = undefined;
            prevRateDate.current = undefined;
        }
    }, [isOpen, initialValues, detailData, reset]);

    const watchLines = useWatch({ control, name: 'po_lines' });

    // ── Partial Approval Detection (Pattern matched with AV/PR) ────────────────
    useEffect(() => {
        if (!watchLines || !detailData) return;
        
        const isAllFinalized = watchLines.every((l: any) => {
            // 1. If item is already processed (approved in full in previous round), it's "Done".
            if (l.is_processed) return true;
            
            // 2. If item is newly approved in THIS round for the full remaining amount, it's "Done".
            const approvedQty = Number(l.qty_ordered || 0);
            const remQty      = Number(l.remaining_qty || 0);
            return !!l.is_approved && approvedQty === remQty && remQty > 0;
        });
        
        setIsPartialApproval(!isAllFinalized);
    }, [watchLines, detailData]);

    // ── Currency Exchange Rate Auto-Calculation triggers (DISABLED FOR POA) ──────
    // Note: Approvers should see the rate from the original PO. 
    // Manual changes to currency will not auto-fetch to avoid overriding historical PO rates.
    /* 
    useEffect(() => {
        if (!watchCurrencyCode || isReadOnly || isInitialLoad.current) return;
        // ... (Disabled to prevent overriding PO data with master data defaults like 35)
    }, [watchCurrencyCode, watchTargetCurrency, watchRateDate, isReadOnly, currencies]);
    */


    const handleConfirmApprove = async () => {
        if (!currentPoId) return;
        
        // 🎯 Extract numeric ID from composite strings for submission
        let numericPoId = Number(currentPoId);
        
        // 🎯 Decode Numeric Offsets back to real database IDs
        if (numericPoId >= 2000000000) {
            numericPoId -= 2000000000;
        } else if (numericPoId >= 1000000000) {
            numericPoId -= 1000000000;
        }
        
        if (!numericPoId || isNaN(numericPoId)) {
            toast('ไม่สามารถระบุเลขที่ PO ได้', 'error');
            return;
        }
        
        try {
            setIsSubmitting(true);
            
            const formData = getValues();
            const now = new Date().toISOString();
            
            // 🎯 NEW: Dynamic Status Calculation (Pattern matched with AV/PR)
            // Check if at least one item is checked
            const hasCheckedItem = formData.po_lines.some((l: any) => !!l.is_approved);
            if (!hasCheckedItem) {
                toast('กรุณาเลือกรายการที่ต้องการอนุมัติอย่างน้อย 1 รายการ', 'error');
                setIsSubmitting(false);
                return;
            }

            // Calculation Logic:
            // APPROVED = All items are checked AND all approved quantities equal ordered quantities.
            // PARTIAL  = At least one item checked AND (some items unchecked OR some quantities reduced).
            const isAllFinalized = formData.po_lines.every((l: any) => {
                if (l.is_processed) return true;
                const approvedQty = Number(l.qty_ordered || 0);
                const remQty      = Number(l.remaining_qty || 0);
                return !!l.is_approved && approvedQty === remQty && remQty > 0;
            });
            
            const submissionStatus = isAllFinalized ? 'APPROVED' : 'PARTIAL';

            // Prepare enriched unified approval payload
            const payload: any = {
                po_header_id: numericPoId,
                status: submissionStatus,
                remarks: formData.remarks || (submissionStatus === 'PARTIAL' ? 'Partially Approved via POA' : 'Approved via POA'),
                approval_date: now,
                need_by_date: formData.delivery_date || formData.po_date || now,
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
                    // 🛡️ Always use the business integer po_line_id, NOT the RHF string field.id
                    po_line_id: Number(l.po_line_id || l.id || 0),
                    // If unchecked, approved_qty MUST be 0 (Backend requirement for PARTIAL)
                    approved_qty: l.is_approved ? Number(l.qty_ordered || l.qty || 0) : 0,
                    remarks: l.line_remark || (l.is_approved ? 'Approved' : 'Rejected/Skipped'),
                    approval_date: now,
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
        
        // 🎯 Extract numeric ID from composite strings for submission
        let numericPoId = Number(currentPoId);
        
        // 🎯 Decode Numeric Offsets back to real database IDs
        if (numericPoId >= 2000000000) {
            numericPoId -= 2000000000;
        } else if (numericPoId >= 1000000000) {
            numericPoId -= 1000000000;
        }
        
        if (!numericPoId || isNaN(numericPoId)) {
            toast('ไม่สามารถระบุเลขที่ PO ได้', 'error');
            return;
        }
        
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
                po_header_id: numericPoId,
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
                    // 🛡️ Always use the business integer po_line_id, NOT the RHF string field.id
                    po_line_id: Number(l.po_line_id || l.id || 0),
                    approved_qty: 0, // Reject sets approved qty to 0
                    remarks: reason,
                    approval_date: now
                }))
            };

            await POAService.submitApproval(payload);
            
            queryClient.invalidateQueries({ queryKey: ['poa-list'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); // sync POListPage status
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
        // 🧹 Clear validation error before opening confirm modal (user already typed reason)
        clearErrors('reject_reason');
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
        isReadOnly,
        isPartialApproval,
    };
};
