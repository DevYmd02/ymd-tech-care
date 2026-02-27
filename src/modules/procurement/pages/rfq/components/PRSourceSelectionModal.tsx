import React, { useState, useMemo } from 'react';
import { Search, Check, FileText } from 'lucide-react';
import type { PRHeader } from '@/modules/procurement/types';
import { MOCK_PRS } from '@/modules/procurement/mocks/data/prData';
import { ModalLayout } from '@/shared/components/ui/layout/ModalLayout';

interface PRSourceSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (pr: PRHeader) => void;
}

export const PRSourceSelectionModal: React.FC<PRSourceSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPRs = useMemo(() => {
        return MOCK_PRS.filter(pr => pr.status === 'APPROVED').filter(pr => {
            const matchesSearch = pr.pr_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (pr.requester_name && pr.requester_name.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesSearch;
        });
    }, [searchTerm]);

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
                                <th className="px-5 py-3 font-semibold whitespace-nowrap">ความมุ่งหมาย</th>
                                <th className="px-5 py-3 font-semibold text-center whitespace-nowrap">รายการ</th>
                                <th className="px-5 py-3 font-semibold text-center whitespace-nowrap">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredPRs.length > 0 ? (
                                filteredPRs.map((pr) => (
                                    <tr key={pr.pr_id} className="hover:bg-teal-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-5 py-3 font-medium text-teal-700 dark:text-teal-400 whitespace-nowrap">{pr.pr_no}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{pr.pr_date?.split('T')[0]}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{pr.requester_name}</td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                                            <div className="truncate max-w-[200px]" title={pr.purpose}>
                                                {pr.purpose || '-'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="inline-flex items-center justify-center bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
                                                {(pr.lines?.length || 0)}
                                            </span>
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
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Search size={32} className="mb-2 opacity-20" />
                                            <p>ไม่พบประวัติ PR ที่ได้รับการอนุมัติ (Status: APPROVED)</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </ModalLayout>
    );
};
