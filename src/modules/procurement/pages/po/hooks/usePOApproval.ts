import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { POService } from '@/modules/procurement/services';
import type { POListItem } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';

// ====================================================================================
// CONFIG
// ====================================================================================

interface UsePOApprovalOptions {
    isOpen:    boolean;
    poId:      string;
}

// ====================================================================================
// HOOK
// ====================================================================================

export const usePOApproval = ({
    isOpen,
    poId,
}: UsePOApprovalOptions) => {
    // ── Data Fetching ─────────────────────────────────────────────────────────
    const { data: po, isLoading, isError } = useQuery<POListItem | null>({
        queryKey: ['po-detail', poId],
        queryFn: () => POService.getById(poId),
        enabled: isOpen && !!poId,
        staleTime: 0,
    });

    // ── Local State ───────────────────────────────────────────────────────────
    const [actionLoading, setActionLoading] = useState(false);
    const [remark, setRemark] = useState('');

    // Reset form when opening new PO
    useEffect(() => {
        if (isOpen) {
            setRemark('');
        }
    }, [isOpen, poId]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleApprove = useCallback(async () => {
        setActionLoading(true);
        try {
            await POService.approve(poId);
            // NOTE: UI orchestration (toast/close/invalidate) moved to component for "Close-First" pattern
        } catch (error) {
            logger.error('[usePOApproval] handleApprove error:', error);
            throw error; // Let component handle error state
        } finally {
            setActionLoading(false);
        }
    }, [poId]);

    const handleReject = useCallback(async () => {
        setActionLoading(true);
        try {
            await POService.reject(poId, remark);
            // NOTE: UI orchestration (toast/close/invalidate) moved to component for "Close-First" pattern
        } catch (error) {
            logger.error('[usePOApproval] handleReject error:', error);
            throw error; // Let component handle error state
        } finally {
            setActionLoading(false);
        }
    }, [poId, remark]);

    return {
        po,
        isLoading,
        isError,
        actionLoading,
        remark,
        setRemark,
        handleApprove,
        handleReject,
    };
};
