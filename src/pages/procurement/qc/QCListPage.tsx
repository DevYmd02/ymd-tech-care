/**
 * @file QCListPage.tsx
 * @description หน้ารายการใบเปรียบเทียบราคา - Quote Comparison Master (QC)
 * @route /procurement/qc
 * @refactored Uses PageListLayout, FilterField, useTableFilters, React Query
 */

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Scale, Search, X } from 'lucide-react';
import { formatThaiDate } from '../../../utils/dateUtils';
import { styles } from '../../../constants';
import { PageListLayout, FilterField } from '../../../components/shared';
import { useTableFilters } from '../../../hooks';
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
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'APPROVED', label: 'Approved' },
];

// ====================================================================================
// STATUS BADGE COMPONENT
// ====================================================================================

const QCStatusBadge = ({ status }: { status: string }) => {
    let className = 'px-3 py-1 rounded-full text-xs font-semibold';
    let label = status;

    switch (status.toUpperCase()) {
        case 'APPROVED':
            className += ' bg-emerald-100 text-emerald-700';
            label = 'Approved';
            break;
        case 'SUBMITTED':
            className += ' bg-blue-100 text-blue-700';
            label = 'Submitted';
            break;
        case 'DRAFT':
        default:
            className += ' bg-gray-100 text-gray-700';
            label = 'Draft';
            break;
    }

    return <span className={className}>{label}</span>;
};

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function QCListPage() {
    // URL-based Filter State
    // search = เลขที่ใบ QC (qc_no), search2 = เลขที่ PR อ้างอิง (pr_id FK)
    const { 
        filters, 
        handleSearchChange, 
        handleSearch2Change,
        handleStatusChange, 
        handleDateRangeChange,
        resetFilters 
    } = useTableFilters<QCStatus>({
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Row 1 */}
                        {/* เลขที่ใบ QC (qc_no) */}
                        <FilterField
                            label="เลขที่ใบ QC (qc_no)"
                            type="text"
                            value={filters.search}
                            onChange={handleSearchChange}
                            placeholder="QC2024-xxx"
                            accentColor="indigo"
                        />
                        
                        {/* เลขที่ PR อ้างอิง (pr_id FK) */}
                        <FilterField
                            label="เลขที่ PR อ้างอิง (pr_id FK)"
                            type="text"
                            value={filters.search2}
                            onChange={handleSearch2Change}
                            placeholder="PR2024-xxx"
                            accentColor="indigo"
                        />

                        {/* สถานะ (status) */}
                        <FilterField
                            label="สถานะ (status)"
                            type="select"
                            value={filters.status}
                            onChange={(val) => handleStatusChange(val as QCStatus | 'ALL')}
                            options={QC_STATUS_OPTIONS}
                            accentColor="indigo"
                        />

                        {/* Row 2 */}
                        {/* วันที่สร้าง จาก (created_at) */}
                        <FilterField
                            label="วันที่สร้าง จาก"
                            type="date"
                            value={filters.dateFrom}
                            onChange={(val) => handleDateRangeChange(val, filters.dateTo)}
                            accentColor="indigo"
                        />

                        {/* ถึงวันที่ */}
                        <FilterField
                            label="ถึงวันที่"
                            type="date"
                            value={filters.dateTo}
                            onChange={(val) => handleDateRangeChange(filters.dateFrom, val)}
                            accentColor="indigo"
                        />

                        {/* Action Buttons - inline (Col 3) */}
                        <div className="flex items-end justify-end gap-2 flex-wrap sm:flex-nowrap h-full pb-0.5">
                            {/* Search Button */}
                            <button
                                type="button"
                                onClick={() => {}}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                            >
                                <Search size={16} />
                                ค้นหา
                            </button>

                            {/* Clear Button */}
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg border border-gray-300 flex items-center gap-2 transition-colors whitespace-nowrap"
                            >
                                <X size={16} />
                                ล้างค่า
                            </button>
                        </div>
                    </div>
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
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-indigo-600">
                        <h2 className="text-lg font-bold text-white">รายการใบเปรียบเทียบราคา</h2>
                        <span className="text-sm text-indigo-100">
                            พบทั้งหมด <span className="font-semibold">{data?.total ?? 0}</span> รายการ
                        </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">ลำดับ</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">เลขที่ใบ QC</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">วันที่สร้าง</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">เลขที่ PR อ้างอิง</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">สถานะ</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">จำนวน Vendors</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ผู้เสนอราคาต่ำสุด</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ราคาต่ำสุด (บาท)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                {qcList.length > 0 ? (
                                    qcList.map((item, index) => (
                                        <tr key={item.qc_id} className="hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-center">{index + 1}</td>
                                            
                                            <td className="px-4 py-3">
                                                <a href="#" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:underline">
                                                    {item.qc_no}
                                                </a>
                                            </td>

                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                {formatThaiDate(item.created_at)}
                                            </td>

                                            <td className="px-4 py-3 text-sm font-medium text-purple-500 dark:text-purple-300">
                                                {item.pr_no}
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <QCStatusBadge status={item.status} />
                                            </td>

                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-center">
                                                {item.vendor_count}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                                                {item.lowest_bidder_name}
                                            </td>

                                            <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-white text-right">
                                                {item.lowest_bid_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
