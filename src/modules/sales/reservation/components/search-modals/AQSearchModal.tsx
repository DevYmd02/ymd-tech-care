import React, { useState, useCallback, useMemo } from 'react';
import { Search, FileCheck, Check, X } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { ReservationService, type AvailableApproval } from '../../services/reservation.service';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@hooks/useDebounce';
import { formatThaiDate } from '@utils/dateUtils';


/**
 * @file AQSearchModal.tsx
 * @description Search Modal for selecting Approved Quotations (AQ) for Reservation (Purple Theme).
 */

export interface AQSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (aq: AvailableApproval) => void;
    title?: string;
    type?: 'SQ' | 'AQ';
}

export const AQSearchModal: React.FC<AQSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
    title = 'ค้นหาใบเสนอราคาอนุมัติ (AQ) - Find Approved Quotation (AQ)',
    type = 'AQ'
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    const { data: allApprovals = [], isLoading } = useQuery({
        queryKey: ['available-approvals'],
        queryFn: ReservationService.getAvailableApprovals,
        enabled: isOpen,
        staleTime: 30 * 1000, 
    });

    // Helper to extract sq_no robustly
    const getSqNo = (aq: AvailableApproval) => {
        const r = aq as Record<string, unknown>;
        const sqObj = (r['sq_header'] || r['sq'] || r['sale_quotation'] || r['quotation'] || r['sale_quotation_header']) as Record<string, unknown> | undefined;
        return String(
            r['sq_no'] || 
            r['sale_quotation_no'] || 
            r['quotation_no'] || 
            r['ref_no'] || 
            r['ref_sq_no'] ||
            sqObj?.['sq_no'] || 
            sqObj?.['code'] || 
            sqObj?.['no'] || 
            ''
        );
    };

    // Helper to extract sq_date robustly
    const getSqDate = (aq: AvailableApproval) => {
        const r = aq as Record<string, unknown>;
        const sqObj = (r['sq_header'] || r['sq'] || r['sale_quotation'] || r['quotation'] || r['sale_quotation_header']) as Record<string, unknown> | undefined;
        return String(
            r['sq_date'] || 
            r['sale_quotation_date'] || 
            sqObj?.['sq_date'] || 
            sqObj?.['date'] || 
            r['aq_date'] || 
            r['created_at'] || 
            ''
        ).split('T')[0];
    };

    const filteredApprovals = useMemo(() => {
        if (!debouncedSearch) return allApprovals;
        const s = debouncedSearch.toLowerCase();
        return allApprovals.filter(aq => {
            const sqNo = getSqNo(aq);
            return aq.aq_no.toLowerCase().includes(s) || sqNo.toLowerCase().includes(s);
        });
    }, [allApprovals, debouncedSearch]);

    const handleSelect = useCallback((aq: AvailableApproval) => {
        onSelect(aq);
        onClose();
    }, [onSelect, onClose]);

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            titleIcon={
                <div className="bg-purple-600 p-1.5 rounded-lg shadow-sm">
                    <FileCheck size={20} className="text-white" />
                </div>
            }
            width="max-w-[1000px]"
            headerColor="bg-purple-600"
        >
            <div className="flex flex-col h-[70vh]">
                {/* Search Bar */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาเลขที่ AQ หรือ SQ..."
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
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-auto p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 opacity-60">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4" />
                            <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md">
                                <tr>
                                    {type === 'SQ' ? (
                                        <>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">เลขที่ใบเสนอราคา (SQ)</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">วันที่ SQ</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">อ้างอิงใบอนุมัติ (AQ)</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">วันที่ AQ</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">อ้างอิงใบอนุมัติ (AQ)</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">วันที่ AQ</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">เลขที่ใบเสนอราคา (SQ)</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">วันที่ SQ</th>
                                        </>
                                    )}
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0b1120]/30 transition-all">
                                {filteredApprovals.length > 0 ? (
                                    filteredApprovals.slice(0, 100).map((aq) => (
                                        <tr 
                                            key={aq.aq_id} 
                                            className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors group cursor-pointer"
                                            onClick={() => handleSelect(aq)}
                                        >
                                            {type === 'SQ' ? (
                                                <>
                                                    <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">
                                                        {getSqNo(aq) || <span className="text-gray-400 dark:text-gray-600 font-normal italic text-sm">-</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {formatThaiDate(getSqDate(aq))}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-bold text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform inline-block">
                                                            {aq.aq_no || <span className="text-gray-400 dark:text-gray-600 font-normal italic text-sm">-</span>}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                        {formatThaiDate(aq.aq_date)}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <span className="font-bold text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform inline-block">
                                                            {aq.aq_no || <span className="text-gray-400 dark:text-gray-600 font-normal italic text-sm">-</span>}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                        {formatThaiDate(aq.aq_date)}
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">
                                                        {getSqNo(aq) || <span className="text-gray-400 dark:text-gray-600 font-normal italic text-sm">-</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {formatThaiDate(getSqDate(aq))}
                                                    </td>
                                                </>
                                            )}

                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(aq);
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
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                                                <Search size={64} className="mb-4 opacity-20" />
                                                <p className="text-xl font-bold">ไม่พบข้อมูลใบเสนอราคาอนุมัติ</p>
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
                        แสดงข้อมูล <span className="font-bold text-purple-600">{filteredApprovals.length}</span> รายการ
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

