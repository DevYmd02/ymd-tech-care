import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { POService } from '@/modules/procurement/services';
import { CreatePOSchema, type POFormData, type POLine, type POListItem } from '@/modules/procurement/schemas/po-schemas';
import type { CreatePOPayload } from '@/modules/procurement/types/po-types';
import type { UserProfile } from '@/core/auth/auth.service';
import { logger } from '@/shared/utils';
import { extractErrorMessage } from '@/core/api/api';

interface UsePOActionsProps {
    poId?: number;
    user: UserProfile | null;
    formMethods: UseFormReturn<POFormData>;
    existingPO: POListItem | null | undefined;
    onClose: () => void;
    onSuccess?: () => void;
    toast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const usePOActions = (props?: UsePOActionsProps) => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<POFormData | null>(null);

    // List-level Direct Submit
    const handleDirectSubmit = async (item: POListItem | Record<string, unknown>) => {
        const itemAny = item as Record<string, unknown>;
        const poId = (itemAny.po_id || itemAny.po_header_id || itemAny.id) as number | string;
        if (!poId) return;

        try {
            setIsSubmitting(true);
            logger.info(`[usePOActions] Direct submitting PO: ${poId}`);
            await POService.submit(Number(poId));
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            props?.toast?.('ส่งอนุมัติสำเร็จ', 'success');
        } catch (error: unknown) {
            logger.error('[usePOActions] handleDirectSubmit error:', error);
            const errMsg = extractErrorMessage(error);
            props?.toast?.(errMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Form-level Save
    const handleConfirmSave = async () => {
        if (!props || !pendingPayload) return;
        const { poId, user, existingPO, onClose, onSuccess, toast, formMethods } = props;
        const { getValues } = formMethods;
        
        try {
            setIsSubmitting(true);
            
            // 🛡️ Data Integrity Guard: Strict Vendor ID Validation
            const safeVendorId = Number(pendingPayload.vendor_id);
            if (!safeVendorId || isNaN(safeVendorId) || safeVendorId <= 0) {
                throw new Error("Invalid Vendor ID. กรุณาเลือกผู้ขายที่ถูกต้องจากระบบ");
            }

            // 🧠 Safe Coercion Helper: Prevents NaN and treats 0/empty as undefined
            const safeId = (id: unknown): number | undefined => {
                if (id === null || id === undefined || id === "") return undefined;
                const num = Number(id);
                return isNaN(num) || num === 0 ? undefined : num;
            };

            // STRICT PAYLOAD ARCHITECTURE (Aligned with Backend Contract 100%)
            const fullPayload: CreatePOPayload = {
                po_date:            pendingPayload.po_date ? new Date(pendingPayload.po_date).toISOString() : new Date().toISOString(),
                pr_id:              safeId(pendingPayload.pr_id),
                vendor_id:          Number(pendingPayload.vendor_id),
                branch_id:          Number(pendingPayload.branch_id),
                warehouse_id:       Number(pendingPayload.ship_to_warehouse_id),
                base_currency_code: pendingPayload.base_currency_code || "THB",
                quote_currency_code: pendingPayload.currency_code || pendingPayload.quote_currency_code || "THB",
                exchange_rate:      Number(pendingPayload.exchange_rate || 1),
                exchange_rate_date: pendingPayload.exchange_rate_date ? new Date(pendingPayload.exchange_rate_date).toISOString() : new Date().toISOString(),
                tax_code_id:        Number(pendingPayload.tax_code_id),
                discount_expression: pendingPayload.discount_expression || "0",
                status:             "DRAFT", // Hardcode DRAFT for new creation
                created_at:         new Date().toISOString(),
                created_by:         Number(poId ? (getValues('created_by') || user?.id || 1) : (user?.id || 1)),
                
                po_lines: (pendingPayload.po_lines || []).map((item: POLine, index: number) => ({
                    line_no:        index + 1,
                    item_id:        Number(item.item_id),
                    pr_line_id:     safeId(item.pr_line_id),
                    rfq_line_id:    safeId(item.rfq_line_id), // 🎯 PR/QC Traceability
                    status:         "OPEN",
                    qty:            Number(item.qty_ordered ?? item.qty ?? 0),
                    uom_id:         Number(item.uom_id),
                    unit_price:     Number(item.unit_price),
                    tax_code_id:    pendingPayload.tax_code_id !== undefined ? Number(pendingPayload.tax_code_id) : Number(item.tax_code_id),
                    discount_expression: String(item.discount_expression || "0"),
                    required_receipt_type: item.required_receipt_type || "FULL",
                    description:    String(item.description || "")
                }))
            };

            const cleanPayload = (obj: unknown): unknown => {
                if (Array.isArray(obj)) {
                    return obj.map(item => cleanPayload(item));
                }
                if (obj !== null && typeof obj === 'object') {
                    const newObj: Record<string, unknown> = {};
                    const entries = Object.entries(obj as Record<string, unknown>);
                    for (const [key, val] of entries) {
                        const v = val;
                        if (v === undefined || v === null || (typeof v === 'number' && isNaN(v))) {
                            continue;
                        }
                        newObj[key] = cleanPayload(v);
                    }
                    return newObj;
                }
                return obj;
            };

            const baseCleanedPayload = cleanPayload(fullPayload) as Record<string, unknown>;
            const finalizedPayload = baseCleanedPayload as unknown as CreatePOPayload;

            logger.info("FINAL_PO_PAYLOAD (Cleaned + Null Override):", finalizedPayload);

            if (poId) {
                // 🔄 UPDATE FLOW (Deep Scan Patch)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { created_by, ...patchCandidate } = finalizedPayload;
                
                const updatePayload = {
                    ...patchCandidate,
                    updated_by: Number(user?.id || 1), // 🛡️ Mandatory for PATCH
                    status:     finalizedPayload.status || existingPO?.status || 'DRAFT',
                    created_at: finalizedPayload.created_at || existingPO?.created_at || new Date().toISOString(),
                };

                await POService.update(Number(poId), updatePayload as unknown as CreatePOPayload);
                
                // 🌟 Auto-submit if it was REJECTED
                if (existingPO?.status === 'REJECTED') {
                    logger.info(`[usePOActions] Auto-submitting PO ${poId} from REJECTED state`);
                    await POService.submit(Number(poId));
                }
            } else {
                CreatePOSchema.parse(finalizedPayload);
                await POService.create(finalizedPayload as unknown as CreatePOPayload);
            }

            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['pr-ready-for-po-triple'] });
            toast('บันทึกใบสั่งซื้อสำเร็จ', 'success');

            setIsConfirmModalOpen(false);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: unknown) {
            logger.error('[usePOActions] handleConfirmSave error:', error);
            const errMsg = extractErrorMessage(error);
            toast(errMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSubmit = (data: POFormData) => {
        if (!data.vendor_id || Number(data.vendor_id) <= 0) {
            props?.toast?.('กรุณาระบุผู้จัดจำหน่าย (Vendor) ก่อนบันทึกใบสั่งซื้อ', 'error');
            return;
        }
        setPendingPayload(data);
        setIsConfirmModalOpen(true);
    };

    return {
        isSubmitting,
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        pendingPayload,
        handleConfirmSave,
        onSubmit,
        handleDirectSubmit
    };
};