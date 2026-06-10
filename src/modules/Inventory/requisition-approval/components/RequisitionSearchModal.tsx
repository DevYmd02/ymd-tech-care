import React, { useState, useMemo } from 'react';
import { Search, FileText, Check, X, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { useDebounce } from '@hooks/useDebounce';
import { RequisitionApprovalService } from '../services/requisition-approval.service';
import type { RequisitionApprovalListItem } from '../types/requisition-approval.types';
import { formatNumber } from '@/shared/utils';

export interface RequisitionSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (requisitionId: string, item?: RequisitionApprovalListItem) => void;
}

export const RequisitionSearchModal: React.FC<RequisitionSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    // Fetch pending Requisitions
    const { data: rawData = [], isLoading } = useQuery({
        queryKey: ['requisition-approvals-lookup-pending', isOpen],
        queryFn: () => RequisitionApprovalService.getPending(),
        enabled: isOpen,
        staleTime: 0,
    });

    const filteredData = useMemo(() => {
        if (!debouncedSearch) return rawData;
        const term = debouncedSearch.toLowerCase();
        return rawData.filter((item) => {
            return (
                String(item.issue_req_no || '').toLowerCase().includes(term) ||
                String(item.dept_name || '').toLowerCase().includes(term) ||
                String(item.save_emp_name || '').toLowerCase().includes(term)
            );
        });
    }, [rawData, debouncedSearch]);

    const handleSelect = (item: RequisitionApprovalListItem) => {
        onSelect(item.docu_item_id, item);
        onClose();
    };

    const formatDate = (val?: string) => {
        if (!val) return '-';
        const cleaned = val.split('T')[0];
        const [y, m, d] = cleaned.split('-');
        return y && m && d ? `${d}/${m}/${y}` : cleaned;
    };

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="ค้นหาใบขอเบิกที่รออนุมัติ - Find Pending Requisition"
            titleIcon={
                <div className="bg-emerald-600 p-1.5 rounded-lg shadow-sm">
                    <ShieldCheck size={20} className="text-white" />
                </div>
            }
            width="max-w-[1000px]"
            headerColor="bg-emerald-700"
        >
            <div className="flex flex-col h-[70vh]">
                {/* Search Bar */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="relative group">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors"
                            size={20}
                        />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาเลขที่เอกสาร, แผนก, ผู้ขอเบิก..."
                            className="w-full pl-12 pr-4 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 dark:text-white shadow-sm group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all font-medium placeholder-gray-400 dark:placeholder-gray-500"
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
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4" />
                            <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">เลขที่เอกสาร</th>
                                    <th className="px-6 py-4 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 whitespace-nowrap">วันที่เอกสาร</th>
                                    <th className="px-6 py-4 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">แผนก</th>
                                    <th className="px-6 py-4 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">ผู้ขอเบิก</th>
                                    <th className="px-6 py-4 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 text-center whitespace-nowrap w-[100px]">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-transparent">
                                {filteredData.length > 0 ? (
                                    filteredData.map((item) => (
                                        <tr
                                            key={item.docu_item_id}
                                            className="hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors group cursor-pointer"
                                            onClick={() => handleSelect(item)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                                                    {item.issue_req_no || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                {formatDate(item.docu_date)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {item.dept_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                {item.save_emp_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(item);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
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
                                                <FileText size={48} className="mb-4 opacity-20" />
                                                <p className="text-lg font-bold">ไม่พบข้อมูล</p>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        พบรายการ <span className="font-bold text-emerald-600 dark:text-emerald-400">{filteredData.length}</span> รายการ
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm active:scale-95"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            </div>
        </DialogFormLayout>
    );
});
