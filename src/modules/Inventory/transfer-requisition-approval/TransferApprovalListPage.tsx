/**
 * @file TransferApprovalListPage.tsx
 * @description หน้ารายการอนุมัติใบขอโอนย้ายสินค้า (Transfer Requisition Approval List Page)
 * @route /inventory/transfer-approval
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Eye, Layers, List, Search, ShieldCheck } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';

import { PageListLayout, SmartTable, FilterField } from '@ui';
import { useTableFilters } from '@/shared/hooks';

import { TransferApprovalService } from './services/transfer-approval.service';
import { TransferApproveFormModal } from './components/TransferApproveFormModal';
import { TransferSearchModal } from './components/TransferSearchModal';
import { TransferApprovalHistoryModal } from './components/TransferApprovalHistoryModal';
import type { TransferApprovalListItem, TransferApprovalListParams } from './types/transfer-approval.types';
import type { TransferRequisitionListItem } from '../transfer-requisition/types/transfer.types';
import { useBranches, useEmployees } from '@/modules/master-data/hooks/useMasterData';

const colHelper = createColumnHelper<TransferApprovalListItem>();
const pendingColHelper = createColumnHelper<TransferRequisitionListItem>();

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'Y', label: 'อนุมัติทั้งหมด (Y)' },
    { value: 'P', label: 'อนุมัติบางส่วน (P)' },
    { value: 'N', label: 'ไม่อนุมัติ (N)' },
];

function StatusBadge({ status }: { status?: string }) {
    if (status === 'APPROVED' || status === 'Y') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                อนุมัติทั้งหมด
            </span>
        );
    }
    if (status === 'PARTIAL_APPROVED' || status === 'PARTIAL' || status === 'P') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                อนุมัติบางส่วน
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            ไม่อนุมัติ
        </span>
    );
}

export default function TransferApprovalListPage() {
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
            search: 'appv_transfer_no',
            status: 'appv_flag',
        },
    });

    // ── Modal State ─────────────────────────────────────────────────────────────────
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [selectedRequisitionId, setSelectedRequisitionId] = useState<string | null>(null);

    // Approval History Modal State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

    // ── API Query ───────────────────────────────────────────────────────────────────
    const { data: pendingItems = [], isLoading: isLoadingPending } = useQuery({
        queryKey: ['transfer-pending-approvals'],
        queryFn: ({ signal }) => TransferApprovalService.getPending({ signal }),
        enabled: activeTab === 'pending',
    });

    const apiParams: TransferApprovalListParams = {
        appv_transfer_no: filters.search || undefined,
        date_start: filters.date_start || undefined,
        date_end: filters.date_end || undefined,
        appv_flag: filters.status === 'ALL' ? undefined : filters.status,
        page: filters.page,
        limit: filters.limit,
    };

    const { data: historyData, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['transfer-requisition-approvals', apiParams],
        queryFn: ({ signal }) => TransferApprovalService.getList(apiParams, { signal }),
        enabled: activeTab === 'history',
    });

    const historyItems = useMemo(() => historyData?.items || [], [historyData]);
    const isLoading = activeTab === 'pending' ? isLoadingPending : isLoadingHistory;

    const { data: branches = [] } = useBranches();
    const { data: employees = [] } = useEmployees();

    const mappedHistoryItems = useMemo(() => {
        return historyItems.map(item => {
            const itemRec = item as unknown as Record<string, unknown>;
            const appvEmpId = itemRec.approval_emp_id;
            const appvEmp = appvEmpId ? employees.find(e => String(e.employee_id) === String(appvEmpId) || String(e.id) === String(appvEmpId)) : undefined;
            
            const saveEmpId = itemRec.created_by_emp_id || itemRec.save_emp_id;
            const saveEmp = saveEmpId ? employees.find(e => String(e.employee_id) === String(saveEmpId) || String(e.id) === String(saveEmpId)) : undefined;
            
            const transEmpId = itemRec.transfer_by_emp_id || itemRec.transfer_emp_id;
            const transEmp = transEmpId ? employees.find(e => String(e.employee_id) === String(transEmpId) || String(e.id) === String(transEmpId)) : undefined;
            return {
                ...item,
                appv_emp_name: appvEmp ? (appvEmp.employee_fullname || appvEmp.employee_name || appvEmp.first_name) : (item.appv_emp_name || '-'),
                save_emp_name: saveEmp ? (saveEmp.employee_fullname || saveEmp.employee_name || saveEmp.first_name) : (item.save_emp_name || '-'),
                transfer_emp_name: transEmp ? (transEmp.employee_fullname || transEmp.employee_name || transEmp.first_name) : (item.transfer_emp_name || (saveEmp ? (saveEmp.employee_fullname || saveEmp.employee_name || saveEmp.first_name) : '-')),
            };
        });
    }, [historyItems, employees]);

    const mappedPendingItems = useMemo(() => {
        return pendingItems.map(item => {
            const itemRec = item as unknown as Record<string, unknown>;
            const branch = branches.find(b => String(b.branch_id) === String(itemRec.branch_id) || String(b.id) === String(itemRec.branch_id));
            
            const saveEmpId = itemRec.created_by_emp_id || itemRec.save_emp_id;
            const saveEmp = saveEmpId ? employees.find(e => String(e.employee_id) === String(saveEmpId) || String(e.id) === String(saveEmpId)) : undefined;
            
            const transEmpId = itemRec.transfer_by_emp_id || itemRec.transfer_emp_id;
            const transEmp = transEmpId ? employees.find(e => String(e.employee_id) === String(transEmpId) || String(e.id) === String(transEmpId)) : undefined;
            return {
                ...item,
                branch_name: branch ? branch.branch_name : (item.branch_name || '-'),
                save_emp_name: saveEmp ? (saveEmp.employee_fullname || saveEmp.employee_name || saveEmp.first_name) : (item.save_emp_name || '-'),
                transfer_emp_name: transEmp ? (transEmp.employee_fullname || transEmp.employee_name || transEmp.first_name) : (item.transfer_emp_name || (saveEmp ? (saveEmp.employee_fullname || saveEmp.employee_name || saveEmp.first_name) : '-')),
            };
        });
    }, [pendingItems, branches, employees]);

    // Filter pending items locally based on filter fields
    const filteredPendingItems = useMemo(() => {
        return mappedPendingItems.filter(item => {
            if (filters.search && !item.transfer__req_no?.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }
            if (filters.date_start && item.docu_date < filters.date_start) {
                return false;
            }
            if (filters.date_end && item.docu_date > filters.date_end) {
                return false;
            }
            return true;
        });
    }, [mappedPendingItems, filters.search, filters.date_start, filters.date_end]);

    // ── Handlers ────────────────────────────────────────────────────────────────────
    const handleView = useCallback((id: string, readOnly: boolean) => {
        setSelectedId(id);
        setSelectedRequisitionId(null);
        setIsReadOnly(readOnly);
        setIsFormOpen(true);
    }, []);

    const handleCreateApproval = (reqId: string) => {
        setSelectedId(null);
        setSelectedRequisitionId(reqId);
        setIsReadOnly(false);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedId(null);
        setSelectedRequisitionId(null);
        setIsReadOnly(false);
    };

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['transfer-pending-approvals'] });
        queryClient.invalidateQueries({ queryKey: ['transfer-requisition-approvals'] });
    };

    // ── Columns ──────────────────────────────────────────────────────────────────────
    const pendingColumns = useMemo(() => [
        pendingColHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center w-full">ลำดับ</div>,
            cell: info => (
                <div className="flex justify-center items-center w-full">
                    {info.row.index + 1}
                </div>
            ),
            size: 60,
        }),
        pendingColHelper.accessor('transfer__req_no', {
            header: 'เลขที่เอกสารใบขอโอนย้าย',
            cell: info => (
                <span className="font-semibold text-gray-900 dark:text-white">
                    {(info.getValue() as string) || '-'}
                </span>
            ),
            size: 200,
        }),
        pendingColHelper.accessor('docu_date', {
            header: 'วันที่เอกสาร',
            cell: info => {
                const val = info.getValue() as string;
                if (!val) return '-';
                const d = new Date(val);
                return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-GB');
            },
            size: 130,
        }),
        pendingColHelper.accessor('branch_name', {
            header: 'สาขา',
            cell: info => <span className="text-sm text-gray-700 dark:text-gray-300">{(info.getValue() as string) || '-'}</span>,
            size: 160,
        }),
        pendingColHelper.accessor('transfer_emp_name', {
            header: 'ผู้ขอโอน',
            cell: info => <span className="text-sm text-gray-700 dark:text-gray-300">{(info.getValue() as string) || '-'}</span>,
            size: 160,
        }),
        pendingColHelper.display({
            id: 'actions',
            header: () => <div className="flex justify-center items-center w-full">จัดการ</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-1.5 w-full">
                    <button
                        onClick={() => handleCreateApproval(row.original.transfer__req_id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1 active:scale-95"
                    >
                        <ShieldCheck size={14} />
                        พิจารณาอนุมัติ
                    </button>
                </div>
            ),
            size: 130,
        }),
    ], []);

    const historyColumns = useMemo(() => [
        colHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center w-full">ลำดับ</div>,
            cell: info => (
                <div className="flex justify-center items-center w-full">
                    {(filters.page - 1) * filters.limit + info.row.index + 1}
                </div>
            ),
            size: 60,
        }),
        colHelper.accessor('appv_transfer_no', {
            header: 'เลขที่เอกสารอนุมัติ',
            cell: info => (
                <span
                    className="font-semibold text-blue-600 hover:underline cursor-pointer transition-all"
                    onClick={() => handleView(info.row.original.appv_transfer_id, true)}
                >
                    {info.getValue()}
                </span>
            ),
            size: 180,
        }),
        colHelper.accessor('transfer_emp_name', {
            header: 'ผู้ขอโอน',
            cell: info => <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{(info.getValue() as string) || '-'}</span>,
            size: 180,
        }),
        colHelper.accessor('appv_transfer_date', {
            header: 'วันที่อนุมัติ',
            cell: info => {
                const val = info.getValue() || info.row.original.appv_date;
                if (!val) return '-';
                const d = new Date(val);
                return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-GB');
            },
            size: 130,
        }),
        colHelper.accessor('appv_emp_name', {
            header: 'ผู้อนุมัติ',
            cell: info => <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{info.getValue() || '-'}</span>,
            size: 150,
        }),
        colHelper.accessor('status', {
            header: () => <div className="flex justify-center items-center w-full">สถานะ</div>,
            cell: info => (
                <div className="flex justify-center items-center w-full">
                    <StatusBadge status={info.getValue() || info.row.original.appv_flag} />
                </div>
            ),
            size: 120,
        }),
        colHelper.display({
            id: 'actions',
            header: () => <div className="flex justify-center items-center w-full">การจัดการ</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-1.5 w-full">
                    <button
                        onClick={() => handleView(row.original.appv_transfer_id, true)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="ดูรายละเอียด"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => {
                            const item = row.original as unknown as Record<string, unknown>;
                            setSelectedHistoryId((item.transfer_req_id as string) || (item.transfer__req_id as string));
                            setIsHistoryOpen(true);
                        }}
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/30 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                        title="ดูประวัติการอนุมัติ"
                    >
                        <Clock size={16} />
                    </button>
                </div>
            ),
            size: 80,
        }),
    ], [filters.page, filters.limit, handleView]);

    return (
        <PageListLayout
            title="อนุมัติใบขอโอนย้ายสินค้า - Transfer Requisition Approval"
            subtitle="พิจารณาอนุมัติการโอนย้ายและตรวจสอบประวัติการขอโอนย้ายสินค้าภายในองค์กร"
            icon={ShieldCheck}
            accentColor="emerald"
            totalCount={activeTab === 'pending' ? filteredPendingItems.length : (historyData?.total ?? 0)}
            searchForm={
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <FilterField
                        label={activeTab === 'pending' ? 'เลขที่ใบขอโอนย้าย' : 'เลขที่เอกสารอนุมัติ'}
                        value={localFilters.search}
                        onChange={(v) => handleFilterChange('search', v)}
                        placeholder={activeTab === 'pending' ? 'เลขที่ใบขอโอนย้าย' : 'เลขที่เอกสารอนุมัติ'}
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
                    {activeTab === 'history' && (
                        <FilterField
                            label="ผลอนุมัติ"
                            type="select"
                            value={localFilters.status}
                            onChange={(v) => handleFilterChange('status', v)}
                            options={STATUS_OPTIONS}
                            accentColor="emerald"
                        />
                    )}

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
                                รอพิจารณาอนุมัติ
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
                                ประวัติการอนุมัติ
                            </button>
                        </div>

                        {/* Action Buttons - Aligned right */}
                        <div className="flex gap-2 self-end w-full md:w-auto md:justify-end">
                            <button
                                onClick={resetFilters}
                                className="h-10 bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-lg font-medium transition-all flex items-center justify-center px-4 gap-2 w-1/2 md:w-auto"
                            >
                                ล้างค่า
                            </button>
                            <button
                                onClick={handleApplyFilters}
                                className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center px-6 gap-2 w-1/2 md:w-auto"
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
                                ดึงใบขอโอนย้ายมาอนุมัติ
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {activeTab === 'pending' && (
                    <SmartTable
                        data={filteredPendingItems}
                        columns={pendingColumns}
                        isLoading={isLoading}
                        pagination={{
                            pageIndex: filters.page,
                            pageSize: filters.limit,
                            totalCount: filteredPendingItems.length,
                            onPageChange: handlePageChange,
                            onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 }),
                        }}
                        rowIdField="transfer__req_id"
                    />
                )}
                {activeTab === 'history' && (
                    <SmartTable
                        data={mappedHistoryItems}
                        columns={historyColumns}
                        isLoading={isLoading}
                        pagination={{
                            pageIndex: filters.page,
                            pageSize: filters.limit,
                            totalCount: historyData?.total ?? 0,
                            onPageChange: handlePageChange,
                            onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 }),
                        }}
                        rowIdField="appv_transfer_id"
                    />
                )}
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <TransferApproveFormModal
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    editId={selectedId}
                    requisitionId={selectedRequisitionId}
                    readOnly={isReadOnly}
                    onSuccess={handleSuccess}
                />
            )}

            {/* Requisition Lookup Search Modal */}
            {isSearchModalOpen && (
                <TransferSearchModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                    onSelect={(id) => {
                        handleCreateApproval(id);
                    }}
                />
            )}

            {isHistoryOpen && selectedHistoryId && (
                <TransferApprovalHistoryModal
                    isOpen={isHistoryOpen}
                    onClose={() => {
                        setIsHistoryOpen(false);
                        setSelectedHistoryId(null);
                    }}
                    requisitionId={selectedHistoryId}
                    requisitionNo={mappedHistoryItems.find(x => String(x.transfer_req_id) === String(selectedHistoryId) || String((x as unknown as Record<string, unknown>).transfer__req_id) === String(selectedHistoryId))?.transfer_req_no}
                />
            )}
        </PageListLayout>
    );
}
