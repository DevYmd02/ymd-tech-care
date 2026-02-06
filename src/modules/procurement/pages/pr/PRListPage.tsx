/**
 * @file PRListPage.tsx
 * @description หน้ารายการใบขอซื้อ (Purchase Requisition List)
 * @route /procurement/pr
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Eye, Edit, Send, Plus, Search } from 'lucide-react';
import { SmartTable } from '@/shared/components/ui/SmartTable';
import { PageListLayout } from '@/shared/components/layout/PageListLayout';
import { PRStatusBadge } from '@/shared/components/ui/StatusBadge';
import { FilterField } from '@/shared/components/ui/FilterField';
import { useTableFilters, useDebounce, type TableFilters } from '@/shared/hooks';
import RFQFormModal from '../rfq/components/RFQFormModal';
import { PRFormModal } from './components/PRFormModal';
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

    const handleQuickApprove = useCallback(async (id: string) => {
        if (!window.confirm("คุณต้องการอนุมัติเอกสารนี้ใช่หรือไม่?")) return;
        try {
            const success = await PRService.approve(id);
            if (success) {
                window.alert("อนุมัติเอกสารเรียบร้อยแล้ว");
                refetch();
            } else {
                window.alert("อนุมัติเอกสารไม่สำเร็จ");
            }
        } catch (error) {
            console.error('Quick approve failed', error);
            window.alert("เกิดข้อผิดพลาดในการอนุมัติเอกสาร");
        }
    }, [refetch]);



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
            header: () => <div className="text-center w-full min-w-[100px]">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center justify-center gap-1.5">
                        {/* Always show View button */}
                        <button className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="ดูรายละเอียด">
                            <Eye size={16} />
                        </button>
                        
                        {/* Edit & Approve Buttons: ONLY for PENDING */}
                        {item.status === 'PENDING' && (
                            <div className="flex items-center gap-1.5">
                                <button 
                                    type="button"
                                    onClick={() => handleEdit(item.pr_id)}
                                    className="group flex items-center justify-center gap-1.5 px-2 py-1 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded transition-colors text-xs font-semibold border border-orange-200 dark:border-orange-800"
                                    title="แก้ไข"
                                >
                                    <Edit size={12} strokeWidth={2.5} /> แก้ไข
                                </button>
                                
                                <button 
                                    type="button"
                                    onClick={() => handleQuickApprove(item.pr_id)}
                                    className="flex items-center justify-center gap-0.5 px-1.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors text-[10px] font-bold shadow-sm whitespace-nowrap"
                                    title="ส่งอนุมัติ"
                                >
                                    <Send size={11} /> ส่งอนุมัติ
                                </button>
                            </div>
                        )}
                        
                        {/* Create RFQ Button: ONLY for APPROVED */}
                        {item.status === 'APPROVED' ? (
                            <button 
                                onClick={() => handleCreateRFQ(item)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-colors flex items-center gap-0.5 whitespace-nowrap"
                                title="สร้างใบขอใบเสนอราคา"
                            >
                                <FileText size={12} /> สร้าง RFQ
                            </button>
                        ) : null}
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
            size: 130,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, data?.items, handleQuickApprove]); // Re-calculate index when page changes

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
                        <div className="lg:col-span-2 flex justify-end gap-2 flex-wrap">
                            <button
                                onClick={resetFilters}
                                className="h-10 px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors border border-gray-300"
                            >
                                ล้างค่า
                            </button>
                            {/* React Query automatically handles fetching, so this button is visual mostly, or triggers refetch if needed manually */}
                            <button
                                onClick={() => refetch()}
                                className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
                            >
                                <Search size={18} />
                                ค้นหา
                            </button>
                            <button
                                onClick={handleCreate}
                                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
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
        </>
    );
}
