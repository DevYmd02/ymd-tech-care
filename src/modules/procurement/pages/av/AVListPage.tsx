import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ShieldCheck, Search, Eye, Printer } from 'lucide-react';
import { PageListLayout, SmartTable, PRStatusBadge, FilterField, MobileListCard, MobileListContainer } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import { AVFormModal } from './components/AVFormModal';
import { ApprovalHistoryModal } from '@/modules/procurement/shared/components/ApprovalHistoryModal';
import { ErrorBoundary } from '@/shared/components/system/ErrorBoundary';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { createColumnHelper } from '@tanstack/react-table';

import { AVService } from '@procurement/services/av.service';
import type { PRListParams } from '@/modules/procurement/services/pr.service';
import type { ApprovalHeader } from '@/modules/procurement/types/av-types';

const AV_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'PENDING', label: 'รออนุมัติ' },
    { value: 'PARTIAL', label: 'อนุมัติบางส่วน' },
    { value: 'APPROVED', label: 'อนุมัติแล้ว' },
    { value: 'REJECTED', label: 'ไม่อนุมัติ' },
];

/**
 * Merged Record Type for the AV List Table.
 * Combines fields from both PRHeader (Pending PRs) and ApprovalHeader (History).
 */
export interface AVCombinedRecord {
    row_key: string;
    pr_id: number;
    pr_no: string;
    status: string;
    
    // PR Header Fields
    pr_date?: string;
    requester_name?: string;
    employee_name?: string;
    created_by_name?: string;
    purpose?: string;
    remark?: string;
    pr_base_total_amount?: string | number;
    total_amount?: number;

    // Approval Header Fields
    approval_id?: number;
    approval_no?: string;
    av_no?: string;
    approval_date?: string;
    approval_emp_id?: number;
    approval_emp_name?: string;
    remarks?: string;
    base_total_amount?: string | number;
    quote_total_amount?: string | number;
    reject_reason?: string;
    created_at?: string;
    updated_at?: string;
    
    // Custom UI fields
    hasOtherAVs?: boolean;

    // Nested relations
    pr?: {
        pr_no: string;
        purpose?: string;
        remark?: string;
    };
}

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
        queryKey: ['av-list', apiFilters],
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
                AVService.getApprovalList({ 
                    ...apiFilters,
                    limit: 1000, 
                    page: 1, 
                    status: undefined // We want all statuses to handle the merging logic
                }),
                AVService.getPendingPRs({ limit: 1000, page: 1 })
            ]);

            const pendingPRs = pendingRes || [];
            // 🎯 FIXED: Support both { data: [] } and direct array responses from AVService
            const approvalRecords = (Array.isArray(approvalRes) ? approvalRes : approvalRes?.data) || [];
            const allPendingPRs = (Array.isArray(allPendingPRsRes) ? allPendingPRsRes : allPendingPRsRes?.data) || [];


            // 🎯 NEW: Merged Set of IDs that are "Pending" in the main PR table
            const pendingPRIdSet = new Set<number>([
                ...pendingPRs.map((p) => Number(p.pr_id)),
                ...allPendingPRs.map((p) => Number(p.pr_id))
            ]);




            // 🎯 FIXED: DO NOT collapse records by pr_id. The user wants to see EVERY AV record separately.
            const approvalByPRId = new Map<number, ApprovalHeader>();
            // (Keep this map only for the 'fullyHandled' check below to identify if ANY approval exists)
            for (const rec of approvalRecords) {
                const prId = Number(rec.pr_id);
                if (!isNaN(prId)) {
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

            // Pending items: all PRs currently awaiting action
            // Exclude truly handled ones (rejected or fully approved AFTER checking pending list)
            const trulyPendingPRs: AVCombinedRecord[] = pendingPRs
                .filter((p) => {
                    const prId = Number(p.pr_id);
                    return !fullyHandledPRIds.has(prId); // Still pending or partial
                })
                .map((p) => ({
                    ...p,
                    status: (p.av_no || (p as unknown as Record<string, unknown>).approval_no) ? 'PARTIAL' : 'PENDING',
                    row_key: `pending-${p.pr_id}`,
                    pr_no: p.pr_no || '',
                }));

            // Approval records: all completed/partial approval entries
            // 🎯 FIX: Filter out stale REJECTED/APPROVED records if the PR is now PENDING again
            const approvalItems: AVCombinedRecord[] = approvalRecords
                .filter((a) => {
                    const prId = Number(a.pr_id);
                    const s = (a.status || '').toUpperCase();
                    
                    // 🎯 FIX: Don't filter out records if searching specifically or viewing 'ALL' / status-specific lists
                    if (apiFilters.approval_no || apiFilters.pr_no) return true;
                    if (filters.status === 'ALL') return true;
                    if (filters.status === s) return true;

                    // If PR is pending, don't show the old REJECTED/APPROVED row in the main "General" list
                    // (prevents clutter when a PR has been fixed and resubmitted)
                    if (pendingPRIdSet.has(prId) && (s === 'REJECTED' || s === 'APPROVED')) return false;
                    return true;
                })
                .map((a) => {
                    const id = a.approval_id || (a as unknown as Record<string, unknown>).id as number;
                    return {
                        ...a,
                        pr_no: a.pr?.pr_no || (a as unknown as Record<string, unknown>).pr_no as string || '',
                        row_key: `approved-${id || a.pr_id || Math.random()}`,
                    } as AVCombinedRecord;
                });

            // ====================================================
            // 🎯 CLIENT-SIDE FILTER: Search & Status filter
            // ====================================================
            const filterItem = (item: AVCombinedRecord): boolean => {
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

            let combined: AVCombinedRecord[];

            const selectedStatus = filters.status;
            const hasAvSearch = !!apiFilters.approval_no;

            if (selectedStatus === 'PENDING' && !hasAvSearch) {
                // Show all pending PRs waiting for action (both PENDING and PARTIAL)
                combined = trulyPendingPRs;
            } else if (selectedStatus === 'PARTIAL' && !hasAvSearch) {
                // Show partially approved items: from both pending list (with PARTIAL status) and approval records
                const partialFromPending = trulyPendingPRs.filter((p: AVCombinedRecord) => p.status === 'PARTIAL');
                const partialFromApproval = approvalItems.filter((a: AVCombinedRecord) => a.status?.toUpperCase() === 'PARTIAL');
                combined = [...partialFromPending, ...partialFromApproval];
            } else if (selectedStatus === 'APPROVED' && !hasAvSearch) {
                combined = approvalItems.filter((a: AVCombinedRecord) => a.status?.toUpperCase() === 'APPROVED');
            } else if (selectedStatus === 'REJECTED' && !hasAvSearch) {
                combined = approvalItems.filter((a: AVCombinedRecord) => a.status?.toUpperCase() === 'REJECTED');
            } else {
                // ALL or searching specifically: merge — pending (not handled) + all approval records
                combined = [...trulyPendingPRs, ...approvalItems];
            }

            // Apply text/date search filter
            const filtered = combined.filter(filterItem);

            // 🎯 FINAL DEDUPLICATION: Ensure no duplicate row_keys enter the table
            const finalDeduplicated: AVCombinedRecord[] = [];
            const seenKeys = new Set<string>();
            filtered.forEach(item => {
                if (!seenKeys.has(item.row_key)) {
                    seenKeys.add(item.row_key);
                    finalDeduplicated.push(item);
                }
            });

            // Paginate client-side
            const startIndex = (filters.page - 1) * filters.limit;
            const paginatedData = finalDeduplicated.slice(startIndex, startIndex + filters.limit);

            return {
                data: paginatedData,
                total: finalDeduplicated.length,
                page: filters.page,
                limit: filters.limit,
                totalPages: Math.ceil(finalDeduplicated.length / filters.limit),
            };
        },
        placeholderData: keepPreviousData,
        staleTime: 0,
        refetchOnWindowFocus: true,
    });

    const [isAVModalOpen, setIsAVModalOpen] = useState(false);
    const [selectedPRId, setSelectedPRId] = useState<number | undefined>(undefined);
    const [selectedApproval, setSelectedApproval] = useState<AVCombinedRecord | undefined>(undefined);
    const [isReadOnly, setIsReadOnly] = useState(false);

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyPrId, setHistoryPrId] = useState<number | undefined>(undefined);
    const [historyPrNo, setHistoryPrNo] = useState<string | undefined>(undefined);

    const handleApprove = useCallback((id: number, approvalItem?: AVCombinedRecord, readOnly = false) => {
        setSelectedPRId(id);
        setSelectedApproval(approvalItem);
        setIsReadOnly(readOnly);
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
        setIsReadOnly(false);
    };

    const handleAVSuccess = () => {
        refetch();
    };

    const columnHelper = createColumnHelper<AVCombinedRecord>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center h-full w-full">ลำดับ</div>,
            cell: (info) => <div className="flex justify-center items-center h-full w-full">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            size: 50,
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.approval_no || '-', {
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
        columnHelper.accessor(row => row.approval_date || '-', {
            id: 'pr_date_no',
            header: 'เอกสาร / วันที่',
            cell: (info) => {
                const row = info.row.original;
                const prNo = row.pr?.pr_no || row.pr_no || '-';
                return (
                    <div className="flex flex-col py-2">
                        <span className="font-bold whitespace-nowrap text-base leading-tight text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => handleViewHistory(row.pr_id, prNo)}>
                            {prNo}
                        </span>
                        <div className="flex flex-col mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatThaiDate(row.approval_date || row.pr_date)}
                            </span>
                        </div>
                    </div>
                );
            },
            size: 160,
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.remarks || row.purpose || row.remark || row.pr?.purpose || row.pr?.remark || '', {
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
        columnHelper.accessor(row => row.approval_emp_name || row.requester_name || '', {
            header: 'ผู้จัดทำ',
            cell: (info) => {
                const row = info.row.original;
                const reqName = row.approval_emp_name || row.requester_name || row.created_by_name || row.employee_name;
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
        columnHelper.accessor(row => Number(row.base_total_amount ?? row.pr_base_total_amount ?? row.total_amount ?? row.quote_total_amount ?? 0), {
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
                        onClick={() => {
                            const isPending = row.original.row_key?.startsWith('pending-');
                            handleApprove(row.original.pr_id, row.original, !isPending);
                        }}
                        className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                            row.original.row_key?.startsWith('pending-')
                            ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
                            : "text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                        }`}
                        title={row.original.row_key?.startsWith('pending-') ? "พิจารณาอนุมัติ" : "ดูรายละเอียด"}
                    >
                        {row.original.row_key?.startsWith('pending-') ? <ShieldCheck size={18} /> : <Eye size={18} />}
                    </button>
                    {['APPROVED', 'PARTIAL'].includes(row.original.status?.toUpperCase()) && (
                        <button 
                            onClick={() => {
                                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                                const approvalId = row.original.approval_id;
                                if (approvalId) {
                                    window.open(`${apiUrl}/pr-approval/${approvalId}/pdf`, '_blank');
                                }
                            }}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all" 
                            title="พิมพ์ใบอนุมัติ"
                        >
                            <Printer size={18} />
                        </button>
                    )}
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
                                    <Search size={18} />
                                    ค้นหา
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setSelectedPRId(undefined); setIsAVModalOpen(true); }}
                                className="w-full sm:w-auto h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
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
                                key={item.row_key}
                                title={item.pr?.pr_no || item.pr_no || '-'}
                                subtitle={formatThaiDate(item.approval_date || item.pr_date)}
                                statusBadge={<PRStatusBadge status={item.status} />}
                                details={[
                                    {
                                        label: 'เลขที่อนุมัติ AV:',
                                        value: item.approval_no || item.av_no ? (
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                {item.approval_no || item.av_no}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500">-</span>
                                        ),
                                    },
                                    {
                                        label: 'ผู้ขอ:',
                                        value: item.approval_emp_name || item.requester_name || 'ไม่ระบุผู้ขอ',
                                    }
                                ]}
                                amountLabel="ยอดรวม"
                                amountValue={
                                    <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                        {Number(item.quote_total_amount ?? item.base_total_amount ?? item.total_amount ?? item.pr_base_total_amount ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    </span>
                                }
                                actions={
                                    <div className="flex gap-2 w-full">
                                        <button
                                            onClick={() => handleApprove(item.pr_id, item, item.status !== 'PENDING' && item.status !== 'PARTIAL')}
                                            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm ${
                                                item.status === 'PENDING'
                                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-medium"
                                            }`}
                                        >
                                            {item.status === 'PENDING' ? (
                                                <><ShieldCheck size={14} /> พิจารณาอนุมัติ</>
                                            ) : (
                                                <><Eye size={14} /> ดูรายละเอียด</>
                                            )}
                                        </button>
                                        {['APPROVED', 'PARTIAL'].includes(item.status?.toUpperCase()) && (
                                            <button
                                                onClick={() => {
                                                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                                                    const approvalId = item.approval_id;
                                                    if (approvalId) {
                                                        window.open(`${apiUrl}/pr-approval/${approvalId}/pdf`, '_blank');
                                                    }
                                                }}
                                                className="flex-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                            >
                                                <Printer size={14} /> พิมพ์
                                            </button>
                                        )}
                                    </div>
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
                            ...selectedApproval,
                            hasOtherAVs: (data?.data || []).some((item: AVCombinedRecord) => 
                                item.pr_id === selectedPRId && 
                                !!(item.approval_no || item.av_no)
                            )
                        } as AVCombinedRecord}
                        onSuccess={handleAVSuccess}
                        readOnly={isReadOnly}
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
