/**
 * @file QCListPage.tsx
 * @description หน้ารายการใบเปรียบเทียบราคา - Quote Comparison Master (QC)
 * @route /procurement/qc
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Scale, FileText, Eye } from 'lucide-react';
import { formatThaiDate } from '@utils/dateUtils';
import { FilterFormBuilder } from '@shared';
import { SmartTable } from '@ui/SmartTable';
import { PageListLayout } from '@layout/PageListLayout';
import { QCStatusBadge } from '@ui/StatusBadge';
import type { FilterFieldConfig } from '@shared/FilterFormBuilder';
import { useTableFilters, type TableFilters } from '@hooks';
import { QCFormModal } from './components/QCFormModal';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';

// Services & Types
import { qcService } from '@services/QCService';
import type { QCListParams } from '@services/QCService';
import type { QCStatus, QCListItem } from '@project-types/qc-types';

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

type QCFilterKeys = Extract<keyof TableFilters<QCStatus>, string>;

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
    const { filters, setFilters, resetFilters, handlePageChange } = useTableFilters<QCStatus>({
        defaultStatus: 'ALL',
    });

    // Convert to API filter format
    const apiFilters: QCListParams = {
        qc_no: filters.search || undefined,
        pr_no: filters.search2 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        // Assuming QCListParams needs pagination fields too, or handled by service defaults
        // If not in type, casting or updating type might be needed, similar to RFQ/QT
    };

    // Data Fetching with React Query
    const { data, isLoading } = useQuery({
        queryKey: ['quote-comparisons', apiFilters],
        queryFn: () => qcService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // Modal State (for future create functionality)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Handlers
    const handleFilterChange = (name: QCFilterKeys, value: string) => {
        setFilters({ [name]: value });
    };

    // Columns
    const columnHelper = createColumnHelper<QCListItem>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            footer: () => <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-bold text-sm text-gray-700 dark:text-gray-200">ยอดรวมราคาต่ำสุดทั้งหมด :</div>,
            size: 40,
            enableSorting: false,
        }),
        columnHelper.accessor('qc_no', {
            header: 'เลขที่ใบ QC',
            cell: (info) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer block" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
            size: 140,
            enableSorting: true,
        }),
        columnHelper.accessor('created_at', {
            header: () => <div className="text-left">วันที่สร้าง</div>,
            cell: (info) => (
                <div className="text-gray-600 dark:text-gray-300 text-left whitespace-nowrap">
                    {formatThaiDate(info.getValue())}
                </div>
            ),
            size: 130,
            enableSorting: true,
        }),
        columnHelper.accessor('pr_no', {
            header: 'PR อ้างอิง',
            cell: (info) => (
                <span className="font-medium text-purple-500 dark:text-purple-300 truncate block" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
            size: 140,
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center">
                    <QCStatusBadge status={info.getValue()} />
                </div>
            ),
            size: 120,
            enableSorting: false,
        }),
        columnHelper.accessor('vendor_count', {
            header: () => <div className="text-center">Vendors</div>,
            cell: (info) => (
                <div className="text-gray-600 dark:text-gray-300 text-center">
                    {info.getValue()}
                </div>
            ),
            size: 80,
            enableSorting: false,
        }),
        columnHelper.accessor('lowest_bidder_name', {
            header: 'ผู้เสนอราคาต่ำสุด',
            cell: (info) => (
                <span className="hover:underline cursor-pointer text-gray-600 dark:text-gray-300 truncate block" title={info.getValue() || ''}>
                    {info.getValue()}
                </span>
            ),
            enableSorting: false,
        }),
        columnHelper.accessor('lowest_bid_amount', {
            header: () => <div className="text-center w-full">ราคาต่ำสุด (บาท)</div>,
            cell: (info) => (
                <div className="font-semibold text-gray-800 dark:text-gray-200 text-center whitespace-nowrap">
                    {info.getValue()?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            ),
            footer: () => {
                 const total = data?.data.reduce((sum, item) => sum + (item.lowest_bid_amount || 0), 0) || 0;
                 return (
                     <div className="text-center font-bold text-base text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                         {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                     </div>
                 );
            },
            size: 140,
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
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
                );
            },
            size: 100,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, data?.data]);

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
                        columns={{ sm: 1, md: 2, lg: 3 }}
                        actionColSpan={{ lg: 1 }}
                    />
                }
            >
                <div className="h-full flex flex-col">
                    <SmartTable
                        data={data?.data ?? []}
                        columns={columns as ColumnDef<QCListItem>[]}
                        isLoading={isLoading}
                        pagination={{
                            pageIndex: filters.page,
                            pageSize: filters.limit,
                            totalCount: data?.total ?? 0,
                            onPageChange: handlePageChange,
                            onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 })
                        }}
                        rowIdField="qc_id"
                        className="flex-1"
                        showFooter={true}
                    />
                </div>
            </PageListLayout>

            {/* Modals - Only mount when open */}
            {isCreateModalOpen && (
                <QCFormModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        // Refetch data is handled by React Query invalidation in the modal or parent
                        // But here we can just close
                    }}
                />
            )}
        </>
    );
}
