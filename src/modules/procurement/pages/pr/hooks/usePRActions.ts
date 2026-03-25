import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PRService } from '@/modules/procurement/services/pr.service';
import type { CreatePRPayload, PRHeader } from '@/modules/procurement/types';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { Send } from 'lucide-react';

export const usePRActions = () => {
    const queryClient = useQueryClient();
    const { confirm } = useConfirmation();
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Mutation for creating PR
    const createPRMutation = useMutation({
        mutationFn: async (payload: CreatePRPayload) => {
            const newPR = await PRService.create(payload);
            if (!newPR?.pr_id) throw new Error("ไม่สามารถสร้างเอกสารได้");
            return { newPR };
        }
    });

    const approveMutation = useMutation({
        mutationFn: (id: number) => PRService.approvePR(id)
    });

    const rejectMutation = useMutation({
        mutationFn: (id: number) => PRService.rejectPR(id)
    });

    const submitMutation = useMutation({
        mutationFn: (id: number) => PRService.processDirectApproval(id)
    });

    const updatePR = useCallback(async (id: number, payload: CreatePRPayload) => {
        setIsActionLoading(true);
        try {
            const result = await PRService.update(id, payload);
            return result;
        } finally {
            setIsActionLoading(false);
        }
    }, []);

    const deletePR = useCallback(async (id: number) => {
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

    const approvePR = useCallback(async (id: number) => {
        // Kept for backward compatibility or direct API usage if needed without UI
        const success = await PRService.approvePR(id);
        if (success) {
            // Close-First pattern: 100ms delay
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['prs'] });
                queryClient.invalidateQueries({ queryKey: ['pr', id] });
            }, 100);
        }
        return success;
    }, [queryClient]);

    // @deprecated Note: UI handlers for approve/reject have been removed.
    // Approvals should now only be processed via the AV Module.

    const cancelPR = useCallback(async (id: number) => {
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
    const handleDirectApproval = useCallback((pr: PRHeader) => {
        const totalAmount = Number(pr.pr_base_total_amount ?? pr.total_amount ?? 0);
        const formattedAmount = totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        return confirm({
            title: 'ยืนยันการส่งอนุมัติ',
            description: `คุณต้องการส่งเอกสาร ${pr.pr_no} เพื่อขออนุมัติใช่หรือไม่?\nยอดรวม: ${formattedAmount} บาท`,
            confirmText: 'ส่งอนุมัติ',
            cancelText: 'ยกเลิก',
            variant: 'info',
            icon: Send,
            onConfirm: async () => {
                await submitMutation.mutateAsync(pr.pr_id);
                // Close-First: Invalidate after delay
                setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ['prs'] });
                    queryClient.invalidateQueries({ queryKey: ['pr', pr.pr_id] });
                }, 100);
            }
        });
    }, [confirm, submitMutation, queryClient]);

    return {
        createPRMutation,
        updatePR,
        deletePR,
        approvePR,
        handleDirectApproval,
        cancelPR,
        isActionLoading,
        setIsActionLoading,
        // Exposed Mutations
        approveMutation,
        rejectMutation,
        submitMutation
    };
};
