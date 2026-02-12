/**
 * @file PRListPage.tsx
 * @description หน้ารายการใบขอซื้อ (Purchase Requisition List)
 * @route /procurement/pr
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Plus, Search, Send, CheckCircle, XCircle } from 'lucide-react';
import { SmartTable } from '@/shared/components/ui/SmartTable';
import { PageListLayout } from '@/shared/components/layout/PageListLayout';
import { PRStatusBadge } from '@/shared/components/ui/StatusBadge';
import { FilterField } from '@/shared/components/ui/FilterField';
import { useTableFilters, useDebounce, type TableFilters, useConfirmation } from '@/shared/hooks';
import RFQFormModal from '../rfq/components/RFQFormModal';
import { PRFormModal } from './components/PRFormModal';
import { PRActionsCell } from './components/PRActionsCell';

import { formatThaiDate } from '@/shared/utils/dateUtils';
import { createColumnHelper } from '@tanstack/react-table';

// Services & Types - Updated imports to use new module structure
import { PRService, type PRListParams } from '@/modules/procurement/services/pr.service';
import { logger } from '@/shared/utils/logger';
import type { PRHeader, PRStatus } from '@/modules/procurement/types/pr-types';
import { mockCostCenters } from '@/modules/master-data/mocks/masterDataMocks';

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

//     // Convert to API filter format - REPLACED BY DEBOUNCED VERSION BELOW
//     const apiFilters: PRListParams = {
//         pr_no: filters.search || undefined,
//         requester_name: filters.search2 || undefined,
//         department: filters.search3 || undefined,
//         status: filters.status === 'ALL' ? undefined : filters.status,
//         date_from: filters.dateFrom || undefined,
//         date_to: filters.dateTo || undefined,
//         page: filters.page,
//         limit: filters.limit
//     };

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

    // Window Manager
    // const { openWindow } = useWindowManager();

    // Modal States
    const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
    const [selectedPR, setSelectedPR] = useState<PRHeader | null>(null);
    
    // PR Form Modal Local State
    const [isPRModalOpen, setIsPRModalOpen] = useState(false);
    const [selectedPRId, setSelectedPRId] = useState<string | undefined>(undefined);


    // Confirmation Modal State
    // Removed manual states in favor of useConfirmation hook

    // Handlers
    const handleFilterChange = (name: PRFilterKeys, value: string) => {
        setFilters({ [name]: value });
    };

    const handleCreateRFQ = (pr: PRHeader) => {
        setSelectedPR(pr);
        setIsRFQModalOpen(true);
    };

    const handleRFQSuccess = useCallback(async () => {
        if (!selectedPR) return;
        
        try {
            // Update PR status to COMPLETED after RFQ is successfully created
            await PRService.update(selectedPR.pr_id, { status: 'COMPLETED' });
            logger.log(`PR ${selectedPR.pr_no} status updated to COMPLETED`);
        } catch (error) {
            logger.error('Failed to update PR status to COMPLETED', error);
        }
        // Always refetch the list to show latest data
        refetch();
    }, [selectedPR, refetch]);

    const handleCreate = () => {
        setSelectedPRId(undefined);
        setIsPRModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setSelectedPRId(id);
        setIsPRModalOpen(true);
    };

    const handleClosePRModal = () => {
        setIsPRModalOpen(false);
        setSelectedPRId(undefined);
    };


    const handleSendApproval = useCallback(async (id: string) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันการส่งอนุมัติ',
            description: 'คุณต้องการส่งเอกสารนี้เพื่อขออนุมัติใช่หรือไม่?',
            confirmText: 'ส่งอนุมัติ',
            cancelText: 'ยกเลิก',
            variant: 'info',
            icon: Send
        });

        if (!isConfirmed) return;

        try {
            const result = await PRService.submit(id);
            if (result.success) {
                await confirm({
                    title: 'ส่งอนุมัติสำเร็จ!',
                    description: `เลขที่เอกสาร: ${result.pr_no || id}\nสถานะ: รออนุมัติ (Pending)`,
                    confirmText: 'ตกลง',
                    hideCancel: true,
                    variant: 'success'
                });
                refetch();
            }
 else {
                await confirm({ 
                    title: 'ส่งอนุมัติไม่สำเร็จ', 
                    description: result.message || 'เกิดข้อผิดพลาด', 
                    confirmText: 'ตกลง', 
                    hideCancel: true, 
                    variant: 'warning' 
                });
            }
        } catch (error) {
            logger.error('Send approval failed', error);
            await confirm({ 
                title: 'เกิดข้อผิดพลาด', 
                description: 'เกิดข้อผิดพลาดในการส่งอนุมัติ', 
                confirmText: 'ตกลง', 
                hideCancel: true, 
                variant: 'danger' 
            });
        }
    }, [confirm, refetch]);



    const handleApprove = useCallback(async (id: string) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันการอนุมัติ',
            description: 'คุณต้องการอนุมัติเอกสารนี้ใช่หรือไม่?',
            confirmText: 'อนุมัติ',
            cancelText: 'ยกเลิก',
            variant: 'success',
            icon: CheckCircle
        });

        if (!isConfirmed) return;

        try {
            const success = await PRService.approve(id);
            if (success) {
                refetch();
            } else {
                await confirm({ title: 'อนุมัติไม่สำเร็จ', description: 'เกิดข้อผิดพลาด', confirmText: 'ตกลง', hideCancel: true, variant: 'warning' });
            }
        } catch (error) {
            logger.error('Approve failed', error);
             await confirm({ title: 'เกิดข้อผิดพลาด', description: 'เกิดข้อผิดพลาดในการอนุมัติ', confirmText: 'ตกลง', hideCancel: true, variant: 'danger' });
        }
    }, [confirm, refetch]);

    const handleReject = useCallback(async (id: string) => {
         const isConfirmed = await confirm({
            title: 'ยืนยันการไม่อนุมัติ',
            description: "คุณต้องการ 'ไม่อนุมัติ' เอกสารนี้ใช่หรือไม่?",
            confirmText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            variant: 'danger',
            icon: XCircle
        });

        if (!isConfirmed) return;

        try {
            await PRService.reject(id, "Rejected by Approver");
            refetch();
        } catch (error) {
            logger.error('Reject failed', error);
            await confirm({ title: 'เกิดข้อผิดพลาด', description: 'เกิดข้อผิดพลาดในการไม่อนุมัติ', confirmText: 'ตกลง', hideCancel: true, variant: 'danger' });
        }
    }, [confirm, refetch]);



    // Columns Definition
    const columnHelper = createColumnHelper<PRHeader>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            footer: () => <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-bold text-sm text-gray-700 dark:text-gray-200">ยอดรวมทั้งหมด :</div>,
            size: 40,
            enableSorting: false,
        }),
        columnHelper.accessor('pr_no', {
            header: 'เลขที่เอกสาร',
            cell: (info) => {
                const val = info.getValue();
                const isTemp = val.startsWith('DRAFT-TEMP');
                return (
                    <span 
                        className={`font-semibold truncate block ${isTemp ? 'text-amber-600 dark:text-amber-400 italic' : 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'}`} 
                        title={isTemp ? 'รอรันเลขเอกสาร (Pending Generation)' : val}
                    >
                        {isTemp ? (
                            <span className="flex items-center gap-1">
                                <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-[10px] rounded border border-amber-200 dark:border-amber-800">รอรันเลข</span>
                            </span>
                        ) : val}
                    </span>
                );
            },
            size: 110,
            enableSorting: true,
        }),
        columnHelper.accessor('request_date', {
            header: 'วันที่',
            cell: (info) => (
                <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {formatThaiDate(info.getValue())}
                </span>
            ),
            size: 90,
            enableSorting: true,
        }),
        columnHelper.accessor('requester_name', {
            header: 'ผู้ขอ',
            cell: (info) => (
                <div className="font-medium text-gray-700 dark:text-gray-200 truncate" title={info.getValue()}>
                    {info.getValue()}
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.accessor('cost_center_id', {
            header: () => <div className="pl-4">แผนก</div>,
            cell: (info) => {
                const id = info.getValue()?.toLowerCase();
                const department = mockCostCenters.find(c => c.cost_center_id.toLowerCase() === id)?.cost_center_name?.replace('แผนก', '');
                return (
                    <span className="truncate block text-gray-600 dark:text-gray-300 pl-4" title={department || '-'}>
                        {department || '-'}
                    </span>
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
                    <PRStatusBadge status={info.getValue()} />
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.lines?.length || 0, {
            id: 'items',
            header: () => <div className="text-center w-full">รายการ</div>,
            cell: (info) => <div className="text-center text-gray-600 dark:text-gray-300">{info.getValue()}</div>,
            size: 60,
            enableSorting: false,
        }),
        columnHelper.accessor('total_amount', {
            header: () => <div className="text-right w-full">ยอดรวม (บาท)</div>,
            cell: (info) => (
                <div className="font-semibold text-gray-800 dark:text-gray-200 text-right whitespace-nowrap">
                    {info.getValue().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            ),
            size: 130,
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full min-w-[120px]">จัดการ</div>,
            cell: ({ row }) => (
                <PRActionsCell 
                    row={row.original}
                    onEdit={handleEdit}
                    onSendApproval={handleSendApproval}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onCreateRFQ={handleCreateRFQ}
                />
            ),
            footer: () => {
                const total = (data?.items ?? []).reduce((sum, item) => sum + (item.total_amount || 0), 0);
                return (
                    <div className="text-right font-bold text-base text-emerald-600 dark:text-emerald-400 whitespace-nowrap pr-2">
                        {total.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                    </div>
                );
            },
            size: 160, // Widened for Draft actions
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, data?.items, handleSendApproval, handleApprove, handleReject]); // Re-calculate index when page changes

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <>
            <PageListLayout
                title="รายการใบขอซื้อ"
                subtitle="Purchase Requisition Master"
                icon={FileText}
                accentColor="blue"
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
                            label="วันที่เอกสาร จาก"
                            type="date"
                            value={filters.dateFrom || ''}
                            onChange={(val: string) => handleFilterChange('dateFrom', val)}
                            accentColor="blue"
                        />
                        <FilterField
                            label="ถึงวันที่"
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
                        data={data?.items ?? []}
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
                />
            )}

            {/* <ConfirmationModal>s removed in favor of useConfirmation hook */ }
        </>
    );
}
