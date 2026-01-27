/**
 * @file QTListPage.tsx
 * @description หน้ารายการใบเสนอราคา (Quotation List)
 * @route /procurement/qt
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Plus, Eye, Edit, RefreshCw } from 'lucide-react';
import { formatThaiDate } from '@utils/dateUtils';
import { PageListLayout, FilterFormBuilder, QTStatusBadge, SmartTable } from '@shared';
import type { FilterFieldConfig } from '@shared/FilterFormBuilder';
import { useTableFilters, type TableFilters } from '@hooks';
import type { ColumnDef } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';

// Services & Types
import { qtService } from '@services/qtService';
import type { QTListParams } from '@services/qtService';
import type { QTListItem, QTStatus } from '@project-types/qt-types';
import QTFormModal from './components/QTFormModal';
import { QCFormModal } from '../qc/components/QCFormModal';

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

const QT_FILTER_CONFIG: FilterFieldConfig<QTFilterKeys>[] = [
    { name: 'search', label: 'เลขที่ใบเสนอราคา', type: 'text', placeholder: 'QT-xxx' },
    { name: 'search2', label: 'ชื่อผู้ขาย', type: 'text', placeholder: 'ชื่อผู้ขาย' },
    { name: 'search3', label: 'เลขที่ RFQ อ้างอิง', type: 'text', placeholder: 'RFQ2024-xxx' },
    { name: 'status', label: 'สถานะ', type: 'select', options: QT_STATUS_OPTIONS },
    { name: 'dateFrom', label: 'วันที่เริ่มต้น', type: 'date' },
    { name: 'dateTo', label: 'วันที่สิ้นสุด', type: 'date' },
];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function QTListPage() {
    // URL-based Filter State
    const { filters, setFilters, resetFilters, handlePageChange } = useTableFilters<QTStatus>({
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
        limit: filters.limit
    };

    // Data Fetching with React Query
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['quotations', apiFilters],
        queryFn: () => qtService.getList(apiFilters),
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
            header: 'ลำดับ',
            cell: (info) => info.row.index + 1 + (filters.page - 1) * filters.limit,
            size: 35,
            enableSorting: false,
        }),
        columnHelper.accessor('quotation_no', {
            header: 'เลขที่ QT',
            cell: (info) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline truncate block tracking-tight" title={info.getValue()}>
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
                        <div className="font-medium text-gray-800 dark:text-gray-200 truncate" title={info.getValue()}>{info.getValue()}</div>
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
                <span className="text-purple-600 dark:text-purple-400 cursor-pointer hover:underline truncate block tracking-tight" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
            size: 155,
            enableSorting: false,
        }),
        columnHelper.accessor('total_amount', {
            header: () => <div className="text-right">ยอดรวม</div>,
            cell: (info) => {
                const item = info.row.original;
                return (
                    <div className="text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {info.getValue().toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-gray-500 font-normal">{item.currency_code || 'THB'}</div>
                    </div>
                );
            },
            size: 90,
            enableSorting: true,
        }),
        columnHelper.accessor('valid_until', {
            header: () => <div className="text-center">ใช้ได้ถึง</div>,
            cell: (info) => (
                <div className="text-center text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {info.getValue() ? formatThaiDate(info.getValue()!) : '-'}
                </div>
            ),
            size: 90,
            enableSorting: true,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: () => <div className="text-center">สถานะ</div>,
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
            header: () => <div className="text-center">จัดการ</div>,
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
            size: 165,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, handleOpenQCModal]);

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
                    <FilterFormBuilder
                        config={QT_FILTER_CONFIG}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onSearch={() => {}} // React Query auto-fetches on filter change
                        onReset={resetFilters}
                        accentColor="blue"
                        columns={{ sm: 2, md: 4, lg: 4 }}
                        actionButtons={
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Plus size={18} />
                                <span>สร้างใบเสนอราคาใหม่</span>
                            </button>
                        }
                    />
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
                        rowIdField="quotation_id"
                        className="flex-1"
                    />
                </div>
            </PageListLayout>

            {/* Modals */}
            <QTFormModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={() => refetch()}
            />

            <QCFormModal
                isOpen={isQCModalOpen}
                onClose={() => {
                    setIsQCModalOpen(false);
                    setSelectedQTForQC(null);
                }}
                initialRFQNo={selectedQTForQC?.rfq_no}
                onSuccess={() => refetch()}
            />
        </>
    );
}
