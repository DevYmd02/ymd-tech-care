import React, { useState, useMemo } from 'react';
import { Search, Check, FileText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { RFQHeader } from '@/modules/procurement/types';
import { ModalLayout } from '@/shared/components/ui/layout/ModalLayout';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatThaiDate } from '@/shared/utils/dateUtils';

interface RFQSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (rfq: RFQHeader) => void;
}

const VendorNameDisplay = ({ vendorId }: { vendorId: number }) => {
    const { data: vendor, isLoading } = useQuery({
        queryKey: ['vendor', vendorId],
        queryFn: () => VendorService.getById(vendorId),
        enabled: !!vendorId,
        staleTime: 5 * 60 * 1000,
    });
    if (isLoading) return <span className="text-gray-400 font-normal italic">กำลังโหลด...</span>;
    return <span>{vendor?.vendor_name || '-'}</span>;
};

export const RFQSelectorModal: React.FC<RFQSelectorModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);

    // 📡 @Agent_API_Infector: Fetch real RFQ data (Fetching more but filtering visually for VQ safety if needed)
    const { data: rfqResponse, isLoading } = useQuery({
        queryKey: ['rfqs-selector', debouncedSearch],
        queryFn: () => RFQService.getList({ 
            keyword: debouncedSearch, 
            status: 'ALL', 
            limit: 100 
        }),
        enabled: isOpen,
    });

    // 📡 @Agent_UI_Hydrator: Match the Status Logic of the main List Page
    // We show RFQs that are either explicitly SENT or have all vendors sent (X/Y logic)
    const rfqs: RFQHeader[] = useMemo(() => {
        // useQuery data is Typed as RFQListResponse | undefined
        const rawItems = rfqResponse?.data; 
        if (!Array.isArray(rawItems)) return [];
        
        return rawItems.filter((rfq: RFQHeader) => {
            const sentCount = rfq.vendor_sent ?? rfq.sent_vendors_count ?? 0;
            const total = rfq.vendor_total ?? rfq.vendor_count ?? 0;
            const isFullySent = total > 0 && sentCount === total;
            
            return rfq.status === 'SENT' || isFullySent;
        });
    }, [rfqResponse]);

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
                {/* 🔍 @Agent_Search_Operator: Server-side Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาด้วย เลขที่ RFQ, ชื่อผู้ขาย หรือ วัตถุประสงค์..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-white transition-all shadow-sm"
                    />
                    {isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500">
                            <Loader2 size={18} className="animate-spin" />
                        </div>
                    )}
                </div>

                {/* 🎨 @Agent_UI_Hydrator: Real-Time Table Hydration */}
                <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm relative min-h-[300px]">
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
                            {isLoading ? (
                                // Full-body loader for first load or search transition
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Loader2 size={40} className="animate-spin mb-4 opacity-20" />
                                            <p className="animate-pulse">กำลังดึงข้อมูล RFQ ล่าสุด...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : rfqs.length > 0 ? (
                                rfqs.map((rfq) => (
                                    <tr key={rfq.rfq_id} className="hover:bg-indigo-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-5 py-3 font-medium text-indigo-700 dark:text-indigo-400 whitespace-nowrap">{rfq.rfq_no}</td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {rfq.rfq_date ? formatThaiDate(rfq.rfq_date) : '-'}
                                        </td>
                                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300 max-w-[150px] truncate">
                                            {/* @Agent_UI_Hydrator: Mapping vendor name via lookup */}
                                            {rfq.rfqVendors && rfq.rfqVendors.length > 0 && rfq.rfqVendors[0]?.vendor_id ? (
                                                <VendorNameDisplay vendorId={Number(rfq.rfqVendors[0].vendor_id)} />
                                            ) : (
                                                rfq.vendor_name || '-'
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                                            <div className="truncate max-w-[200px]" title={rfq.remarks || rfq.purpose}>
                                                {rfq.remarks || rfq.purpose || '-'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // 🔄 @Agent_Selection_Handler: Send full RFQ object
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