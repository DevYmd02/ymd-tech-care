/**
 * @file TransferListPage.tsx
 * @description หน้ารายการใบขอโอนย้ายสินค้า (Transfer Requisition List)
 * @route /inventory/transfer
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';

import { PageListLayout, SmartTable, FilterField } from '@ui';
import { useTableFilters } from '@/shared/hooks';

import { TransferService } from './services/transfer.service';
import { TransferFormModal } from './components/TransferFormModal';
import type { TransferRequisitionListItem, TransferRequisitionListParams } from './types/transfer.types';

// ====================================================================================
// CONSTANTS
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'N', label: 'ปกติ' },
    { value: 'Y', label: 'ยกเลิกแล้ว' },
];

const colHelper = createColumnHelper<TransferRequisitionListItem>();

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
            ปกติ
        </span>
    );
}

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function TransferListPage() {
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
            search: 'transfer__req_no',
            status: 'cancelflag',
        },
    });

    // ── Modal State ─────────────────────────────────────────────────────────────────
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // ── API Query ───────────────────────────────────────────────────────────────────
    const apiParams: TransferRequisitionListParams = {
        transfer__req_no: filters.search || undefined,
        date_start: filters.date_start || undefined,
        date_end: filters.date_end || undefined,
        cancelflag: filters.status === 'ALL' ? undefined : filters.status,
        page: filters.page,
        limit: filters.limit,
    };

    const { data, isLoading } = useQuery({
        queryKey: ['transfer-requisitions', apiParams],
        queryFn: ({ signal }) => TransferService.getList(apiParams, { signal }),
        staleTime: 0,
    });

    // ── Handlers ────────────────────────────────────────────────────────────────────
    const handleCreate = () => {
        setSelectedId(null);
        setIsReadOnly(false);
        setIsFormOpen(true);
    };

    const handleView = useCallback((id: string) => {
        setSelectedId(id);
        setIsReadOnly(true);
        setIsFormOpen(true);
    }, []);

    const handleEdit = useCallback((id: string) => {
        setSelectedId(id);
        setIsReadOnly(false);
        setIsFormOpen(true);
    }, []);

    const handleDelete = useCallback(
        async (id: string) => {
            if (!window.confirm('ต้องการยกเลิกใบขอโอนย้ายรายการนี้หรือไม่?')) return;
            const res = await TransferService.delete(id);
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['transfer-requisitions'] });
            }
        },
        [queryClient]
    );

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedId(null);
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
            colHelper.accessor('transfer__req_no', {
                header: 'เลขที่เอกสารขอโอนย้าย',
                cell: info => (
                    <span
                        className="font-semibold text-blue-600 hover:underline cursor-pointer transition-all"
                        onClick={() => handleView(info.row.original.transfer__req_id)}
                    >
                        {info.getValue()}
                    </span>
                ),
                size: 180,
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
            colHelper.accessor('branch_name', {
                header: 'สาขา',
                cell: info => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() || '-'}</span>,
                size: 150,
                enableSorting: false,
            }),
            colHelper.accessor('save_emp_name', {
                header: 'ผู้บันทึก',
                cell: info => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() || '-'}</span>,
                size: 140,
                enableSorting: false,
            }),
            colHelper.accessor('transfer_emp_name', {
                header: 'ผู้ขอโอน',
                cell: info => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() || '-'}</span>,
                size: 140,
                enableSorting: false,
            }),
            colHelper.accessor('cancelflag', {
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
                            onClick={() => handleView(row.original.transfer__req_id)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="ดูรายละเอียด"
                        >
                            <Eye size={16} />
                        </button>
                        <button
                            onClick={() => handleEdit(row.original.transfer__req_id)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="แก้ไข"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => handleDelete(row.original.transfer__req_id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="ยกเลิก/ลบ"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ),
                size: 120,
                enableSorting: false,
            }),
        ],
        [filters.page, filters.limit, handleView, handleEdit, handleDelete]
    );

    return (
        <PageListLayout
            title="ใบขอโอนย้ายสินค้า - Transfer Requisition"
            subtitle="จัดการข้อมูลการขอโอนย้ายสินค้าและวัตถุดิบระหว่างคลังสินค้าภายในองค์กร"
            icon={ClipboardList}
            accentColor="blue"
            totalCount={data?.total ?? 0}
            searchForm={
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <FilterField
                        label="เลขที่ใบขอโอนย้าย"
                        value={localFilters.search}
                        onChange={(v) => handleFilterChange('search', v)}
                        placeholder="เลขที่ใบขอโอนย้าย"
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
                    <div className="md:col-span-4 flex flex-col md:flex-row md:justify-end items-center gap-3 mt-2">
                        <button
                            onClick={resetFilters}
                            className="h-10 w-full md:w-auto bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-lg font-medium transition-all flex items-center justify-center px-4 gap-2"
                        >
                            <Plus size={18} className="rotate-45 text-slate-500" strokeWidth={2.5} />
                            ล้างค่า
                        </button>
                        <button
                            onClick={handleApplyFilters}
                            className="h-10 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center px-6 gap-2"
                        >
                            <Search size={18} strokeWidth={3} />
                            ค้นหา
                        </button>
                        <button
                            onClick={handleCreate}
                            className="h-10 w-full md:w-auto px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            สร้างใบขอโอนย้ายใหม่
                        </button>
                    </div>
                </div>
            }
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <SmartTable
                    data={data?.items ?? []}
                    columns={columns as ColumnDef<TransferRequisitionListItem, unknown>[]}
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
                    rowIdField="transfer__req_id"
                />
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <TransferFormModal
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    editId={selectedId}
                    readOnly={isReadOnly}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['transfer-requisitions'] })}
                />
            )}
        </PageListLayout>
    );
}
