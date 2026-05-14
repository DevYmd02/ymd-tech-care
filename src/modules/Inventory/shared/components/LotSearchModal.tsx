import React, { useState, useMemo, useCallback } from 'react';
import { Search, Tag, Check, X, Calendar } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { LotNoService } from '@master-data/inventory/services/inventory-master.service';
import type { LotNo } from '@master-data/inventory/types/inventory-master.types';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@hooks/useDebounce';
import { formatNumber } from '@/shared/utils';

/**
 * @file LotSearchModal.tsx
 * @description Localized Search Modal for selecting Lot Numbers in Inventory module.
 * @pattern ตามสไตล์ของ Sales Module ระดับ Premium
 */

export interface LotSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (lot: LotNo) => void;
    itemId?: number | string;
}

export const LotSearchModal: React.FC<LotSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
    itemId
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    // ดึงข้อมูล Lot สินค้าผ่าน LotNoService
    const { data: response, isLoading } = useQuery({
        queryKey: ['inventory-lots-lookup', debouncedSearch, itemId],
        queryFn: () => LotNoService.getAll({ 
            q: debouncedSearch, 
            item_id: itemId,
            limit: 50 
        }),
        enabled: isOpen && !!itemId,
    });

    const lots = useMemo(() => response?.items || [], [response]);

    const handleSelect = useCallback((lot: LotNo) => {
        onSelect(lot);
        onClose();
    }, [onSelect, onClose]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="เลือก Lot สินค้า - Select Lot Number"
            headerColor="bg-blue-600"
            titleIcon={
                <div className="bg-white/20 p-1.5 rounded-lg shadow-sm">
                    <Tag size={20} className="text-white" />
                </div>
            }
            width="max-w-[1100px]"
        >
            <div className="flex flex-col h-[65vh]">
                {/* 🔍 Search Bar & Info */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาเลข Lot..."
                            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-gray-900 dark:text-white shadow-sm group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all font-medium"
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

                {/* 📊 Table Section */}
                <div className="flex-1 overflow-auto p-0">
                    {!itemId ? (
                        <div className="flex flex-col items-center justify-center py-24 text-amber-500 bg-amber-50/30 dark:bg-amber-900/10 h-full">
                            <Tag size={64} className="mb-4 opacity-20" />
                            <p className="text-xl font-bold font-outfit uppercase tracking-wider">กรุณาเลือกสินค้าก่อน</p>
                            <p className="text-sm opacity-80 font-outfit">เพื่อแสดงรายการ Lot ของสินค้าที่ถูกต้อง</p>
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-60">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
                            <p className="text-gray-500 font-medium font-outfit">กำลังโหลดข้อมูลล็อต...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Lot No.</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right">คงเหลือ</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">วันหมดอายุ</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">หมายเหตุ</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0b1120]/30 transition-all">
                                {lots.length > 0 ? (
                                    lots.map((lot) => (
                                        <tr 
                                            key={lot.lot_no_id} 
                                            className="transition-colors group cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                                            onClick={() => handleSelect(lot)}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform inline-block uppercase">
                                                    {lot.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-gray-800 dark:text-gray-200">
                                                    {formatNumber(lot.balance_qty ?? 0)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <Calendar size={14} className="opacity-50" />
                                                    {formatDate(lot.expiry_date)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 italic">
                                                {lot.note || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(lot);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
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
                                                <Tag size={64} className="mb-4 opacity-20" />
                                                <p className="text-xl font-bold font-outfit">ไม่พบข้อมูลล็อต</p>
                                                <p className="text-sm opacity-80 font-outfit">ลองเปลี่ยนคำค้นหาอีกครั้ง</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                
                {/* 📝 Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center px-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium font-outfit">
                        แสดงข้อมูล <span className="font-bold text-blue-600">{lots.length}</span> รายการ
                    </p>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm active:scale-95 font-outfit"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </DialogFormLayout>
    );
});
