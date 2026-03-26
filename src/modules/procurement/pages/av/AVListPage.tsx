import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ShieldCheck, Search, Eye } from 'lucide-react';
import { PageListLayout, SmartTable, PRStatusBadge, FilterField, MobileListCard, MobileListContainer } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import { AVFormModal } from './components/AVFormModal';
import { ApprovalHistoryModal } from '@/modules/procurement/shared/components/ApprovalHistoryModal';
import { ErrorBoundary } from '@/shared/components/system/ErrorBoundary';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { createColumnHelper } from '@tanstack/react-table';

import { AVService } from '../../services/av.service';
import type { PRListParams } from '@/modules/procurement/services/pr.service';

const AV_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'PENDING', label: 'รออนุมัติ' },
    { value: 'PARTIAL', label: 'อนุมัติบางส่วน' },
    { value: 'APPROVED', label: 'อนุมัติแล้ว' },
    { value: 'REJECTED', label: 'ไม่อนุมัติ' },
];

export default function AVListPage() {
    // Force default status to PENDING for approvals
    const { filters, localFilters, handleFilterChange, handleApplyFilters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<string>({
        defaultStatus: 'PENDING',
        customParamKeys: {
            search: 'pr_no',
            search2: 'approval_no'
        }
    });

    const apiFilters: PRListParams & { approval_no?: string } = {
        pr_no: filters.search || undefined,
        approval_no: filters.search2 || undefined,
        status: ((filters.status as string) === 'ALL' ? undefined : filters.status) as PRListParams['status'],
        date_start: filters.date_start || undefined,
        date_end: filters.date_end || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined
    };

        const { data, isLoading, refetch } = useQuery({
        queryKey: ['prs', apiFilters],
        queryFn: async () => {

            // ====================================================
            // 🎯 ALWAYS fetch both sources in parallel for dedup
            // ====================================================
            // ====================================================
            // 🎯 TRIPLE-SOURCE FETCH: 
            // 1. Actionable PRs (Pending for current user)
            // 2. Approval History (Already processed)
            // 3. All Pending PRs (Source of truth for resubmissions)
            // ====================================================
            const [pendingRes, approvalRes, allPendingPRsRes] = await Promise.all([
                AVService.getPendingApprovalPRs(),
                AVService.getApprovalList({ limit: 1000, page: 1, status: undefined }),
                AVService.getPendingPRs({ limit: 1000, page: 1 })
            ]);

            const pendingPRs: any[] = pendingRes || [];
            const approvalRecords: any[] = approvalRes?.data || [];
            const allPendingPRs: any[] = allPendingPRsRes?.data || allPendingPRsRes || [];

            // 🎯 NEW: Merged Set of IDs that are "Pending" in the main PR table
            const pendingPRIdSet = new Set<number>([
                ...pendingPRs.map((p: any) => Number(p.pr_id)),
                ...allPendingPRs.map((p: any) => Number(p.pr_id))
            ]);

            console.log('🔍 [AVListPage] Triple-Source Data:', {
                actionableCount: pendingPRs.length,
                approvalHistoryCount: approvalRecords.length,
                mainPendingCount: allPendingPRs.length,
                pendingPRIdSetSize: pendingPRIdSet.size
            });


            // Build a map of pr_id -> approval record for fast lookup
            // This is the GROUND TRUTH of what has been processed
            const approvalByPRId = new Map<number, any>();
            for (const rec of approvalRecords) {
                const prId = Number(rec.pr_id);
                if (!isNaN(prId)) {
                    // Keep the LATEST record if multiple exist for same PR
                    const existing = approvalByPRId.get(prId);
                    if (!existing || rec.approval_id > existing.approval_id) {
                        approvalByPRId.set(prId, rec);
                    }
                }
            }

            // PRs that have been FULLY processed (approved/rejected — no more pending items)
            // 🎯 FIX: A PR is only "fully handled" if it's NOT in the pendingPRs list.
            // If it's in the pending list (Source 1), it's NOT fully handled anymore.
            const fullyHandledPRIds = new Set<number>(
                [...approvalByPRId.entries()]
                    .filter(([prId, rec]) => {
                        const s = (rec.status || '').toUpperCase();
                        const isHandledStatus = s === 'APPROVED' || s === 'REJECTED';
                        return isHandledStatus && !pendingPRIdSet.has(prId);
                    })
                    .map(([prId]) => prId)
            );

            // PRs that are partially approved (still have pending items)
            const partialPRIds = new Set<number>(
                [...approvalByPRId.entries()]
                    .filter(([, rec]) => rec.status?.toUpperCase() === 'PARTIAL')
                    .map(([prId]) => prId)
            );

            // Pending items: all PRs currently awaiting action
            // Exclude truly handled ones (rejected or fully approved AFTER checking pending list)
            const trulyPendingPRs = pendingPRs
                .filter((p: any) => {
                    const prId = Number(p.pr_id);
                    return !fullyHandledPRIds.has(prId); // Still pending or partial
                })
                .map((p: any) => ({
                    ...p,
                    status: partialPRIds.has(Number(p.pr_id)) ? 'PARTIAL' : 'PENDING',
                    row_key: `pending-${p.pr_id}`,
                    pr_no: p.pr_no,
                }));

            // Approval records: all completed/partial approval entries
            // 🎯 FIX: Filter out stale REJECTED/APPROVED records if the PR is now PENDING again
            const approvalItems = approvalRecords
                .filter((a: any) => {
                    const prId = Number(a.pr_id);
                    const s = (a.status || '').toUpperCase();
                    // If PR is pending, don't show the old REJECTED/APPROVED row in the main list
                    if (pendingPRIdSet.has(prId) && (s === 'REJECTED' || s === 'APPROVED')) return false;
                    return true;
                })
                .map((a: any) => ({
                    ...a,
                    pr_no: a.pr?.pr_no || a.pr_no || '',
                    row_key: `approved-${a.approval_id || a.pr_id}`,
                }));

            // ====================================================
            // 🎯 CLIENT-SIDE FILTER: Search & Status filter
            // ====================================================
            const filterItem = (item: any): boolean => {
                // PR No search
                const prNo = (item.pr_no || '').toLowerCase();
                const filterPrNo = (apiFilters.pr_no || '').toLowerCase();
                if (filterPrNo && !prNo.includes(filterPrNo)) return false;

                // Approval No search
                const appNo = (item.approval_no || item.av_no || '').toLowerCase();
                const filterAppNo = (apiFilters.approval_no || '').toLowerCase();
                if (filterAppNo && !appNo.includes(filterAppNo)) return false;

                // Date range filter
                const itemDate = (item.pr_date || item.approval_date || '').split('T')[0];
                if (apiFilters.date_start && itemDate && itemDate < apiFilters.date_start) return false;
                if (apiFilters.date_end && itemDate && itemDate > apiFilters.date_end) return false;

                return true;
            };

            let combined: any[];

            const selectedStatus = filters.status;

            if (selectedStatus === 'PENDING') {
                // Show only truly pending PRs (no approval record at all, or still waiting)
                combined = trulyPendingPRs.filter((p: any) => p.status === 'PENDING');
            } else if (selectedStatus === 'PARTIAL') {
                // Show partially approved items: from both pending list (with PARTIAL status) and approval records
                const partialFromPending = trulyPendingPRs.filter((p: any) => p.status === 'PARTIAL');
                const partialFromApproval = approvalItems.filter((a: any) => a.status?.toUpperCase() === 'PARTIAL');
                combined = [...partialFromPending, ...partialFromApproval];
            } else if (selectedStatus === 'APPROVED') {
                combined = approvalItems.filter((a: any) => a.status?.toUpperCase() === 'APPROVED');
            } else if (selectedStatus === 'REJECTED') {
                combined = approvalItems.filter((a: any) => a.status?.toUpperCase() === 'REJECTED');
            } else {
                // ALL: merge — pending (not handled) + all approval records
                combined = [...trulyPendingPRs, ...approvalItems];
            }

            // Apply text/date search filter
            const filtered = combined.filter(filterItem);

            // Paginate client-side
            const startIndex = (filters.page - 1) * filters.limit;
            const paginatedData = filtered.slice(startIndex, startIndex + filters.limit);

            return {
                data: paginatedData,
                total: filtered.length,
                page: filters.page,
                limit: filters.limit,
                totalPages: Math.ceil(filtered.length / filters.limit),
            };
        },
        placeholderData: keepPreviousData,
        staleTime: 0,
        refetchOnWindowFocus: true,
    });

    const [isAVModalOpen, setIsAVModalOpen] = useState(false);
    const [selectedPRId, setSelectedPRId] = useState<number | undefined>(undefined);
    const [selectedApproval, setSelectedApproval] = useState<any | undefined>(undefined);

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyPrId, setHistoryPrId] = useState<number | undefined>(undefined);
    const [historyPrNo, setHistoryPrNo] = useState<string | undefined>(undefined);

    const handleApprove = useCallback((id: number, approvalItem?: any) => {
        setSelectedPRId(id);
        setSelectedApproval(approvalItem);
        setIsAVModalOpen(true);
    }, []);

    const handleViewHistory = useCallback((id: number, prNo?: string) => {
        setHistoryPrId(id);
        setHistoryPrNo(prNo);
        setIsHistoryModalOpen(true);
    }, []);

    const handleCloseAVModal = () => {
        setIsAVModalOpen(false);
        setSelectedPRId(undefined);
        setSelectedApproval(undefined);
    };

    const handleAVSuccess = () => {
        refetch();
    };

    const columnHelper = createColumnHelper<any>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center h-full w-full">ลำดับ</div>,
            cell: (info) => <div className="flex justify-center items-center h-full w-full">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            size: 50,
            enableSorting: false,
        }),
        columnHelper.accessor(row => (row as any).approval_no || '-', {
            id: 'av_no',
            header: 'เลขที่อนุมัติ AV',
            cell: (info) => {
                const val = info.getValue();
                if (!val || val === '-') {
                    return <div className="py-2 text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">-</div>;
                }
                return (
                    <div className="py-2 text-sm text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                        {val}
                    </div>
                );
            },
            size: 140,
            enableSorting: false,
        }),
        columnHelper.accessor(row => (row as any).approval_date || '-', {
            id: 'pr_date_no',
            header: 'เอกสาร / วันที่',
            cell: (info) => {
                const row = info.row.original;
                const prNo = (row as any).pr?.pr_no || (row as any).pr_no || '-';
                return (
                    <div className="flex flex-col py-2">
                        <span className="font-bold whitespace-nowrap text-base leading-tight text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => handleViewHistory(row.pr_id, prNo)}>
                            {prNo}
                        </span>
                        <div className="flex flex-col mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatThaiDate((row as any).approval_date || (row as any).pr_date)}
                            </span>
                        </div>
                    </div>
                );
            },
            size: 160,
            enableSorting: false,
        }),
        columnHelper.accessor(row => (row as any).remarks || row.purpose || row.remark || '', {
            id: 'purpose',
            header: 'รายละเอียด',
            cell: (info) => (
                <div className="max-w-[300px] truncate py-2 text-sm text-gray-600 dark:text-gray-400" title={info.getValue() || '-'}>
                    {info.getValue() || '-'}
                </div>
            ),
            size: 220,
            enableSorting: false,
        }),
        columnHelper.accessor(row => (row as any).approval_emp_name || row.requester_name || '', {
            header: 'ผู้จัดทำ',
            cell: (info) => {
                const row = info.row.original;
                const reqName = (row as any).approval_emp_name || (row as any).requester_name || (row as any).created_by_name || (row as any).employee_name;
                const displayReq = reqName ? String(reqName) : 'ไม่ระบุผู้ขอ';
                return (
                    <div className="flex flex-col py-2 gap-0.5">
                        <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[140px]" title={displayReq}>
                            {displayReq}
                        </span>
                    </div>
                );
            },
            size: 140,
            enableSorting: false,
        }),
        columnHelper.accessor(row => Number((row as any).base_total_amount ?? (row as any).pr_base_total_amount ?? (row as any).total_amount ?? (row as any).quote_total_amount ?? 0), {
            id: 'total_amount',
            header: () => <span className="whitespace-nowrap">ยอดรวม (บาท)</span>,
            meta: { align: 'right' },
            cell: (info) => (
                <div className="text-right pr-10 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                     {new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(info.getValue() || 0))}
                </div>
            ),
            size: 180,
            enableSorting: false,
        }),
        columnHelper.accessor('status', {
            id: 'status',
            header: () => <div className="flex justify-center items-center w-full h-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center items-center w-full h-full py-2">
                    <PRStatusBadge status={info.getValue()} />
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="flex justify-center items-center w-full h-full">จัดการ</div>,
            cell: ({ row }) => (
                <div className="flex justify-center items-center gap-2 w-full h-full py-2 min-w-[100px]">
                    <button
                        onClick={() => handleApprove(row.original.pr_id, row.original)}
                        className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                            row.original.status === 'PENDING'
                            ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
                            : "text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                        }`}
                        title={row.original.status === 'PENDING' ? "พิจารณาอนุมัติ" : "ดูรายละเอียด"}
                    >
                        {row.original.status === 'PENDING' ? <ShieldCheck size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            ),
            size: 180, 
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, handleApprove, handleViewHistory]);

    return (
        <>
            <PageListLayout
                title="รายการอนุมัติใบขอซื้อ"
                subtitle="Approval (AV) for PR"
                icon={ShieldCheck}
                accentColor="emerald"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                searchForm={
                    <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <FilterField
                            label="เลขที่ PR"
                            value={localFilters.search}
                            onChange={(val: string) => handleFilterChange('search', val)}
                            placeholder="PR-xxx"
                            accentColor="emerald"
                        />
                        <FilterField
                            label="เลขที่อนุมัติ AV"
                            value={localFilters.search2 || ''}
                            onChange={(val: string) => handleFilterChange('search2', val)}
                            placeholder="AV-xxx"
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
                            value={localFilters.status}
                            onChange={(val: string) => handleFilterChange('status', val)}
                            options={AV_STATUS_OPTIONS}
                            accentColor="emerald"
                        />
                        
                        <div className="md:col-span-1 lg:col-span-3 flex justify-end gap-2 items-center">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300 shadow-sm whitespace-nowrap"
                            >
                                ล้างค่า
                            </button>
                            <button
                                type="submit"
                                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap mr-2"
                            >
                                <Search size={18} />
                                ค้นหา
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSelectedPRId(undefined); setIsAVModalOpen(true); }}
                                className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <ShieldCheck size={18} />
                                รายการอนุมัติใบขอซื้อ
                            </button>
                        </div>
                        </div>
                    </form>
                }
            >
                <div className="h-full flex flex-col">
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
                            rowIdField="row_key"
                            className="flex-1"
                            showFooter={false}
                        />
                    </div>

                    <MobileListContainer
                        isLoading={isLoading}
                        isEmpty={!data?.data.length}
                        pagination={data?.total ? { page: filters.page, total: data.total, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                    >
                        {data?.data.map((item) => (
                            <MobileListCard
                                key={(item as any).approval_id || (item as any).pr_id}
                                title={(item as any).pr?.pr_no || (item as any).pr_no || '-'}
                                subtitle={formatThaiDate((item as any).approval_date || (item as any).pr_date)}
                                statusBadge={<PRStatusBadge status={item.status} />}
                                details={[
                                    {
                                        label: 'เลขที่อนุมัติ AV:',
                                        value: (item as any).approval_no || (item as any).av_no ? (
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                {(item as any).approval_no || (item as any).av_no}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500">-</span>
                                        ),
                                    },
                                    {
                                        label: 'ผู้ขอ:',
                                        value: (item as any).approval_emp_name || (item as any).requester_name || 'ไม่ระบุผู้ขอ',
                                    }
                                ]}
                                amountLabel="ยอดรวม"
                                amountValue={
                                    <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                        {Number((item as any).quote_total_amount ?? (item as any).base_total_amount ?? (item as any).total_amount ?? (item as any).pr_base_total_amount ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    </span>
                                }
                                actions={
                                    <button
                                        onClick={() => handleApprove(item.pr_id, item)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                    >
                                        {item.status === 'PENDING' ? (
                                            <><ShieldCheck size={14} /> พิจารณาอนุมัติ</>
                                        ) : (
                                            <><Eye size={14} /> ดูรายละเอียด</>
                                        )}
                                    </button>
                                }
                            />
                        ))}
                    </MobileListContainer>
                </div>
            </PageListLayout>

            {isAVModalOpen && (
                <ErrorBoundary>
                    <AVFormModal
                        isOpen={isAVModalOpen}
                        onClose={handleCloseAVModal}
                        id={selectedPRId}
                        approvalItem={{
                            ...(selectedApproval || {}),
                            hasOtherAVs: (data?.data || []).some((item: any) => 
                                item.pr_id === selectedPRId && 
                                !!(item.approval_no || item.av_no)
                            )
                        }}
                        onSuccess={handleAVSuccess}
                    />
                </ErrorBoundary>
            )}

            {isHistoryModalOpen && historyPrId && (
                <ApprovalHistoryModal 
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    prId={historyPrId}
                    prNo={historyPrNo}
                />
            )}
        </>
    );
}
