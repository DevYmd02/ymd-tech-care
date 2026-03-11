import React, { useState } from 'react';
import { FileText, Plus, CheckCircle, PackageSearch, AlertCircle, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { QCService } from '@/modules/procurement/services/qc.service';
import { ModalLayout } from '@/shared/components/ui/layout';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { cn } from '@/shared/utils/cn';

interface DocumentSourceSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSource: (sourceType: 'QC' | 'BLANK', qcId?: number, vendorId?: number) => void;
}

export const DocumentSourceSelectorModal: React.FC<DocumentSourceSelectorModalProps> = ({
    isOpen,
    onClose,
    onSelectSource
}) => {
    const [selectedQcId, setSelectedQcId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch QCs that are ready (COMPLETED and not yet converted to PO)
    const { data, isLoading, isError } = useQuery({
        queryKey: ['qc-ready-for-po'],
        queryFn: () => QCService.getReadyForPO(),
        enabled: isOpen,
    });

    const readyQCs = data?.data || [];
    
    // Filter logic based on search query
    const filteredQCs = readyQCs.filter(qc => {
        const query = searchQuery.toLowerCase();
        const qcNoMatch = qc.qc_no?.toLowerCase().includes(query);
        const prNoMatch = qc.pr_no?.toLowerCase().includes(query);
        const vendorMatch = qc.lowest_bidder_name?.toLowerCase().includes(query);
        
        return qcNoMatch || prNoMatch || vendorMatch;
    });

    const handleConfirm = () => {
        if (selectedQcId) {
            const selectedQc = readyQCs.find(qc => qc.qc_id === selectedQcId);
            onSelectSource('QC', selectedQcId, selectedQc?.winning_vendor_id);
        } else {
            onSelectSource('BLANK');
        }
    };

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title="สร้างใบสั่งซื้อ (PO)"
            titleIcon={<FileText size={20} />}
            subtitle="กรุณาเลือกแหล่งที่มาของข้อมูลเพื่อลดการบันทึกซ้ำซ้อน"
            size="md"
        >
            <div className="flex flex-col space-y-6">
                {/* 1. Blank PO Option */}
                <div 
                    className={cn(
                        "p-4 rounded-xl border-2 cursor-pointer transition-all",
                        selectedQcId === null 
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 bg-white dark:bg-gray-800"
                    )}
                    onClick={() => setSelectedQcId(null)}
                >
                    <div className="flex items-start gap-3">
                        <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full",
                            selectedQcId === null ? "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300" : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                        )}>
                            <Plus size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className={cn("font-bold", selectedQcId === null ? "text-blue-700 dark:text-blue-400" : "text-gray-700 dark:text-gray-300")}>
                                สร้างเอกสารเปล่า
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                กรอกข้อมูลใหม่ทั้งหมดด้วยตนเอง
                            </p>
                        </div>
                        {selectedQcId === null && <CheckCircle className="text-blue-600" size={20} />}
                    </div>
                </div>

                {/* 2. QC selection Option */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white dark:bg-gray-800 px-3 text-sm font-medium text-gray-500">หรือดึงข้อมูลจากใบเปรียบเทียบราคา (QC)</span>
                    </div>
                </div>

                {/* Search Bar section */}
                <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาด้วยเลข QC, PR หรือชื่อผู้ขาย..." 
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 mt-3 animate-pulse">กำลังโหลดรายการคอมแพร์ที่รอออก PO...</p>
                        </div>
                    ) : isError ? (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl flex items-start gap-3">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p className="text-sm">เกิดข้อผิดพลาดในการดึงข้อมูลคอมแพร์ราคา กรุณาลองใหม่อีกครั้ง</p>
                        </div>
                    ) : readyQCs.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <PackageSearch size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-600 dark:text-gray-400 font-medium">ไม่มีรายการคอมแพร์ราคาที่รอออก PO</p>
                            <p className="text-xs text-gray-500 mt-1">QC จะต้องอยู่ในสถานะ "ยืนยันผลแล้ว" เท่านั้น</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                            {filteredQCs.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                                    ไม่พบใบเทียบราคา (QC) ที่ตรงกับการค้นหา
                                </div>
                            ) : (
                                filteredQCs.map((qc) => (
                                    <div 
                                        key={qc.qc_id}
                                        className={cn(
                                            "p-4 rounded-xl border-2 cursor-pointer transition-all shrink-0",
                                            selectedQcId === qc.qc_id 
                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                                                : "border-gray-200 dark:border-gray-700 hover:border-emerald-300 bg-white dark:bg-gray-800"
                                        )}
                                        onClick={() => setSelectedQcId(qc.qc_id || null)}
                                    >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                                            selectedQcId === qc.qc_id ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"
                                        )}>
                                            <FileText size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className={cn("font-bold text-sm truncate", selectedQcId === qc.qc_id ? "text-emerald-700 dark:text-emerald-400" : "text-gray-800 dark:text-gray-200")}>
                                                    {qc.qc_no}
                                                </h4>
                                                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                    {formatThaiDate(qc.created_at || '')}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                                <span className="flex items-center gap-1">
                                                    <span className="font-semibold">ผู้ชนะ:</span> <span className="text-indigo-600 dark:text-indigo-400 font-bold max-w-[120px] truncate">{qc.lowest_bidder_name}</span>
                                                </span>
                                                {qc.pr_no && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-semibold">อ้างอิง PR:</span> {qc.pr_no}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {selectedQcId === qc.qc_id && <CheckCircle className="text-emerald-600 shrink-0" size={20} />}
                                    </div>
                                </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    ยกเลิก
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isLoading && !isError}
                    className={cn(
                        "px-6 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-colors",
                        selectedQcId 
                            ? "bg-emerald-600 hover:bg-emerald-700" 
                            : "bg-blue-600 hover:bg-blue-700",
                        (isLoading && !isError) ? "opacity-50 cursor-not-allowed" : ""
                    )}
                >
                    ดำเนินการต่อ
                </button>
            </div>
        </ModalLayout>
    );
};
