import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { POService } from '@/modules/procurement/services';
import type { POListItem } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';

// ====================================================================================
// CONFIG
// ====================================================================================

interface UsePOApprovalOptions {
    isOpen:    boolean;
    poId:      string;
    onClose:   () => void;
    onSuccess: () => void;
}

// ====================================================================================
// HOOK
// ====================================================================================

export const usePOApproval = ({
    isOpen,
    poId,
    onClose,
    onSuccess,
}: UsePOApprovalOptions) => {
    const queryClient = useQueryClient();

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
        if (!confirm('ยืนยันการอนุมัติใบสั่งซื้อนี้?')) return;

        setActionLoading(true);
        try {
            await POService.approve(poId, remark);
            // Auto-Refresh: invalidate PO list + detail caches
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['po-detail', poId] });
            onSuccess();
            onClose();
        } catch (error) {
            logger.error('[usePOApproval] handleApprove error:', error);
            alert('เกิดข้อผิดพลาดในการอนุมัติ');
        } finally {
            setActionLoading(false);
        }
    }, [poId, remark, onSuccess, onClose, queryClient]);

    const handleReject = useCallback(async () => {
        if (!remark) {
            alert('กรุณาระบุเหตุผลในการปฏิเสธ');
            return;
        }
        if (!confirm('ยืนยันการปฏิเสธใบสั่งซื้อนี้?')) return;

        setActionLoading(true);
        try {
            await POService.reject(poId, remark);
            // Auto-Refresh: invalidate PO list + detail caches
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['po-detail', poId] });
            onSuccess();
            onClose();
        } catch (error) {
            logger.error('[usePOApproval] handleReject error:', error);
            alert('เกิดข้อผิดพลาดในการปฏิเสธ');
        } finally {
            setActionLoading(false);
        }
    }, [poId, remark, onSuccess, onClose, queryClient]);

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
