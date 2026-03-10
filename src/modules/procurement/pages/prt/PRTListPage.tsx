/**
 * @file PRTListPage.tsx
 * @description หน้ารายการใบคืนสินค้า (Purchase Return List)
 * @route /procurement/prt
 * @refactored Uses PageListLayout, FilterField, useTableFilters (Manual Search Pattern), React Query, SmartTable
 */

import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { FileText, Eye, Package, Database, Search, Plus } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, SmartTable, FilterField, MobileListCard, MobileListContainer } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import { PrtService } from '@/modules/procurement/services/prt.service';
import type { PRTListParams, PRTStatus, PurchaseReturn } from '@/modules/procurement/types';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import PRTFormModal from './components/PRTFormModal';

// ====================================================================================
// STATUS BADGE IMPL
// ====================================================================================
const PRTStatusBadge: React.FC<{ status: PRTStatus; className?: string }> = ({ status, className }) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    let label: string = status;

    switch (status) {
        case 'DRAFT':
            label = 'แบบร่าง';
            colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            break;
        case 'POSTED':
            label = 'บันทึกแล้ว';
            colorClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            break;
        case 'CANCELLED':
            label = 'ยกเลิก';
            colorClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400';
            break;
    }

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colorClass} ${className || ''}`}>
            {label}
        </span>
    );
};

// ====================================================================================
// OPTIONS
// ====================================================================================

const PRT_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'POSTED', label: 'บันทึกแล้ว' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function PRTListPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // URL-based Filter State (Explicit Search Pattern)
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
    } = useTableFilters<PRTStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'prt_no',
            search2: 'vendor_name',
            search3: 'ref_grn_no',
        },
    });

    // Convert to API filter format using APPLIED filters (from URL)
    const apiFilters: PRTListParams = {
        page: filters.page,
        limit: filters.limit,
        prt_no: filters.search || undefined,
        vendor_name: filters.search2 || undefined,
        ref_grn_no: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        sort: filters.sort || undefined,
    };

    // Data Fetching — driven by applied filters (URL params only)
    const { data, isLoading } = useQuery({
        queryKey: ['purchase-returns', apiFilters],
        queryFn: () => PrtService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // Handlers
    const handleView = (id: number) => alert(`ดูรายละเอียด PRT: ${id}`);
    const handleCN = (id: number) => alert(`ออก CN สำหรับ PRT: ${id}`);
    const handlePost = (id: number) => alert(`Post PRT: ${id}`);

    const handleCreate = () => {
        setIsModalOpen(true);
    };

    const handleModalSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
        setIsModalOpen(false);
    };

    // Columns
    const columnHelper = createColumnHelper<PurchaseReturn>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            size: 50,
            enableSorting: false,
        }),
        columnHelper.accessor('prt_no', {
            header: 'เลขที่ PRT',
            cell: (info) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => handleView(info.row.original.prt_id)}>
                        {info.getValue()}
                    </span>
                    <span className="text-xs text-gray-400">สร้างโดย: {info.row.original.created_by}</span>
                </div>
            ),
            size: 140,
            enableSorting: true,
        }),
        columnHelper.accessor('prt_date', {
            header: 'วันที่คืน',
            cell: (info) => (
                <span className="text-gray-600 dark:text-gray-300">
                    {formatThaiDate(info.getValue())}
                </span>
            ),
            size: 110,
            enableSorting: true,
        }),
        columnHelper.accessor('vendor_name', {
            header: 'ผู้ขาย',
            cell: (info) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]" title={info.getValue()}>
                        {info.getValue()}
                    </span>
                    <span className="text-xs text-gray-500">{info.row.original.vendor_code}</span>
                </div>
            ),
            size: 200,
            enableSorting: false,
        }),
        columnHelper.accessor('ref_grn_no', {
            header: 'อ้างอิง GRN',
            cell: (info) => (
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                    {info.getValue() || '-'}
                </span>
            ),
            size: 130,
            enableSorting: false,
        }),
        columnHelper.accessor('total_qty', {
            header: () => <div className="text-right w-full">จำนวนคืน (QTY)</div>,
            cell: (info) => (
                <div className="text-right font-medium text-gray-700 dark:text-gray-300">
                    {info.getValue()?.toLocaleString()}
                </div>
            ),
            size: 100,
            enableSorting: true,
        }),
        columnHelper.accessor('total_amount', {
            header: () => <div className="text-right w-full">มูลค่ารวม (TOTAL)</div>,
            cell: (info) => (
                <div className="text-right font-bold text-gray-800 dark:text-white">
                    {info.getValue()?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            ),
            size: 130,
            enableSorting: true,
        }),
        columnHelper.accessor('status', {
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center">
                    <PRTStatusBadge status={info.getValue()} />
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">การจัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => handleView(item.prt_id)}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
                            title="ดูรายละเอียด"
                        >
                            <Eye size={16} />
                        </button>

                        {item.status === 'POSTED' && (
                            <button
                                onClick={() => handleCN(item.prt_id)}
                                className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
                                title="Credit Note"
                            >
                                <FileText size={14} /> CN
                            </button>
                        )}

                        {item.status === 'DRAFT' && (
                            <button
                                onClick={() => handlePost(item.prt_id)}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
                                title="Post PRT"
                            >
                                <Package size={14} /> Post
                            </button>
                        )}
                    </div>
                );
            },
            size: 120,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit]);

    return (
        <>
            <PageListLayout
                title="รายการใบคืนสินค้า (Purchase Return - PRT)"
                subtitle="จัดการและติดตามใบคืนสินค้าทั้งหมด"
                icon={Database}
                accentColor="blue"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                isLoading={isLoading}
                searchForm={
                    <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <FilterField
                                label="เลขที่ PRT"
                                value={localFilters.search}
                                onChange={(val: string) => handleFilterChange('search', val)}
                                placeholder="PRT2024-xxx"
                                accentColor="blue"
                            />
                            <FilterField
                                label="ผู้ขาย"
                                value={localFilters.search2}
                                onChange={(val: string) => handleFilterChange('search2', val)}
                                placeholder="ชื่อผู้ขาย"
                                accentColor="blue"
                            />
                            <FilterField
                                label="เลขที่ GRN อ้างอิง"
                                value={localFilters.search3}
                                onChange={(val: string) => handleFilterChange('search3', val)}
                                placeholder="GRN2024-xxx"
                                accentColor="blue"
                            />
                            <FilterField
                                label="สถานะ"
                                type="select"
                                value={localFilters.status}
                                onChange={(val: string) => handleFilterChange('status', val)}
                                options={PRT_STATUS_OPTIONS}
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
                            <div className="md:col-span-2 lg:col-span-2 flex flex-col sm:flex-row flex-wrap justify-end gap-2 items-center">
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
                                    onClick={handleCreate}
                                    className="w-full sm:w-auto h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <Plus size={16} strokeWidth={2.5} />
                                    สร้าง PRT ใหม่
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
                            columns={columns as ColumnDef<PurchaseReturn>[]}
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
                            rowIdField="prt_id"
                            className="h-full"
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
                                key={item.prt_id}
                                title={item.prt_no}
                                subtitle={formatThaiDate(item.prt_date)}
                                statusBadge={<PRTStatusBadge status={item.status} />}
                                details={[
                                    { label: 'ผู้ขาย:', value: item.vendor_name || '-' },
                                    { label: 'GRN อ้างอิง:', value: item.ref_grn_no || '-' },
                                    { label: 'จำนวนคืน:', value: `${item.total_qty?.toLocaleString() || 0}` },
                                ]}
                                amountLabel="มูลค่ารวม"
                                amountValue={
                                    <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                        {item.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                                    </span>
                                }
                                actions={
                                    <>
                                        <button
                                            onClick={() => handleView(item.prt_id)}
                                            className="flex-1 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200 dark:border-slate-600"
                                        >
                                            <Eye size={14} /> ดูรายละเอียด
                                        </button>
                                        {item.status === 'DRAFT' && (
                                            <button
                                                onClick={() => handlePost(item.prt_id)}
                                                className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                            >
                                                <Package size={14} /> Post
                                            </button>
                                        )}
                                        {item.status === 'POSTED' && (
                                            <button
                                                onClick={() => handleCN(item.prt_id)}
                                                className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                            >
                                                <FileText size={14} /> CN
                                            </button>
                                        )}
                                    </>
                                }
                            />
                        ))}
                    </MobileListContainer>
                </div>
            </PageListLayout>

            <PRTFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleModalSuccess}
            />
        </>
    );
}
