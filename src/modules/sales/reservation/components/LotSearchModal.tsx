import React, { useState, useCallback, useMemo } from 'react';
import { Search, Tag, Check, X, AlertCircle } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { ReservationInventoryService } from '@sales/reservation/services/reservation-inventory.service';
import type { LotNo } from '@inventory/types/inventory-master.types';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@hooks/useDebounce';
import { formatThaiDate as formatDate } from '@utils/dateUtils';

export interface LotSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (lot: LotNo) => void;
    itemId?: string | number;
    warehouseId?: string | number | null;
    locationId?: string | number | null;
    title?: string;
}

export const LotSearchModal: React.FC<LotSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
    itemId,
    warehouseId,
    locationId,
    title = 'ค้นหาล็อตสินค้า - Search Lot Numbers'
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    // Fetch lots - supports progressive filtering by itemId, warehouseId, and locationId
    // Now using ReservationService to get lots with stock balance specifically for booking
    const { data: response, isLoading } = useQuery({
        queryKey: ['lot-lookup-reservation', debouncedSearch, itemId, warehouseId, locationId],
        queryFn: () => ReservationInventoryService.getAvailableLots({ 
            q: debouncedSearch, 
            item_id: itemId, 
            warehouse_id: warehouseId ?? undefined,
            location_id: locationId ?? undefined,
            limit: 100 
        }),
        enabled: isOpen,
    });

    const lots = useMemo(() => response?.items || [], [response]);

    const handleSelect = useCallback((lot: LotNo) => {
        onSelect(lot);
        onClose();
    }, [onSelect, onClose]);

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            titleIcon={
                <div className="bg-purple-600 p-1.5 rounded-lg shadow-sm">
                    <Tag size={20} className="text-white" />
                </div>
            }
            width="max-w-[1000px]"
            headerColor="bg-purple-600"
        >
            <div className="flex flex-col h-[60vh]">
                {/* Search Bar */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาเลขล็อต (Lot No)..."
                            className="w-full pl-12 pr-4 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-base text-gray-900 dark:text-white shadow-sm group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all font-medium placeholder-gray-400 dark:placeholder-gray-500"
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
                    
                    {!itemId && (
                        <div className="mt-3 flex items-center text-amber-600 dark:text-amber-500 text-sm font-medium bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-800/30">
                            <AlertCircle size={16} className="mr-2" />
                            กรุณาเลือกสินค้าก่อนทำการค้นหาล็อต เพื่อให้ระบบกรองข้อมูลได้อย่างถูกต้อง
                        </div>
                    )}
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-auto p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-60">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4" />
                            <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลล็อต...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">เลขล็อต (Lot No.)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right">จำนวนคงเหลือ</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right">Sale Stock</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">วันผลิต (MFG)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">วันหมดอายุ (EXP)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0b1120]/30 transition-all">
                                {lots.length > 0 ? (
                                    lots.map((lot) => (
                                        <tr 
                                            key={lot.lot_no_id || lot.id} 
                                            className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors group cursor-pointer"
                                            onClick={() => handleSelect(lot)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform inline-block w-fit">
                                                        {lot.code}
                                                    </span>
                                                    {lot.name_th && <span className="text-xs text-gray-500 mt-1">{lot.name_th}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-gray-900 dark:text-white">
                                                    {(lot.balance_qty ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    {(lot.sale_stock ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                                                    {lot.mfg_date ? formatDate(lot.mfg_date) : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                                                    {lot.expiry_date ? formatDate(lot.expiry_date) : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(lot);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                                                >
                                                    เลือก
                                                    <Check size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center items-center justify-center">
                                            <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                                                <Tag size={56} className="mb-4 opacity-20" />
                                                <p className="text-xl font-bold">ไม่พบข้อมูลล็อต</p>
                                                <p className="text-sm opacity-80 mt-1">
                                                    {itemId ? "ไม่มีล็อตสินค้าสำหรับรหัสสินค้านี้" : "พิมพ์ค้นหาคีย์เวิร์ดอีกครั้ง หรือเลือกสินค้าก่อน"}
                                                </p>
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
                        แสดงข้อมูล <span className="font-bold text-purple-600">{lots.length}</span> รายการ
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
