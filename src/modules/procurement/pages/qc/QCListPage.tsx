/**
 * @file QCListPage.tsx
 * @description หน้ารายการใบเปรียบเทียบราคา - Quote Comparison Master (QC)
 * @route /procurement/qc
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scale, Eye, RefreshCw, Pencil, Search, Plus, Trophy, Clock } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, SmartTable, QCStatusBadge, FilterField, MobileListCard, MobileListContainer } from '@ui';
import { useTableFilters, useConfirmation } from '@/shared/hooks';
import toast from 'react-hot-toast';
import { QCFormModal } from './components';
import { createColumnHelper } from '@tanstack/react-table';

// Services & Types
import { QCService } from '@/modules/procurement/services';
import type { QCListParams, QCListItem, QCStatus } from '@/modules/procurement/schemas/qc-schemas';
import { QC_STATUS_OPTIONS } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';

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
    const { filters, localFilters, handleFilterChange, handleApplyFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<QCStatus>({
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
    });


    const queryClient = useQueryClient();
    const { confirm } = useConfirmation();

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
            toast.success('ส่งเปรียบเทียบราคาสำเร็จ!');
        },
        onError: (error) => {
            logger.error('[QCListPage] Price comparison generation failed:', { error });
            toast.error('เกิดข้อผิดพลาดในการส่งเปรียบเทียบราคา');
        }
    });

    const handleCompare = useCallback(async (id: string) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันการเปรียบเทียบ',
            description: 'คุณต้องการส่งเปรียบเทียบราคารายการนี้ใช่หรือไม่?',
            confirmText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            variant: 'info',
        });
        if (isConfirmed) compareMutation.mutate(id);
    }, [compareMutation, confirm]);

    // handleFilterChange is provided by useTableFilters directly

    // Columns Definition
    const columnHelper = createColumnHelper<QCListItem>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: 'ลำดับ',
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            footer: () => <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-bold text-sm text-gray-700 dark:text-gray-200">ยอดรวมราคาต่ำสุดทั้งหมด :</div>,
            meta: { thClassName: 'px-3 py-3 w-[5%] text-center' },
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
            meta: { thClassName: 'px-3 py-3 w-[13%] text-left whitespace-nowrap' },
            enableSorting: true,
        }),
        columnHelper.accessor('created_at', {
            header: 'วันที่สร้าง',
            cell: (info) => (
                <div className="text-gray-600 dark:text-gray-300 text-center whitespace-nowrap">
                    {info.getValue() ? formatThaiDate(info.getValue()!) : '-'}
                </div>
            ),
            meta: { thClassName: 'px-3 py-3 w-[10%] text-left whitespace-nowrap' },
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
            meta: { thClassName: 'px-3 py-3 w-[13%] text-left whitespace-nowrap' },
            enableSorting: false,
        }),
        columnHelper.accessor('vendor_count', {
            header: 'VENDORS',
            cell: (info) => (
                <div className="text-gray-600 dark:text-gray-300 text-center">
                    {info.getValue()}
                </div>
            ),
            meta: { thClassName: 'px-3 py-3 w-[8%] text-center' },
            enableSorting: false,
        }),
        columnHelper.accessor('lowest_bidder_name', {
            header: 'ผู้ชนะการเสนอราคา',
            cell: (info) => {
                const item = info.row.original;
                const vendorName = info.getValue();

                // Condition 1: Finalized — show winner badge
                if (item.status === 'COMPLETED') {
                    return (
                        <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium text-sm max-w-full"
                            title={vendorName || '-'}
                        >
                            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="truncate">{vendorName || '-'}</span>
                        </div>
                    );
                }

                // Condition 2: Cancelled — muted dash
                if (item.status === 'CANCELLED') {
                    return <span className="text-slate-400 dark:text-slate-600">-</span>;
                }

                // Condition 3: Pending/Draft — awaiting result
                return (
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 italic text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        <span>รอเปรียบเทียบราคา</span>
                    </div>
                );
            },
            meta: { thClassName: 'px-3 py-3 w-auto text-left' },
            enableSorting: false,
        }),
        columnHelper.accessor('lowest_price', {
            header: 'ราคาต่ำสุด (บาท)',
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
            meta: { 
                thClassName: 'px-3 py-3 w-[12%] text-right whitespace-nowrap',
                tdClassName: 'px-3 py-3 text-right font-medium whitespace-nowrap'
            },
            enableSorting: true,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: 'สถานะ',
            cell: (info) => (
                <div className="flex justify-center flex-wrap">
                    <QCStatusBadge status={info.getValue()} />
                </div>
            ),
            meta: { 
                thClassName: 'px-3 py-3 w-[12%] text-center whitespace-nowrap',
                tdClassName: 'px-3 py-3 text-center whitespace-nowrap'
            },
            enableSorting: false,
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
             size: 160,
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
                                onPageSizeChange: () => handleApplyFilters()
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
                                statusBadge={<QCStatusBadge status={item.status} />}
                                details={[
                                    { label: 'PR อ้างอิง:', value: <span className="font-medium text-blue-600 dark:text-blue-400">{item.pr_no}</span> },
                                    { label: 'RFQ อ้างอิง:', value: <span className="font-semibold text-blue-600 dark:text-blue-400">{item.rfq_no || '-'}</span> },
                                    { label: 'Vendors:', value: `${item.vendor_count} ราย` },
                                    {
                                        label: 'ผู้ชนะ:',
                                        value: item.status === 'COMPLETED' ? (
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium text-sm">
                                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                                <span className="truncate max-w-[130px]">{item.lowest_bidder_name || '-'}</span>
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
                                        {item.lowest_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                                        {item.status === 'DRAFT' && (
                                            <button
                                                onClick={() => item.qc_id && handleCompare(item.qc_id)}
                                                disabled={compareMutation.isPending}
                                                className="flex-[2] bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                                            >
                                                {compareMutation.isPending && compareMutation.variables === item.qc_id
                                                    ? <RefreshCw size={14} className="animate-spin" />
                                                    : <Pencil size={14} />}
                                                เปรียบเทียบราคา
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