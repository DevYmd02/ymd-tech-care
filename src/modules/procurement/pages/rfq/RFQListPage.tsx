/**
 * @file RFQListPage.tsx
 * @description หน้ารายการใบขอใบเสนอราคา (Request for Quotation List)
 * @route /procurement/rfq
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Eye, Send, Edit } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, FilterFormBuilder, SmartTable, RFQStatusBadge } from '@ui';
import type { FilterFieldConfig } from '@/shared/components/ui/filters/FilterFormBuilder';
import { useTableFilters, type TableFilters } from '@/shared/hooks';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { QTFormModal } from '@/modules/procurement/pages/qt/components';

// Services & Types
import { RFQService } from '@/modules/procurement/services';
import type { RFQFilterCriteria, RFQHeader, RFQStatus } from '@/modules/procurement/types/rfq-types';
import { RFQFormModal } from './components';

// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const RFQ_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'SENT', label: 'ส่งแล้ว' },
    { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
    { value: 'CLOSED', label: 'ปิดแล้ว' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================



// const RFQ_FILTER_CONFIG: FilterFieldConfig<RFQFilterKeys>[] = [
//     { name: 'search', label: 'เลขที่ RFQ', type: 'text', placeholder: 'RFQ-xxx' },
//     { name: 'search2', label: 'PR อ้างอิง', type: 'text', placeholder: 'PR-xxx' },
//     { name: 'creator', label: 'ผู้สร้าง RFQ', type: 'text', placeholder: 'ชื่อผู้สร้าง' },
//     { name: 'status', label: 'สถานะ', type: 'select', options: RFQ_STATUS_OPTIONS },
//     { name: 'dateFrom', label: 'วันที่เริ่มต้น', type: 'date' },
//     { name: 'dateTo', label: 'วันที่สิ้นสุด', type: 'date' },
// ];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function RFQListPage() {
    // URL-based Filter State
    const { filters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<RFQStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'rfq_no',
            search2: 'ref_pr_no',
            search3: 'creator_name'
        }
    });

    // Convert to API filter format
    const apiFilters: RFQFilterCriteria = {
        rfq_no: filters.search || undefined,
        ref_pr_no: filters.search2 || undefined,
        creator_name: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined
    };

    // Data Fetching with React Query
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['rfqs', apiFilters],
        queryFn: () => RFQService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isQTModalOpen, setIsQTModalOpen] = useState(false);
    const [selectedRFQForQT, setSelectedRFQForQT] = useState<RFQHeader | null>(null);

    // Handlers
    const handleFilterChange = (name: string, value: string) => {
        setFilters({ [name]: value });
    };

    const handleOpenQTModal = (rfq: RFQHeader) => {
        setSelectedRFQForQT(rfq);
        setIsQTModalOpen(true);
    };

    // Columns
    const columnHelper = createColumnHelper<RFQHeader>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center w-full">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            size: 40,
            enableSorting: false,
        }),
        columnHelper.accessor('rfq_no', {
            header: 'เลขที่ RFQ',
            cell: (info) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer block" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
            size: 140,
            enableSorting: true,
        }),
        columnHelper.accessor('rfq_date', {
            header: 'วันที่',
            cell: (info) => (
                <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {formatThaiDate(info.getValue())}
                </span>
            ),
            size: 110,
            enableSorting: true,
        }),
        columnHelper.accessor('ref_pr_no', {
            header: 'PR อ้างอิง',
            cell: (info) => (
                <span className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer" title={info.getValue() || ''}>
                    {info.getValue() || '-'}
                </span>
            ),
            size: 140,
            enableSorting: false,
        }),
        columnHelper.accessor('created_by_name', {
            header: 'ผู้สร้าง',
            cell: (info) => (
                <span className="text-gray-700 dark:text-gray-200">
                    {info.getValue() || '-'}
                </span>
            ),
            size: 120,
            enableSorting: false,
        }),
        columnHelper.accessor('quote_due_date', {
            header: 'ครบกำหนด',
            cell: (info) => (
                <span className="text-orange-600 dark:text-orange-400 whitespace-nowrap">
                    {info.getValue() ? formatThaiDate(info.getValue()!) : '-'}
                </span>
            ),
            size: 110,
            enableSorting: true,
        }),
        columnHelper.accessor('vendor_count', {
            header: () => <div className="text-center w-full">Vendors</div>,
            cell: (info) => (
                <div className="text-center text-gray-700 dark:text-gray-200">
                    <span className="font-semibold">{info.getValue() ?? 0}</span> ราย
                </div>
            ),
            size: 90,
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center">
                    <RFQStatusBadge status={info.getValue()} />
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center justify-center gap-2">
                        <button className="p-1 text-gray-500 hover:text-blue-600 transition-colors" title="ดูรายละเอียด">
                            <Eye size={18} />
                        </button>
                        
                        {item.status === 'DRAFT' && (
                            <>
                                <button 
                                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded shadow-sm border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all whitespace-nowrap"
                                    title="แก้ไข"
                                >
                                    <Edit size={14} /> 
                                    <span className="text-[10px] font-bold">แก้ไข</span>
                                </button>

                                <button 
                                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                    title="ส่ง RFQ"
                                >
                                    <Send size={12} /> ส่ง RFQ
                                </button>
                            </>
                        )}

                        {item.status === 'SENT' && (
                            <button 
                                onClick={() => handleOpenQTModal(item)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
                                title="บันทึกราคา"
                            >
                                <FileText size={14} />
                                บันทึกราคา
                            </button>
                        )}

                         {/* Debug/Legacy actions if needed, or remove them as per new design */}
                         {/* 
                         {item.status === 'DRAFT' && (
                             <>
                                 <button className="p-1 text-blue-500 hover:text-blue-700 transition-colors" title="แก้ไข">
                                     <Edit size={18} />
                                 </button>
                                 <button className="p-1 text-red-500 hover:text-red-700 transition-colors" title="ลบ">
                                     <Trash2 size={18} />
                                 </button>
                             </>
                         )}
                         */}
                    </div>
                );
            },
            size: 160,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit]);

    // ====================================================================================
    // RENDER
    // ====================================================================================

    // Filter Config
    const filterConfig: FilterFieldConfig<keyof TableFilters<RFQStatus>>[] = useMemo(() => [
        { name: 'search', label: 'เลขที่ RFQ', type: 'text', placeholder: 'RFQ-xxx' },
        { name: 'search2', label: 'PR อ้างอิง', type: 'text', placeholder: 'PR-xxx' },
        { name: 'search3', label: 'ผู้สร้าง RFQ', type: 'text', placeholder: 'ชื่อผู้สร้าง' },
        { name: 'status', label: 'สถานะ', type: 'select' as const, options: RFQ_STATUS_OPTIONS },
        { name: 'dateFrom', label: 'วันที่เริ่มต้น', type: 'date' },
        { name: 'dateTo', label: 'วันที่สิ้นสุด', type: 'date' },
    ], []);

    return (
        <>
            <PageListLayout
                title="รายการขอใบเสนอราคา"
                subtitle="Request for Quotation (RFQ)"
                icon={FileText}
                accentColor="blue"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                searchForm={
                    <FilterFormBuilder<TableFilters<RFQStatus>>
                        config={filterConfig}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onSearch={refetch}
                        onReset={resetFilters}
                        accentColor="blue"
                        onCreate={() => setIsCreateModalOpen(true)}
                        createLabel="สร้าง RFQ"
                    />
                }
            >
                <div className="h-full flex flex-col">
                    <SmartTable
                        data={data?.data ?? []}
                        columns={columns as ColumnDef<RFQHeader>[]}
                        isLoading={isLoading}
                        pagination={{
                            pageIndex: filters.page,
                            pageSize: filters.limit,
                            totalCount: data?.total ?? 0,
                            onPageChange: handlePageChange,
                            onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 })
                        }}
                        sortConfig={sortConfig}
                        onSortChange={handleSortChange}
                        rowIdField="rfq_id"
                        className="flex-1"
                    />
                </div>
            </PageListLayout>

            {isCreateModalOpen && (
                <RFQFormModal 
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        refetch();
                    }}
                />
            )}

            {isQTModalOpen && (
                <QTFormModal
                    isOpen={isQTModalOpen}
                    onClose={() => {
                        setIsQTModalOpen(false);
                        setSelectedRFQForQT(null);
                    }}
                    initialRFQ={selectedRFQForQT}
                    onSuccess={() => {
                       refetch();
                       setIsQTModalOpen(false);
                    }}
                />
            )}
        </>
    );
}

