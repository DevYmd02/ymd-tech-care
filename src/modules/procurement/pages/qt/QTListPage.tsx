/**
 * @file QTListPage.tsx
 * @description หน้ารายการใบเสนอราคา (Quotation List)
 * @route /procurement/qt
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Plus, Eye, Edit, RefreshCw, Search } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
// import { FilterFormBuilder } from '@shared';
import { FilterField } from '@/shared/components/ui/FilterField';
import { SmartTable } from '@/shared/components/ui/SmartTable';
import { PageListLayout } from '@/shared/components/layout/PageListLayout';
import { QTStatusBadge } from '@/shared/components/ui/StatusBadge';
// import type { FilterFieldConfig } from '@shared/FilterFormBuilder';
import { useTableFilters, type TableFilters } from '@/shared/hooks';
import type { ColumnDef } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';

// Services & Types
import { QTService, type QTListParams } from '@/modules/procurement/services/qt.service';
import type { QTListItem, QTStatus } from '@/modules/procurement/types/qt-types';
import { QTFormModal } from './components';
import { QCFormModal } from '../qc/components';

// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const QT_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'SUBMITTED', label: 'ได้รับแล้ว' },
    { value: 'SELECTED', label: 'เทียบราคาแล้ว' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================

type QTFilterKeys = Extract<keyof TableFilters<QTStatus>, string>;

// const QT_FILTER_CONFIG: FilterFieldConfig<QTFilterKeys>[] = [
//     { name: 'search', label: 'เลขที่ใบเสนอราคา', type: 'text', placeholder: 'QT-xxx' },
//     { name: 'search2', label: 'ชื่อผู้ขาย', type: 'text', placeholder: 'ชื่อผู้ขาย' },
//     { name: 'search3', label: 'เลขที่ RFQ อ้างอิง', type: 'text', placeholder: 'RFQ2024-xxx' },
//     { name: 'status', label: 'สถานะ', type: 'select', options: QT_STATUS_OPTIONS },
//     { name: 'dateFrom', label: 'วันที่เริ่มต้น', type: 'date' },
//     { name: 'dateTo', label: 'วันที่สิ้นสุด', type: 'date' },
// ];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function QTListPage() {
    // URL-based Filter State
    const { filters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<QTStatus>({
        defaultStatus: 'ALL',
    });

    // Convert to API filter format
    const apiFilters: QTListParams = {
        quotation_no: filters.search || undefined,
        vendor_name: filters.search2 || undefined,
        rfq_no: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined
    };

    // Data Fetching with React Query
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['quotations', apiFilters],
        queryFn: () => QTService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isQCModalOpen, setIsQCModalOpen] = useState(false);
    const [selectedQTForQC, setSelectedQTForQC] = useState<QTListItem | null>(null);

    // Handlers
    const handleFilterChange = (name: QTFilterKeys, value: string) => {
        setFilters({ [name]: value });
    };

    const handleOpenQCModal = useCallback((qt: QTListItem) => {
        setSelectedQTForQC(qt);
        setIsQCModalOpen(true);
    }, []);

    // Columns Definition
    const columnHelper = createColumnHelper<QTListItem>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            footer: () => <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-bold text-sm text-gray-700 dark:text-gray-200">ยอดรวมทั้งหมด :</div>,
            size: 40,
            enableSorting: false,
        }),
        columnHelper.accessor('quotation_no', {
            header: 'เลขที่ QT',
            cell: (info) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer block" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
            size: 155,
            enableSorting: true,
        }),
        columnHelper.accessor('quotation_date', {
            header: 'วันที่',
            cell: (info) => (
                <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {formatThaiDate(info.getValue())}
                </span>
            ),
            size: 90,
            enableSorting: true,
        }),
        columnHelper.accessor('vendor_name', {
            header: 'ผู้ขาย',
            cell: (info) => {
                const item = info.row.original;
                return (
                    <div>
                        <span className="text-gray-700 dark:text-gray-200 block truncate" title={info.getValue()}>{info.getValue()}</span>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate" title={`เครดิต ${item.payment_term_days || '-'} วัน | Lead ${item.lead_time_days || '-'} วัน`}>
                            เครดิต {item.payment_term_days || '-'} วัน | Lead {item.lead_time_days || '-'} วัน
                        </div>
                    </div>
                );
            },
            size: 200,
            enableSorting: false,
        }),
        columnHelper.accessor('rfq_no', {
            header: 'RFQ อ้างอิง',
            cell: (info) => (
                <span className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer" title={info.getValue() || ''}>
                    {info.getValue()}
                </span>
            ),
            size: 155,
            enableSorting: false,
        }),
        columnHelper.accessor('total_amount', {
            header: () => <div className="text-right whitespace-nowrap">ยอดรวม (บาท)</div>,
            cell: (info) => (
                <div className="text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {info.getValue().toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            ),
            size: 120,
            enableSorting: true,
        }),
        columnHelper.accessor('valid_until', {
            header: () => <div className="text-center">ใช้ได้ถึง</div>,
            cell: (info) => (
                <div className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {info.getValue() ? formatThaiDate(info.getValue()!) : '-'}
                </div>
            ),
            size: 90,
            enableSorting: true,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center">
                    <QTStatusBadge status={info.getValue()} />
                </div>
            ),
            size: 85,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center justify-center gap-1.5">
                        <button className="p-1 text-gray-500 hover:text-blue-600 transition-colors" title="ดูรายละเอียด">
                            <Eye size={16} />
                        </button>
                        
                        {item.status === 'SUBMITTED' && (
                            <>
                                <button className="p-1 text-blue-500 hover:text-blue-700 transition-colors" title="แก้ไข">
                                    <Edit size={16} />
                                </button>
                                <button 
                                    onClick={() => handleOpenQCModal(item)}
                                    className="flex items-center gap-0.5 px-2 py-1 bg-[#a855f7] hover:bg-[#9333ea] text-white text-[10px] font-bold rounded shadow transition-colors whitespace-nowrap"
                                    title="ส่งเปรียบเทียบราคา"
                                >
                                    <RefreshCw size={12} /> ส่งเปรียบเทียบราคา
                                </button>
                            </>
                        )}
                    </div>
                );
            },
            footer: () => {
                 const total = (data?.data || []).reduce((sum, item) => sum + item.total_amount, 0) || 0;
                 return (
                     <div className="text-right font-bold text-base text-emerald-600 dark:text-emerald-400 whitespace-nowrap pr-2">
                         {total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                     </div>
                 );
            },
            size: 165,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, handleOpenQCModal, data?.data]);

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <>
            <PageListLayout
                title="รายการใบเสนอราคา"
                subtitle="Vendor Quotation (QT)"
                icon={FileText}
                accentColor="blue"
                isLoading={isLoading}
                searchForm={
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <FilterField
                            label="เลขที่ใบเสนอราคา"
                            value={filters.search}
                            onChange={(val: string) => handleFilterChange('search', val)}
                            placeholder="QT-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="ชื่อผู้ขาย"
                            value={filters.search2}
                            onChange={(val: string) => handleFilterChange('search2', val)}
                            placeholder="ชื่อผู้ขาย"
                            accentColor="blue"
                        />
                        <FilterField
                            label="เลขที่ RFQ อ้างอิง"
                            value={filters.search3}
                            onChange={(val: string) => handleFilterChange('search3', val)}
                            placeholder="RFQ2024-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={filters.status}
                            onChange={(val: string) => handleFilterChange('status', val)}
                            options={QT_STATUS_OPTIONS}
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
                                สร้างใบเสนอราคาใหม่
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="h-full flex flex-col">
                    <SmartTable
                        data={data?.data ?? []}
                        columns={columns as ColumnDef<QTListItem>[]}
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
                        rowIdField="quotation_id"
                        className="flex-1"
                        showFooter={true}
                    />
                </div>
            </PageListLayout>

            {/* Modals - Only mount when open */}
            {isCreateModalOpen && (
                <QTFormModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => setIsCreateModalOpen(false)} 
                    onSuccess={() => refetch()}
                />
            )}

            {isQCModalOpen && (
                <QCFormModal
                    isOpen={isQCModalOpen}
                    onClose={() => {
                        setIsQCModalOpen(false);
                        setSelectedQTForQC(null);
                    }}
                    initialRFQNo={selectedQTForQC?.rfq_no}
                    onSuccess={() => refetch()}
                />
            )}
        </>
    );
}