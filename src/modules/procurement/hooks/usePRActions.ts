import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PRService } from '@/modules/procurement/services/pr.service';
import type { CreatePRPayload } from '@/modules/procurement/types/pr-types';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { CheckCircle } from 'lucide-react';
import { logger } from '@/shared/utils/logger';

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
                setApprovingId(id); // Disable buttons in list
                const result = await PRService.approve(id);
                if (!result || !result.success) {
                    throw new Error(result?.message || 'ไม่สามารถอนุมัติเอกสารได้');
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
        }).catch(() => {
             // Error handled by context or ignored here
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

    return {
        createPRMutation,
        updatePR,
        deletePR,
        approvePR,
        handleApprove,
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
