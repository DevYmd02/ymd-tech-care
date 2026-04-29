import React, { useState, useCallback, useMemo } from 'react';
import { Search, ClipboardList, Check, X } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { EstimateService, type EstimateHeader } from '@sales/estimate/services/estimate.service';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@hooks/useDebounce';

/**
 * @file LeadSearchModal.tsx
 * @description Localized Search Modal for selecting Estimates/Leads in Reservation module (Purple Theme).
 */

export interface LeadSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (estimate: EstimateHeader) => void;
    title?: string;
}

export const LeadSearchModal: React.FC<LeadSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
    title = 'ค้นหาใบประมาณการราคา - Find Estimate'
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    // Fetch estimates (Leads)
    const { data: response, isLoading } = useQuery({
        queryKey: ['estimates-lookup-reservation', debouncedSearch],
        queryFn: () => EstimateService.getList({
            estimate_no: debouncedSearch,
            limit: 100
        }),
        enabled: isOpen,
        staleTime: 1000 * 60 * 5, 
    });

    const estimates = useMemo<EstimateHeader[]>(() => response?.data || [], [response]);

    const handleSelect = useCallback((estimate: EstimateHeader) => {
        onSelect(estimate);
        onClose();
    }, [onSelect, onClose]);

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            titleIcon={
                <div className="bg-purple-600 p-1.5 rounded-lg shadow-sm">
                    <ClipboardList size={20} className="text-white" />
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
                            placeholder="ค้นหาเลขที่ประมาณการราคา หรือเลขที่คำขอ..."
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
                            <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลโครงการ...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">เลขที่ประมาณการ</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">เลขที่คำขอ (Inquiry)</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right">ยอดเงินรวม</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">สถานะ</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0b1120]/30 transition-all">
                                {estimates.length > 0 ? (
                                    estimates.map((estimate) => (
                                        <tr 
                                            key={estimate.id} 
                                            className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors group cursor-pointer"
                                            onClick={() => handleSelect(estimate)}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform inline-block">
                                                    {estimate.estimate_no}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {estimate.inquiry_no || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm font-bold text-gray-900 dark:text-white">
                                                {new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(estimate.total_price)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    estimate.status === 'SUBMITTED' 
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                    {estimate.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(estimate);
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
                                        <td colSpan={5} className="px-6 py-20 text-center items-center justify-center">
                                            <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                                                <Search size={64} className="mb-4 opacity-20" />
                                                <p className="text-xl font-bold">ไม่พบข้อมูลประมาณการราคา</p>
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
                        แสดงข้อมูล <span className="font-bold text-purple-600">{estimates.length}</span> รายการ
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
