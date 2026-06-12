/**
 * @file SelectPendingReturnModal.tsx
 * @description Modal เลือกใบเบิกสินค้าที่ Confirmed แล้ว ก่อนสร้างใบรับคืน
 *              รองรับ pagination, sorting, และ search
 */

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, Search, ChevronRight, Loader2, X, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ReturnIssueService } from '../services/return.service';
import type { PendingReturnIssue, PendingReturnIssueParams } from '../types/return.types';

interface SelectPendingReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: PendingReturnIssue) => void;
}



export const SelectPendingReturnModal: React.FC<SelectPendingReturnModalProps> = ({
    isOpen,
    onClose,
    onSelect,
}) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);

    const params: PendingReturnIssueParams = {
        page,
        limit,
        issue_stock_no: search || undefined,
    };

    const { data, isLoading } = useQuery({
        queryKey: ['pending-return-stocks', params],
        queryFn: () => ReturnIssueService.getPendingReturns(params),
        enabled: isOpen,
        staleTime: 0,
    });

    const items = data?.data ?? [];
    const meta = data?.meta ?? { total: 0, page: 1, limit: 20, total_pages: 0 };

    const handleSearch = useCallback((value: string) => {
        setSearch(value);
        setPage(1);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-modal-scale { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl mx-4 overflow-hidden animate-modal-scale origin-center">

                {/* Header */}
                <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <div className="bg-white/20 p-1.5 rounded shadow-sm">
                            <ClipboardCheck size={16} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="font-bold text-base">เลือกใบเบิกสินค้าที่ยืนยันแล้ว</h2>
                            <p className="text-blue-100 text-xs">เลือกเพื่อสร้างใบรับคืนสินค้า</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาเลขที่ใบเบิก หรือ หมายเหตุ..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            className="w-full pl-9 pr-4 h-10 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <div className="col-span-3 flex items-center">
                            เลขที่ใบเบิก
                        </div>
                        <div className="col-span-2 flex items-center">
                            วันที่
                        </div>
                        <div className="col-span-2 flex items-center">
                            รายการเอกสาร
                        </div>
                        <div className="col-span-2 flex items-center">
                            หมายเหตุ
                        </div>
                        <div className="col-span-2 flex items-center">
                            สถานะ
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                            รายการ
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto max-h-[380px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40 gap-2 text-gray-400">
                            <Loader2 size={20} className="animate-spin" />
                            <span className="text-sm">กำลังโหลดข้อมูล...</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <ClipboardCheck size={32} className="mb-2 opacity-30" />
                            <p className="text-sm">ไม่พบใบเบิกสินค้าที่ยืนยันแล้ว</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                            {items.map(item => (
                                <li key={item.issue_stock_id}>
                                    <button
                                        onClick={() => onSelect(item)}
                                        className="w-full px-6 py-3.5 flex items-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left group"
                                    >
                                        <div className="grid grid-cols-12 gap-2 w-full items-center">
                                            {/* เลขที่ใบเบิก */}
                                            <div className="col-span-3">
                                                <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                                                    {item.issue_stock_no}
                                                </span>
                                            </div>
                                            {/* วันที่ */}
                                            <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(item.issue_stock_date).toLocaleDateString('th-TH', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })}
                                            </div>
                                            {/* รายการเอกสาร */}
                                            <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {item.doc_type_name || '-'}
                                            </div>
                                            {/* หมายเหตุ */}
                                            <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {item.remarks || '-'}
                                            </div>
                                            {/* สถานะ */}
                                            <div className="col-span-2">
                                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                                                    {item.status === 'CONFIRMED' ? 'ยืนยันแล้ว' : item.status}
                                                </span>
                                            </div>
                                            {/* จำนวนรายการ + Arrow */}
                                            <div className="col-span-1 flex items-center justify-center gap-1">
                                                <span className="text-xs text-gray-500">
                                                    {item.issueStockLines?.length ?? 0}
                                                </span>
                                                <ChevronRight
                                                    size={16}
                                                    className="text-gray-300 group-hover:text-blue-500 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {meta.total > 0 ? (
                            <>
                                แสดง {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} จากทั้งหมด{' '}
                                <span className="font-semibold text-gray-700 dark:text-gray-300">{meta.total}</span> รายการ
                            </>
                        ) : (
                            'ไม่พบข้อมูล'
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {/* First page */}
                        <button
                            onClick={() => setPage(1)}
                            disabled={page <= 1}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="หน้าแรก"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                        {/* Previous page */}
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="หน้าก่อน"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {/* Page info */}
                        <span className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                            หน้า {meta.page} / {meta.total_pages || 1}
                        </span>
                        {/* Next page */}
                        <button
                            onClick={() => setPage(p => Math.min(meta.total_pages || 1, p + 1))}
                            disabled={page >= (meta.total_pages || 1)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="หน้าถัดไป"
                        >
                            <ChevronRight size={16} />
                        </button>
                        {/* Last page */}
                        <button
                            onClick={() => setPage(meta.total_pages || 1)}
                            disabled={page >= (meta.total_pages || 1)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="หน้าสุดท้าย"
                        >
                            <ChevronsRight size={16} />
                        </button>
                        {/* Cancel button */}
                        <button
                            onClick={onClose}
                            className="ml-3 h-9 px-5 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
