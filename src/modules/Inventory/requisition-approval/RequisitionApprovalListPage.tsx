import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Search, Eye, Layers, List } from 'lucide-react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';

import { PageListLayout, SmartTable, FilterField } from '@ui';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { useTableFilters } from '@/shared/hooks';

import { RequisitionApprovalService } from './services/requisition-approval.service';
import { RequisitionApproveFormModal } from './components/RequisitionApproveFormModal';
import { RequisitionSearchModal } from './components/RequisitionSearchModal';
import type { RequisitionApprovalListItem } from './types/requisition-approval.types';
import { formatNumber } from '@/shared/utils';

const colHelper = createColumnHelper<RequisitionApprovalListItem>();

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'PENDING', label: 'รออนุมัติ' },
    { value: 'APPROVED', label: 'อนุมัติแล้ว' },
    { value: 'REJECTED', label: 'ไม่อนุมัติ' },
];

export interface RequisitionApprovalListPageProps {
    isModal?: boolean;
    onClose?: () => void;
}

function StatusBadge({ status }: { status: RequisitionApprovalListItem['status'] }) {
    switch (status) {
        case 'APPROVED':
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    อนุมัติแล้ว
                </span>
            );
        case 'REJECTED':
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    ไม่อนุมัติ
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    รออนุมัติ
                </span>
            );
    }
}

export default function RequisitionApprovalListPage({ isModal = false, onClose }: RequisitionApprovalListPageProps = {}) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    // ── Filters ──────────────────────────────────────────────────────────────────
    const {
        filters,
        localFilters,
        handleFilterChange,
        handleApplyFilters,
        resetFilters,
        handlePageChange,
        setFilters,
    } = useTableFilters({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'issue_req_no',
            status: 'status',
        },
    });

    // ── Modal State ─────────────────────────────────────────────────────────────────
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    // ── API Query ───────────────────────────────────────────────────────────────────
    const { data: pendingItems = [], isLoading: isLoadingPending } = useQuery({
        queryKey: ['requisition-pending-approvals'],
        queryFn: () => RequisitionApprovalService.getPending(),
        enabled: activeTab === 'pending',
    });

    const { data: historyItems = [], isLoading: isLoadingHistory } = useQuery({
        queryKey: ['requisition-approval-history'],
        queryFn: () => RequisitionApprovalService.getHistory(),
        enabled: activeTab === 'history',
    });

    const items = activeTab === 'pending' ? pendingItems : historyItems;
    const isLoading = activeTab === 'pending' ? isLoadingPending : isLoadingHistory;

    // Filter items locally based on filter fields
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (filters.search && !item.issue_req_no.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }
            if (filters.date_start && item.docu_date < filters.date_start) {
                return false;
            }
            if (filters.date_end && item.docu_date > filters.date_end) {
                return false;
            }
            if (filters.status && filters.status !== 'ALL' && item.status !== filters.status) {
                return false;
            }
            return true;
        });
    }, [items, filters]);

    // ── Handlers ────────────────────────────────────────────────────────────────────
    const handleView = useCallback((id: string, readOnly: boolean) => {
        setSelectedId(id);
        setIsReadOnly(readOnly);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedId(null);
        setIsReadOnly(false);
    };

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['requisition-pending-approvals'] });
        queryClient.invalidateQueries({ queryKey: ['requisition-approval-history'] });
    };

    // ── Columns ──────────────────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns: ColumnDef<RequisitionApprovalListItem, any>[] = useMemo(() => {
        return [
            colHelper.display({
                id: 'index',
                header: () => <div className="flex justify-center items-center w-full">ลำดับ</div>,
                cell: info => (
                    <div className="flex justify-center items-center w-full">
                        {info.row.index + 1}
                    </div>
                ),
                size: 60,
            }),
            colHelper.accessor('issue_req_no', {
                header: 'เลขที่เอกสาร',
                cell: info => (
                    <span
                        className="font-semibold text-emerald-600 hover:underline cursor-pointer transition-all"
                        onClick={() => handleView(info.row.original.docu_item_id, activeTab === 'history')}
                    >
                        {info.getValue()}
                    </span>
                ),
                size: 160,
            }),
            colHelper.accessor('docu_date', {
                header: 'วันที่เอกสาร',
                cell: info => {
                    const val = info.getValue();
                    if (!val) return '-';
                    const d = new Date(val);
                    return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-GB');
                },
                size: 130,
            }),
            colHelper.accessor('dept_name', {
                header: 'แผนก',
                cell: info => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() || '-'}</span>,
                size: 160,
            }),
            colHelper.accessor('save_emp_name', {
                header: 'ผู้ขอเบิก/ผู้บันทึก',
                cell: info => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() || '-'}</span>,
                size: 150,
            }),
            colHelper.accessor('qty_total', {
                header: () => <div className="text-center w-full">จำนวนเบิก</div>,
                cell: info => (
                    <div className="text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {formatNumber(info.getValue() || 0)}
                    </div>
                ),
                size: 110,
            }),
            ...(activeTab === 'history'
                ? [
                      colHelper.accessor('status', {
                          header: () => <div className="flex justify-center items-center w-full">สถานะการพิจารณา</div>,
                          cell: info => (
                              <div className="flex justify-center items-center w-full">
                                  <StatusBadge status={info.getValue()} />
                              </div>
                          ),
                          size: 130,
                      }),
                      colHelper.accessor('approval_emp_name', {
                          header: 'ผู้อนุมัติ',
                          cell: info => <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{info.getValue() || '-'}</span>,
                          size: 150,
                      }),
                  ]
                : []),
            colHelper.display({
                id: 'actions',
                header: () => <div className="flex justify-center items-center w-full">จัดการ</div>,
                cell: ({ row }) => (
                    <div className="flex items-center justify-center gap-1.5 w-full">
                        <button
                            onClick={() => handleView(row.original.docu_item_id, activeTab === 'history')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95 ${
                                activeTab === 'pending'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                            }`}
                        >
                            <Eye size={14} />
                            {activeTab === 'pending' ? 'พิจารณาอนุมัติ' : 'ดูรายละเอียด'}
                        </button>
                    </div>
                ),
                size: 120,
            }),
        ];
    }, [activeTab, handleView]);

    const modalContent = (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <FilterField
                    label="เลขที่เอกสาร"
                    value={localFilters.search}
                    onChange={(v) => handleFilterChange('search', v)}
                    placeholder="เลขที่ใบขอเบิก"
                    accentColor="emerald"
                />
                <FilterField
                    label="วันที่เริ่มต้น"
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
                <FilterField
                    label="สถานะ"
                    type="select"
                    value={localFilters.status}
                    onChange={(v) => handleFilterChange('status', v)}
                    options={STATUS_OPTIONS}
                    accentColor="emerald"
                />

                <div className="md:col-span-4 flex flex-col md:flex-row md:justify-between items-center gap-3 mt-2 w-full">
                    {/* Tab Toggle */}
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === 'pending'
                                    ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-200/50 dark:border-gray-600/50'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <Layers size={16} />
                            รอพิจารณาอนุมัติ ({pendingItems.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === 'history'
                                    ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-200/50 dark:border-gray-600/50'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            <List size={16} />
                            ประวัติการอนุมัติ ({historyItems.length})
                        </button>
                    </div>

                    <div className="flex gap-2 self-end">
                        <button
                            onClick={resetFilters}
                            className="h-10 bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-lg font-medium transition-all flex items-center justify-center px-4 gap-2"
                        >
                            ล้างค่า
                        </button>
                        <button
                            onClick={handleApplyFilters}
                            className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center px-6 gap-2"
                        >
                            <Search size={18} strokeWidth={3} />
                            ค้นหา
                        </button>
                        <button
                            onClick={() => {
                                setIsSearchModalOpen(true);
                            }}
                            className="h-10 w-full md:w-auto px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <ShieldCheck size={18} strokeWidth={2.5} />
                            รายการอนุมัติใบขอเบิก
                        </button>
                    </div>
                </div>
            </div>
 
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <SmartTable
                    data={filteredItems}
                    columns={columns}
                    isLoading={isLoading}
                    pagination={{
                        pageIndex: filters.page,
                        pageSize: filters.limit,
                        totalCount: filteredItems.length,
                        onPageChange: handlePageChange,
                        onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 }),
                    }}
                    rowIdField="docu_item_id"
                />
            </div>
 
            {isModalOpen && (
                <RequisitionApproveFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    requisitionId={selectedId}
                    readOnly={isReadOnly}
                    onSuccess={handleSuccess}
                />
            )}

            {isSearchModalOpen && (
                <RequisitionSearchModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                    onSelect={(id) => {
                        handleView(id, false);
                    }}
                />
            )}
        </div>
    );
 
    if (isModal) {
        return (
            <DialogFormLayout
                isOpen={true}
                onClose={onClose || (() => {})}
                title="รายการอนุมัติใบขอเบิก - Requisition Approval"
                titleIcon={
                    <div className="bg-emerald-600 p-1.5 rounded-lg shadow-sm text-white">
                        <ShieldCheck size={20} />
                    </div>
                }
                width="max-w-[1200px]"
                headerColor="bg-emerald-700"
            >
                <div className="flex flex-col h-[75vh] overflow-y-auto p-6 bg-slate-100 dark:bg-[#0b1120] text-gray-900 dark:text-white">
                    {modalContent}
                </div>
            </DialogFormLayout>
        );
    }
 
    return (
        <PageListLayout
            title="อนุมัติใบขอเบิก - Requisition Approval"
            subtitle="พิจารณาการอนุมัติและตรวจสอบประวัติการขอเบิกวัสดุอุปกรณ์จากคลัง"
            icon={ShieldCheck}
            accentColor="emerald"
            totalCount={filteredItems.length}
            searchForm={
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <FilterField
                        label="เลขที่เอกสาร"
                        value={localFilters.search}
                        onChange={(v) => handleFilterChange('search', v)}
                        placeholder="เลขที่ใบขอเบิก"
                        accentColor="emerald"
                    />
                    <FilterField
                        label="วันที่เริ่มต้น"
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
                    <FilterField
                        label="สถานะ"
                        type="select"
                        value={localFilters.status}
                        onChange={(v) => handleFilterChange('status', v)}
                        options={STATUS_OPTIONS}
                        accentColor="emerald"
                    />
 
                    {/* Action Buttons */}
                    <div className="md:col-span-4 flex flex-col md:flex-row md:justify-between items-center gap-3 mt-2 w-full">
                        {/* Tab Toggle */}
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit border border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeTab === 'pending'
                                        ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-200/50 dark:border-gray-600/50'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                <Layers size={16} />
                                รอพิจารณาอนุมัติ ({pendingItems.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeTab === 'history'
                                        ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-200/50 dark:border-gray-600/50'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                <List size={16} />
                                ประวัติการอนุมัติ ({historyItems.length})
                            </button>
                        </div>
 
                        <div className="flex gap-2 self-end">
                            <button
                                onClick={resetFilters}
                                className="h-10 bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-lg font-medium transition-all flex items-center justify-center px-4 gap-2"
                            >
                                ล้างค่า
                            </button>
                            <button
                                onClick={handleApplyFilters}
                                className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center px-6 gap-2"
                            >
                                <Search size={18} strokeWidth={3} />
                                ค้นหา
                            </button>
                            <button
                                onClick={() => {
                                    setIsSearchModalOpen(true);
                                }}
                                className="h-10 w-full md:w-auto px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <ShieldCheck size={18} strokeWidth={2.5} />
                                รายการอนุมัติใบขอเบิก
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <SmartTable
                    data={filteredItems}
                    columns={columns}
                    isLoading={isLoading}
                    pagination={{
                        pageIndex: filters.page,
                        pageSize: filters.limit,
                        totalCount: filteredItems.length,
                        onPageChange: handlePageChange,
                        onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 }),
                    }}
                    rowIdField="docu_item_id"
                />
            </div>

            {isModalOpen && (
                <RequisitionApproveFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    requisitionId={selectedId}
                    readOnly={isReadOnly}
                    onSuccess={handleSuccess}
                />
            )}

            {isSearchModalOpen && (
                <RequisitionSearchModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                    onSelect={(id) => {
                        handleView(id, false);
                    }}
                />
            )}
        </PageListLayout>
    );
}
