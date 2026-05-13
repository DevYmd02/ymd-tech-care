import { useRef } from 'react';
import { Eye, Edit, Send, Clock, Printer } from 'lucide-react';
import type { PRHeader } from '@/modules/procurement/types';
import { useQueryClient } from '@tanstack/react-query';
import { PRService } from '@/modules/procurement/services/pr.service';

interface PRActionsCellProps {
    row: PRHeader;
    onEdit: (id: number) => void;
    onView: (id: number) => void;
    onViewHistory?: (id: number) => void;

    onSendApproval: (row: PRHeader) => void;
}

export const PRActionsCell = ({ 
    row: item, 
    onEdit, 
    onView,
    onViewHistory,
    onSendApproval, 
}: PRActionsCellProps) => {
    const queryClient = useQueryClient();

    const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 🚀 INTENT-BASED PRE-FETCHING: Only fetch if the user stays on the button for 80ms
    const handleMouseEnter = () => {
        if (!item.pr_id) return;
        if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);

        prefetchTimerRef.current = setTimeout(() => {
            queryClient.prefetchQuery({
                queryKey: ['pr-detail', item.pr_id],
                queryFn: () => PRService.getDetail(item.pr_id),
                staleTime: 60 * 1000,
            });
        }, 80); 
    };

    const handleMouseLeave = () => {
        if (prefetchTimerRef.current) {
            clearTimeout(prefetchTimerRef.current);
            prefetchTimerRef.current = null;
        }
    };

    return (
        <div className="flex items-center justify-center gap-1">
            {/* 1. VIEW: Always Visible */}
            <button 
                onClick={() => onView(item.pr_id)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all" 
                title="ดูรายละเอียด"
            >
                <Eye size={16} />
            </button>

            {/* History Trigger for relevant states */}
            {['APPROVED', 'PARTIAL', 'COMPLETED'].includes(item.status as string) && onViewHistory && (
                <button 
                    onClick={() => onViewHistory(item.pr_id)}
                    className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-all" 
                    title="ประวัติการอนุมัติ"
                >
                    <Clock size={16} />
                </button>
            )}

            {/* 2. EDIT: Available for DRAFT, REJECTED, and PENDING (Restored at user request) */}
            {(item.status === 'DRAFT' || item.status === 'REJECTED' || item.status === 'PENDING') && (
                <button 
                    onClick={() => onEdit(item.pr_id)}
                    onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded shadow-sm border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all whitespace-nowrap"
                    title={item.status === 'REJECTED' ? 'แก้ไขและส่งอนุมัติใหม่' : 'แก้ไข'}
                >
                    <Edit size={14} /> 
                    <span className="text-[10px] font-bold">{item.status === 'REJECTED' ? 'แก้ไขและส่งอนุมัติใหม่' : 'แก้ไข'}</span>
                </button>
            )}

            {/* 3. SEND APPROVAL: Only for DRAFT */}
            {item.status === 'DRAFT' && (
                <button 
                    onClick={() => onSendApproval(item)}
                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                    title="ส่งอนุมัติ"
                >
                    <Send size={12} /> ส่งอนุมัติ
                </button>
            )}

            {/* 3. PENDING: Handled by AV Module */}
            {/* The previous Approve/Reject actions have been removed to enforce usage of the dedicated Approval (AV) Module */}
            

            {/* Print Trigger for finalized states */}
            {['APPROVED', 'PARTIAL', 'COMPLETED'].includes(item.status as string) && (
                <button 
                onClick={() => {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                    window.open(`${apiUrl}/pr/${item.pr_id}/pdf`, '_blank');
                }}
                className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all" 
                title="พิมพ์ใบขอซื้อ"
                >
                    <Printer size={16} />
                </button>
            )}

             {/* 5. CANCELLED: View Only */}
             {item.status === 'CANCELLED' && (
                null
            )}
        </div>
    );
};