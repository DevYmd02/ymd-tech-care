import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Eye, Package, Plus } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { FilterFormBuilder } from '@ui';
import { SmartTable } from '@ui';
import { PageListLayout } from '@ui';
import type { FilterFieldConfig } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import { GRNService } from '@/modules/procurement/services/grn.service';
import type { GRNListParams, GRNStatus, GRNListItem } from '@/modules/procurement/types/grn-types';
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

    // 1. Filter State
    const { filters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<GRNStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'grn_no',
            search2: 'po_no'
        }
    });

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

    // 2. Data Fetching
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['grn-list', apiFilters],
        queryFn: () => GRNService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });



    // 3. Actions
    const handleView = (id: string) => alert(`View GRN: ${id}`);

    // 4. Columns
    const columnHelper = createColumnHelper<GRNListItem>();
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            size: 50,
        }),
        columnHelper.accessor('grn_no', {
            header: 'เลขที่เอกสาร',
            cell: (info) => <span className="font-medium text-blue-600 cursor-pointer hover:underline">{info.getValue()}</span>,
        }),
        columnHelper.accessor('po_no', {
            header: 'อ้างอิง PO',
            cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
        }),
        columnHelper.accessor('received_date', {
            header: 'วันที่รับ',
            cell: (info) => formatThaiDate(info.getValue()),
        }),
        columnHelper.accessor('warehouse_name', {
            header: 'คลังสินค้า',
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('received_by_name', {
            header: 'ผู้รับสินค้า',
            cell: (info) => info.getValue(),
        }),
        columnHelper.accessor('status', {
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className={`mx-auto px-2 py-1 rounded text-xs font-semibold w-max ${STATUS_COLORS[info.getValue()]}`}>
                    {STATUS_LABELS[info.getValue()]}
                </div>
            ),
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <button 
                        onClick={() => handleView(row.original.grn_id)}
                        className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-gray-100"
                        title="ดูรายละเอียด"
                    >
                        <Eye size={18} />
                    </button>
                </div>
            ),
            size: 80,
        }),
    ], [columnHelper, filters.page, filters.limit]);

    // 5. Config - matching the reference image layout
    const filterConfig: FilterFieldConfig<string>[] = [
        { name: 'search', label: 'เลขที่ GRN', type: 'text', placeholder: 'GRN2024-xxx' },
        { name: 'search2', label: 'เลขที่ PO อ้างอิง', type: 'text', placeholder: 'PO2024-xxx' },
        { name: 'warehouse', label: 'คลังสินค้า', type: 'text', placeholder: 'ชื่อคลัง' },
        { name: 'status', label: 'สถานะ', type: 'select', options: GRN_STATUS_OPTIONS },
        { name: 'dateFrom', label: 'วันที่เริ่มต้น', type: 'date' },
        { name: 'dateTo', label: 'วันที่สิ้นสุด', type: 'date' },
    ];

    return (
        <>
            <PageListLayout
                title="ใบรับสินค้า"
                subtitle="Goods Receipt Note (GRN)"
                icon={Package}
                accentColor="blue"
                isLoading={isLoading}
                searchForm={
                    <FilterFormBuilder
                        config={filterConfig}
                        filters={filters}
                        onFilterChange={(name: string, value: string) => setFilters({ [name]: value })}
                        onSearch={() => refetch()} 
                        onReset={resetFilters}
                        accentColor="blue"
                        columns={{ sm: 1, md: 2, xl: 4 }}
                        actionColSpan={{ md: 2, xl: 2 }}
                        actionButtons={
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap w-full sm:w-auto font-medium"
                            >
                                <Plus size={20} />
                                สร้างใบรับสินค้า
                            </button>
                        }
                    />
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
                                onPageSizeChange: (size) => setFilters({ limit: size, page: 1 })
                            }}
                            sortConfig={sortConfig}
                            onSortChange={handleSortChange}
                            rowIdField="grn_id"
                            className="h-full"
                            showFooter={true}
                        />
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="md:hidden flex-1 overflow-y-auto p-2 space-y-3 pb-20">
                        {isLoading ? (
                            <div className="text-center py-4 text-gray-500">กำลังโหลด...</div>
                        ) : data?.data.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                                ไม่พบข้อมูล
                            </div>
                        ) : (
                            data?.data.map((item) => (
                                <div key={item.grn_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                                    {/* Header: GRN No + Status */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                                {item.grn_no}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatThaiDate(item.received_date)}
                                            </span>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[item.status]}`}>
                                            {STATUS_LABELS[item.status]}
                                        </div>
                                    </div>

                                    {/* Content Info */}
                                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5 border-t border-b border-gray-50 py-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">PO อ้างอิง:</span>
                                            <span className="font-medium text-purple-600">{item.po_no || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">คลังสินค้า:</span>
                                            <span className="font-medium">{item.warehouse_name || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">ผู้รับ:</span>
                                            <span className="font-medium">{item.received_by_name || '-'}</span>
                                        </div>
                                    </div>

                                    {/* Footer: Actions */}
                                    <div className="flex justify-end gap-2 pt-1">
                                            <button 
                                                onClick={() => handleView(item.grn_id)}
                                                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200"
                                            >
                                                <Eye size={14} /> ดูรายละเอียด
                                            </button>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Pagination for Mobile */}
                        {data?.total ? (
                            <div className="flex justify-between items-center pt-2 text-sm text-gray-600">
                                 <div>ทั้งหมด {data.total} รายการ</div>
                                 <div className="flex gap-2">
                                     <button
                                        disabled={filters.page === 1}
                                        onClick={() => handlePageChange(filters.page - 1)}
                                        className="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                                     >
                                        &lt;
                                     </button>
                                     <span>{filters.page} / {Math.ceil(data.total / filters.limit)}</span>
                                     <button
                                        disabled={filters.page >= Math.ceil(data.total / filters.limit)}
                                        onClick={() => handlePageChange(filters.page + 1)}
                                        className="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                                     >
                                        &gt;
                                     </button>
                                 </div>
                            </div>
                         ) : null}
                    </div>
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



