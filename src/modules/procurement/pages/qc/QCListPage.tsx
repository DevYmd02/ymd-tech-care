/**
 * @file QCListPage.tsx
 * @description หน้ารายการใบเปรียบเทียบราคา - Quote Comparison Master (QC)
 * @route /procurement/qc
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scale, Eye, RefreshCw, Pencil, Search, Plus } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, SmartTable, QCStatusBadge, FilterField } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import { QCFormModal } from './components';
import { createColumnHelper } from '@tanstack/react-table';

// Services & Types
import { QCService } from '@/modules/procurement/services';
import type { QCListParams, QCListItem, QCStatus } from '@/modules/procurement/schemas/qc-schemas';
import { QC_STATUS_OPTIONS } from '@/modules/procurement/types';

// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const FILTER_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    ...QC_STATUS_OPTIONS,
];



// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function QCListPage() {
    // URL-based Filter State
    const { filters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<QCStatus>({
        defaultStatus: 'ALL',
    });

    // Convert to API filter format
    const apiFilters: QCListParams = {
        qc_no: filters.search || undefined,
        pr_no: filters.search2 || undefined,
        rfq_no: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined,
    };

    // Data Fetching with React Query
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['quote-comparisons', apiFilters],
        queryFn: () => QCService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });


    const queryClient = useQueryClient();

    // Modal State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedQcId, setSelectedQcId] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('create');

    const handleCreate = useCallback(() => {
        setSelectedQcId(null);
        setModalMode('create');
        setIsFormModalOpen(true);
    }, []);

    const handleView = useCallback((row: QCListItem) => {
        setSelectedQcId(row.qc_id || null);
        setModalMode('view');
        setIsFormModalOpen(true);
    }, []);

    const handleEdit = useCallback((row: QCListItem) => {
        setSelectedQcId(row.qc_id || null);
        setModalMode('edit');
        setIsFormModalOpen(true);
    }, []);

    // Price Comparison Mutation
    const compareMutation = useMutation({
        mutationFn: (id: string) => QCService.compare(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quote-comparisons'] });
            window.alert('ส่งเปรียบเทียบราคาสำเร็จ!');
        },
        onError: (error) => {
            console.error('Comparison failed:', error);
            window.alert('เกิดข้อผิดพลาดในการส่งเปรียบเทียบราคา');
        }
    });

    const handleCompare = useCallback((id: string) => {
        if (window.confirm('คุณต้องการส่งเปรียบเทียบราคารายการนี้ใช่หรือไม่?')) {
            compareMutation.mutate(id);
        }
    }, [compareMutation]);

    // Handlers
    const handleFilterChange = (name: string, value: string) => {
        setFilters({ [name]: value });
    };

    // Columns Definition
    const columnHelper = createColumnHelper<QCListItem>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            footer: () => <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-bold text-sm text-gray-700 dark:text-gray-200">ยอดรวมราคาต่ำสุดทั้งหมด :</div>,
            size: 60,
            enableSorting: false,
        }),
        columnHelper.accessor('qc_no', {
            header: 'เลขที่ใบ QC',
            cell: (info) => (
                <span 
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer block whitespace-nowrap" 
                    title={info.getValue()}
                    // onClick={() => {
                    //     window.alert(`Open QC Detail: ${info.getValue()}`);
                    // }}
                >
                    {info.getValue()}
                </span>
            ),
            size: 140,
            enableSorting: true,
        }),
        columnHelper.accessor('created_at', {
            header: () => <div className="text-center w-full">วันที่สร้าง</div>,
            cell: (info) => (
                <div className="text-gray-600 dark:text-gray-300 text-center whitespace-nowrap">
                    {info.getValue() ? formatThaiDate(info.getValue()!) : '-'}
                </div>
            ),
            size: 110,
            enableSorting: true,
        }),
        columnHelper.accessor('rfq_no', {
            header: 'เอกสารอ้างอิง',
            cell: (info) => {
                const item = info.row.original;
                return (
                    <div className="flex flex-col truncate">
                        <span 
                            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer leading-tight" 
                            title={`RFQ: ${item.rfq_no || '-'}`}
                            // onClick={() => {
                            //     if (item.rfq_no) window.alert(`Open RFQ Detail: ${item.rfq_no}`);
                            // }}
                        >
                            {item.rfq_no || '-'}
                        </span>
                        {item.pr_no && (
                            <span 
                                className="text-xs text-slate-500 mt-0.5 truncate" 
                                title={`PR: ${item.pr_no}`}
                            >
                                Ref: {item.pr_no}
                            </span>
                        )}
                    </div>
                );
            },
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
            size: 100,
            enableSorting: false,
        }),
        columnHelper.accessor('vendor_count', {
            header: () => <div className="text-center">Vendors</div>,
            cell: (info) => (
                <div className="text-gray-600 dark:text-gray-300 text-center">
                    {info.getValue()}
                </div>
            ),
            size: 60,
            enableSorting: false,
        }),
        columnHelper.accessor('lowest_bidder_name', {
            header: 'ผู้เสนอราคาต่ำสุด',
            cell: (info) => (
                <div className="truncate" title={info.getValue() || ''}>
                    <span className="hover:underline cursor-pointer text-gray-600 dark:text-gray-300">
                        {info.getValue() || '-'}
                    </span>
                </div>
            ),
            size: 100, 
            enableSorting: false,
        }),
        columnHelper.accessor('lowest_price', {
            header: () => <div className="text-right w-full">ราคาต่ำสุด (บาท)</div>,
            cell: (info) => {
                const item = info.row.original;
                const isCompleted = item.status === 'COMPLETED';
                return (
                    <div className={`text-right font-bold whitespace-nowrap ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-600'}`}>
                        {isCompleted
                            ? (info.getValue() || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '-'
                        }
                    </div>
                );
            },
            size: 150,
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center justify-center gap-2">
                        {/* Eye — PR pattern */}
                        <button
                            onClick={() => handleView(item)}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
                            title="ดูรายละเอียด"
                        >
                            <Eye size={16} />
                        </button>

                        {/* DRAFT: เปรียบเทียบราคา — violet special process, PR compact size */}
                        {item.status === 'DRAFT' && (
                            <button
                                onClick={() => handleEdit(item)}
                                className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                title="เปรียบเทียบราคา"
                            >
                                <Pencil size={12} />
                                <span>เปรียบเทียบราคา</span>
                            </button>
                        )}
                    </div>
                );
            },
            footer: () => {
                 const total = data?.data
                    .filter(item => item.status === 'COMPLETED')
                    .reduce((sum, item) => sum + (item.lowest_price || 0), 0) || 0;
                 return (
                     <div className="text-right font-bold text-base text-emerald-600 dark:text-emerald-400 whitespace-nowrap pr-2">
                         {total.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                     </div>
                 );
            },
             size: 140,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, data?.data, handleView, handleEdit]);

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <>
            <PageListLayout
                title="รายการใบเปรียบเทียบราคา"
                subtitle="Quote Comparison (QC)"
                icon={Scale}
                accentColor="indigo"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                isLoading={isLoading}
                searchForm={
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <FilterField
                            label="เลขที่ใบ QC"
                            value={filters.search}
                            onChange={(val: string) => handleFilterChange('search', val)}
                            placeholder="QC2024-xxx"
                            accentColor="indigo"
                        />
                        <FilterField
                            label="เลขที่ PR อ้างอิง"
                            value={filters.search2}
                            onChange={(val: string) => handleFilterChange('search2', val)}
                            placeholder="PR2024-xxx"
                            accentColor="indigo"
                        />
                        <FilterField
                            label="เลขที่ RFQ อ้างอิง"
                            value={filters.search3}
                            onChange={(val: string) => handleFilterChange('search3', val)}
                            placeholder="RFQ2024-xxx"
                            accentColor="indigo"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={filters.status}
                            onChange={(val: string) => handleFilterChange('status', val)}
                            options={FILTER_STATUS_OPTIONS}
                            accentColor="indigo"
                        />
                        <FilterField
                            label="วันที่สร้างเริ่มต้น"
                            type="date"
                            value={filters.dateFrom || ''}
                            onChange={(val: string) => handleFilterChange('dateFrom', val)}
                            accentColor="indigo"
                        />
                        <FilterField
                            label="วันที่สร้างสิ้นสุด"
                            type="date"
                            value={filters.dateTo || ''}
                            onChange={(val: string) => handleFilterChange('dateTo', val)}
                            accentColor="indigo"
                        />
                        
                        {/* Action Buttons Group */}
                        <div className="md:col-span-2 lg:col-span-2 flex flex-col sm:flex-row flex-wrap justify-end gap-2 items-center">
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={resetFilters}
                                    className="flex-1 sm:flex-none h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300 shadow-sm whitespace-nowrap"
                                >
                                    ล้างค่า
                                </button>
                                <button
                                    onClick={() => refetch()}
                                    className="flex-1 sm:flex-none h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <Search size={18} />
                                    ค้นหา
                                </button>
                            </div>
                            <button
                                onClick={handleCreate}
                                className="w-full sm:w-auto h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                สร้างใบเปรียบเทียบราคา
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="h-full flex flex-col">
                    {/* Desktop View: Table */}
                    <div className="hidden md:block flex-1 overflow-hidden">
                        <SmartTable
                            data={data?.data ?? []}
                            columns={columns}
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
                                                {item.created_at ? formatThaiDate(item.created_at) : '-'}
                                            </span>
                                        </div>
                                        <QCStatusBadge status={item.status} />
                                    </div>

                                    {/* Content Info */}
                                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5 border-t border-b border-gray-50 py-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">PR อ้างอิง:</span>
                                            <span className="font-medium text-blue-600 dark:text-blue-400">{item.pr_no}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">RFQ อ้างอิง:</span>
                                            <span 
                                                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer truncate leading-tight" 
                                                title={`RFQ: ${item.rfq_no || '-'}`}
                                                onClick={() => {
                                                    if (item.rfq_no) window.alert(`Open RFQ Detail: ${item.rfq_no}`);
                                                }}
                                            >
                                                {item.rfq_no || '-'}
                                            </span>
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
                                                {item.lowest_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button 
                                                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200"
                                            >
                                                <Eye size={14} /> ดู
                                            </button>

                                            {item.status === 'DRAFT' && (
                                                <button 
                                                    onClick={() => item.qc_id && handleCompare(item.qc_id)}
                                                    disabled={compareMutation.isPending}
                                                    className="flex-[2] bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                                                >
                                                    {compareMutation.isPending && compareMutation.variables === item.qc_id ? (
                                                        <RefreshCw size={14} className="animate-spin" />
                                                    ) : (
                                                        <Pencil size={14} />
                                                    )}
                                                    เปรียบเทียบราคา
                                                </button>
                                            )}

                                            {/* COMPLETED: Eye only — no print button */}

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

            {isFormModalOpen && (
                <QCFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    qcId={selectedQcId}
                    mode={modalMode}
                    onSuccess={() => {
                        setIsFormModalOpen(false);
                        queryClient.invalidateQueries({ queryKey: ['quote-comparisons'] });
                    }}
                />
            )}
        </>
    );
}