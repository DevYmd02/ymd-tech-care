/**
 * @file RFQListPage.tsx
 * @description หน้ารายการขอใบเสนอราคา (Request for Quotation List)
 * @route /procurement/rfq
 * @refactored Uses PageListLayout, FilterFormBuilder, React Query, and URL-based filters
 */

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Plus, Eye, Send, AlertCircle } from 'lucide-react';
import { formatThaiDate } from '../../../utils/dateUtils';
import { styles } from '../../../constants';
import { PageListLayout, FilterFormBuilder, RFQStatusBadge } from '../../../components/shared';
import type { FilterFieldConfig } from '../../../components/shared/FilterFormBuilder';
import { useWindowManager } from '../../../hooks/useWindowManager';
import { useTableFilters, type TableFilters } from '../../../hooks';
import QTFormModal from '../qt/components/QTFormModal';

// Services & Types
import { rfqService } from '../../../services/rfqService';
import type { RFQHeader, RFQStatus, RFQFilterCriteria } from '../../../types/rfq-types';

// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const RFQ_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'SENT', label: 'ส่งแล้ว' },

    { value: 'CLOSED', label: 'ปิดแล้ว' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================

type RFQFilterKeys = keyof TableFilters<RFQStatus>;

const RFQ_FILTER_CONFIG: FilterFieldConfig<RFQFilterKeys>[] = [
    { name: 'search', label: 'เลขที่ RFQ', type: 'text', placeholder: 'RFQ2024-xxx' },
    { name: 'search2', label: 'เลขที่ PR อ้างอิง', type: 'text', placeholder: 'PR2024-xxx' },
    { name: 'search3', label: 'ผู้สร้าง RFQ', type: 'text', placeholder: 'ชื่อผู้สร้าง' },
    { name: 'status', label: 'สถานะ', type: 'select', options: RFQ_STATUS_OPTIONS },
    { name: 'dateFrom', label: 'วันที่เริ่มต้น', type: 'date' },
    { name: 'dateTo', label: 'วันที่สิ้นสุด', type: 'date' },
];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function RFQListPage() {
    // URL-based Filter State
    const { filters, setFilters, resetFilters } = useTableFilters<RFQStatus>({
        defaultStatus: 'ALL',
    });

    // Convert to API filter format
    const apiFilters: RFQFilterCriteria = {
        rfq_no: filters.search || undefined,
        pr_no: filters.search2 || undefined,
        created_by_name: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
    };

    // Data Fetching with React Query
    const { data, isLoading, isFetching, isError, error } = useQuery({
        queryKey: ['rfqs', apiFilters],
        queryFn: () => rfqService.getList(apiFilters),
        placeholderData: keepPreviousData,
        retry: 1, // Fail fast on backend error
    });

    // QT Modal State
    const [isQTModalOpen, setIsQTModalOpen] = useState(false);
    const [selectedRFQForQT, setSelectedRFQForQT] = useState<RFQHeader | null>(null);
    
    // Window Manager
    const { openWindow } = useWindowManager();

    // Handlers
    const handleFilterChange = (name: RFQFilterKeys, value: string) => {
        setFilters({ [name]: value });
    };

    const handleOpenQT = (rfq: RFQHeader) => {
        setSelectedRFQForQT(rfq);
        setIsQTModalOpen(true);
    };

    const rfqList = data?.data ?? [];

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <>
            <PageListLayout
                title="รายการใบขอเสนอราคา"
                subtitle="Request for Quotation (RFQ)"
                icon={FileText}
                accentColor="teal"
                isLoading={isLoading}
                searchForm={
                    <FilterFormBuilder
                        config={RFQ_FILTER_CONFIG}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onSearch={() => {}} // React Query auto-fetches on filter change
                        onReset={resetFilters}
                        accentColor="teal"
                        columns={{ sm: 2, md: 4, lg: 4 }}
                        actionButtons={
                            <button
                                onClick={() => openWindow('RFQ')}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Plus size={18} />
                                <span>สร้าง RFQ ใหม่</span>
                            </button>
                        }
                    />
                }
            >
                {/* Error State */}
                {isError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3">
                        <div className="text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-full">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h3 className="text-red-800 dark:text-red-200 font-semibold">ไม่สามารถโหลดข้อมูลได้</h3>
                            <p className="text-red-600 dark:text-red-300 text-sm">
                                {error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่ในภายหลัง'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Results Section */}
                <div className={`${styles.tableContainer} relative`}>
                    {/* Fetching indicator */}
                    {isFetching && !isLoading && (
                        <div className="absolute top-2 right-2 z-10">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600" />
                        </div>
                    )}

                    {/* Results Header */}
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-teal-600">
                        <h2 className="text-lg font-bold text-white">ผลลัพธ์การค้นหา</h2>
                        <span className="text-sm text-teal-100">
                            พบทั้งหมด <span className="font-semibold">{data?.total ?? 0}</span> รายการ
                        </span>
                    </div>

                    {/* Table - Responsive Fixed Layout */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] table-fixed">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="w-[4%] px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">ลำดับ</th>
                                    <th className="w-[14%] px-2 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">เลขที่ RFQ</th>
                                    <th className="w-[10%] px-2 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">วันที่</th>
                                    <th className="w-[14%] px-2 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">PR อ้างอิง</th>
                                    <th className="w-[14%] px-2 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">ผู้สร้าง</th>
                                    <th className="w-[10%] px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">สถานะ</th>
                                    <th className="w-[10%] px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">ใช้ได้ถึง</th>
                                    <th className="w-[8%] px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">เจ้าหนี้</th>
                                    <th className="w-[16%] px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-xs">
                                {rfqList.length > 0 ? (
                                    rfqList.map((rfq, index) => (
                                        <tr key={rfq.rfq_id} className="hover:bg-teal-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-2 py-3 text-gray-500 dark:text-gray-400 text-center">
                                                {index + 1}
                                            </td>
                                            <td className="px-2 py-3">
                                                <span className="font-semibold text-teal-600 hover:text-teal-800 hover:underline cursor-pointer truncate block" title={rfq.rfq_no}>
                                                    {rfq.rfq_no}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                {formatThaiDate(rfq.rfq_date)}
                                            </td>
                                            <td className="px-2 py-3">
                                                <span className="font-semibold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer truncate block" title={rfq.pr_no || '-'}>
                                                    {rfq.pr_no || '-'}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 text-gray-700 dark:text-gray-300">
                                                <span className="truncate block" title={rfq.created_by_name || '-'}>{rfq.created_by_name || '-'}</span>
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                <RFQStatusBadge status={rfq.status} />
                                            </td>
                                            <td className="px-2 py-3 text-center text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                {formatThaiDate(rfq.quote_due_date || '')}
                                            </td>
                                            <td className="px-2 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                                                {rfq.vendor_count} ราย
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button className="p-1 text-gray-500 hover:text-gray-700 transition-colors" title="ดูรายละเอียด">
                                                        <Eye size={16} />
                                                    </button>
                                                    
                                                    {rfq.status === 'DRAFT' && (
                                                        <button className="flex items-center gap-0.5 px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold rounded shadow transition-colors whitespace-nowrap">
                                                            <Send size={12} /> ส่ง RFQ
                                                        </button>
                                                    )}

                                                    {rfq.status === 'SENT' && (
                                                        <button 
                                                            onClick={() => handleOpenQT(rfq)}
                                                            className="flex items-center gap-0.5 px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded shadow transition-colors whitespace-nowrap"
                                                        >
                                                            <FileText size={12} /> บันทึกราคา
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                                            ไม่พบข้อมูล RFQ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageListLayout>

            {/* QT Form Modal */}
            <QTFormModal
                isOpen={isQTModalOpen}
                onClose={() => {
                    setIsQTModalOpen(false);
                    setSelectedRFQForQT(null);
                }}
                initialRFQ={selectedRFQForQT}
            />
        </>
    );
}
