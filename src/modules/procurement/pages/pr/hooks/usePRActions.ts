import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PRService } from '@/modules/procurement/services/pr.service';
import type { CreatePRPayload, PRHeader } from '@/modules/procurement/types';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { CheckCircle, Send } from 'lucide-react';
import { logger } from '@/shared/utils/logger';
import { extractErrorMessage } from '@/core/api/api';

export const usePRActions = () => {
    const queryClient = useQueryClient();
    const { confirm } = useConfirmation();
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [approvingId, setApprovingId] = useState<string | null>(null);

    const [rejectPRId, setRejectPRId] = useState<string | null>(null);
    const [isRejectReasonOpen, setIsRejectReasonOpen] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    // Mutation for creating PR
    const createPRMutation = useMutation({
        mutationFn: async (payload: CreatePRPayload) => {
            const newPR = await PRService.create(payload);
            if (!newPR?.pr_id) throw new Error("ไม่สามารถสร้างเอกสารได้");
            return { newPR };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prs'] });
        }
    });

    const updatePR = useCallback(async (id: string, payload: CreatePRPayload) => {
        setIsActionLoading(true);
        try {
            await PRService.update(id, payload);
            queryClient.invalidateQueries({ queryKey: ['prs'] });
            queryClient.invalidateQueries({ queryKey: ['pr', id] }); 
            return { success: true };
        } finally {
            setIsActionLoading(false);
        }
    }, [queryClient]);

    const deletePR = useCallback(async (id: string) => {
        setIsActionLoading(true);
        try {
            const success = await PRService.delete(id);
            if (success) {
                queryClient.invalidateQueries({ queryKey: ['prs'] });
            }
            return success;
        } finally {
            setIsActionLoading(false);
        }
    }, [queryClient]);

    const approvePR = useCallback(async (id: string) => {
        // Kept for backward compatibility or direct API usage if needed without UI
        const success = await PRService.approve(id);
        if (success) {
            queryClient.invalidateQueries({ queryKey: ['prs'] });
            queryClient.invalidateQueries({ queryKey: ['pr', id] });
        }
        return success;
    }, [queryClient]);

    const handleApprove = useCallback((id: string, callbacks?: { onSuccess?: () => void }) => {
        confirm({
            title: 'ยืนยันการอนุมัติ',
            description: 'คุณต้องการอนุมัติเอกสารนี้ใช่หรือไม่?',
            confirmText: 'อนุมัติ',
            cancelText: 'ยกเลิก',
            variant: 'success',
            icon: CheckCircle,
            onConfirm: async () => {
                try {
                    setApprovingId(id); // Disable buttons in list
                    const result = await PRService.approve(id);
                    if (!result || !result.success) {
                        throw new Error(result?.message || 'ไม่สามารถอนุมัติเอกสารได้');
                    }
                } catch (error) {
                    // Extract exact backend error for the toast
                    const errorMessage = extractErrorMessage(error);
                    throw new Error(errorMessage);
                }
            }
        }).then((confirmed) => {
            setApprovingId(null);
            if (confirmed) {
                // Success Modal (After loading modal closes)
                confirm({
                    title: 'อนุมัติสำเร็จ',
                    description: `เอกสารได้รับการอนุมัติเรียบร้อยแล้ว\nสถานะ: อนุมัติแล้ว (Approved)\nพร้อมสำหรับการสร้าง RFQ`,
                    confirmText: 'ตกลง',
                    hideCancel: true,
                    variant: 'success'
                });
                queryClient.invalidateQueries({ queryKey: ['prs'] });
                queryClient.invalidateQueries({ queryKey: ['pr', id] });
                callbacks?.onSuccess?.();
            }
        }).catch((error) => {
            setApprovingId(null);
            // Red Toast showing the specific backend message
            if (error instanceof Error && error.message !== 'cancel') {
                confirm({
                    title: 'อนุมัติไม่สำเร็จ',
                    description: error.message,
                    confirmText: 'ตกลง',
                    hideCancel: true,
                    variant: 'danger'
                });
            }
        });
    }, [confirm, queryClient]);

    const handleReject = useCallback(async (id: string) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันการไม่อนุมัติ',
            description: "คุณต้องการ 'ไม่อนุมัติ' เอกสารนี้ใช่หรือไม่?",
            confirmText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            variant: 'danger',
            // icon: XCircle // Optional: Add if imported
        });

        if (isConfirmed) {
            setRejectPRId(id);
            setIsRejectReasonOpen(true);
        }
    }, [confirm]);

    const submitReject = useCallback(async (reason: string, callbacks?: { onSuccess?: () => void }) => {
        if (!rejectPRId) return;

        setIsRejecting(true);
        try {
            await PRService.reject(rejectPRId, reason);
            // Assuming result handles success check internally or returns object
             await confirm({
                title: 'ดำเนินการสำเร็จ',
                description: 'เอกสารถูกไม่อนุมัติเรียบร้อยแล้ว',
                confirmText: 'ตกลง',
                hideCancel: true,
                variant: 'success'
            });
            
            queryClient.invalidateQueries({ queryKey: ['prs'] });
            queryClient.invalidateQueries({ queryKey: ['pr', rejectPRId] });
            
            setIsRejectReasonOpen(false);
            setRejectPRId(null);
            callbacks?.onSuccess?.();
            
        } catch (error) {
            logger.error('Reject failed', error);
            await confirm({ 
                title: 'เกิดข้อผิดพลาด', 
                description: 'เกิดข้อผิดพลาดในการไม่อนุมัติเอกสาร', 
                confirmText: 'ตกลง', 
                hideCancel: true, 
                variant: 'danger' 
            });
        } finally {
            setIsRejecting(false);
        }
    }, [rejectPRId, queryClient, confirm]);

    const closeRejectModal = useCallback(() => {
        setIsRejectReasonOpen(false);
        setRejectPRId(null);
    }, []);

    const cancelPR = useCallback(async (id: string) => {
        setIsActionLoading(true);
        try {
            const response = await PRService.cancel(id);
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['prs'] });
                queryClient.invalidateQueries({ queryKey: ['pr', id] });
                return true;
            } else {
                throw new Error(response.message);
            }
        } finally {
            setIsActionLoading(false);
        }
    }, [queryClient]);

    /**
     * handleDirectApproval — Send for Approval Flow (DRAFT → PENDING)
     * Shows confirmation dialog, then calls processDirectApproval which:
     * 1. Calls PATCH /pr/{id}/submit to change status DRAFT → PENDING (รออนุมัติ)
     *
     * Root cause fix: ไม่ต้อง PATCH header ก่อน เพราะ FK IDs จาก PRHeader เป็น string
     * แต่ backend DTO ต้องการ number → ทำให้เกิด 400 Bad Request
     */
    const handleDirectApproval = useCallback((pr: PRHeader, callbacks?: { onSuccess?: () => void }) => {
        const totalAmount = Number(pr.pr_base_total_amount ?? pr.total_amount ?? 0);
        const formattedAmount = totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        confirm({
            title: 'ยืนยันการส่งอนุมัติ',
            description: `คุณต้องการส่งเอกสาร ${pr.pr_no} เพื่อขออนุมัติใช่หรือไม่?\nยอดรวม: ${formattedAmount} บาท`,
            confirmText: 'ส่งอนุมัติ',
            cancelText: 'ยกเลิก',
            variant: 'info',
            icon: Send,
            onConfirm: async () => {
                const result = await PRService.processDirectApproval(pr.pr_id);
                if (!result || !result.success) {
                    throw new Error(result?.message || 'ส่งอนุมัติไม่สำเร็จ');
                }
            }
        }).then((confirmed) => {
            if (confirmed) {
                // Success Modal — สถานะเปลี่ยนเป็น PENDING (รออนุมัติ) ไม่ใช่ APPROVED
                confirm({
                    title: 'ส่งอนุมัติสำเร็จ',
                    description: `เอกสาร ${pr.pr_no} ถูกส่งเพื่อขออนุมัติเรียบร้อยแล้ว\nสถานะ: รออนุมัติ (Pending)`,
                    confirmText: 'ตกลง',
                    hideCancel: true,
                    variant: 'success',
                    icon: CheckCircle,
                });
                queryClient.invalidateQueries({ queryKey: ['prs'] });
                queryClient.invalidateQueries({ queryKey: ['pr', pr.pr_id] });
                callbacks?.onSuccess?.();
            }
        }).catch((error) => {
            if (error instanceof Error && error.message !== 'cancel') {
                const errorMessage = extractErrorMessage(error);
                confirm({
                    title: 'ส่งอนุมัติไม่สำเร็จ',
                    description: errorMessage,
                    confirmText: 'ตกลง',
                    hideCancel: true,
                    variant: 'danger'
                });
            }
            logger.error('Send for approval failed', error);
        });
    }, [confirm, queryClient]);

    return {
        createPRMutation,
        updatePR,
        deletePR,
        approvePR,
        handleApprove,
        handleDirectApproval,
        cancelPR,
        isActionLoading,
        approvingId,
        setIsActionLoading,
        // Reject Logic
        handleReject,
        submitReject,
        closeRejectModal,
        isRejectReasonOpen,
        isRejecting
    };
};
