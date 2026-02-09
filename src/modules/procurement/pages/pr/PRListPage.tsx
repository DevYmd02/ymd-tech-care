/**
 * @file PRListPage.tsx
 * @description หน้ารายการใบขอซื้อ (Purchase Requisition List)
 * @route /procurement/pr
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Eye, Edit, Send, Plus, Search, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { SmartTable } from '@/shared/components/ui/SmartTable';
import { PageListLayout } from '@/shared/components/layout/PageListLayout';
import { PRStatusBadge } from '@/shared/components/ui/StatusBadge';
import { FilterField } from '@/shared/components/ui/FilterField';
import { useTableFilters, useDebounce, type TableFilters } from '@/shared/hooks';
import RFQFormModal from '../rfq/components/RFQFormModal';
import { PRFormModal } from './components/PRFormModal';
import { ConfirmationModal } from '@/shared/components/system/ConfirmationModal';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';

// Services & Types - Updated imports to use new module structure
import { PRService, type PRListParams } from '@/modules/procurement/services/pr.service';
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
    { value: 'CANCELLED', label: 'ยกเลิก' },
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
    const { filters, setFilters, resetFilters, handlePageChange } = useTableFilters<PRStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'pr_no',
            search2: 'requester_name',
            search3: 'department'
        }
    });

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
        limit: debouncedFilters.limit
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
    const [isSendApprovalModalOpen, setIsSendApprovalModalOpen] = useState(false);
    const [pendingSendApprovalId, setPendingSendApprovalId] = useState<string | null>(null);

    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [pendingApproveId, setPendingApproveId] = useState<string | null>(null);

    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);

    // Handlers
    const handleFilterChange = (name: PRFilterKeys, value: string) => {
        setFilters({ [name]: value });
    };

    const handleCreateRFQ = (pr: PRHeader) => {
        setSelectedPR(pr);
        setIsRFQModalOpen(true);
    };

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

    const handleSendApproval = useCallback((id: string) => {
        setPendingSendApprovalId(id);
        setIsSendApprovalModalOpen(true);
    }, []);

    const confirmSendApproval = useCallback(async () => {
        if (!pendingSendApprovalId) return;
        
        try {
            // Changed from approve() to submit() to transition to PENDING
            const result = await PRService.submit(pendingSendApprovalId);
            if (result.success) {
                refetch();
            } else {
                window.alert(result.message || "ส่งอนุมัติไม่สำเร็จ");
            }
        } catch (error) {
            console.error('Send approval failed', error);
            window.alert("เกิดข้อผิดพลาดในการส่งอนุมัติ");
        } finally {
            setIsSendApprovalModalOpen(false);
            setPendingSendApprovalId(null);
        }
    }, [pendingSendApprovalId, refetch]);

    const handleDelete = useCallback(async (id: string) => {
        if (!window.confirm("คุณต้องการลบใบขอซื้อนี้ใช่หรือไม่?")) return;

        try {
            const success = await PRService.delete(id);
            if (success) {
                refetch();
            } else {
                window.alert("ลบข้อมูลไม่สำเร็จ");
            }
        } catch (error) {
            console.error('Delete failed', error);
            window.alert("เกิดข้อผิดพลาดในการลบข้อมูล");
        }
    }, [refetch]);

    const handleApprove = useCallback((id: string) => {
        setPendingApproveId(id);
        setIsApproveModalOpen(true);
    }, []);

    const confirmApprove = useCallback(async () => {
        if (!pendingApproveId) return;
        
        try {
            const success = await PRService.approve(pendingApproveId);
            if (success) {
                refetch();
            } else {
                window.alert("อนุมัติเอกสารไม่สำเร็จ");
            }
        } catch (error) {
            console.error('Approve failed', error);
            window.alert("เกิดข้อผิดพลาดในการอนุมัติเอกสาร");
        } finally {
            setIsApproveModalOpen(false);
            setPendingApproveId(null);
        }
    }, [pendingApproveId, refetch]);

    const handleReject = useCallback((id: string) => {
        setPendingRejectId(id);
        setIsRejectModalOpen(true);
    }, []);

    const confirmReject = useCallback(async () => {
        if (!pendingRejectId) return;

        try {
            // For now, hardcode reason or just call reject
            await PRService.reject(pendingRejectId, "Rejected by Approver"); 
            refetch();
        } catch (error) {
            console.error('Reject failed', error);
            window.alert("เกิดข้อผิดพลาดในการไม่อนุมัติเอกสาร");
        } finally {
            setIsRejectModalOpen(false);
            setPendingRejectId(null);
        }
    }, [pendingRejectId, refetch]);



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
            cell: (info) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate block" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
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
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center justify-center gap-1">
                        {/* 1. VIEW: Always Visible */}
                        <button 
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all" 
                            title="ดูรายละเอียด"
                        >
                            <Eye size={16} />
                        </button>

                        {/* 2. DRAFT Actions: Edit, Delete, Send Approval */}
                        {item.status === 'DRAFT' && (
                            <>
                                <button 
                                    onClick={() => handleEdit(item.pr_id)}
                                    className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-all"
                                    title="แก้ไข"
                                >
                                    <Edit size={16} />
                                </button>
                                
                                <button 
                                    onClick={() => handleDelete(item.pr_id)}
                                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                                    title="ลบ"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <button 
                                    onClick={() => handleSendApproval(item.pr_id)}
                                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                    title="ส่งอนุมัติ"
                                >
                                    <Send size={12} /> ส่งอนุมัติ
                                </button>
                            </>
                        )}

                        {/* 3. PENDING: Approve / Reject (Approver View) */}
                        {item.status === 'PENDING' && (
                            <>
                                <button 
                                    onClick={() => handleApprove(item.pr_id)}
                                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                    title="อนุมัติ"
                                >
                                    <CheckCircle size={12} /> อนุมัติ
                                </button>
                                <button 
                                    onClick={() => handleReject(item.pr_id)}
                                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                    title="ไม่อนุมัติ"
                                >
                                    <XCircle size={12} /> ไม่อนุมัติ
                                </button>
                            </>
                        )}
                        
                        {/* 4. APPROVED Actions: Create RFQ */}
                        {item.status === 'APPROVED' && (
                            <button 
                                onClick={() => handleCreateRFQ(item)}
                                className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                title="สร้างใบขอเสนอราคา"
                            >
                                <FileText size={12} /> สร้าง RFQ
                            </button>
                        )}

                         {/* 5. CANCELLED: View Only */}
                         {item.status === 'CANCELLED' && (
                            null
                        )}
                    </div>
                );
            },
            footer: () => {
                const total = data?.items.reduce((sum, item) => sum + item.total_amount, 0) || 0;
                return (
                    <div className="text-right font-bold text-base text-emerald-600 dark:text-emerald-400 whitespace-nowrap pr-2">
                        {total.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                    </div>
                );
            },
            size: 160, // Widened for Draft actions
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, data?.items, handleSendApproval, handleDelete, handleApprove, handleReject]); // Re-calculate index when page changes

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
                isLoading={isLoading}
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
                        columns={columns as ColumnDef<PRHeader>[]}
                        isLoading={isLoading}
                        pagination={{
                            pageIndex: filters.page,
                            pageSize: filters.limit,
                            totalCount: data?.total ?? 0,
                            onPageChange: handlePageChange,
                            onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 })
                        }}
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

            <ConfirmationModal
                isOpen={isSendApprovalModalOpen}
                onClose={() => {
                    setIsSendApprovalModalOpen(false);
                    setPendingSendApprovalId(null);
                }}
                onConfirm={confirmSendApproval}
                title="ยืนยันการส่งอนุมัติ"
                description="คุณต้องการส่งเอกสารนี้เพื่อขออนุมัติใช่หรือไม่?"
                confirmText="ส่งอนุมัติ"
                cancelText="ยกเลิก"
                variant="info"
                icon={Send}
            />

            <ConfirmationModal
                isOpen={isApproveModalOpen}
                onClose={() => {
                    setIsApproveModalOpen(false);
                    setPendingApproveId(null);
                }}
                onConfirm={confirmApprove}
                title="ยืนยันการอนุมัติ"
                description="คุณต้องการอนุมัติเอกสารนี้ใช่หรือไม่?"
                confirmText="อนุมัติ"
                cancelText="ยกเลิก"
                variant="success"
                icon={CheckCircle}
            />

            <ConfirmationModal
                isOpen={isRejectModalOpen}
                onClose={() => {
                    setIsRejectModalOpen(false);
                    setPendingRejectId(null);
                }}
                onConfirm={confirmReject}
                title="ยืนยันการไม่อนุมัติ"
                description="คุณต้องการ 'ไม่อนุมัติ' เอกสารนี้ใช่หรือไม่?"
                confirmText="ยืนยัน"
                cancelText="ยกเลิก"
                variant="danger"
                icon={XCircle}
            />
        </>
    );
}
