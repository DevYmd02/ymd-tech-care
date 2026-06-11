/**
 * @file IssueListPage.tsx
 * @description หน้ารายการใบเบิกสินค้า (Stock Issue List)
 * @route /inventory/issue
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, Search, Eye, Edit } from 'lucide-react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';

import { PageListLayout, SmartTable, FilterField } from '@ui';
import { useTableFilters } from '@/shared/hooks';

import { IssueStockService } from './services/issue.service';
import { IssueFormModal } from './components/IssueFormModal';
import type { IssueStockListItem, IssueStockListParams } from './types/issue.types';

import { SelectPendingIssueModal } from './components/SelectPendingIssueModal';
import type { PendingIssueStock } from './types/issue.types';

// ====================================================================================
// CONSTANTS
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'N', label: 'ยืนยันแล้ว' },
    { value: 'Y', label: 'ยกเลิกแล้ว' },
];

const colHelper = createColumnHelper<IssueStockListItem>();

// ====================================================================================
// STATUS BADGE
// ====================================================================================

function CancelBadge({ flag }: { flag: string }) {
    if (flag === 'Y') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                ยกเลิก
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            ยืนยันแล้ว
        </span>
    );
}

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function IssueListPage() {
    const queryClient = useQueryClient();

    // ── Filters (URL-synced) ────────────────────────────────────────────────────────
    const {
        filters,
        localFilters,
        handleFilterChange,
        handleApplyFilters,
        setFilters,
        resetFilters,
        handlePageChange,
        handleSortChange,
        sortConfig,
    } = useTableFilters({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'issue_stk_no',
            search2: 'appvissue_req_no',
            status: 'cancel_flag',
        },
    });

    // ── Modal State ─────────────────────────────────────────────────────────────────
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isSelectPendingOpen, setIsSelectPendingOpen] = useState(false);
    const [selectedPending, setSelectedPending] = useState<PendingIssueStock | null>(null);

    // ── API Query ───────────────────────────────────────────────────────────────────
    const apiParams: IssueStockListParams = {
        issue_stk_no: filters.search || undefined,
        appvissue_req_no: filters.search2 || undefined,
        date_start: filters.date_start || undefined,
        date_end: filters.date_end || undefined,
        cancel_flag: filters.status === 'ALL' ? undefined : filters.status,
        page: filters.page,
        limit: filters.limit,
    };

    const { data, isLoading } = useQuery({
        queryKey: ['issue-stocks', apiParams],
        queryFn: () => IssueStockService.getList(apiParams),
        staleTime: 0,
    });

    // ── Handlers ────────────────────────────────────────────────────────────────────
    const handleCreate = () => {
        setIsSelectPendingOpen(true)
    };

    const handleView = useCallback((id: string) => {
        setSelectedId(id);
        setIsReadOnly(true);
        setIsFormOpen(true);
    }, []);

    const handleSelectPending = useCallback((item: PendingIssueStock) => {
        setSelectedPending(item);
        setSelectedId(null);
        setIsReadOnly(false);
        setIsSelectPendingOpen(false);
        setIsFormOpen(true);
    }, [])

    const handleEdit = useCallback((id: string) => {
        setSelectedId(id);
        setIsReadOnly(false);
        setIsFormOpen(true);
    }, []);


    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedId(null);
        setSelectedPending(null);
        setIsReadOnly(false);
    };

    // ── Columns ──────────────────────────────────────────────────────────────────────
    const columns = useMemo(
        () => [
            colHelper.display({
                id: 'index',
                header: () => <div className="flex justify-center items-center w-full">ลำดับ</div>,
                cell: info => (
                    <div className="flex justify-center items-center w-full">
                        {(filters.page - 1) * filters.limit + info.row.index + 1}
                    </div>
                ),
                size: 60,
                enableSorting: false,
            }),
            colHelper.accessor('issue_stk_no', {
                header: 'เลขที่เอกสารใบเบิก',
                cell: info => (
                    <span
                        className="font-semibold text-blue-600 hover:underline cursor-pointer transition-all"
                        onClick={() => handleView(info.row.original.docu_item_id)}
                    >
                        {info.getValue()}
                    </span>
                ),
                size: 160,
                enableSorting: false,
            }),
            colHelper.accessor('docu_item_no', {
                header: 'รายการเอกสาร',
                cell: info => <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{info.getValue() || '-'}</span>,
                size: 150,
                enableSorting: false,
            }),
            colHelper.accessor('appvissue_req_no', {
                header: 'เลขที่อนุมัติ / ใบขอเบิกอ้างอิง',
                cell: info => (
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {info.getValue() && info.getValue() !== '-' ? info.getValue() : '-'}
                        </span>
                        {info.row.original.issue_req_no && info.row.original.issue_req_no !== '-' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({info.row.original.issue_req_no})
                            </span>
                        )}
                    </div>
                ),
                size: 200,
                enableSorting: false,
            }),
            colHelper.accessor('docu_date', {
                header: 'วันที่เอกสาร',
                cell: info => {
                    const val = info.getValue();
                    if (!val) return '-';
                    const d = new Date(val);
                    return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-GB');
                },
                size: 120,
                enableSorting: false,
            }),
            colHelper.accessor('dept_name', {
                header: 'แผนก',
                cell: info => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() || '-'}</span>,
                size: 150,
                enableSorting: false,
            }),

            colHelper.accessor('rece_emp_name', {
                header: 'ผู้รับสินค้า',
                cell: info => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() || '-'}</span>,
                size: 140,
                enableSorting: false,
            }),
            colHelper.accessor('amnt_total', {
                header: () => <div className="text-right w-full">รวมเงิน</div>,
                cell: info => (
                    <div className="text-right font-bold text-gray-800 dark:text-gray-200">
                        {Number(info.getValue() || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                ),
                size: 120,
                enableSorting: false,
            }),
            colHelper.accessor('cancel_flag', {
                header: () => <div className="flex justify-center items-center w-full">สถานะ</div>,
                cell: info => (
                    <div className="flex justify-center items-center w-full">
                        <CancelBadge flag={info.getValue()} />
                    </div>
                ),
                size: 100,
                enableSorting: false,
            }),
            colHelper.display({
                id: 'actions',
                header: () => <div className="flex justify-center items-center w-full">การจัดการ</div>,
                cell: ({ row }) => (
                    <div className="flex items-center justify-center gap-1.5 w-full">
                        <button
                            onClick={() => handleView(row.original.docu_item_id)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="ดูรายละเอียด"
                        >
                            <Eye size={16} />
                        </button>
                        <button
                            onClick={() => handleEdit(row.original.docu_item_id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30 rounded-md transition-colors"
                            title="แก้ไข"
                        >
                            <Edit size={14} />
                            <span>แก้ไข</span>
                        </button>
                    </div>
                ),
                size: 120,
                enableSorting: false,
            }),
        ],
        [filters.page, filters.limit, handleView, handleEdit]
    );

    return (
        <PageListLayout
            title="ใบเบิกสินค้า - Stock Issue"
            subtitle="จัดการข้อมูลการเบิกจ่ายสินค้าและวัตถุดิบออกจากคลังสินค้า"
            icon={ClipboardList}
            accentColor="blue"
            totalCount={data?.total ?? 0}
            searchForm={
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <FilterField
                        label="เลขที่ใบเบิก"
                        value={localFilters.search}
                        onChange={(v) => handleFilterChange('search', v)}
                        placeholder="เลขที่ใบเบิก"
                        accentColor="blue"
                    />
                    <FilterField
                        label="เลขที่อนุมัติใบขอเบิก"
                        value={localFilters.search2 || ''}
                        onChange={(v) => handleFilterChange('search2', v)}
                        placeholder="เลขที่อนุมัติใบขอเบิก"
                        accentColor="blue"
                    />
                    <FilterField
                        label="วันที่ตั้งแต่"
                        type="date"
                        value={localFilters.date_start}
                        onChange={(v) => handleFilterChange('date_start', v)}
                        accentColor="blue"
                    />
                    <FilterField
                        label="ถึงวันที่"
                        type="date"
                        value={localFilters.date_end}
                        onChange={(v) => handleFilterChange('date_end', v)}
                        accentColor="blue"
                    />
                    <FilterField
                        label="สถานะ"
                        type="select"
                        value={localFilters.status}
                        onChange={(v) => handleFilterChange('status', v)}
                        options={STATUS_OPTIONS}
                        accentColor="blue"
                    />

                    {/* Action Buttons */}
                    <div className="md:col-span-3 flex flex-col md:flex-row md:justify-end gap-3 mt-2">
                        <div className="grid grid-cols-2 md:flex gap-2">
                            <button
                                onClick={resetFilters}
                                className="h-10 bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-lg font-medium transition-all flex items-center justify-center px-4 gap-2"
                            >
                                <Plus size={18} className="rotate-45 text-slate-500" strokeWidth={2.5} />
                                ล้างค่า
                            </button>
                            <button
                                onClick={handleApplyFilters}
                                className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center px-6 gap-2"
                            >
                                <Search size={18} strokeWidth={3} />
                                ค้นหา
                            </button>
                        </div>

                        <button
                            onClick={handleCreate}
                            className="h-10 w-full md:w-auto px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            สร้างใบเบิกสินค้าใหม่
                        </button>
                    </div>
                </div>
            }
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <SmartTable
                    data={data?.items ?? []}
                    columns={columns as ColumnDef<IssueStockListItem, unknown>[]}
                    isLoading={isLoading}
                    pagination={{
                        pageIndex: filters.page,
                        pageSize: filters.limit,
                        totalCount: data?.total ?? 0,
                        onPageChange: handlePageChange,
                        onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 }),
                    }}
                    sortConfig={sortConfig}
                    onSortChange={handleSortChange}
                    rowIdField="docu_item_id"
                />
            </div>

            {/* เพิ่ม SelectPendingIssueModal */}
            <SelectPendingIssueModal
                isOpen={isSelectPendingOpen}
                onClose={() => setIsSelectPendingOpen(false)}
                onSelect={handleSelectPending}
            />

            {/* Form Modal */}
            {isFormOpen && (
                <IssueFormModal
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    editId={selectedId}
                    readOnly={isReadOnly}
                    pendingIssue={selectedPending}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['issue-stocks'] })}
                />
            )}
        </PageListLayout>
    );
}
