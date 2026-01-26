/**
 * @file QCListPage.tsx
 * @description หน้ารายการใบเปรียบเทียบราคา - Quote Comparison Master (QC)
 * @route /procurement/qc
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query
 */

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Scale, FileText, Eye } from 'lucide-react';
import { formatThaiDate } from '../../../utils/dateUtils';
import { styles } from '../../../constants';
import { PageListLayout, FilterFormBuilder, QCStatusBadge } from '../../../components/shared';
import type { FilterFieldConfig } from '../../../components/shared/FilterFormBuilder';
import { useTableFilters, type TableFilters } from '../../../hooks';
import { QCFormModal } from './components/QCFormModal';

// Services & Types
import { qcService } from '../../../services/qcService';
import type { QCListParams } from '../../../services/qcService';
import type { QCStatus } from '../../../types/qc-types';

// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const QC_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'WAITING_FOR_PO', label: 'รอเปิดใบสั่งซื้อ' },
    { value: 'PO_CREATED', label: 'เปิดใบสั่งซื้อแล้ว' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================

type QCFilterKeys = keyof TableFilters<QCStatus>;

const QC_FILTER_CONFIG: FilterFieldConfig<QCFilterKeys>[] = [
    { name: 'search', label: 'เลขที่ใบ QC', type: 'text', placeholder: 'QC2024-xxx' },
    { name: 'search2', label: 'เลขที่ PR อ้างอิง', type: 'text', placeholder: 'PR2024-xxx' },
    { name: 'status', label: 'สถานะ', type: 'select', options: QC_STATUS_OPTIONS },
    { name: 'dateFrom', label: 'วันที่สร้าง จาก', type: 'date' },
    { name: 'dateTo', label: 'ถึงวันที่', type: 'date' },
];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function QCListPage() {
    // URL-based Filter State
    const { filters, setFilters, resetFilters } = useTableFilters<QCStatus>({
        defaultStatus: 'ALL',
    });

    // Convert to API filter format
    const apiFilters: QCListParams = {
        qc_no: filters.search || undefined,
        pr_no: filters.search2 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
    };

    // Data Fetching with React Query
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['quote-comparisons', apiFilters],
        queryFn: () => qcService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    const qcList = data?.data ?? [];

    // Modal State (for future create functionality)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Handlers
    const handleFilterChange = (name: QCFilterKeys, value: string) => {
        setFilters({ [name]: value });
    };

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <>
            <PageListLayout
                title="รายการใบเปรียบเทียบราคา"
                subtitle="Quote Comparison Master (QC)"
                icon={Scale}
                accentColor="indigo"
                isLoading={isLoading}
                searchForm={
                    <FilterFormBuilder
                        config={QC_FILTER_CONFIG}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onSearch={() => {}} // React Query auto-fetches on filter change
                        onReset={resetFilters}
                        accentColor="indigo"
                        columns={{ sm: 2, md: 3, lg: 3 }}
                    />
                }
            >
                {/* Results Section */}
                <div className={`${styles.tableContainer} relative`}>
                    {/* Fetching indicator */}
                    {isFetching && !isLoading && (
                        <div className="absolute top-2 right-2 z-10">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                        </div>
                    )}

                    {/* Results Header */}
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-indigo-600">
                        <h2 className="text-lg font-bold text-white">รายการใบเปรียบเทียบราคา</h2>
                        <span className="text-sm text-indigo-100">
                            พบทั้งหมด <span className="font-semibold">{data?.total ?? 0}</span> รายการ
                        </span>
                    </div>

                    {/* Table - Responsive Fixed Layout */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] table-fixed">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="w-[5%] px-2 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">ลำดับ</th>
                                    <th className="w-[14%] px-2 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">เลขที่ใบ QC</th>
                                    <th className="w-[12%] px-2 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">วันที่สร้าง</th>
                                    <th className="w-[14%] px-2 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">PR อ้างอิง</th>
                                    <th className="w-[10%] px-2 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">สถานะ</th>
                                    <th className="w-[10%] px-2 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Vendors</th>
                                    <th className="w-[18%] px-2 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">ผู้เสนอราคาต่ำสุด</th>
                                    <th className="w-[17%] px-2 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">ราคาต่ำสุด (บาท)</th>
                                    <th className="w-[10%] px-2 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900 text-xs">
                                {qcList.length > 0 ? (
                                    qcList.map((item, index) => (
                                        <tr key={item.qc_id} className="hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-2 py-3 text-gray-600 dark:text-gray-300 text-center">{index + 1}</td>
                                            
                                            <td className="px-2 py-3">
                                                <span className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:underline cursor-pointer truncate block" title={item.qc_no}>
                                                    {item.qc_no}
                                                </span>
                                            </td>

                                            <td className="px-2 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                {formatThaiDate(item.created_at)}
                                            </td>

                                            <td className="px-2 py-3">
                                                <span className="font-medium text-purple-500 dark:text-purple-300 truncate block" title={item.pr_no}>
                                                    {item.pr_no}
                                                </span>
                                            </td>

                                            <td className="px-2 py-3 text-center">
                                                <QCStatusBadge status={item.status} />
                                            </td>

                                            <td className="px-2 py-3 text-gray-600 dark:text-gray-300 text-center">
                                                {item.vendor_count}
                                            </td>

                                            <td className="px-2 py-3 text-gray-700 dark:text-gray-200">
                                                <span className="truncate block" title={item.lowest_bidder_name}>{item.lowest_bidder_name}</span>
                                            </td>

                                            <td className="px-2 py-3 font-bold text-gray-800 dark:text-white text-right whitespace-nowrap">
                                                {item.lowest_bid_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>

                                            <td className="px-2 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {item.status === 'WAITING_FOR_PO' && (
                                                        <button 
                                                            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                                            title="เปิดใบสั่งซื้อ"
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="p-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                                        title="ดูรายละเอียด"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                                            ไม่พบข้อมูลใบเปรียบเทียบราคา
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageListLayout>

            {/* Modals */}
            <QCFormModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    // Refetch data is handled by React Query invalidation in the modal or parent
                    // But here we can just close
                }}
            />
        </>
    );
}
