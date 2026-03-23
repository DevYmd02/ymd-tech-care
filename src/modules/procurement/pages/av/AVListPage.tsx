import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ShieldCheck, Search, Eye } from 'lucide-react';
import { PageListLayout, SmartTable, PRStatusBadge, FilterField, MobileListCard, MobileListContainer } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import { AVFormModal } from './components/AVFormModal';
import { ErrorBoundary } from '@/shared/components/system/ErrorBoundary';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { createColumnHelper } from '@tanstack/react-table';

import { PRService, type PRListParams } from '@/modules/procurement/services/pr.service';
import type { PRHeader, PRStatus } from '@/modules/procurement/types';

const AV_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'PENDING', label: 'รออนุมัติ' },
    { value: 'APPROVED', label: 'อนุมัติแล้ว' },
    { value: 'REJECTED', label: 'ไม่อนุมัติ' },
];

export default function AVListPage() {
    // Force default status to PENDING for approvals
    const { filters, localFilters, handleFilterChange, handleApplyFilters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<PRStatus>({
        defaultStatus: 'PENDING',
        customParamKeys: {
            search: 'pr_no',
            search2: 'vendor_code',
            search3: 'vendor_name'
        }
    });

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

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['prs', apiFilters], // We query PR API for approvals
        queryFn: () => PRService.getList(apiFilters),
        placeholderData: keepPreviousData,
        staleTime: 0,
        refetchOnWindowFocus: true,
    });

    const [isAVModalOpen, setIsAVModalOpen] = useState(false);
    const [selectedPRId, setSelectedPRId] = useState<number | undefined>(undefined);

    const handleApprove = useCallback((id: number) => {
        setSelectedPRId(id);
        setIsAVModalOpen(true);
    }, []);

    const handleCloseAVModal = () => {
        setIsAVModalOpen(false);
        setSelectedPRId(undefined);
    };

    const handleAVSuccess = () => {
        refetch();
    };

    const columnHelper = createColumnHelper<PRHeader>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center h-full w-full">ลำดับ</div>,
            cell: (info) => <div className="flex justify-center items-center h-full w-full">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            size: 50,
            enableSorting: false,
        }),
        columnHelper.accessor(row => (row as any).av_no || '-', {
            id: 'av_no',
            header: 'เลขที่อนุมัติ PR',
            cell: (info) => (
                <div className="py-2 text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                    {info.getValue() || '-'}
                </div>
            ),
            size: 140,
            enableSorting: false,
        }),
        columnHelper.accessor('pr_date', {
            id: 'pr_date_no',
            header: 'เอกสาร / วันที่',
            cell: (info) => {
                const row = info.row.original;
                return (
                    <div className="flex flex-col py-2">
                        <span className="font-bold whitespace-nowrap text-base leading-tight text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => handleApprove(row.pr_id)}>
                            {row.pr_no}
                        </span>
                        <div className="flex flex-col mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatThaiDate(info.getValue())}
                            </span>
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
            cell: (info) => (
                <div className="max-w-[300px] truncate py-2 text-sm text-gray-600 dark:text-gray-400" title={info.getValue() || '-'}>
                    {info.getValue() || '-'}
                </div>
            ),
            size: 220,
            enableSorting: false,
        }),
        columnHelper.accessor('requester_name', {
            header: 'ผู้จัดทำ',
            cell: (info) => {
                const row = info.row.original;
                const reqName = row.requester_name || row.created_by_name || row.employee_name;
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
                        onClick={() => handleApprove(row.original.pr_id)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 rounded-md transition-colors"
                        title={row.original.status === 'PENDING' ? "พิจารณาอนุมัติ" : "ดูรายละเอียด"}
                    >
                        {row.original.status === 'PENDING' ? <ShieldCheck size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            ),
            size: 100, 
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, handleApprove]);

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
                            label="เลขที่เอกสาร"
                            value={localFilters.search}
                            onChange={(val: string) => handleFilterChange('search', val)}
                            placeholder="PR-xxx"
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
                        
                        <div className="md:col-span-4 xl:col-span-4 flex justify-end gap-2 items-center">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300 shadow-sm whitespace-nowrap"
                            >
                                ล้างค่า
                            </button>
                            <button
                                type="submit"
                                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Search size={18} />
                                ค้นหา
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
                            rowIdField="pr_id"
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
                                key={item.pr_id}
                                title={item.pr_no}
                                subtitle={formatThaiDate(item.pr_date)}
                                statusBadge={<PRStatusBadge status={item.status} />}
                                details={[
                                    {
                                        label: 'เลขที่อนุมัติ PR:',
                                        value: (item as any).av_no || '-',
                                    },
                                    {
                                        label: 'ผู้ขอ:',
                                        value: item.requester_name || item.created_by_name || item.employee_name || 'ไม่ระบุผู้ขอ',
                                    }
                                ]}
                                amountLabel="ยอดรวม"
                                amountValue={
                                    <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                        {(item.total_amount ?? Number(item.pr_base_total_amount ?? 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    </span>
                                }
                                actions={
                                    <button
                                        onClick={() => handleApprove(item.pr_id)}
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
                        onSuccess={handleAVSuccess}
                    />
                </ErrorBoundary>
            )}
        </>
    );
}
