/**
 * @file TransferInListPage.tsx
 * @description หน้ารายการใบโอนย้ายสินค้าเข้า (Transfer In List)
 * @route /inventory/transfer-in
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownLeft, Plus, Search, Eye, Edit, X } from 'lucide-react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';

import { PageListLayout, SmartTable, FilterField } from '@ui';
import { useTableFilters } from '@/shared/hooks';

import { TransferInService } from './services/transfer-in.services';
import { TransferInModal } from './components/TransferInModal';
import type { TransferInListItem, TransferInListParams, PendingTransferInItem } from './types/transfer-in.types';

const colHelper = createColumnHelper<TransferInListItem>();
const pendingColHelper = createColumnHelper<PendingTransferInItem>();

export default function TransferInListPage() {
    const queryClient = useQueryClient();

    const {
        filters,
        localFilters,
        handleFilterChange,
        handleApplyFilters,
        resetFilters,
        handlePageChange,
        handleSortChange,
        sortConfig,
        setFilters
    } = useTableFilters({
        customParamKeys: {
            search: 'transfer_in_no',
        },
    });

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [pendingDataForModal, setPendingDataForModal] = useState<PendingTransferInItem | null>(null);

    const apiParams: TransferInListParams = {
        transfer_in_no: filters.search || undefined,
        date_start: filters.date_start || undefined,
        date_end: filters.date_end || undefined,
        page: filters.page,
        limit: filters.limit,
    };

    const { data, isLoading } = useQuery({
        queryKey: ['transfer-in-list', apiParams],
        queryFn: ({ signal }) => TransferInService.getList(apiParams, { signal }),
        staleTime: 0,
        enabled: activeTab === 'history',
    });

    const { data: pendingData, isLoading: isPendingLoading } = useQuery({
        queryKey: ['transfer-in-pending'],
        queryFn: ({ signal }) => TransferInService.getPendingList(undefined, { signal }),
        staleTime: 0,
        enabled: activeTab === 'pending',
    });

    const handleCreate = () => {
        setSelectedId(null);
        setIsReadOnly(false);
        setPendingDataForModal(null);
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

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedId(null);
        setIsReadOnly(false);
    };

    const columns = useMemo(
        () => [
            colHelper.display({
                id: 'index',
                header: 'ลำดับ',
                meta: { thClassName: 'text-center w-16' },
                cell: info => <div className="flex justify-center">{(filters.page - 1) * filters.limit + info.row.index + 1}</div>,
                size: 60,
            }),
            colHelper.accessor('transfer_in_no', {
                header: 'เลขที่เอกสาร',
                cell: info => (
                    <span
                        className="font-semibold text-blue-600 hover:underline cursor-pointer"
                        onClick={() => handleView(info.row.original.transfer_in_id)}
                    >
                        {info.getValue()}
                    </span>
                ),
            }),
            colHelper.accessor('docu_date', {
                header: 'วันที่',
                cell: info => {
                    const val = info.getValue();
                    return val ? new Date(val).toLocaleDateString('en-GB') : '-';
                },
            }),
            colHelper.accessor('branch_name', {
                header: 'สาขา',
                cell: info => info.getValue() || '-',
            }),
            colHelper.accessor('status', {
                header: 'สถานะ',
                cell: info => info.getValue() || '-',
            }),
            colHelper.display({
                id: 'actions',
                header: 'จัดการ',
                meta: { thClassName: 'text-center w-24' },
                cell: ({ row }) => (
                    <div className="flex justify-center gap-2">
                        <button onClick={() => handleView(row.original.transfer_in_id)} className="text-gray-500 hover:text-blue-600"><Eye size={16} /></button>
                        <button onClick={() => handleEdit(row.original.transfer_in_id)} className="text-gray-500 hover:text-amber-600"><Edit size={16} /></button>
                    </div>
                ),
            }),
        ],
        [filters.page, filters.limit, handleView, handleEdit]
    );

    const pendingColumns = useMemo(
        () => [
            pendingColHelper.display({
                id: 'index',
                header: 'ลำดับ',
                meta: { thClassName: 'text-center w-16' },
                cell: info => <div className="flex justify-center text-slate-500">{info.row.index + 1}</div>,
                size: 60,
            }),
            pendingColHelper.accessor('appv_transfer_no', {
                header: 'เลขที่เอกสารอนุมัติ',
                cell: info => <span className="font-medium text-slate-700 dark:text-slate-200">{info.getValue() || '-'}</span>,
            }),
            pendingColHelper.accessor('appv_transfer_date', {
                header: 'วันที่อนุมัติ',
                cell: info => <div className="text-slate-600">{info.getValue() ? new Date(info.getValue()!).toLocaleDateString('en-GB') : '-'}</div>,
            }),
            pendingColHelper.accessor('doc_type_name', {
                header: 'ประเภทเอกสาร',
                cell: info => info.getValue() || '-',
            }),
            pendingColHelper.accessor('status', {
                header: 'สถานะ',
                cell: info => info.getValue() || '-',
            }),
            pendingColHelper.display({
                id: 'actions',
                header: 'จัดการ',
                meta: { thClassName: 'text-center' },
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <button 
                            onClick={() => {
                                setPendingDataForModal(row.original);
                                setIsFormOpen(true);
                                setSelectedId(null);
                                setIsReadOnly(false);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-sm transition-all active:scale-95"
                        >
                            <Plus size={14} />
                            สร้างใบโอนย้าย
                        </button>
                    </div>
                ),
                size: 150,
            }),
        ],
        []
    );

    return (
        <PageListLayout
            title="ใบโอนย้ายสินค้าเข้า (Transfer In)"
            subtitle="จัดการข้อมูลการรับโอนย้ายสินค้าและวัตถุดิบเข้าคลังสินค้า"
            icon={ArrowDownLeft}
            accentColor="emerald"
            totalCount={activeTab === 'pending' ? (pendingData?.length ?? 0) : (data?.total ?? 0)}
            searchForm={
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <FilterField
                        label="ค้นหาเลขที่เอกสาร"
                        value={localFilters.search}
                        onChange={(v) => handleFilterChange('search', v)}
                        placeholder="ค้นหา..."
                        accentColor="emerald"
                    />
                    <FilterField
                        label="ตั้งแต่วันที่"
                        type="date"
                        value={localFilters.date_start}
                        onChange={(v) => handleFilterChange('date_start', v)}
                        accentColor="emerald"
                    />
                    <FilterField
                        label="ถึงวันที่"
                        type="date"
                        value={localFilters.date_end}
                        onChange={(v) => handleFilterChange('date_end', v)}
                        accentColor="emerald"
                    />
                    {/* Action Buttons */}
                    <div className="md:col-span-4 flex flex-col md:flex-row md:justify-end items-center gap-3 mt-2">
                        <button
                            onClick={resetFilters}
                            className="h-10 w-full md:w-auto bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-lg font-medium transition-all flex items-center justify-center px-4 gap-2"
                        >
                            <X size={18} className="text-slate-500" strokeWidth={2.5} />
                            ล้างค่า
                        </button>
                        <button
                            onClick={handleApplyFilters}
                            className="h-10 w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center px-6 gap-2"
                        >
                            <Search size={18} strokeWidth={3} />
                            ค้นหา
                        </button>
                        <button
                            onClick={handleCreate}
                            className="h-10 w-full md:w-auto px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            สร้างใบโอนย้ายเข้าใหม่
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
                        activeTab === 'pending'
                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    รายการรอโอนย้ายเข้า {pendingData ? `(${pendingData.length})` : ''}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
                        activeTab === 'history'
                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    ประวัติการโอนย้าย
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {activeTab === 'pending' ? (
                    <SmartTable
                        data={pendingData ?? []}
                        columns={pendingColumns as ColumnDef<PendingTransferInItem, unknown>[]}
                        isLoading={isPendingLoading}
                        rowIdField="appv_transfer_id"
                        pagination={{
                            pageIndex: 1,
                            pageSize: pendingData?.length || 10,
                            totalCount: pendingData?.length || 0,
                            onPageChange: () => {},
                            onPageSizeChange: () => {}
                        }}
                    />
                ) : (
                    <SmartTable
                        data={data?.items ?? []}
                        columns={columns as ColumnDef<TransferInListItem, unknown>[]}
                        isLoading={isLoading}
                        pagination={{
                            pageIndex: filters.page,
                            pageSize: filters.limit,
                            totalCount: data?.total ?? 0,
                            onPageChange: handlePageChange,
                            onPageSizeChange: (size) => setFilters({ limit: size, page: 1 }),
                        }}
                        sortConfig={sortConfig}
                        onSortChange={handleSortChange}
                        rowIdField="transfer_in_id"
                    />
                )}
            </div>

            {isFormOpen && (
                <TransferInModal
                    isOpen={isFormOpen}
                    onClose={() => {
                        handleCloseForm();
                        setPendingDataForModal(null);
                    }}
                    editId={selectedId}
                    readOnly={isReadOnly}
                    pendingData={pendingDataForModal}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['transfer-in-list'] });
                        queryClient.invalidateQueries({ queryKey: ['transfer-in-pending'] });
                    }}
                />
            )}
        </PageListLayout>
    );
}
