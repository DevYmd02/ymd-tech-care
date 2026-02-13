/**
 * @file RFQListPage.tsx
 * @description หน้ารายการใบขอใบเสนอราคา (Request for Quotation List)
 * @route /procurement/rfq
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Plus, Eye, Send, Search } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
// import { FilterFormBuilder } from '@shared';
import { PageListLayout, FilterField, SmartTable, RFQStatusBadge } from '@ui';
// import type { FilterFieldConfig } from '@shared/FilterFormBuilder';
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

type RFQFilterKeys = Extract<keyof TableFilters<RFQStatus>, string> | 'creator';

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
    });

    const extendedFilters = filters as TableFilters<RFQStatus> & { creator?: string };

    // Convert to API filter format
    const apiFilters: RFQFilterCriteria = {
        rfq_no: filters.search || undefined,
        pr_no: filters.search2 || undefined,
        created_by_name: extendedFilters.creator || undefined,
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
    const handleFilterChange = (name: RFQFilterKeys, value: string) => {
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
        columnHelper.accessor('pr_no', {
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
                            <button 
                                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
                                title="ส่ง RFQ"
                            >
                                <Send size={14} />
                                ส่ง RFQ
                            </button>
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

    return (
        <>
            <PageListLayout
                title="รายการขอใบเสนอราคา"
                subtitle="Request for Quotation (RFQ)"
                icon={FileText}
                accentColor="blue"
                isLoading={isLoading}
                searchForm={
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <FilterField
                            label="เลขที่ RFQ"
                            value={filters.search}
                            onChange={(val: string) => handleFilterChange('search', val)}
                            placeholder="RFQ-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="PR อ้างอิง"
                            value={filters.search2}
                            onChange={(val: string) => handleFilterChange('search2', val)}
                            placeholder="PR-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="ผู้สร้าง RFQ"
                            value={extendedFilters.creator || ''}
                            onChange={(val: string) => handleFilterChange('creator', val)}
                            placeholder="ชื่อผู้สร้าง"
                            accentColor="blue"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={filters.status}
                            onChange={(val: string) => handleFilterChange('status', val)}
                            options={RFQ_STATUS_OPTIONS}
                            accentColor="blue"
                        />
                         <FilterField
                            label="วันที่เริ่มต้น"
                            type="date"
                            value={filters.dateFrom || ''}
                            onChange={(val: string) => handleFilterChange('dateFrom', val)}
                            accentColor="blue"
                        />
                         <FilterField
                            label="วันที่สิ้นสุด"
                            type="date"
                            value={filters.dateTo || ''}
                            onChange={(val: string) => handleFilterChange('dateTo', val)}
                            accentColor="blue"
                        />

                        {/* Action Buttons Group */}
                        <div className="lg:col-span-2 flex justify-end gap-2 flex-wrap">
                            <button
                                onClick={resetFilters}
                                className="h-10 px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors border border-gray-300"
                            >
                                ล้างค่า
                            </button>
                            <button
                                onClick={() => refetch()}
                                className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
                            >
                                <Search size={18} />
                                ค้นหา
                            </button>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                สร้าง RFQ
                            </button>
                        </div>
                    </div>
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

