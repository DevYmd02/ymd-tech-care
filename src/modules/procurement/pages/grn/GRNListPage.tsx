/**
 * @file GRNListPage.tsx
 * @description หน้ารายการใบรับสินค้า (Goods Receipt Note List)
 * @route /procurement/grn
 * @refactored Uses PageListLayout, FilterField, useTableFilters (Manual Search Pattern), React Query, SmartTable
 */

import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Eye, Package, Search, Plus } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { SmartTable, PageListLayout, FilterField, MobileListCard, MobileListContainer } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import { GRNService } from '@/modules/procurement/services/grn.service';
import type { GRNListParams, GRNStatus, GRNListItem } from '@/modules/procurement/types';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { GRNFormModal } from './components';

// ====================================================================================
// CONSTANTS
// ====================================================================================

const GRN_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'ร่าง' },
    { value: 'POSTED', label: 'บันทึกแล้ว' },
    { value: 'REVERSED', label: 'ย้อนกลับแล้ว' },
    { value: 'RETURNED', label: 'มีการคืน' },
];

const STATUS_COLORS: Record<GRNStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    POSTED: 'bg-green-100 text-green-800',
    REVERSED: 'bg-red-100 text-red-800',
    RETURNED: 'bg-orange-100 text-orange-800',
};

const STATUS_LABELS: Record<GRNStatus, string> = {
    DRAFT: 'ร่าง',
    POSTED: 'บันทึกแล้ว',
    REVERSED: 'ย้อนกลับแล้ว',
    RETURNED: 'มีการคืน',
};

// ====================================================================================
// COMPONENT
// ====================================================================================

export default function GRNListPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // 1. URL-based Filter State (Explicit Search Pattern)
    const {
        filters,
        localFilters,
        handleFilterChange,
        handleApplyFilters,
        setFilters,
        resetFilters,
        handlePageChange,
        handleSortChange,
        sortConfig,
    } = useTableFilters<GRNStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'grn_no',
            search2: 'po_no',
        },
    });

    // Convert to API filter format using APPLIED filters (from URL)
    const apiFilters: GRNListParams = {
        grn_no: filters.search || undefined,
        po_no: filters.search2 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined,
    };

    // 2. Data Fetching — driven by applied filters (URL params only)
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['grn-list', apiFilters],
        queryFn: () => GRNService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // 3. Actions
    const handleView = (id: number) => alert(`View GRN: ${id}`);

    // 4. Columns
    const columnHelper = createColumnHelper<GRNListItem>();
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            size: 50,
            enableSorting: false,
        }),
        columnHelper.accessor('grn_no', {
            header: 'เลขที่เอกสาร',
            cell: (info) => <span className="font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">{info.getValue()}</span>,
            enableSorting: true,
        }),
        columnHelper.accessor('po_no', {
            header: 'อ้างอิง PO',
            cell: (info) => <span className="text-gray-600 dark:text-gray-300">{info.getValue()}</span>,
            enableSorting: false,
        }),
        columnHelper.accessor('received_date', {
            header: 'วันที่รับ',
            cell: (info) => <span className="text-gray-600 dark:text-gray-300">{formatThaiDate(info.getValue())}</span>,
            enableSorting: true,
        }),
        columnHelper.accessor('warehouse_name', {
            header: 'คลังสินค้า',
            cell: (info) => <span className="text-gray-700 dark:text-gray-200">{info.getValue()}</span>,
            enableSorting: false,
        }),
        columnHelper.accessor('received_by_name', {
            header: 'ผู้รับสินค้า',
            cell: (info) => <span className="text-gray-700 dark:text-gray-200">{info.getValue()}</span>,
            enableSorting: false,
        }),
        columnHelper.accessor('status', {
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center">
                    <div className={`mx-auto px-2 py-1 rounded text-xs font-semibold w-max ${STATUS_COLORS[info.getValue()]}`}>
                        {STATUS_LABELS[info.getValue()]}
                    </div>
                </div>
            ),
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <button
                        onClick={() => handleView(row.original.grn_id)}
                        className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1 rounded hover:bg-gray-100 dark:hover:bg-blue-900/20 transition-all"
                        title="ดูรายละเอียด"
                    >
                        <Eye size={18} />
                    </button>
                </div>
            ),
            size: 80,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit]);

    return (
        <>
            <PageListLayout
                title="ใบรับสินค้า"
                subtitle="Goods Receipt Note (GRN)"
                icon={Package}
                accentColor="blue"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                isLoading={isLoading}
                searchForm={
                    <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <FilterField
                                label="เลขที่ GRN"
                                value={localFilters.search}
                                onChange={(val: string) => handleFilterChange('search', val)}
                                placeholder="GRN2024-xxx"
                                accentColor="blue"
                            />
                            <FilterField
                                label="เลขที่ PO อ้างอิง"
                                value={localFilters.search2}
                                onChange={(val: string) => handleFilterChange('search2', val)}
                                placeholder="PO2024-xxx"
                                accentColor="blue"
                            />
                            <FilterField
                                label="สถานะ"
                                type="select"
                                value={localFilters.status}
                                onChange={(val: string) => handleFilterChange('status', val)}
                                options={GRN_STATUS_OPTIONS}
                                accentColor="blue"
                            />
                            <FilterField
                                label="วันที่เริ่มต้น"
                                type="date"
                                value={localFilters.dateFrom || ''}
                                onChange={(val: string) => handleFilterChange('dateFrom', val)}
                                accentColor="blue"
                            />
                            <FilterField
                                label="วันที่สิ้นสุด"
                                type="date"
                                value={localFilters.dateTo || ''}
                                onChange={(val: string) => handleFilterChange('dateTo', val)}
                                accentColor="blue"
                            />

                            {/* Action Buttons Group */}
                            <div className="md:col-span-2 lg:col-span-3 flex flex-col sm:flex-row flex-wrap justify-end gap-2 items-center">
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="flex-1 sm:flex-none h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300 shadow-sm whitespace-nowrap"
                                    >
                                        ล้างค่า
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 sm:flex-none h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        <Search size={18} />
                                        ค้นหา
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="w-full sm:w-auto h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <Plus size={16} strokeWidth={2.5} />
                                    สร้างใบรับสินค้าใหม่
                                </button>
                            </div>
                        </div>
                    </form>
                }
            >
                <div className="h-full flex flex-col">
                    {/* Desktop View: Table */}
                    <div className="hidden md:block flex-1 overflow-hidden">
                        <SmartTable
                            data={data?.data ?? []}
                            columns={columns as ColumnDef<GRNListItem>[]}
                            isLoading={isLoading}
                            pagination={{
                                pageIndex: filters.page,
                                pageSize: filters.limit,
                                totalCount: data?.total ?? 0,
                                onPageChange: handlePageChange,
                                onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 }),
                            }}
                            sortConfig={sortConfig}
                            onSortChange={handleSortChange}
                            rowIdField="grn_id"
                            className="h-full"
                            showFooter={true}
                        />
                    </div>

                    {/* Mobile View: Cards (shared MobileListContainer + MobileListCard) */}
                    <MobileListContainer
                        isLoading={isLoading}
                        isEmpty={!data?.data?.length}
                        pagination={data?.total ? { page: filters.page, total: data.total, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                    >
                        {(data?.data ?? []).map((item) => (
                            <MobileListCard
                                key={item.grn_id}
                                title={item.grn_no}
                                subtitle={formatThaiDate(item.received_date)}
                                statusBadge={
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[item.status]}`}>
                                        {STATUS_LABELS[item.status]}
                                    </span>
                                }
                                details={[
                                    { label: 'PO อ้างอิง:', value: item.po_no || '-' },
                                    { label: 'คลังสินค้า:', value: item.warehouse_name || '-' },
                                    { label: 'ผู้รับ:', value: item.received_by_name || '-' },
                                ]}
                                actions={
                                    <button
                                        onClick={() => handleView(item.grn_id)}
                                        className="flex-1 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200 dark:border-slate-600"
                                    >
                                        <Eye size={14} /> ดูรายละเอียด
                                    </button>
                                }
                            />
                        ))}
                    </MobileListContainer>
                </div>
            </PageListLayout>

            <GRNFormModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => refetch()}
            />
        </>
    );
}
