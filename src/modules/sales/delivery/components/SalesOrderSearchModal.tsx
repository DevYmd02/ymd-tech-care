import { useState, useCallback, useMemo, memo } from 'react';
import { Search, ShoppingCart, Check, X } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { cn } from '@/shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@hooks/useDebounce';
import { type SalesOrderHeader } from '@sales/sales-order/services/sales-order.service';
import { DeliveryService } from '../services/delivery.service';
import { SQStatusBadge } from '@sales/shared/components/SQStatusBadge';

/**
 * @file SalesOrderSearchModal.tsx
 * @description Modal สำหรับค้นหาและเลือกใบสั่งขาย (Sales Order) เพื่อนำมาสร้างใบจัดส่ง
 */

export interface SalesOrderSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (so: SalesOrderHeader) => void;
    title?: string;
    headerColor?: string;
}

export const SalesOrderSearchModal = memo(({
    isOpen,
    onClose,
    onSelect,
    title = 'ค้นหาใบสั่งขาย - Find Sales Order',
    headerColor,
}: SalesOrderSearchModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    const { data: soResponse, isLoading } = useQuery({
        queryKey: ['sales-orders-search', debouncedSearch],
        queryFn: () =>
            DeliveryService.getPendingDeliveries({
                so_no: debouncedSearch,
            }),
        enabled: isOpen,
        staleTime: 30 * 1000,
    });

    const soList = useMemo(() => {
        const data = soResponse?.data || [];
        if (!debouncedSearch) return data;
        const lowerSearch = debouncedSearch.toLowerCase();
        return data.filter((so: SalesOrderHeader) =>
            so.so_no?.toLowerCase().includes(lowerSearch) ||
            so.customer_name?.toLowerCase().includes(lowerSearch)
        );
    }, [soResponse, debouncedSearch]);

    const handleSelect = useCallback(
        (so: SalesOrderHeader) => {
            onSelect(so);
            onClose();
        },
        [onSelect, onClose]
    );

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('en-GB');
        } catch {
            return dateStr;
        }
    };

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            headerColor={headerColor}
            titleIcon={
                <div className={cn('p-1.5 rounded-lg shadow-sm', headerColor ? 'bg-white/20' : 'bg-teal-600')}>
                    <ShoppingCart size={20} className="text-white" />
                </div>
            }
            width="max-w-[1100px]"
        >
            <div className="flex flex-col h-[70vh]">
                {/* Search Bar */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="relative group">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors"
                            size={20}
                        />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาเลขที่ SO หรือ ชื่อลูกค้า (แสดงเฉพาะ APPROVED)"
                            className="w-full pl-12 pr-4 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-base text-gray-900 dark:text-white shadow-sm transition-all font-medium placeholder-gray-400 dark:placeholder-gray-500"
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

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 opacity-60">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4" />
                            <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลใบสั่งขาย...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                                        เลขที่ SO
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                                        วันที่
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                                        ลูกค้า
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">
                                        สถานะ
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">
                                        จัดการ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0b1120]/30">
                                {soList.length > 0 ? (
                                    soList.slice(0, 100).map((so: SalesOrderHeader) => (
                                        <tr
                                            key={so.so_id}
                                            className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors group cursor-pointer"
                                            onClick={() => handleSelect(so)}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-teal-600 dark:text-teal-400">
                                                    {so.so_no}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">
                                                {formatDate(so.so_date)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-200 font-medium">
                                                {so.customer_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center scale-90">
                                                    <SQStatusBadge status={so.status} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(so);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                                                >
                                                    เลือก
                                                    <Check size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                                                <ShoppingCart size={64} className="mb-4 opacity-20" />
                                                <p className="text-xl font-bold">ไม่พบใบสั่งขาย</p>
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
                        แสดงข้อมูล{' '}
                        <span className="font-bold text-teal-600">{soList.length}</span> รายการ
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

SalesOrderSearchModal.displayName = 'SalesOrderSearchModal';
