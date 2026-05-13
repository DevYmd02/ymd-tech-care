/**
 * @file PRListPage.tsx
 * @description หน้ารายการใบขอซื้อ (Purchase Requisition List)
 * @route /procurement/pr
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Search, Send, AlertTriangle, Eye, Edit, Printer } from 'lucide-react';
import { PageListLayout, SmartTable, PRStatusBadge, MobileListCard, MobileListContainer } from '@ui';
import { FilterField } from '@/shared/components/ui/filters/FilterField';
import { useTableFilters } from '@/shared/hooks';
import { PRFormModal } from './components/PRFormModal';
import { PRActionsCell } from './components/PRActionsCell';
import { ApprovalHistoryModal } from '@/modules/procurement/shared/components/ApprovalHistoryModal';
import { usePRActions } from '@/modules/procurement/pages/pr/hooks';
import { ErrorBoundary } from '@/shared/components/system/ErrorBoundary';

import { formatThaiDate } from '@/shared/utils/dateUtils';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';


// Services & Types - Updated imports to use new module structure
import { PRService, type PRListParams } from '@/modules/procurement/services/pr.service';
import type { PRHeader, PRStatus } from '@/modules/procurement/types';
import { createVendorMap, hydratePRHeader } from '@/modules/procurement/utils/pr-hydration';


import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';




// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const PR_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'PENDING', label: 'รออนุมัติ' },
    { value: 'APPROVED', label: 'อนุมัติแล้ว' },
    { value: 'PARTIAL', label: 'อนุมัติบางส่วน' },
    { value: 'REJECTED', label: 'ไม่อนุมัติ' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
    { value: 'COMPLETED', label: 'เสร็จสมบูรณ์' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================


// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function PRListPage() {
    const queryClient = useQueryClient();



    // Fetch Vendors for client-side lookup
    const { data: vendorData } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => VendorService.getList(),
        staleTime: 5 * 60 * 1000,
    });

    const vendorMap = useMemo(() => {
        return createVendorMap(vendorData?.items || []);
    }, [vendorData]);

    // URL-based Filter State (Explicit Search Pattern)
    const { filters, localFilters, handleFilterChange, handleApplyFilters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<PRStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'pr_no',
            search2: 'vendor_code',
            search3: 'vendor_name'
        }
    });

    // Convert to API filter format using APPLIED filters (from URL)
    const apiFilters: PRListParams = {
        pr_no: filters.search || undefined,
        vendor_code: filters.search2 || undefined,
        vendor_name: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_start: filters.date_start || undefined,
        date_end: filters.date_end || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined
    };

    // Data Fetching with React Query (responds to applied filters in URL only)
    const { data, isLoading } = useQuery({
        queryKey: ['prs', apiFilters],
        queryFn: () => PRService.getList(apiFilters),
        placeholderData: keepPreviousData,
        staleTime: 0,
        refetchOnWindowFocus: true,
    });

    // Modal States
    
    // PR Form Modal Local State
    const [isPRModalOpen, setIsPRModalOpen] = useState(false);
    const [selectedPRId, setSelectedPRId] = useState<number | undefined>(undefined);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Approval History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyPrId, setHistoryPrId] = useState<number | undefined>(undefined);
    const [historyPrNo, setHistoryPrNo] = useState<string | undefined>(undefined);

    // Hook Actions
    const {
        handleDirectApproval
    } = usePRActions();

    // Handlers (handleFilterChange is from useTableFilters, directly available)


    const handleCreate = () => {
        setSelectedPRId(undefined);
        setIsReadOnly(false);
        setIsPRModalOpen(true);
    };

    const handleEdit = useCallback((id: number) => {
        setSelectedPRId(id);
        setIsReadOnly(false);
        setIsPRModalOpen(true);
    }, []);

    const handleView = useCallback((id: number) => {
        setSelectedPRId(id);
        setIsReadOnly(true);
        setIsPRModalOpen(true);
    }, []);

    const handleClosePRModal = () => {
        setIsPRModalOpen(false);
        setSelectedPRId(undefined);
        setIsReadOnly(false);
    };

    const handleViewHistory = useCallback((id: number, prNo?: string) => {
        setHistoryPrId(id);
        setHistoryPrNo(prNo);
        setIsHistoryModalOpen(true);
    }, []);

    const handleSendApproval = useCallback(async (pr: PRHeader) => {
        const confirmed = await handleDirectApproval(pr);
        if (confirmed) {
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['prs'] });
            }, 100);
        }
    }, [handleDirectApproval, queryClient]);

    // Removed onApproveClick and handleReject as they are now handled by AV Module

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
                const isTemp = prNo?.startsWith('DRAFT-TEMP') ?? false;
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
                                {prDateStr ? formatThaiDate(prDateStr) : '-'}
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
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.purpose || row.remark || '', {
            id: 'purpose',
            header: 'รายละเอียด',
            cell: (info) => {
                const val = info.getValue() || '-';
                return (
                    <div 
                        className="max-w-[300px] truncate py-2 text-sm text-gray-600 dark:text-gray-400" 
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
            header: 'ผู้ขอซื้อ',
            cell: (info) => {
                const row = hydratePRHeader(info.row.original);
                const displayReq = row.requester_name || 'ไม่ระบุผู้ขอ';

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

        columnHelper.accessor(row => {
            const hydrated = hydratePRHeader(row, vendorMap);
            return `${hydrated.vendor_code} ${hydrated.vendor_name}`;
        }, {
            id: 'vendor_info',
            header: 'ผู้ขาย/รหัสผู้ขาย',
            cell: (info) => {
                const row = hydratePRHeader(info.row.original, vendorMap);
                
                if (!row.vendor_name && !row.vendor_code) return <div className="text-sm text-gray-400">-</div>;

                return (
                    <div className="flex flex-col py-1 gap-0.5">
                        <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[180px]" title={row.vendor_name || 'ไม่ระบุชื่อผู้ขาย'}>
                            {row.vendor_name || '-'}
                        </span>
                        {row.vendor_code && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded w-fit">
                                {row.vendor_code}
                            </span>
                        )}
                    </div>
                );
            },
            size: 120,
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
            enableSorting: false,
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
            enableSorting: true,
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
                        onViewHistory={(id) => handleViewHistory(id, row.original.pr_no)}
                        onSendApproval={handleSendApproval}
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
            size: 200, 
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, data?.data, handleSendApproval, handleEdit, handleView, vendorMap, handleViewHistory]);


    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <ErrorBoundary>
            <PageListLayout
                title="รายการใบขอซื้อ"
                subtitle="Purchase Requisition (PR)"
                icon={FileText}
                accentColor="blue"
                totalCount={data?.total}
                searchForm={
                    <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <FilterField
                            label="เลขที่เอกสาร"
                            value={localFilters.search}
                            onChange={(val: string) => handleFilterChange('search', val)}
                            placeholder="PR-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="รหัสผู้ขาย"
                            value={localFilters.search2}
                            onChange={(val: string) => handleFilterChange('search2', val)}
                            placeholder="รหัสผู้ขาย"
                            accentColor="blue"
                        />
                        <FilterField
                            label="ชื่อผู้ขาย"
                            value={localFilters.search3}
                            onChange={(val: string) => handleFilterChange('search3', val)}
                            placeholder="ชื่อผู้ขาย"
                            accentColor="blue"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={localFilters.status}
                            onChange={(val: string) => handleFilterChange('status', val)}
                            options={PR_STATUS_OPTIONS}
                            accentColor="blue"
                        />
                        <FilterField
                            label="วันที่เริ่มต้น"
                            type="date"
                            value={localFilters.date_start || ''}
                            onChange={(val: string) => handleFilterChange('date_start', val)}
                            accentColor="blue"
                        />
                        <FilterField
                            label="วันที่สิ้นสุด"
                            type="date"
                            value={localFilters.date_end || ''}
                            onChange={(val: string) => handleFilterChange('date_end', val)}
                            accentColor="blue"
                        />
                        
                        {/* Action Buttons Group */}
                        <div className="md:col-span-2 xl:col-span-2 flex flex-col sm:flex-row flex-wrap justify-end gap-2 items-center">
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
                                    className="flex-1 sm:flex-none h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <Search size={18} />
                                    ค้นหา
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleCreate}
                                className="w-full sm:w-auto h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                สร้างใบขอซื้อใหม่
                            </button>
                        </div>
                        </div>
                    </form>
                }
            >
                <div className="h-full flex flex-col">
                    {/* Desktop View: Table */}
                    <div className="hidden md:block flex-1 overflow-hidden">
                        <SmartTable
                            data={data?.data ?? []}
                            columns={columns as ColumnDef<PRHeader, unknown>[]}

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

                    {/* Mobile View: Cards (shared MobileListContainer + MobileListCard) */}
                    <div className="md:hidden">
                        <MobileListContainer
                            isLoading={isLoading}
                            isEmpty={!data?.data.length}
                            pagination={data?.total ? { page: filters.page, total: data.total, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                        >
                            {data?.data.map((item) => {
                                const hydrated = hydratePRHeader(item, vendorMap);
                                return (
                                <MobileListCard
                                    key={hydrated.pr_id}
                                    title={hydrated.pr_no}
                                    subtitle={formatThaiDate(hydrated.pr_date)}
                                    statusBadge={<PRStatusBadge status={hydrated.status} />}
                                    details={[
                                        {
                                            label: 'ผู้ขอ:',
                                            value: hydrated.requester_name || 'ไม่ระบุผู้ขอ',
                                        },
                                        {
                                            label: 'รหัสผู้ขาย:',
                                            value: hydrated.vendor_code || '-',
                                        },
                                        {
                                            label: 'ชื่อผู้ขาย:',
                                            value: hydrated.vendor_name || '-',
                                        },
                                        ...(hydrated.need_by_date ? [{ label: 'ต้องการใช้:', value: formatThaiDate(hydrated.need_by_date) }] : []),
                                    ]}

                                    amountLabel="ยอดรวม"
                                    amountValue={
                                        <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                            {(item.total_amount ?? Number(item.pr_base_total_amount ?? 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                        </span>
                                    }
                                    actions={
                                        <>
                                            <button
                                                onClick={() => handleView(item.pr_id)}
                                                className="flex-1 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200 dark:border-slate-600"
                                            >
                                                <Eye size={14} /> ดู
                                            </button>
                                            {(item.status === 'DRAFT' || item.status === 'REJECTED' || item.status === 'PENDING') && (
                                                <button
                                                    onClick={() => handleEdit(item.pr_id)}
                                                    className="flex-1 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Edit size={14} /> {item.status === 'REJECTED' ? 'แก้ไขและส่งอนุมัติใหม่' : 'แก้ไข'}
                                                </button>
                                            )}
                                            {item.status === 'DRAFT' && (
                                                <button
                                                    onClick={() => handleSendApproval(item)}
                                                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                                >
                                                    <Send size={14} /> ส่งอนุมัติ
                                                </button>
                                            )}
                                            {['APPROVED', 'PARTIAL', 'COMPLETED'].includes(item.status as string) && (
                                                <button
                                                    onClick={() => {
                                                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                                                        window.open(`${apiUrl}/pr/${item.pr_id}/pdf`, '_blank');
                                                    }}
                                                    className="flex-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Printer size={14} /> พิมพ์
                                                </button>
                                            )}
                                            {/* PENDING approval actions removed for Mobile View to enforce AV Module usage */}
                                        </>
                                    }
                                />
                                );
                            })}
                        </MobileListContainer>



                    </div>
                </div>

            </PageListLayout>


            {isPRModalOpen && (
                <ErrorBoundary>
                    <PRFormModal
                        isOpen={isPRModalOpen}
                        onClose={handleClosePRModal}
                        id={selectedPRId}
                        readOnly={isReadOnly}
                    />
                </ErrorBoundary>
            )}

            {/* RejectReasonModal has been removed */}            {historyPrId && (
                <ApprovalHistoryModal 
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    prId={historyPrId}
                    prNo={historyPrNo}
                />
            )}
        </ErrorBoundary>
    );
}
