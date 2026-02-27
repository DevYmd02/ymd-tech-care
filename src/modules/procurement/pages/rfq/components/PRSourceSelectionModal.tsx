import React, { useState, useMemo } from 'react';
import { Search, X, Check, FileText } from 'lucide-react';
import type { PRHeader } from '@/modules/procurement/types';
import { MOCK_PRS } from '@/modules/procurement/mocks/data/prData';

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-teal-600 text-white">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 opacity-90" />
                        เลือกข้อมูล PR (Approved)
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-full hover:bg-teal-500 transition-colors"
                        title="ปิดหน้าต่าง"
                    >
                        <X size={20} className="text-white opacity-90" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-900">
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
                    <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">เลขที่ PR</th>
                                    <th className="px-5 py-3 font-semibold">วันที่</th>
                                    <th className="px-5 py-3 font-semibold">ผู้ขอ</th>
                                    <th className="px-5 py-3 font-semibold">ความมุ่งหมาย</th>
                                    <th className="px-5 py-3 font-semibold text-center">รายการ</th>
                                    <th className="px-5 py-3 font-semibold text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredPRs.length > 0 ? (
                                    filteredPRs.map((pr) => (
                                        <tr key={pr.pr_id} className="hover:bg-teal-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-5 py-3 font-medium text-teal-700 dark:text-teal-400">{pr.pr_no}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{pr.pr_date?.split('T')[0]}</td>
                                            <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{pr.requester_name}</td>
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
                                                    onClick={() => {
                                                        onSelect(pr);
                                                        setSearchTerm(''); // Reset search on select
                                                    }}
                                                    className="inline-flex items-center justify-center px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-md text-sm font-medium transition-colors focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 focus:outline-none"
                                                >
                                                    <Check size={16} className="mr-1 -ml-1 border-white" />
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
            </div>
        </div>
    );
};
