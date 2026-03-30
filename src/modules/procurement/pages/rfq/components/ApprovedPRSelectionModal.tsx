import React, { useState, useEffect } from 'react';
import { Search, Check, FileText, Loader2, Info } from 'lucide-react';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { ModalLayout } from '@/shared/components/ui/layout/ModalLayout';
import { logger } from '@/shared/utils/logger';

interface ApprovedPRSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (record: any) => void;
    prNo: string | null;
    prId: number | null;
}

export const ApprovedPRSelectionModal: React.FC<ApprovedPRSelectionModalProps> = ({ isOpen, onClose, onSelect, prNo, prId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [approvedRecords, setApprovedRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !prId) return;

        const fetchApprovedNumbers = async () => {
            setIsLoading(true);
            setFetchError(null);
            try {
                logger.info(`[ApprovedPRSelectionModal] Fetching AV numbers for ${prNo} (ID: ${prId})`);
                const records = await RFQService.getPRApprovalDetail(prId);
                setApprovedRecords(records);
                logger.info(`[ApprovedPRSelectionModal] Found ${records.length} AV records for PR ${prNo}`);
            } catch (error) {
                logger.error(`[ApprovedPRSelectionModal] Failed to fetch for PR ${prId}:`, error);
                setFetchError('ไม่สามารถดึงข้อมูลเลขที่ Approve ได้');
                setApprovedRecords([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchApprovedNumbers();
    }, [isOpen, prId, prNo]); // Added prNo to dependencies

    // Reset search on close
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    const filteredRecords = approvedRecords.filter(record => {
        const num = record.approval_no || record.approved_pr_no || '';
        return num.toLowerCase().includes(searchTerm.toLowerCase());
    });

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
                                <th className="px-5 py-3 font-semibold whitespace-nowrap">สถานะ</th>
                                <th className="px-5 py-3 font-semibold text-center whitespace-nowrap w-24">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading && (
                                <tr>
                                    <td colSpan={3} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                            <Loader2 size={32} className="mb-2 animate-spin text-teal-500" />
                                            <p>กำลังโหลดข้อมูล...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!isLoading && fetchError && (
                                <tr>
                                    <td colSpan={3} className="px-5 py-12 text-center border-b">
                                        <p className="text-red-500">{fetchError}</p>
                                    </td>
                                </tr>
                            )}

                            {!isLoading && !fetchError && filteredRecords.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-5 py-12 text-center border-b">
                                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-2">
                                            <Info size={32} className="opacity-20" />
                                            <p className="text-sm">
                                                {!prNo 
                                                    ? 'กรุณาเลือก PR ต้นทางก่อน' 
                                                    : `ไม่พบเลขที่ Approve (AV) สำหรับ ${prNo} ในระบบ`}
                                            </p>
                                            {prNo && (
                                                <p className="text-xs opacity-60 max-w-[280px]">
                                                    โปรดตรวจสอบว่า PR นี้ได้รับการอนุมัติผ่านระบบ AV Module และมีเลขที่เอกสาร AV-xxxx แล้ว
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!isLoading && !fetchError && filteredRecords.map((record, i) => {
                                const approvedNo = record.approval_no || record.approved_pr_no || record.approval_id?.toString() || '-';
                                return (
                                    <tr key={i} className="hover:bg-teal-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-5 py-3 font-medium text-teal-700 dark:text-teal-400 tabular-nums">
                                            {approvedNo}
                                        </td>
                                        <td className="px-5 py-3">
                                            {(() => {
                                                const status = record.status?.toUpperCase() || '';
                                                let bgColor = 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
                                                let label = record.status || 'ไม่ระบุ';

                                                if (status === 'APPROVED') {
                                                    bgColor = 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
                                                    label = 'อนุมัติแล้ว';
                                                } else if (status === 'PARTIAL') {
                                                    bgColor = 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50';
                                                    label = 'อนุมัติบางส่วน';
                                                } else if (status === 'PENDING') {
                                                    bgColor = 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
                                                    label = 'รออนุมัติ';
                                                }

                                                return (
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${bgColor}`}>
                                                        {label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => onSelect(record)}
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
