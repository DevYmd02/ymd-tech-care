import { Eye, Edit, Send, CheckCircle, XCircle, FileText } from 'lucide-react';
import type { PRHeader } from '@/modules/procurement/types';

interface PRActionsCellProps {
    row: PRHeader;
    onEdit: (id: string) => void;
    onView: (id: string) => void;

    onSendApproval: (row: PRHeader) => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onCreateRFQ: (item: PRHeader) => void;
    isApproving?: boolean;
}

export const PRActionsCell = ({ 
    row: item, 
    onEdit, 
    onView,

    onSendApproval, 
    onApprove, 
    onReject, 
    onCreateRFQ,
    isApproving = false
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

            {/* 2. DRAFT Actions: Edit, Delete, Send Approval */}
            {item.status === 'DRAFT' && (
                <>
                    <button 
                        onClick={() => onEdit(item.pr_id)}
                        className="flex items-center gap-1 pl-1.5 pr-2 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded shadow-sm border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all whitespace-nowrap"
                        title="แก้ไข"
                    >
                        <Edit size={14} /> 
                        <span className="text-[10px] font-bold">แก้ไข</span>
                    </button>


                    <button 
                        onClick={() => onSendApproval(item)}
                        className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                        title="ส่งอนุมัติ"
                    >
                        <Send size={12} /> ส่งอนุมัติ
                    </button>
                </>
            )}

            {/* 3. PENDING: Approve / Reject (Approver View) */}
            {item.status === 'PENDING' && (
                <>
                    <button 
                        onClick={() => onApprove(item.pr_id)}
                        disabled={isApproving}
                        className={`flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap ${
                            isApproving 
                            ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        title="อนุมัติ"
                    >
                        <CheckCircle size={12} /> 
                        อนุมัติ
                    </button>
                    <button 
                        onClick={() => onReject(item.pr_id)}
                        disabled={isApproving}
                        className={`flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap ${
                            isApproving
                            ? 'bg-gray-400 cursor-not-allowed opacity-70'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                        title="ไม่อนุมัติ"
                    >
                        <XCircle size={12} /> ไม่อนุมัติ
                    </button>
                </>
            )}
            
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