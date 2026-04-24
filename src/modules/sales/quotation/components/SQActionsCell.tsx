import React from 'react';
import { Eye, Edit, Send, Clock } from 'lucide-react';
import type { QuotationHeader } from '@sales/quotation/types/quotation.types';

interface SQActionsCellProps {
    row: QuotationHeader;
    onView: (id: string, row?: QuotationHeader) => void;
    onEdit: (id: string, row?: QuotationHeader) => void;
    onViewHistory?: (row: QuotationHeader) => void;
    onSendApprove: (id: string) => void;
}

export const SQActionsCell: React.FC<SQActionsCellProps> = ({
    row,
    onView,
    onEdit,
    onViewHistory,
    onSendApprove,
}) => {
    const id = String(row.id || row.sq_id);
    const status = (row.status || '').toUpperCase();
    const isDraft = status === 'DRAFT';
    const isPending = status === 'PENDING';
    const isRejected = status === 'REJECTED';
    const isApproved = status === 'APPROVED';
    const canViewHistory = isApproved || isRejected;

    return (
        <div className="flex items-center justify-center gap-1">
            {/* 1. VIEW: Always Visible */}
            <button 
                onClick={() => onView(id, row)}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all" 
                title="ดูรายละเอียด"
            >
                <Eye size={16} />
            </button>

            {/* 2. HISTORY: For Accepted/Rejected */}
            {canViewHistory && (
                <button 
                    onClick={() => onViewHistory && onViewHistory(row)}
                    className="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-md transition-all" 
                    title="ดูประวัติการอนุมัติ"
                >
                    <Clock size={16} />
                </button>
            )}

            {/* 2. REJECTED: Unified Action */}
            {isRejected && (
                <button 
                    onClick={() => onEdit(id, row)}
                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded shadow-sm transition-all whitespace-nowrap ml-1"
                    title="แก้ไขและส่งอนุมัติใหม่"
                >
                    <Edit size={14} /> 
                    <span className="text-[10px] font-bold">แก้ไขและส่งอนุมัติใหม่</span>
                </button>
            )}

            {/* 3. DRAFT/PENDING: Standard Edit */}
            {(isDraft || isPending) && (
                <button 
                    onClick={() => onEdit(id, row)}
                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded shadow-sm border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all whitespace-nowrap"
                    title="แก้ไข"
                >
                    <Edit size={14} /> 
                    <span className="text-[10px] font-bold">แก้ไข</span>
                </button>
            )}
 
            {/* 4. SEND APPROVAL: Only for Drafts */}
            {isDraft && (
                <button 
                    onClick={() => onSendApprove(id)}
                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                    title="ส่งอนุมัติ"
                >
                    <Send size={12} /> ส่งอนุมัติ
                </button>
            )}
        </div>
    );
};
