import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PRService } from '@/modules/procurement/services/pr.service';
import type { CreatePRPayload } from '@/modules/procurement/types/pr-types';
// Note: We'll inject the confirm dialog function to keep this hook UI-agnostic-ish, 
// or strictly return functions that *perform* the action, and let the coordinator handle the confirmation UI.
// For now, let's keep it simple and just expose the mutations/async ops.

export const usePRActions = () => {
    const queryClient = useQueryClient();
    const [isActionLoading, setIsActionLoading] = useState(false);

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
        setIsActionLoading(true);
        try {
            const success = await PRService.approve(id);
            if (success) {
                queryClient.invalidateQueries({ queryKey: ['prs'] });
                queryClient.invalidateQueries({ queryKey: ['pr', id] });
            }
            return success;
        } finally {
            setIsActionLoading(false);
        }
    }, [queryClient]);

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
        cancelPR,
        isActionLoading,
        setIsActionLoading // Expose setter if needed for coordinator to control state manually
    };
};
