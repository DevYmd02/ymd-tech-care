/**
 * @file PRListPage.tsx
 * @description หน้ารายการใบขอซื้อ (Purchase Requisition List)
 * @route /procurement/pr
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Plus, Search, Send, AlertTriangle } from 'lucide-react';
import { PageListLayout, SmartTable, PRStatusBadge, FilterField } from '@ui';
import { useTableFilters, useDebounce, type TableFilters, useConfirmation } from '@/shared/hooks';
import RFQFormModal from '@/modules/procurement/pages/rfq/components/RFQFormModal';
import { PRFormModal } from './components/PRFormModal';
import { PRActionsCell } from './components/PRActionsCell';
import { usePRActions } from '@/modules/procurement/hooks/pr';
import { RejectReasonModal } from '@/modules/procurement/shared/components/RejectReasonModal';

import { formatThaiDate } from '@/shared/utils/dateUtils';
import { createColumnHelper } from '@tanstack/react-table';

// Services & Types - Updated imports to use new module structure
import { PRService, type PRListParams } from '@/modules/procurement/services/pr.service';
import { logger } from '@/shared/utils/logger';
import type { PRHeader, PRStatus } from '@/modules/procurement/types';
import { DEPARTMENT_NAME_MAP } from '@/modules/procurement/shared/constants/procurement.constants';

// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const PR_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'PENDING', label: 'รออนุมัติ' },
    { value: 'APPROVED', label: 'อนุมัติแล้ว' },
    { value: 'REJECTED', label: 'ไม่อนุมัติ' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
    { value: 'COMPLETED', label: 'เสร็จสมบูรณ์' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================

type PRFilterKeys = Extract<keyof TableFilters<PRStatus>, string>;


// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function PRListPage() {
    // URL-based Filter State
    const { filters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<PRStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'pr_no',
            search2: 'requester_name',
            search3: 'department'
        }
    });
    const { confirm } = useConfirmation();

    // Debounce filters to prevent API flooding
    const debouncedFilters = useDebounce(filters, 500);

    // Convert to API filter format using DEBOUNCED values
    const apiFilters: PRListParams = {
        pr_no: debouncedFilters.search || undefined,
        requester_name: debouncedFilters.search2 || undefined,
        department: debouncedFilters.search3 || undefined,
        status: debouncedFilters.status === 'ALL' ? undefined : debouncedFilters.status,
        date_from: debouncedFilters.dateFrom || undefined,
        date_to: debouncedFilters.dateTo || undefined,
        page: debouncedFilters.page,
        limit: debouncedFilters.limit,
        sort: debouncedFilters.sort || undefined
    };

    // Data Fetching with React Query
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['prs', apiFilters],
        queryFn: () => PRService.getList(apiFilters),
        placeholderData: keepPreviousData,
        staleTime: 0, // Ensure data is considered stale immediately
        refetchOnWindowFocus: true, // Refetch when window gains focus
    });

    // Modal States
    const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
    const [selectedPR, setSelectedPR] = useState<PRHeader | null>(null);
    
    // PR Form Modal Local State
    const [isPRModalOpen, setIsPRModalOpen] = useState(false);
    const [selectedPRId, setSelectedPRId] = useState<string | undefined>(undefined);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Hook Actions
    const { 
        handleApprove, 
        approvingId, 
        handleReject, 
        submitReject, 
        closeRejectModal, 
        isRejectReasonOpen, 
        isRejecting 
    } = usePRActions();

    // Handlers
    const handleFilterChange = (name: PRFilterKeys, value: string) => {
        setFilters({ [name]: value });
    };

    const handleCreateRFQ = useCallback((pr: PRHeader) => {
        // V-05: Only allow RFQ creation for APPROVED PRs
        if (pr.status !== 'APPROVED') {
            logger.warn(`[PR] Cannot create RFQ: PR ${pr.pr_no} status is ${pr.status}, expected APPROVED`);
            return;
        }
        setSelectedPR(pr);
        setIsRFQModalOpen(true);
    }, []);

    const handleRFQSuccess = useCallback(async () => {
        if (!selectedPR) return;
        
        try {
            await PRService.update(selectedPR.pr_id, { status: 'COMPLETED' as PRStatus });
            logger.log(`PR ${selectedPR.pr_no} status updated to COMPLETED`);
        } catch (error) {
            logger.error('Failed to update PR status to COMPLETED', error);
        }
        refetch();
    }, [selectedPR, refetch]);

    const handleCreate = () => {
        setSelectedPRId(undefined);
        setIsReadOnly(false);
        setIsPRModalOpen(true);
    };

    const handleEdit = useCallback((id: string) => {
        setSelectedPRId(id);
        setIsReadOnly(false);
        setIsPRModalOpen(true);
    }, []);

    const handleView = useCallback((id: string) => {
        setSelectedPRId(id);
        setIsReadOnly(true);
        setIsPRModalOpen(true);
    }, []);

    const handleClosePRModal = () => {
        setIsPRModalOpen(false);
        setSelectedPRId(undefined);
        setIsReadOnly(false);
    };

    const handleSendApproval = useCallback((pr: PRHeader) => {
        confirm({
            title: 'ยืนยันการส่งอนุมัติ',
            description: `คุณต้องการส่งเอกสาร ${pr.pr_no} เพื่อขออนุมัติใช่หรือไม่?\nยอดรวม: ${pr.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`,
            confirmText: 'ส่งอนุมัติ',
            cancelText: 'ยกเลิก',
            variant: 'info',
            icon: Send,
            onConfirm: async () => {
                 const result = await PRService.submit(pr.pr_id);
                 if (!result.success) {
                     throw new Error(result.message || 'ส่งอนุมัติไม่สำเร็จ');
                 }
            }
        }).then((confirmed) => {
            if (confirmed) {
                confirm({
                    title: 'ส่งอนุมัติสำเร็จ!',
                    description: `เอกสารสถานะ: รออนุมัติ (Pending)`,
                    confirmText: 'ตกลง',
                    hideCancel: true,
                    variant: 'success'
                });
                refetch();
            }
        }).catch((error) => {
            // Error handling (Modal stays open on error, but if we throw, we might want to close and show error? 
            // Current Async Pattern: onConfirm error -> Modal Stays Open (ideally shows error).
            // But our Context catches error? 
            // Actually, looking at usePRActions, we don't catch there. 
            // If onConfirm throws, the button stops loading. 
            // We should probably show an alert if it fails?
            // Context implementation:
            // try { await onConfirm() ... close } catch { ... }
            // So if it throws, modal stays open. 
            // We can add a toast here? Or just let it be.
            logger.error('Send approval failed', error);
        });
    }, [confirm, refetch]);

    const onApproveClick = useCallback((id: string) => {
        handleApprove(id, { onSuccess: refetch });
    }, [handleApprove, refetch]);

    // Columns Definition
    const columnHelper = createColumnHelper<PRHeader>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center h-full w-full">ลำดับ</div>,
            cell: (info) => <div className="flex justify-center items-center h-full w-full">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            footer: () => <span className="whitespace-nowrap font-bold text-sm text-gray-700 dark:text-gray-200">ยอดรวมทั้งหมด :</span>,
            size: 50,
            enableSorting: false,
        }),
        columnHelper.accessor('pr_date', {
            id: 'pr_date_no', // Required for sorting on this combined column
            header: 'เอกสาร / วันที่',
            cell: (info) => {
                const row = info.row.original;
                const prNo = row.pr_no;
                const prDateStr = info.getValue() as string;
                const isTemp = prNo.startsWith('DRAFT-TEMP');
                const needByDateStr = row.need_by_date;
                
                // Urgency Logic
                let urgencyClass = 'text-gray-500';
                let showWarning = false;
                
                if (needByDateStr) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const target = new Date(needByDateStr);
                    target.setHours(0, 0, 0, 0);
                    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays < 0) {
                        urgencyClass = 'text-red-600 font-semibold';
                        showWarning = true;
                    } else if (diffDays <= 3) {
                        urgencyClass = 'text-amber-600 font-medium';
                    }
                }

                return (
                    <div className="flex flex-col py-2">
                        {/* Top Line: PR No (Enforced Visibility) */}
                        <span 
                            className={`font-bold whitespace-nowrap text-base leading-tight ${isTemp ? 'text-amber-600 dark:text-amber-400 italic' : 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'}`} 
                            title={isTemp ? 'รอรันเลขเอกสาร (Pending Generation)' : prNo}
                        >
                            {isTemp ? (
                                <span className="flex items-center gap-1">
                                    <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-[10px] rounded border border-amber-200 dark:border-amber-800">รอรันเลข</span>
                                </span>
                            ) : prNo}
                        </span>
                        
                        {/* Bottom Line: PR Date & Need By Urgency */}
                        <div className="flex flex-col mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatThaiDate(prDateStr)}
                            </span>
                            {needByDateStr && (
                                <span className={`text-[10px] flex items-center mt-1 ${urgencyClass}`}>
                                    {showWarning && <AlertTriangle className="w-3 h-3 mr-1" />}
                                    ต้องการใช้: {formatThaiDate(needByDateStr)}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
            size: 160,
            enableSorting: true,
        }),
        columnHelper.accessor(row => row.purpose || row.remark, {
            id: 'purpose',
            header: 'รายละเอียด',
            cell: (info) => {
                const val = info.getValue() || '-';
                return (
                    <div 
                        className="max-w-[200px] truncate py-2 text-sm text-gray-600 dark:text-gray-400" 
                        title={val}
                    >
                        {val}
                    </div>
                );
            },
            size: 220,
            enableSorting: false,
        }),
        columnHelper.accessor('requester_name', {
            header: 'ผู้ขอ / แผนก',
            cell: (info) => {
                const row = info.row.original;
                const requesterName = info.getValue() || '-';
                const deptId = row.cost_center_id;
                const deptName = (DEPARTMENT_NAME_MAP as Record<string | number, string>)[deptId] || (row.cost_center_id ? row.cost_center_id : 'ไม่ระบุ');
                
                return (
                    <div className="flex flex-col py-2">
                        <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[160px]" title={requesterName}>
                            {requesterName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {deptName}
                        </span>
                    </div>
                );
            },
            size: 140,
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.total_amount ?? Number(row.pr_base_total_amount ?? 0), {
            id: 'total_amount',
            header: () => <span className="whitespace-nowrap">ยอดรวม (บาท)</span>,
            meta: { align: 'right' },
            cell: (info) => (
                <div className="text-right pr-10 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                     {new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(info.getValue() || 0))}
                </div>
            ),
            size: 180,
            enableSorting: true,
        }),
        columnHelper.accessor(row => row.status, {
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
                    <PRActionsCell 
                        row={row.original}
                        onEdit={handleEdit}
                        onView={handleView}
                        onSendApproval={handleSendApproval}
                        onApprove={onApproveClick}
                        onReject={handleReject}
                        onCreateRFQ={handleCreateRFQ}
                        isApproving={approvingId === row.original.pr_id}
                    />
                </div>
            ),
            footer: () => {
                 const total = (data?.data ?? []).reduce((sum, item) => sum + (item.total_amount ?? Number(item.pr_base_total_amount ?? 0)), 0);
                 return (
                     <div className="text-right font-bold text-base text-emerald-600 dark:text-emerald-400 whitespace-nowrap pr-2">
                         {total.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                     </div>
                 );
            },
            size: 160, 
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, data?.data, handleSendApproval, onApproveClick, handleReject, approvingId, handleEdit, handleCreateRFQ, handleView]);

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <>
            <PageListLayout
                title="รายการใบขอซื้อ"
                subtitle="Purchase Requisition (PR)"
                icon={FileText}
                accentColor="blue"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                searchForm={
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <FilterField
                            label="เลขที่เอกสาร"
                            value={filters.search}
                            onChange={(val: string) => handleFilterChange('search', val)}
                            placeholder="PR2024-xxx"
                            accentColor="blue"
                            disabled={true}
                            className="bg-gray-100 cursor-not-allowed text-gray-400"
                        />
                        <FilterField
                            label="ผู้ขอ"
                            value={filters.search2}
                            onChange={(val: string) => handleFilterChange('search2', val)}
                            placeholder="ชื่อผู้ขอ"
                            accentColor="blue"
                        />
                        <FilterField
                            label="แผนก"
                            value={filters.search3}
                            onChange={(val: string) => handleFilterChange('search3', val)}
                            placeholder="แผนก"
                            accentColor="blue"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={filters.status}
                            onChange={(val: string) => handleFilterChange('status', val)}
                            options={PR_STATUS_OPTIONS}
                            accentColor="blue"
                        />
                        <FilterField
                            label="วันที่เริ่มต้น"
                            type="date"
                            value={filters.dateFrom || ''}
                            onChange={(val: string) => handleFilterChange('dateFrom', val)}
                            accentColor="blue"
                        />
                        <FilterField
                            label="วันที่สิ้นสุด"
                            type="date"
                            value={filters.dateTo || ''}
                            onChange={(val: string) => handleFilterChange('dateTo', val)}
                            accentColor="blue"
                        />
                        
                        {/* Action Buttons Group */}
                        <div className="md:col-span-2 xl:col-span-2 flex flex-col sm:flex-row flex-wrap justify-end gap-2 items-center">
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={resetFilters}
                                    className="flex-1 sm:flex-none h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300 shadow-sm whitespace-nowrap"
                                >
                                    ล้างค่า
                                </button>
                                <button
                                    onClick={() => refetch()}
                                    className="flex-1 sm:flex-none h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <Search size={18} />
                                    ค้นหา
                                </button>
                            </div>
                            <button
                                onClick={handleCreate}
                                className="w-full sm:w-auto h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                สร้างใบขอซื้อใหม่
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="h-full flex flex-col">
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
                        rowIdField="pr_id"
                        className="flex-1"
                        showFooter={true}
                    />
                </div>
            </PageListLayout>

            {isRFQModalOpen && (
                <RFQFormModal
                    isOpen={isRFQModalOpen}
                    onClose={() => {
                        setIsRFQModalOpen(false);
                        setSelectedPR(null);
                    }}
                    initialPR={selectedPR}
                    onSuccess={handleRFQSuccess}
                />
            )}

            {isPRModalOpen && (
                <PRFormModal
                    isOpen={isPRModalOpen}
                    onClose={handleClosePRModal}
                    id={selectedPRId}
                    onSuccess={() => refetch()}
                    readOnly={isReadOnly}
                />
            )}

            <RejectReasonModal
                isOpen={isRejectReasonOpen}
                onClose={closeRejectModal}
                onConfirm={(reason) => submitReject(reason, { onSuccess: refetch })}
                isSubmitting={isRejecting}
            />
        </>
    );
}
