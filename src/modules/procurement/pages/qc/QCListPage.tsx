/**
 * @file QCListPage.tsx
 * @description หน้ารายการใบเปรียบเทียบราคา - Quote Comparison Master (QC)
 * @route /procurement/qc
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { Scale, Eye, Pencil, Search, Plus, Trophy, Clock } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, SmartTable, QCStatusBadge, FilterField, MobileListCard, MobileListContainer } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import { QCFormModal } from './components';
import { createColumnHelper } from '@tanstack/react-table';

// Services & Types
import { QCService } from '../../services/qc.service';
import type { QCListParams, QCStatus, QCListItem } from '@/modules/procurement/schemas/qc-schemas';
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
    const { filters, localFilters, handleFilterChange, handleApplyFilters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<QCStatus>({
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
    const { data, isLoading } = useQuery({
        queryKey: ['quote-comparisons', apiFilters],
        queryFn: () => QCService.getList(apiFilters),
        placeholderData: keepPreviousData,
        retry: false, // Disable retry for 404 handling
    });

    // Dynamic Summary Calculation: Sum of vq_total_amount (Current Page)
    const totalAccumulatedAmount = useMemo(() => {
        if (!data?.data) return 0;
        return data.data.reduce((sum: number, item: QCListItem) => {
            const rawPrice = item.vq_total_amount || item.lowest_price;
            const price = typeof rawPrice === 'string' ? Number(rawPrice) : (rawPrice || 0);
            return sum + (isNaN(price) ? 0 : price);
        }, 0);
    }, [data]);

    const queryClient = useQueryClient();

    // Modal State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedQC, setSelectedQC] = useState<QCListItem | null>(null);
    const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('create');

    const handleCreate = useCallback(() => {
        setSelectedQC(null);
        setModalMode('create');
        setIsFormModalOpen(true);
    }, []);

    const handleView = useCallback((row: QCListItem) => {
        if (!row.qc_id) return;
        setSelectedQC(row);
        setModalMode('view');
        setIsFormModalOpen(true);
    }, []);

    const handleEdit = useCallback((row: QCListItem) => {
        if (!row.qc_id) return;
        setSelectedQC(row);
        setModalMode('edit');
        setIsFormModalOpen(true);
    }, []);



    // handleFilterChange is provided by useTableFilters directly

    // Columns Definition
    const columnHelper = createColumnHelper<QCListItem>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: 'ลำดับ',
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            footer: () => (
                <div className="text-left font-bold text-sm text-gray-500 dark:text-gray-400 pl-4 whitespace-nowrap">
                    ยอดรวมราคาต่ำสุดสะสม :
                </div>
            ),
            size: 60,
            enableSorting: false,
        }),
        columnHelper.accessor('qc_no', {
            header: 'เลขที่ใบ QC',
            cell: (info) => (
                <span className="font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {info.getValue() || '-'}
                </span>
            ),
            size: 160,
            enableSorting: true,
        }),
        columnHelper.accessor('created_at', {
            header: 'วันที่สร้าง',
            cell: (info) => (
                <div className="text-gray-600 dark:text-gray-300 text-center whitespace-nowrap">
                    {info.getValue() ? formatThaiDate(info.getValue()!) : '-'}
                </div>
            ),
            size: 120,
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'references',
            header: 'เอกสารอ้างอิง',
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5 py-1">
                    <div className="flex items-center gap-1.5 line-clamp-1">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">RFQ: {row.original.rfq_no || '-'}</span>
                    </div>
                    {row.original.pr_no && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                            Ref: {row.original.pr_no}
                        </div>
                    )}
                </div>
            ),
            size: 180,
        }),
        columnHelper.display({
            id: 'winner',
            header: 'ผู้ชนะการเสนอราคา',
            cell: ({ row }) => {
                const item = row.original;
                const isConfirmed = !!item.vq_header_id;

                if (isConfirmed) {
                    return (
                        <div className="flex flex-col gap-1 py-1 min-w-0">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <Trophy className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                                <span className="font-bold text-gray-900 dark:text-gray-100 truncate" title={item.vendor_name || item.lowest_bidder_name}>
                                    {item.vendor_name || item.lowest_bidder_name || 'ไม่ระบุ'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded w-fit flex items-center gap-1">
                                    <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></div>
                                    ได้รับการคัดเลือก
                                </span>
                            </div>
                        </div>
                    );
                }

                if (item.status === 'CANCELLED') {
                    return <span className="text-gray-400 italic text-sm">-</span>;
                }

                return (
                    <div className="flex items-center gap-1.5 text-gray-400 italic text-sm py-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>รอสรุปผล</span>
                    </div>
                );
            },
            size: 280,
        }),
        columnHelper.accessor('vq_total_amount', {
            header: () => <div className="text-right w-full pr-4">ราคาต่ำสุด (บาท)</div>,
            cell: ({ row }) => {
                const rawValue = row.original.vq_total_amount || row.original.lowest_price;
                const amount = typeof rawValue === 'string' ? Number(rawValue) : (rawValue || 0);
                const isConfirmed = !!row.original.vq_header_id;
                
                return (
                    <div className={`text-right w-full font-bold tabular-nums pr-4 ${isConfirmed ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                );
            },
            size: 160,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: 'สถานะ',
            cell: (info) => {
                const item = info.row.original;
                const isConfirmed = !!item.vq_header_id;
                const displayStatus = (item.status === 'DRAFT' && isConfirmed) ? 'COMPLETED' : item.status;
                
                return (
                    <div className="flex justify-center flex-wrap">
                        <QCStatusBadge status={displayStatus as QCStatus} />
                    </div>
                );
            },
            size: 120,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                const isConfirmed = !!item.vq_header_id;

                return (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => handleView(item)}
                            className="p-1 px-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="ดูรายละเอียด"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        {!isConfirmed && (
                            <button
                                onClick={() => handleEdit(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-sm shadow-purple-200 dark:shadow-none transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                            >
                                <Pencil size={12} />
                                <span>เปรียบเทียบราคา</span>
                            </button>
                        )}
                    </div>
                );
            },
            footer: () => (
                <div className="flex justify-end items-center gap-4 w-full pr-4">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 drop-shadow-sm">
                        {Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalAccumulatedAmount)}
                    </span>
                    <span className="text-sm font-bold text-gray-500">บาท</span>
                </div>
            ),
            size: 150,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, handleView, handleEdit, totalAccumulatedAmount]);

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
                    <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <FilterField
                            label="เลขที่ใบ QC"
                            value={localFilters.search}
                            onChange={(val: string) => handleFilterChange('search', val)}
                            placeholder="QC-xxx"
                            accentColor="indigo"
                        />
                        <FilterField
                            label="เลขที่ PR อ้างอิง"
                            value={localFilters.search2}
                            onChange={(val: string) => handleFilterChange('search2', val)}
                            placeholder="PR-xxx"
                            accentColor="indigo"
                        />
                        <FilterField
                            label="เลขที่ RFQ อ้างอิง"
                            value={localFilters.search3}
                            onChange={(val: string) => handleFilterChange('search3', val)}
                            placeholder="RFQ-xxx"
                            accentColor="indigo"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={localFilters.status}
                            onChange={(val: string) => handleFilterChange('status', val)}
                            options={FILTER_STATUS_OPTIONS}
                            accentColor="indigo"
                        />
                        <FilterField
                            label="วันที่สร้างเริ่มต้น"
                            type="date"
                            value={localFilters.dateFrom || ''}
                            onChange={(val: string) => handleFilterChange('dateFrom', val)}
                            accentColor="indigo"
                        />
                        <FilterField
                            label="วันที่สร้างสิ้นสุด"
                            type="date"
                            value={localFilters.dateTo || ''}
                            onChange={(val: string) => handleFilterChange('dateTo', val)}
                            accentColor="indigo"
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
                                    className="flex-1 sm:flex-none h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
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
                                สร้างใบเปรียบเทียบราคา
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

                    {/* Mobile View: Cards (shared MobileListContainer + MobileListCard) */}
                    <MobileListContainer
                        isLoading={isLoading}
                        isEmpty={!data?.data.length}
                        pagination={data?.total ? { page: filters.page, total: data.total, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                    >
                        {data?.data.map((item) => (
                            <MobileListCard
                                key={item.qc_id}
                                title={item.qc_no}
                                subtitle={item.created_at ? formatThaiDate(item.created_at) : '-'}
                                statusBadge={
                                    <QCStatusBadge 
                                        status={(item.status === 'DRAFT' && !!item.vq_header_id) ? 'COMPLETED' : item.status} 
                                    />
                                }
                                details={[
                                    { label: 'PR อ้างอิง:', value: <span className="font-medium text-blue-600 dark:text-blue-400">{item.pr_no}</span> },
                                    { label: 'RFQ อ้างอิง:', value: <span className="font-semibold text-blue-600 dark:text-blue-400">{item.rfq_no || '-'}</span> },
                                    { label: 'Vendors:', value: `${item.vendor_count} ราย` },
                                    {
                                        label: 'ผู้ชนะ:',
                                        value: item.vq_header_id ? (
                                            <div className="flex flex-col gap-1 py-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Trophy className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                                                    <span className="font-bold text-gray-900 dark:text-gray-100 truncate max-w-[140px]">
                                                        {item.vendor_name || item.lowest_bidder_name || 'ไม่ระบุ'}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit uppercase">
                                                    CONFIRMED WINNER
                                                </span>
                                            </div>
                                        ) : item.status === 'CANCELLED' ? (
                                            <span className="text-slate-400">-</span>
                                        ) : (
                                            <div className="flex items-center gap-1 text-slate-400 italic text-sm">
                                                <Clock className="w-3 h-3" />
                                                <span>รอสรุปผล</span>
                                            </div>
                                        ),
                                    },
                                ]}
                                amountLabel="ราคาต่ำสุด"
                                amountValue={
                                    <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                        {(typeof item.vq_total_amount === 'string' 
                                           ? Number(item.vq_total_amount) 
                                           : (item.vq_total_amount || item.lowest_price || 0)
                                        ).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                }
                                actions={
                                    <>
                                        <button
                                            onClick={() => handleView(item)}
                                            className="flex-1 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200 dark:border-slate-600"
                                        >
                                            <Eye size={14} /> ดู
                                        </button>
                                        {!item.vq_header_id && (
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="flex-[2] bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                                            >
                                                <Pencil size={14} />
                                                <span>เปรียบเทียบราคา</span>
                                            </button>
                                        )}
                                    </>
                                }
                            />
                        ))}
                    </MobileListContainer>
                </div>
            </PageListLayout>

            {isFormModalOpen && (
                <QCFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    qcId={selectedQC?.qc_id}
                    initialData={selectedQC}
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