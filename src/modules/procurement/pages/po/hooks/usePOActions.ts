import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConfirmation } from '@/shared/hooks';
import { POService } from '@/modules/procurement/services';
import type { POListItem } from '@/modules/procurement/types';
import { Send } from 'lucide-react';
import { logger } from '@/shared/utils/logger';

// ====================================================================================
// HOOK
// ====================================================================================

export const usePOActions = () => {
    const queryClient = useQueryClient();
    const { confirm } = useConfirmation();

    /**
     * Issue PO: APPROVED → ISSUED
     * Shows confirm dialog, calls POService.issue(), then auto-refreshes list.
     */
    const handleIssuePO = useCallback((item: POListItem) => {
        confirm({
            title:       'ยืนยันการออกใบสั่งซื้อ',
            description: `คุณต้องการออกใบสั่งซื้อเลขที่ ${item.po_no} ใช่หรือไม่?\nยอดรวม: ${item.total_amount?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`,
            confirmText: 'ออก PO',
            cancelText:  'ยกเลิก',
            variant:     'info',
            icon:        Send,
            onConfirm:   async () => {
                await POService.issue(item.po_id || '');
            },
        }).then((confirmed) => {
            if (confirmed) {
                confirm({
                    title:       'ออก PO สำเร็จ!',
                    description: `ใบสั่งซื้อ ${item.po_no} ถูกส่งให้ผู้ขายแล้ว`,
                    confirmText: 'ตกลง',
                    hideCancel:  true,
                    variant:     'success',
                });
                // Auto-Refresh: invalidate PO list cache
                queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            }
        }).catch((error) => {
            logger.error('[usePOActions] handleIssuePO error:', error);
        });
    }, [confirm, queryClient]);

    return {
        handleIssuePO,
    };
};