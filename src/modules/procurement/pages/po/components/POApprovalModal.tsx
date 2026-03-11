/**
 * @file POApprovalModal.tsx
 * @description PO Approval/Rejection Modal — presentational layer.
 * Business logic extracted to usePOApproval hook.
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertCircle, FileText, Eye, Clock } from 'lucide-react';
import { WindowFormLayout } from '@ui';
import { POStatusBadge } from '@ui';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { ConfirmationModal } from '@/shared/components/system/ConfirmationModal';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { usePOApproval } from '../hooks';

// ====================================================================================
// STYLE CONSTANTS (Blue PO accent)
// ====================================================================================

const s = {
    label:     'text-sm font-medium text-gray-500 dark:text-gray-400',
    value:     'text-sm font-semibold text-gray-900 dark:text-white',
    cardTitle: 'text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3 mb-4',
};

// ====================================================================================
// PROPS
// ====================================================================================

interface POApprovalModalProps {
    isOpen:    boolean;
    onClose:   () => void;
    poId:      number;
    onSuccess: () => void;
}

// ====================================================================================
// MAIN MODAL
// ====================================================================================

export default function POApprovalModal({
    isOpen,
    onClose,
    poId,
    onSuccess,
}: POApprovalModalProps) {

    // ── Modern UI State & Logic ──────────────────────────────────────────────
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'APPROVE' | 'REJECT' | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // ── Hook (Data & Service Logic) ──────────────────────────────────────────
    const {
        po,
        isLoading,
        isError,
        actionLoading,
        remark,
        setRemark,
        handleApprove,
        handleReject,
    } = usePOApproval({ isOpen, poId });

    // ── Handlers ──────────────────────────────────────────────────────────────
    
    /** Trigger confirmation before calling API */
    const handleActionClick = (action: 'APPROVE' | 'REJECT') => {
        if (action === 'REJECT' && (!remark || remark.trim() === '')) {
            toast('กรุณาระบุเหตุผลในการปฏิเสธ', 'error');
            return;
        }
        setConfirmAction(action);
        setIsConfirmOpen(true);
    };

    /** Execute the actual mutation (Close-First Pattern) */
    const handleConfirmExecution = async () => {
        try {
            if (confirmAction === 'APPROVE') {
                await handleApprove();
            } else if (confirmAction === 'REJECT') {
                await handleReject();
            }

            // 🎯 THE CLOSE-FIRST PATTERN (ON SUCCESS)
            setIsConfirmOpen(false); // Close confirm modal
            onClose();              // Close the main PO details modal
            
            toast(confirmAction === 'APPROVE' ? 'อนุมัติเอกสารสำเร็จ' : 'ปฏิเสธเอกสารสำเร็จ', 'success');

            // Delay query invalidation for smoother transition
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
                queryClient.invalidateQueries({ queryKey: ['po-detail', poId] });
            }, 100);

            onSuccess(); // Optional callback for parent
        } catch {
            // 🎯 ERROR RESILIENCE: Close ONLY the confirm modal
            // Keep the main modal open so the user doesn't lose their remark.
            setIsConfirmOpen(false);
            toast(confirmAction === 'APPROVE' ? 'เกิดข้อผิดพลาดในการอนุมัติ' : 'เกิดข้อผิดพลาดในการปฏิเสธ', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="อนุมัติ / ปฏิเสธ ใบสั่งซื้อ"
            titleIcon={
                <div className="bg-white/20 p-1 rounded-md shadow-sm">
                    <Eye size={14} strokeWidth={3} className="text-white" />
                </div>
            }
            headerColor="bg-blue-600"
            footer={
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-slate-100 dark:bg-gray-900 sticky bottom-0 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors"
                    >
                        ปิด
                    </button>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleActionClick('REJECT')}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 border-2 border-red-500 text-red-600 hover:bg-red-50 rounded-md text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            <XCircle size={16} /> ปฏิเสธ
                        </button>
                        <button
                            type="button"
                            onClick={() => handleActionClick('APPROVE')}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                        >
                            <CheckCircle size={16} /> อนุมัติ
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6">

                {/* Loading / Error States */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Clock className="animate-spin text-blue-600" size={32} />
                        <span className="ml-3 text-gray-500">กำลังโหลดข้อมูล...</span>
                    </div>
                )}
                {isError && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg">
                        <AlertCircle size={20} />
                        <span>ไม่สามารถโหลดข้อมูลได้</span>
                    </div>
                )}

                {po && !isLoading && (
                    <>
                        {/* ── Card 1: PO Summary ────────────────────────────── */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm p-5">
                            <div className={s.cardTitle}>
                                <FileText size={18} />
                                <span>ข้อมูลใบสั่งซื้อ</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className={s.label}>เลขที่ PO</p>
                                    <p className={s.value}>{po.po_no || '-'}</p>
                                </div>
                                <div>
                                    <p className={s.label}>วันที่ PO</p>
                                    <p className={s.value}>{formatThaiDate(po.po_date)}</p>
                                </div>
                                <div>
                                    <p className={s.label}>สถานะ</p>
                                    <POStatusBadge status={po.status} />
                                </div>
                                <div>
                                    <p className={s.label}>ผู้ขาย</p>
                                    <p className={s.value}>{po.vendor_name || '-'}</p>
                                </div>
                                <div>
                                    <p className={s.label}>อ้างอิง QC</p>
                                    <p className={s.value}>{po.qc_no || '-'}</p>
                                </div>
                                <div>
                                    <p className={s.label}>อ้างอิง PR</p>
                                    <p className={s.value}>{po.pr_no || '-'}</p>
                                </div>
                            </div>

                            {/* Finance */}
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className={s.label}>ยอดก่อนภาษี</p>
                                    <p className={s.value}>
                                        {po.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className={s.label}>ภาษี</p>
                                    <p className={s.value}>
                                        {po.tax_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className={s.label}>ยอดรวมสุทธิ</p>
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                        {po.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Card 2: Remark ────────────────────────────────── */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm p-5">
                            <div className={s.cardTitle}>
                                <FileText size={18} />
                                <span>หมายเหตุการอนุมัติ / ปฏิเสธ</span>
                            </div>
                            <textarea
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                rows={4}
                                className="w-full p-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white resize-none"
                                placeholder="ระบุหมายเหตุ (จำเป็นในกรณีปฏิเสธ)..."
                            />
                            <p className="text-xs text-gray-400 mt-1">* กรณีปฏิเสธ จำเป็นต้องระบุเหตุผล</p>
                        </div>
                    </>
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmExecution}
                isLoading={actionLoading}
                variant={confirmAction === 'APPROVE' ? 'success' : 'danger'}
                title={confirmAction === 'APPROVE' ? 'ยืนยันการอนุมัติ' : 'ยืนยันการปฏิเสธ'}
                description={
                    confirmAction === 'APPROVE' 
                    ? 'คุณต้องการอนุมัติใบสั่งซื้อนี้ใช่หรือไม่?' 
                    : `คุณต้องการปฏิเสธใบสั่งซื้อนี้ใช่หรือไม่?\nเหตุผล: ${remark}`
                }
                confirmText={confirmAction === 'APPROVE' ? 'อนุมัติ' : 'ปฏิเสธ'}
                cancelText="ยกเลิก"
            />
        </WindowFormLayout>
    );
}
