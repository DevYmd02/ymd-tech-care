import { useState, useMemo, useCallback } from 'react';
import { Search, CheckCircle, Eye, Clock, Printer } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, SmartTable, FilterField, MobileListCard, MobileListContainer } from '@ui';
import { POStatusBadge } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { usePOAList, POA_STATUS_OPTIONS } from './hooks/usePOAList';
import type { POListItem } from '@/modules/procurement/types';
import { POAFormModal } from './components';
import { POAHistoryModal } from '@/modules/procurement/pages/poa/components/POAHistoryModal';

const columnHelper = createColumnHelper<POListItem>();

export default function POAListPage() {
    // ── Hooks (Business Logic) ────────────────────────────────────────────────
    const {
        data, isLoading,
        filters, localFilters, handleFilterChange, handleApplyFilters,
        setFilters, resetFilters,
        handlePageChange,
    } = usePOAList();

    // ── View / Approve Modal State ─────────────────────────────────────────
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<POListItem | undefined>(undefined);
    const [isViewOnly, setIsViewOnly] = useState(false);

    // 🎯 FILTER: Do not show 'DRAFT' status in POA list
    const filteredData = useMemo(() => {
        return (data?.data ?? []).filter(item => item.status !== 'DRAFT');
    }, [data?.data]);
    
    // ── Approval History Modal State ─────────────────────────────────────────
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyPoId, setHistoryPoId] = useState<number | undefined>(undefined);
    const [historyPoNo, setHistoryPoNo] = useState<string | undefined>(undefined);

    const handleApprove = useCallback((item: POListItem, mode: 'view' | 'approve' = 'approve') => {
        setIsViewOnly(mode === 'view');
        setSelectedPO(item);
        setIsApprovalModalOpen(true);
    }, []);

    const handleViewHistory = useCallback((id: number, poNo?: string) => {
        setHistoryPoId(id);
        setHistoryPoNo(poNo);
        setIsHistoryModalOpen(true);
    }, []);



    // ── Columns ───────────────────────────────────────────────────────────────
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full whitespace-nowrap">ลำดับ</div>,
            cell: (info) => <div className="text-center w-full">{info.row.index + 1 + (filters.page - 1) * (filters.limit || 10)}</div>,
            size: 50,
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.poa_no, {
            id: 'poa_no',
            header: () => <div className="text-left whitespace-nowrap">เลขที่อนุมัติ POA</div>,
            cell: (info) => (
                <span className="font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap text-sm">
                    {info.getValue() || '-'}
                </span>
            ),
            size: 150,
            enableSorting: false
        }),
        columnHelper.accessor('po_no', {
            header: () => <div className="text-left whitespace-nowrap">เลขที่ PO</div>,
            cell: (info) => (
                <span className="font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap text-sm" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
            size: 150,
            enableSorting: false,
        }),
        columnHelper.accessor('po_date', {
            header: 'วันที่',
            cell: (info) => (
                <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap text-sm">
                    {formatThaiDate(info.getValue())}
                </span>
            ),
            size: 120,
            enableSorting: false,
        }),
        columnHelper.accessor((row: POListItem) => {
            // PENDING_APPROVAL rows have no approver yet — fall back to PO creator
            return row.approval_emp_name || row.created_by_name || '-';
        }, {
            id: 'approval_emp_name',
            header: 'ผู้จัดทำ',
            cell: (info) => {
                const isPending = info.row.original.status === 'PENDING_APPROVAL';
                const name = info.getValue() || '-';
                return (
                    <div
                        className="truncate font-semibold text-left max-w-[220px] text-slate-700 dark:text-gray-200 text-sm"
                        title={name}
                    >
                        {name}
                        {isPending && name !== '-' && (
                            <span className="ml-1.5 text-[11px] text-amber-500 dark:text-amber-400 font-medium">(ผู้สร้าง)</span>
                        )}
                    </div>
                );
            },
            size: 220,
            enableSorting: false,
        }),
        columnHelper.accessor('total_amount', {
            header: () => <div className="text-right w-full whitespace-nowrap">ยอดรวม (บาท)</div>,
            cell: (info) => {
                const item = info.row.original;
                // 🛡️ REJECTED always = 0.00
                const val = item.status === 'REJECTED' ? 0 : Number(info.getValue() || 0);
                return (
                    <div className="text-right font-bold text-gray-800 dark:text-white whitespace-nowrap w-full text-sm">
                        {new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}
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
                    <POStatusBadge status={info.getValue()} className="whitespace-nowrap scale-[0.95]" />
                </div>
            ),
            size: 120,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                if (item.status === 'APPROVED' || item.status === 'PARTIAL' || item.status === 'REJECTED') {
                    return (
                        <div className="flex items-center justify-center gap-1">
                            <button
                                onClick={() => handleApprove(item, 'view')}
                                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                                title="ดูรายละเอียด"
                            >
                                <Eye size={18} />
                            </button>
                            <button
                                onClick={() => handleViewHistory(item.po_id, item.po_no)}
                                className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-all"
                                title="ประวัติการอนุมัติ"
                            >
                                <Clock size={18} />
                            </button>
                            {(item.status === 'APPROVED' || item.status === 'PARTIAL') && item.approval_id && (
                                <button
                                    onClick={() => {
                                        window.open(`/print/poa/${item.approval_id}`, '_blank');
                                    }}
                                    className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                                    title="พิมพ์ใบอนุมัติ"
                                >
                                    <Printer size={18} />
                                </button>
                            )}
                        </div>
                    );
                }
                return (
                    <div className="flex items-center justify-center gap-1.5">
                        <button
                            onClick={() => handleApprove(item, 'approve')}
                            className="flex items-center gap-1.5 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md shadow-sm transition-all whitespace-nowrap"
                            title="อนุมัติเอกสาร"
                        >
                            <CheckCircle size={14} /> พิจารณาอนุมัติ
                        </button>
                        {item.status !== 'PENDING_APPROVAL' && item.po_no && item.po_no !== '-' && (
                            <button
                                onClick={() => handleViewHistory(item.po_id, item.po_no)}
                                className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-all"
                                title="ประวัติการอนุมัติ"
                            >
                                <Clock size={18} />
                            </button>
                        )}
                    </div>
                );
            },
            size: 150,
            enableSorting: false,
        }),
    ], [filters.page, filters.limit, handleApprove, handleViewHistory]);

    return (
        <>
            <PageListLayout
                title="รายการอนุมัติใบสั่งซื้อ"
                subtitle="Purchase Order Approval (POA)"
                icon={CheckCircle}
                accentColor="emerald"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                isLoading={isLoading}
                searchForm={
                    <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <FilterField
                                label="เลขที่อนุมัติ POA"
                                value={localFilters.search4}
                                onChange={(val: string) => handleFilterChange('search4', val)}
                                placeholder="กรอกเลขที่อนุมัติ"
                                accentColor="emerald"
                            />
                            <FilterField
                                label="เลขที่เอกสาร PO"
                                value={localFilters.search}
                                onChange={(val: string) => handleFilterChange('search', val)}
                                placeholder="กรอกเลขที่เอกสาร"
                                accentColor="emerald"
                            />
                            <FilterField
                                label="วันที่เริ่มต้น"
                                type="date"
                                value={localFilters.date_start || ''}
                                onChange={(val: string) => handleFilterChange('date_start', val)}
                                accentColor="emerald"
                            />
                            <FilterField
                                label="วันที่สิ้นสุด"
                                type="date"
                                value={localFilters.date_end || ''}
                                onChange={(val: string) => handleFilterChange('date_end', val)}
                                accentColor="emerald"
                            />
                            <FilterField
                                label="สถานะ"
                                type="select"
                                value={localFilters.status || ''}
                                onChange={(val: string) => handleFilterChange('status', val)}
                                options={POA_STATUS_OPTIONS}
                                accentColor="emerald"
                            />
                            <div className="md:col-span-2 lg:col-span-3 flex flex-col sm:flex-row flex-wrap justify-end gap-2 items-center">
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
                                        className="flex-1 sm:flex-none h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        <Search size={18} /> ค้นหา
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setIsViewOnly(false); setSelectedPO(undefined); setIsApprovalModalOpen(true); }}
                                    className="w-full sm:w-auto h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <CheckCircle size={18} /> รายการอนุมัติใบสั่งซื้อ
                                </button>
                            </div>
                        </div>
                    </form>
                }
            >
                <div className="h-full flex flex-col">
                    <div className="hidden md:block flex-1 overflow-hidden">
                        <SmartTable
                            data={filteredData}
                            columns={columns as ColumnDef<POListItem>[]}
                            isLoading={isLoading}
                            enableRowSelection={false}
                            pagination={{
                                pageIndex: filters.page,
                                pageSize: filters.limit,
                                totalCount: data?.total ?? 0,
                                onPageChange: handlePageChange,
                                onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 })
                            }}
                            rowIdField="row_key"
                        />
                    </div>

                    <MobileListContainer
                        isLoading={isLoading}
                        isEmpty={!filteredData.length}
                        pagination={data?.total ? { page: filters.page, total: data.total, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                    >
                        {filteredData.map((item) => (
                            <MobileListCard
                                key={item.row_key}
                                title={item.po_no}
                                subtitle={formatThaiDate(item.po_date)}
                                statusBadge={<POStatusBadge status={item.status} />}
                                details={[
                                    { label: 'เลขที่ POA:', value: item.poa_no || '-' },
                                    { label: 'ผู้จัดทำ:', value: item.approval_emp_name || '-' },
                                    { 
                                        label: 'ยอดรวมสุทธิ', 
                                        value: (
                                            <span className="font-bold text-emerald-600">
                                                {Number(item.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        ) 
                                    }
                                ]}
                                actions={
                                    item.status === 'APPROVED' || item.status === 'PARTIAL' || item.status === 'REJECTED' ? (
                                        <div className="flex justify-end w-full gap-2 font-bold tracking-wide">
                                            <button
                                                onClick={() => handleApprove(item, 'view')}
                                                className="flex-1 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-gray-200 dark:border-slate-600 font-bold"
                                            >
                                                <Eye size={16} /> ดูข้อมูล
                                            </button>
                                            <button
                                                onClick={() => handleViewHistory(item.po_id, item.po_no)}
                                                className="flex-1 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 font-bold"
                                            >
                                                <Clock size={16} /> ประวัติ
                                            </button>
                                            {(item.status === 'APPROVED' || item.status === 'PARTIAL') && item.approval_id && (
                                                <button
                                                    onClick={() => {
                                                        window.open(`/print/poa/${item.approval_id}`, '_blank');
                                                    }}
                                                    className="flex-1 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 font-bold"
                                                >
                                                    <Printer size={16} /> พิมพ์
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 w-full font-bold tracking-wide">
                                            <button
                                                onClick={() => handleApprove(item, 'approve')}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <CheckCircle size={16} /> พิจารณาอนุมัติ
                                            </button>
                                            {item.po_no && item.po_no !== '-' && (
                                                <button
                                                    onClick={() => handleViewHistory(item.po_id, item.po_no)}
                                                    className="w-full bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 font-bold"
                                                >
                                                    <Clock size={16} /> ดูประวัติการอนุมัติ
                                                </button>
                                            )}
                                        </div>
                                    )
                                }
                            />
                        ))}
                    </MobileListContainer>
                </div>
            </PageListLayout>

            {isApprovalModalOpen && (
                <POAFormModal
                    isOpen={isApprovalModalOpen}
                    onClose={() => {
                        setIsApprovalModalOpen(false);
                        setSelectedPO(undefined);
                    }}
                    onSuccess={() => {
                        setIsApprovalModalOpen(false);
                        handleApplyFilters();
                    }}
                    poId={selectedPO?.po_id}
                    initialValues={selectedPO}
                    readOnly={isViewOnly}
                />
            )}

            {isHistoryModalOpen && historyPoNo && (
                <POAHistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    poId={historyPoId}
                    poNo={historyPoNo}
                />
            )}
        </>
    );
}
