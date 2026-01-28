/**
 * @file PRListPage.tsx
 * @description หน้ารายการใบขอซื้อ (Purchase Requisition List)
 * @route /procurement/pr
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Eye, Edit, Send } from 'lucide-react';
import { PageListLayout, FilterFormBuilder, PRStatusBadge, SmartTable } from '@shared';
import type { FilterFieldConfig } from '@shared/FilterFormBuilder';
// import { useWindowManager } from '@hooks/useWindowManager';
import { useTableFilters, type TableFilters } from '@hooks';
import RFQFormModal from '../rfq/components/RFQFormModal';
import { PRFormModal } from './components/PRFormModal';
import { formatThaiDate } from '@utils/dateUtils';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';

// Services & Types
import { prService } from '@services/prService';
import type { PRListParams } from '@services/prService';
import type { PRHeader, PRStatus } from '@project-types/pr-types';
import { mockCostCenters } from '../../../__mocks__/masterDataMocks';

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

const PR_FILTER_CONFIG: FilterFieldConfig<PRFilterKeys>[] = [
    { name: 'search', label: 'เลขที่เอกสาร', type: 'text', placeholder: 'PR2024-xxx' },
    { name: 'search2', label: 'ผู้ขอ', type: 'text', placeholder: 'ชื่อผู้ขอ' },
    { name: 'search3', label: 'แผนก', type: 'text', placeholder: 'แผนก' },
    { name: 'status', label: 'สถานะ', type: 'select', options: PR_STATUS_OPTIONS },
    { name: 'dateFrom', label: 'วันที่เอกสาร จาก', type: 'date' },
    { name: 'dateTo', label: 'ถึงวันที่', type: 'date' },
];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function PRListPage() {
    // URL-based Filter State
    const { filters, setFilters, resetFilters, handlePageChange } = useTableFilters<PRStatus>({
        defaultStatus: 'ALL',
    });

    // Convert to API filter format
    const apiFilters: PRListParams = {
        pr_no: filters.search || undefined,
        requester_name: filters.search2 || undefined,
        department: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        page: filters.page,
        limit: filters.limit
    };

    // Data Fetching with React Query
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['prs', apiFilters],
        queryFn: () => prService.getList(apiFilters),
        placeholderData: keepPreviousData,
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
            const success = await prService.approve(id);
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
            footer: () => {
                const total = data?.data.reduce((sum, item) => sum + item.total_amount, 0) || 0;
                return (
                    <div className="text-right font-bold text-base text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {total.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                    </div>
                );
            },
            size: 100,
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
            size: 130,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, data?.data, handleQuickApprove]); // Re-calculate index when page changes

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
                    <FilterFormBuilder
                        config={PR_FILTER_CONFIG}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onSearch={() => {}} // React Query auto-fetches
                        onReset={resetFilters}
                        accentColor="blue"
                        columns={{ sm: 2, md: 4, lg: 4 }}
                        onCreate={handleCreate}
                        createLabel="สร้างใบขอซื้อใหม่"
                    />
                }
            >
                <div className="h-full flex flex-col">
                    <SmartTable
                        data={data?.data ?? []}
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

            <RFQFormModal
                isOpen={isRFQModalOpen}
                onClose={() => {
                    setIsRFQModalOpen(false);
                    setSelectedPR(null);
                }}
                initialPR={selectedPR}
            />

            <PRFormModal
                isOpen={isPRModalOpen}
                onClose={handleClosePRModal}
                id={selectedPRId}
                onSuccess={() => refetch()}
            />
        </>
    );
}