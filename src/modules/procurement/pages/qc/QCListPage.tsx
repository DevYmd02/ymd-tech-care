/**
 * @file QCListPage.tsx
 * @description หน้ารายการใบเปรียบเทียบราคา - Quote Comparison Master (QC)
 * @route /procurement/qc
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Scale, FileText, Eye } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { FilterFormBuilder } from '@/shared/components/FilterFormBuilder';
import { SmartTable } from '@/shared/components/ui/SmartTable';
import { PageListLayout } from '@/shared/components/layout/PageListLayout';
import { QCStatusBadge } from '@/shared/components/ui/StatusBadge';
import type { FilterFieldConfig } from '@/shared/components/FilterFormBuilder';
import { useTableFilters, type TableFilters } from '@/shared/hooks';
import { QCFormModal } from './components';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';

// Services & Types
import { QCService } from '@/modules/procurement/services';
import type { QCListParams } from '@/modules/procurement/services/qc.service';
import type { QCStatus, QCListItem } from '@/modules/procurement/types/qc-types';
import type { POFormData } from '@/modules/procurement/types/po-types';
import { POFormModal } from '../po/components';

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
        queryFn: () => QCService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // Modal State (for future create functionality)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // PO Modal State
    const [isPOModalOpen, setIsPOModalOpen] = useState(false);
    const [poInitialValues, setPoInitialValues] = useState<Partial<POFormData> | undefined>(undefined);

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
            size: 120, // Reduced from 140
            enableSorting: true,
        }),
        columnHelper.accessor('created_at', {
            header: () => <div className="text-left">วันที่สร้าง</div>,
            cell: (info) => (
                <div className="text-gray-600 dark:text-gray-300 text-left whitespace-nowrap">
                    {formatThaiDate(info.getValue())}
                </div>
            ),
            size: 110, // Reduced from 130
            enableSorting: true,
        }),
        columnHelper.accessor('pr_no', {
            header: 'PR อ้างอิง',
            cell: (info) => (
                <span className="font-medium text-purple-500 dark:text-purple-300 truncate block" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
            size: 120, // Reduced from 140
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
            size: 70, // Reduced from 80
            enableSorting: false,
        }),
        columnHelper.accessor('lowest_bidder_name', {
            header: 'ผู้เสนอราคาต่ำสุด',
            cell: (info) => (
                <div className="max-w-[150px] truncate" title={info.getValue() || ''}>
                    <span className="hover:underline cursor-pointer text-gray-600 dark:text-gray-300">
                        {info.getValue()}
                    </span>
                </div>
            ),
            size: 160, // Reduced from 200
            enableSorting: false,
        }),
        columnHelper.accessor('lowest_bid_amount', {
            header: () => <div className="text-right w-full">ราคาต่ำสุด (บาท)</div>,
            cell: (info) => (
                <div className="font-semibold text-gray-800 dark:text-gray-200 text-right whitespace-nowrap">
                    {info.getValue()?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            ),
            size: 120, // Reduced from 140
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center justify-center"
                            title="ดูรายละเอียด"
                        >
                            <Eye size={18} />
                        </button>
                        {item.status === 'WAITING_FOR_PO' && (
                            <button 
                                onClick={() => {
                                    setPoInitialValues({
                                        vendor_id: item.lowest_bidder_vendor_id || '',
                                        remarks: `Refer from QC: ${item.qc_no}`
                                    });
                                    setIsPOModalOpen(true);
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-xs font-medium whitespace-nowrap h-8 shadow-sm"
                                title="เปิดใบสั่งซื้อ"
                            >
                                <FileText size={14} />
                                <span>เปิดใบสั่งซื้อ</span>
                            </button>
                        )}
                    </div>
                );
            },
            footer: () => {
                 const total = data?.data.reduce((sum, item) => sum + (item.lowest_bid_amount || 0), 0) || 0;
                 return (
                     <div className="text-right font-bold text-base text-emerald-600 dark:text-emerald-400 whitespace-nowrap pr-2">
                         {total.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                     </div>
                 );
            },
            size: 130, // Optimized for text button
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
                        columns={{ sm: 1, md: 2, lg: 4, xl: 4 }}
                        actionColSpan={{ md: 2, lg: 3, xl: 3 }}
                        actionAlign="start"
                    />
                }
            >
                <div className="h-full flex flex-col">
                    {/* Desktop View: Table */}
                    <div className="hidden md:block flex-1 overflow-hidden">
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
                                <div key={item.qc_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                                    {/* Header: QC No + Status */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                                {item.qc_no}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatThaiDate(item.created_at)}
                                            </span>
                                        </div>
                                        <QCStatusBadge status={item.status} />
                                    </div>

                                    {/* Content Info */}
                                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5 border-t border-b border-gray-50 py-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">PR อ้างอิง:</span>
                                            <span className="font-medium text-purple-600">{item.pr_no}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Vendors:</span>
                                            <span className="font-medium">{item.vendor_count} ราย</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-gray-500 whitespace-nowrap mr-2">ต่ำสุดโดย:</span>
                                            <span className="font-medium text-right truncate max-w-[150px]">
                                                {item.lowest_bidder_name || '-'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer: Amount + Actions */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-gray-900 dark:text-white">ราคาต่ำสุด</span>
                                            <span className="font-bold text-lg text-emerald-600">
                                                {item.lowest_bid_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button 
                                                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200"
                                            >
                                                <Eye size={14} /> ดู
                                            </button>

                                            {item.status === 'WAITING_FOR_PO' && (
                                                <button 
                                                    onClick={() => {
                                                        setPoInitialValues({
                                                            vendor_id: item.lowest_bidder_vendor_id || '',
                                                            remarks: `Refer from QC: ${item.qc_no}`
                                                        });
                                                        setIsPOModalOpen(true);
                                                    }}
                                                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                                >
                                                    <FileText size={14} /> เปิดใบสั่งซื้อ
                                                </button>
                                            )}
                                        </div>
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
            
            <POFormModal
                isOpen={isPOModalOpen}
                onClose={() => setIsPOModalOpen(false)}
                initialValues={poInitialValues}
                onSuccess={() => {
                     // Maybe navigate to PO list or just refresh?
                     // User said they haven't saved, so after save maybe we SHOULD go to PO list?
                     // Or just stay here. Let's stay here for now or alert.
                     // Actually standard flow after create is often to view it.
                     // Let's just reload strictly for now as per previous pattern or do nothing?
                     // The previous pattern was window.location.reload() in POListPage.
                     // Let's do nothing but close, and maybe show success.
                     // POFormModal handles success alert.
                     window.location.href = '/procurement/po'; // Navigate to PO List to see the result
                }}
            />
        </>
    );
}
