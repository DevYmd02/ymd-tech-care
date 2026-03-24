import React, { useState, useEffect } from 'react';
import { Search, Check, FileText, Loader2 } from 'lucide-react';
import { ModalLayout } from '@/shared/components/ui/layout/ModalLayout';

interface ApprovedPRSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (approvedNo: string) => void;
    prNo: string | null;
}

export const ApprovedPRSelectionModal: React.FC<ApprovedPRSelectionModalProps> = ({ isOpen, onClose, onSelect, prNo }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [approvedNumbers, setApprovedNumbers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !prNo) return;

        const fetchApprovedNumbers = async () => {
            setIsLoading(true);
            setFetchError(null);
            try {
                // 🎯 TODO: Replace with real API call when backend is ready
                // Example:
                // const response = await PRService.getApprovedNumbers(prNo);
                // setApprovedNumbers(response.data || []);
                
                // For now, left Empty as requested ("ไม่ต้องใส่ mock data")
                setApprovedNumbers([]);
            } catch (error) {
                console.error('[ApprovedPRSelectionModal] Failed to fetch:', error);
                setFetchError('ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
                setApprovedNumbers([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchApprovedNumbers();
    }, [isOpen, prNo]);

    // Reset search on close
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const filteredNumbers = approvedNumbers.filter(num =>
        num.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title={`เลือกเลขที่ Approve PR (${prNo || 'ไม่ได้เลือก PR'})`}
            titleIcon={<FileText className="w-5 h-5 opacity-90" />}
            size="md"
            headerColor="bg-teal-600"
        >
            <div className="flex flex-col h-full bg-gray-50/30 dark:bg-transparent">
                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาเลขที่ Approve..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:text-white transition-all shadow-sm"
                        disabled={isLoading || !prNo}
                    />
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 dark:text-gray-400 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-5 py-3 font-semibold whitespace-nowrap">เลขที่ Approve PR</th>
                                <th className="px-5 py-3 font-semibold text-center whitespace-nowrap w-24">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading && (
                                <tr>
                                    <td colSpan={2} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Loader2 size={32} className="mb-2 animate-spin text-teal-500" />
                                            <p>กำลังโหลดข้อมูล...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!isLoading && fetchError && (
                                <tr>
                                    <td colSpan={2} className="px-5 py-12 text-center border-b">
                                        <p className="text-red-500">{fetchError}</p>
                                    </td>
                                </tr>
                            )}

                            {!isLoading && !fetchError && filteredNumbers.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-5 py-12 text-center border-b text-gray-400">
                                        {!prNo ? 'กรุณาเลือก PR ต้นทางก่อน' : 'ไม่พบข้อมูลเลขที่ Approve สำหรับ PR นี้'}
                                    </td>
                                </tr>
                            )}

                            {!isLoading && !fetchError && filteredNumbers.map((num, i) => (
                                <tr key={i} className="hover:bg-teal-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-5 py-3 font-medium text-teal-700 dark:text-teal-400">
                                        {num}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => onSelect(num)}
                                            className="inline-flex items-center justify-center px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-md text-sm font-medium transition-colors shadow-sm active:scale-95"
                                        >
                                            <Check size={16} className="mr-1 -ml-1" />
                                            เลือก
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ModalLayout>
    );
};
