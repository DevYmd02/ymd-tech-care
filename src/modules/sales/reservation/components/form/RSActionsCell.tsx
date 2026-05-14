import React, { useRef } from 'react';
import { Edit, Printer, Eye, Send } from 'lucide-react';
import type { ReservationHeader } from '../../services/reservation.service';
import { useQueryClient } from '@tanstack/react-query';
import { ReservationService } from '../../services/reservation.service';

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
    const queryClient = useQueryClient();
    const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = (id: string) => {
        if (!id) return;
        if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
        
        prefetchTimerRef.current = setTimeout(() => {
            queryClient.prefetchQuery({
                queryKey: ['reservation-detail', id],
                queryFn: () => ReservationService.getById(id),
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
    const id = String(row.reservation_id || row.id);

    return (
        <div className="flex items-center justify-center gap-1.5 w-full">
            {/* 1. VIEW Button (Ghost style with Eye) */}
            <button 
                onClick={() => onView(id, row)}
                onMouseEnter={() => handleMouseEnter(id)}
                onMouseLeave={handleMouseLeave}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all shrink-0"
                title="ดูรายละเอียด"
            >
                <Eye size={18} />
            </button>

            {/* 2. EDIT Button (Ghost Gold style) */}
            {row.status === 'DRAFT' && (
                <button 
                    onClick={() => onEdit(id, row)}
                    onMouseEnter={() => handleMouseEnter(id)}
                    onMouseLeave={handleMouseLeave}
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
                    className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-all shrink-0"
                    title="พิมพ์"
                >
                    <Printer size={18} />
                </button>
            )}
        </div>
    );
};

