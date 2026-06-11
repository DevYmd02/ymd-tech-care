/**
 * @file SelectPendingIssueModal.tsx
 * @description Modal เลือกใบขอเบิกที่อนุมัติแล้ว ก่อนสร้างใบเบิก
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, Search, ChevronRight, Loader2, X } from 'lucide-react';
import { IssueStockService } from '../services/issue.service';
import type { PendingIssueStock } from '../types/issue.types';

interface SelectPendingIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: PendingIssueStock) => void;
}

export const SelectPendingIssueModal: React.FC<SelectPendingIssueModalProps> = ({
    isOpen,
    onClose,
    onSelect,
}) => {
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['pending-issue-stocks'],
        queryFn: () => IssueStockService.getPendingIssues(),
        enabled: isOpen,
        staleTime: 0,
    });

    // API คืนค่าเป็น array ตรงๆ (ไม่ได้ wrap ใน items)
    // ดูจาก response ในรูปแรก — root เป็น array
    const items: PendingIssueStock[] = Array.isArray(data)
        ? (data as PendingIssueStock[])
        : ((data as { items?: PendingIssueStock[] })?.items ?? []);

    const filtered = items.filter(item =>
        item.appv_issue_req_no?.toLowerCase().includes(search.toLowerCase()) ||
        item.remarks?.toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">

                {/* Header */}
                <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <div className="bg-white/20 p-1.5 rounded shadow-sm">
                            <ClipboardCheck size={16} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="font-bold text-base">เลือกใบขอเบิกที่อนุมัติแล้ว</h2>
                            <p className="text-emerald-100 text-xs">เลือกเพื่อสร้างใบเบิกสินค้า</p>
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
                            placeholder="ค้นหาเลขที่ใบขอเบิก หรือ หมายเหตุ..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 h-10 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto max-h-[420px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40 gap-2 text-gray-400">
                            <Loader2 size={20} className="animate-spin" />
                            <span className="text-sm">กำลังโหลดข้อมูล...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <ClipboardCheck size={32} className="mb-2 opacity-30" />
                            <p className="text-sm">ไม่พบใบขอเบิกที่อนุมัติแล้ว</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filtered.map(item => (
                                <li key={item.appv_issue_req_id}>
                                    <button
                                        onClick={() => onSelect(item)}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-left group"
                                    >
                                        <div className="flex flex-col gap-1">
                                            {/* เลขที่ */}
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                                                {item.appv_issue_req_no}
                                            </span>
                                            {/* วันที่ + รายการ */}
                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                <span>
                                                    {new Date(item.appv_issue_req_date).toLocaleDateString('th-TH', {
                                                        day: '2-digit', month: 'short', year: 'numeric'
                                                    })}
                                                </span>
                                                <span>•</span>
                                                <span>{item.appvissueRequistionLines?.length ?? 0} รายการ</span>
                                                {item.remarks && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="truncate max-w-[200px]">{item.remarks}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {/* Badge + Arrow */}
                                        <div className="flex items-center gap-2 shrink-0 ml-4">
                                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                                อนุมัติแล้ว
                                            </span>
                                            <ChevronRight
                                                size={16}
                                                className="text-gray-300 group-hover:text-emerald-500 transition-colors"
                                            />
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="h-9 px-5 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors"
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>
    );
};