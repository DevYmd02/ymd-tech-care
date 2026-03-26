import { Eye, Edit, Send, FileText, Clock } from 'lucide-react';
import type { PRHeader } from '@/modules/procurement/types';

interface PRActionsCellProps {
    row: PRHeader;
    onEdit: (id: number) => void;
    onView: (id: number) => void;
    onViewHistory?: (id: number) => void;

    onSendApproval: (row: PRHeader) => void;
    onCreateRFQ: (item: PRHeader) => void;
}

export const PRActionsCell = ({ 
    row: item, 
    onEdit, 
    onView,
    onViewHistory,

    onSendApproval, 
    onCreateRFQ
}: PRActionsCellProps) => {

    return (
        <div className="flex items-center justify-center gap-1">
            {/* 1. VIEW: Always Visible */}
            <button 
                onClick={() => onView(item.pr_id)}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all" 
                title="ดูรายละเอียด"
            >
                <Eye size={16} />
            </button>

            {/* History Trigger for relevant states */}
            {['PENDING', 'APPROVED', 'PARTIAL', 'COMPLETED'].includes(item.status as string) && onViewHistory && (
                <button 
                    onClick={() => onViewHistory(item.pr_id)}
                    className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-all" 
                    title="ประวัติการอนุมัติ"
                >
                    <Clock size={16} />
                </button>
            )}

            {/* 2. EDIT: Available for DRAFT, REJECTED (PENDING is locked to prevent Approval Drift) */}
            {(item.status === 'DRAFT' || item.status === 'REJECTED') && (
                <button 
                    onClick={() => onEdit(item.pr_id)}
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
            
            {/* 4. APPROVED Actions: Create RFQ */}
            {item.status === 'APPROVED' && (
                <button 
                    onClick={() => onCreateRFQ(item)}
                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                    title="สร้างใบขอเสนอราคา"
                >
                    <FileText size={12} /> สร้าง RFQ
                </button>
            )}

             {/* 5. CANCELLED: View Only */}
             {item.status === 'CANCELLED' && (
                null
            )}
        </div>
    );
};