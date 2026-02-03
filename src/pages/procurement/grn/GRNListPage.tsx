import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Eye, CheckCircle, RotateCcw, XCircle, Package, Plus } from 'lucide-react';
import { formatThaiDate } from '@utils/dateUtils';
import { FilterFormBuilder } from '@shared';
import { SmartTable } from '@ui/SmartTable';
import { PageListLayout } from '@layout/PageListLayout';
import type { FilterFieldConfig } from '@shared/FilterFormBuilder';
import { useTableFilters } from '@hooks';
import { GRNService } from '@/services/procurement/grn.service';
import type { GRNListParams, GRNStatus, GRNListItem, GRNSummaryCounts } from '@/types/grn-types';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import GRNFormModal from './components/GRNFormModal';

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
    const { filters, setFilters, resetFilters, handlePageChange } = useTableFilters<GRNStatus>({
        defaultStatus: 'ALL',
    });

    const apiFilters: GRNListParams = {
        grn_no: filters.search || undefined,
        po_no: filters.search2 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        page: filters.page,
        limit: filters.limit,
    };

    // 2. Data Fetching
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['grn-list', apiFilters],
        queryFn: () => GRNService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    const { data: summaryCounts } = useQuery({
        queryKey: ['grn-summary'],
        queryFn: () => GRNService.getSummaryCounts(),
        initialData: { DRAFT: 0, POSTED: 0, REVERSED: 0, RETURNED: 0 } as GRNSummaryCounts
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

    // 5. Config
    const filterConfig: FilterFieldConfig<string>[] = [
        { name: 'search', label: 'เลขที่ GRN', type: 'text', placeholder: 'ค้นหาเลขที่เอกสาร' },
        { name: 'search2', label: 'เลขที่ PO', type: 'text', placeholder: 'ค้นหาเลขที่ PO' },
        { name: 'status', label: 'สถานะ', type: 'select', options: GRN_STATUS_OPTIONS },
        { name: 'dateFrom', label: 'วันที่รับ จาก', type: 'date' },
        { name: 'dateTo', label: 'ถึงวันที่', type: 'date' },
    ];

    return (
        <>
            <PageListLayout
                title="ใบรับสินค้า"
                subtitle="Goods Receipt Note (GRN) Management"
                icon={Package}
                accentColor="blue"
                isLoading={isLoading}
                searchForm={
                    <FilterFormBuilder
                        config={filterConfig}
                        filters={filters}
                        onFilterChange={(name, value) => setFilters({ [name]: value })}
                        onSearch={() => refetch()} 
                        onReset={resetFilters}
                        columns={{ sm: 2, md: 3, lg: 5 }}
                        actionButtons={
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
                            >
                                <Plus size={20} />
                                สร้างใบรับสินค้า
                            </button>
                        }
                    />
                }
            >
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <SummaryCard 
                        title="แบบร่าง (Draft)" 
                        count={summaryCounts.DRAFT} 
                        icon={FileText} 
                        color="text-gray-600" 
                        bg="bg-gray-50 dark:bg-gray-800" 
                        border="border-gray-200 dark:border-gray-700" 
                    />
                    <SummaryCard 
                        title="บันทึกแล้ว (Posted)" 
                        count={summaryCounts.POSTED} 
                        icon={CheckCircle} 
                        color="text-green-600" 
                        bg="bg-green-50 dark:bg-green-900/20" 
                        border="border-green-200 dark:border-green-800" 
                    />
                    <SummaryCard 
                        title="มีการคืน (Returned)" 
                        count={summaryCounts.RETURNED} 
                        icon={RotateCcw} 
                        color="text-orange-600" 
                        bg="bg-orange-50 dark:bg-orange-900/20" 
                        border="border-orange-200 dark:border-orange-800" 
                    />
                    <SummaryCard 
                        title="ยกเลิก (Reversed)" 
                        count={summaryCounts.REVERSED} 
                        icon={XCircle} 
                        color="text-red-600" 
                        bg="bg-red-50 dark:bg-red-900/20" 
                        border="border-red-200 dark:border-red-800" 
                    />
                </div>

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
                    rowIdField="grn_id"
                />
            </PageListLayout>

            <GRNFormModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => refetch()}
            />
        </>
    );
}

// Helper Component for Summary Layout
interface SummaryCardProps {
    title: string;
    count: number;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
}

function SummaryCard({ title, count, icon: Icon, color, bg, border }: SummaryCardProps) {
    return (
        <div className={`p-4 rounded-xl border ${border} ${bg} flex items-center justify-between shadow-sm`}>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{count}</p>
            </div>
            <div className={`p-3 rounded-lg bg-white dark:bg-gray-800 ${color} shadow-sm`}>
                <Icon size={24} />
            </div>
        </div>
    );
}
