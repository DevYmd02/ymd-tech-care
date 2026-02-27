import React, { useState, useMemo } from 'react';
import { Search, Check, FileText } from 'lucide-react';
import type { RFQHeader } from '@/modules/procurement/types';
import { MOCK_RFQS } from '@/modules/procurement/mocks/data/rfqData';
import { ModalLayout } from '@/shared/components/ui/layout/ModalLayout';

interface RFQSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (rfq: RFQHeader) => void;
}

export const RFQSelectorModal: React.FC<RFQSelectorModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRFQs = useMemo(() => {
        return MOCK_RFQS.filter(rfq => {
            const matchesSearch = rfq.rfq_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 (rfq.vendor_name && rfq.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                 (rfq.purpose && rfq.purpose.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesSearch;
        });
    }, [searchTerm]);

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title="เลือกข้อมูลใบขอเสนอราคา (RFQ)"
            titleIcon={<FileText className="w-5 h-5 opacity-90" />}
            size="lg"
            headerColor="bg-indigo-600"
        >
            <div className="flex flex-col h-full bg-gray-50/30 dark:bg-transparent">
                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาด้วย เลขที่ RFQ, ชื่อผู้ขาย หรือ วัตถุประสงค์..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all shadow-sm"
                    />
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 sticky top-0 z-20 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                            <tr>
                                <th className="px-5 py-3 font-semibold whitespace-nowrap">เลขที่ RFQ</th>
                                <th className="px-5 py-3 font-semibold whitespace-nowrap">วันที่</th>
                                <th className="px-5 py-3 font-semibold whitespace-nowrap">ผู้ขาย</th>
                                <th className="px-5 py-3 font-semibold whitespace-nowrap">เรื่อง/วัตถุประสงค์</th>
                                <th className="px-5 py-3 font-semibold text-center whitespace-nowrap">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredRFQs.length > 0 ? (
                                filteredRFQs.map((rfq) => (
                                    <tr key={rfq.rfq_id} className="hover:bg-indigo-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-5 py-3 font-medium text-indigo-700 dark:text-indigo-400 whitespace-nowrap">{rfq.rfq_no}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{rfq.rfq_date?.split('T')[0]}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300 max-w-[150px] truncate">
                                            {rfq.vendor_name || '-'}
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                                            <div className="truncate max-w-[200px]" title={rfq.purpose}>
                                                {rfq.purpose || '-'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onSelect(rfq);
                                                    setSearchTerm('');
                                                }}
                                                className="inline-flex items-center justify-center px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition-colors shadow-sm active:scale-95"
                                            >
                                                <Check size={16} className="mr-1 -ml-1" />
                                                เลือก
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Search size={32} className="mb-2 opacity-20" />
                                            <p>ไม่พบข้อมูล RFQ</p>
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