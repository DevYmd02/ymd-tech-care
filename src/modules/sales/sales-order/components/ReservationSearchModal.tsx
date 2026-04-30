import React, { useState, useCallback, useMemo } from 'react';
import { Search, ClipboardList, Check, X } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { cn } from '@/shared/utils/cn';
import { type ReservationHeader } from '@sales/reservation/services/reservation.service';
import { SalesOrderService } from '../services/sales-order.service';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@hooks/useDebounce';
import { format } from 'date-fns';

/**
 * @file ReservationSearchModal.tsx
 * @description Modal สำหรับค้นหาและเลือกใบจองสินค้า (Reservation) เพื่อนำมาสร้าง Sales Order
 */

export interface ReservationSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (reservation: ReservationHeader) => void;
    title?: string;
    headerColor?: string;
}

export const ReservationSearchModal: React.FC<ReservationSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
    title = 'ค้นหาใบจองสินค้า - Find Reservation',
    headerColor
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    // Fetch available reservations using the new API endpoint
    const { data: allReservations = [], isLoading } = useQuery({
        queryKey: ['available-reservations'],
        queryFn: () => SalesOrderService.getAvailableRS(),
        enabled: isOpen,
        staleTime: 0,
    });

    // Local filtering based on search term
    const reservations = useMemo(() => {
        if (!debouncedSearch) return allReservations;
        const lowerSearch = debouncedSearch.toLowerCase();
        return allReservations.filter((rs: ReservationHeader) => 
            rs.reservation_no?.toLowerCase().includes(lowerSearch) ||
            rs.customer_name?.toLowerCase().includes(lowerSearch) ||
            rs.customer_code?.toLowerCase().includes(lowerSearch)
        );
    }, [allReservations, debouncedSearch]);

    const handleSelect = useCallback((reservation: ReservationHeader) => {
        onSelect(reservation);
        onClose();
    }, [onSelect, onClose]);

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            headerColor={headerColor}
            titleIcon={
                <div className={cn(
                    "p-1.5 rounded-lg shadow-sm",
                    headerColor ? "bg-white/20" : "bg-indigo-600"
                )}>
                    <ClipboardList size={20} className="text-white" />
                </div>
            }
            width="max-w-[1200px]"
        >
            <div className="flex flex-col h-[70vh]">
                {/* Search Bar */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาเลขที่ใบจอง หรือ ชื่อลูกค้า..."
                            className="w-full pl-12 pr-4 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base text-gray-900 dark:text-white shadow-sm group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all font-medium placeholder-gray-400 dark:placeholder-gray-500"
                            autoFocus
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-auto p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 opacity-60">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
                            <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลใบจอง...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">เลขที่ใบจอง</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">วันที่</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0b1120]/30 transition-all">
                                {reservations.length > 0 ? (
                                    reservations.slice(0, 100).map((rs: ReservationHeader) => (
                                        <tr 
                                            key={rs.reservation_id} 
                                            className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group cursor-pointer"
                                            onClick={() => handleSelect(rs)}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform inline-block">
                                                    {rs.reservation_no}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">
                                                {rs.reservation_date ? format(new Date(rs.reservation_date), 'dd/MM/yyyy') : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(rs);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                                                >
                                                    เลือก
                                                    <Check size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-20 text-center items-center justify-center">
                                            <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                                                <Search size={64} className="mb-4 opacity-20" />
                                                <p className="text-xl font-bold">ไม่พบข้อมูลใบจอง</p>
                                                <p className="text-sm opacity-80">ลองเปลี่ยนคำค้นหาอีกครั้ง</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center px-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        แสดงข้อมูล <span className="font-bold text-indigo-600">{reservations.length}</span> รายการ
                    </p>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm active:scale-95"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </DialogFormLayout>
    );
});
