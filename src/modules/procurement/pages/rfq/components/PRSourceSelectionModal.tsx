import React, { useState, useEffect, useMemo } from 'react';
import { Search, Check, FileText, Loader2 } from 'lucide-react';
import type { PRHeader } from '@/modules/procurement/types';
import { PRService } from '@/modules/procurement/services/pr.service';
import { ModalLayout } from '@/shared/components/ui/layout/ModalLayout';
import { logger } from '@/shared/utils/logger';

interface PRSourceSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (pr: PRHeader) => void;
}

export const PRSourceSelectionModal: React.FC<PRSourceSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [prList, setPrList] = useState<PRHeader[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch APPROVED PRs from real API whenever modal opens
    useEffect(() => {
        if (!isOpen) return;

        const fetchApprovedPRs = async () => {
            setIsLoading(true);
            setFetchError(null);
            try {
                logger.info('[PRSourceSelectionModal] Fetching APPROVED PRs from API');
                const response = await PRService.getList({ status: 'APPROVED' });
                setPrList(response.data);
                logger.info(`[PRSourceSelectionModal] Loaded ${response.data.length} APPROVED PRs`);
            } catch (error) {
                logger.error('[PRSourceSelectionModal] Failed to fetch APPROVED PRs:', error);
                setFetchError('ไม่สามารถดึงข้อมูล PR ได้ กรุณาลองใหม่อีกครั้ง');
                setPrList([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchApprovedPRs();
    }, [isOpen]);

    // Reset search when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const filteredPRs = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return prList;
        return prList.filter(pr =>
            pr.pr_no.toLowerCase().includes(term) ||
            (pr.requester_name && pr.requester_name.toLowerCase().includes(term))
        );
    }, [prList, searchTerm]);

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title="เลือกข้อมูล PR (Approved)"
            titleIcon={<FileText className="w-5 h-5 opacity-90" />}
            size="lg"
            headerColor="bg-teal-600"
        >
            <div className="flex flex-col h-full bg-gray-50/30 dark:bg-transparent">
                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาด้วย เลขที่ PR หรือ ผู้ขอ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white transition-all shadow-sm"
                        disabled={isLoading}
                    />
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-5 py-3 font-semibold whitespace-nowrap">เลขที่ PR</th>
                                <th className="px-5 py-3 font-semibold whitespace-nowrap">วันที่</th>
                                <th className="px-5 py-3 font-semibold whitespace-nowrap">ผู้ขอ</th>
                                <th className="px-5 py-3 font-semibold whitespace-nowrap">วัตถุประสงค์ / หมายเหตุ</th>
                                <th className="px-5 py-3 font-semibold text-right whitespace-nowrap">ยอดรวม</th>
                                <th className="px-5 py-3 font-semibold text-center whitespace-nowrap">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {/* Loading State */}
                            {isLoading && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Loader2 size={32} className="mb-2 animate-spin text-teal-500" />
                                            <p>กำลังโหลดข้อมูล PR ที่อนุมัติแล้ว...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* Error State */}
                            {!isLoading && fetchError && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-red-400 dark:text-red-500">
                                            <Search size={32} className="mb-2 opacity-40" />
                                            <p className="font-medium">{fetchError}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* Empty State */}
                            {!isLoading && !fetchError && filteredPRs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Search size={32} className="mb-2 opacity-20" />
                                            <p>ไม่พบประวัติ PR ที่ได้รับการอนุมัติ (Status: APPROVED)</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* Data Rows */}
                            {!isLoading && !fetchError && filteredPRs.map((pr) => {
                                const displayRemark = pr.remark || pr.purpose || '-';
                                const displayTotal = pr.total_amount != null
                                    ? Number(pr.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : '-';
                                return (
                                    <tr key={pr.pr_id} className="hover:bg-teal-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-5 py-3 font-medium text-teal-700 dark:text-teal-400 whitespace-nowrap">{pr.pr_no}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{pr.pr_date?.split('T')[0]}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{pr.requester_name}</td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                                            <div className="truncate max-w-[200px]" title={displayRemark}>
                                                {displayRemark}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap font-mono text-xs">
                                            {displayTotal}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onSelect(pr);
                                                    setSearchTerm('');
                                                }}
                                                className="inline-flex items-center justify-center px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-md text-sm font-medium transition-colors shadow-sm active:scale-95"
                                            >
                                                <Check size={16} className="mr-1 -ml-1" />
                                                เลือก
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </ModalLayout>
    );
};
