import React from 'react';
import { Edit, Printer, Eye, Send } from 'lucide-react';
import type { ReservationHeader } from '../services/reservation.service';

interface RSActionsCellProps {
    row: ReservationHeader;
    onView: (id: string, row: ReservationHeader) => void;
    onEdit: (id: string, row: ReservationHeader) => void;
    onConfirm: (id: string, row: ReservationHeader) => void;
}

export const RSActionsCell: React.FC<RSActionsCellProps> = ({ 
    row, 
    onView, 
    onEdit,
    onConfirm
}) => {
    const id = String(row.reservation_id || row.id);

    return (
        <div className="flex items-center justify-center gap-1.5 w-full">
            {/* 1. VIEW Button (Ghost style with Eye) */}
            <button 
                onClick={() => onView(id, row)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all shrink-0"
                title="ดูรายละเอียด"
            >
                <Eye size={18} />
            </button>

            {/* 2. EDIT Button (Ghost Gold style) */}
            {row.status === 'DRAFT' && (
                <button 
                    onClick={() => onEdit(id, row)}
                    className="flex items-center gap-1 px-2 py-1 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all font-bold text-[11px] shrink-0"
                >
                    <Edit size={14} />
                    แก้ไข
                </button>
            )}

            {/* 3. SEND FOR APPROVAL Button (Solid Green style) */}
            {row.status === 'DRAFT' && (
                <button 
                    onClick={() => onConfirm(id, row)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm active:scale-95 font-bold text-[11px] whitespace-nowrap shrink-0"
                >
                    <Send size={14} />
                    ยืนยัน
                </button>
            )}

            {/* 4. PRINT Button (For Non-Draft) */}
            {row.status !== 'DRAFT' && (
                <button 
                    className="flex items-center gap-1 px-2 py-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all font-bold text-[11px] shrink-0"
                >
                    <Printer size={14} />
                    พิมพ์
                </button>
            )}
        </div>
    );
};
