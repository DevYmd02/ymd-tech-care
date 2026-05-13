import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PRService } from '@/modules/procurement/services/pr.service';
import type { CreatePRPayload, PRHeader, PRListResponse } from '@/modules/procurement/types';
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
        mutationFn: (id: number) => PRService.processDirectApproval(id),
        // 🚀 Optimistic Update for 160-user scale: UI feels instant
        onMutate: async (id) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['prs'] });
            await queryClient.cancelQueries({ queryKey: ['pr', id] });

            // Snapshot the previous value
            const previousPrs = queryClient.getQueryData(['prs']);
            const previousPr = queryClient.getQueryData(['pr', id]);

            // Optimistically update to the new value
            queryClient.setQueryData(['prs'], (old: PRListResponse | undefined) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map((p: PRHeader) => 
                        p.pr_id === id ? { ...p, status: 'PENDING' } : p
                    )
                };
            });

            queryClient.setQueryData(['pr', id], (old: PRHeader | undefined) => {
                if (!old) return old;
                return { ...old, status: 'PENDING' };
            });

            // Return a context object with the snapshotted value
            return { previousPrs, previousPr };
        },
        // If the mutation fails, use the context returned from onMutate to roll back
        onError: (_err, id, context) => {
            if (context?.previousPrs) {
                queryClient.setQueryData(['prs'], context.previousPrs);
            }
            if (context?.previousPr) {
                queryClient.setQueryData(['pr', id], context.previousPr);
            }
        },
        // Always refetch after error or success to ensure we have the correct server state
        onSettled: (_data, _error, id) => {
            queryClient.invalidateQueries({ queryKey: ['prs'] });
            queryClient.invalidateQueries({ queryKey: ['pr', id] });
        },
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
            // 💡 Fix: Invalidate immediately and await it to ensure UI is fresh
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['prs'] }),
                queryClient.invalidateQueries({ queryKey: ['pr', id] })
            ]);
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
                // 💡 Fix: Invalidate immediately and await it to ensure UI is fresh
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['prs'] }),
                    queryClient.invalidateQueries({ queryKey: ['pr', pr.pr_id] })
                ]);
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
