/**
 * @file VQListPage.tsx
 * @description หน้ารายการใบเสนอราคา (Quotation List)
 * @route /procurement/vq
 * @supports URL auto-filter: /procurement/vq?rfq_no=XXX (from RFQ navigation)
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Eye, Edit, Filter, FileText, X } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, FilterFormBuilder, SmartTable, VQStatusBadge } from '@ui';
import type { FilterFieldConfig } from '@/shared/components/ui/filters/FilterFormBuilder';
import { useTableFilters, type TableFilters } from '@/shared/hooks';
import type { ColumnDef } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';

// Services & Types
import { VQService, type VQListParams } from '@/modules/procurement/services/vq.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import type { VQListItem, VQStatus } from '@/modules/procurement/types';
import type { RFQHeader } from '@/modules/procurement/types';
import { VQFormModal } from './components';
import { logger } from '@/shared/utils/logger';

// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const VQ_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'RECEIVED', label: 'ได้รับแล้ว' },
    { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
    { value: 'CLOSED', label: 'ปิดแล้ว' },
    { value: 'COMPARED', label: 'เทียบราคาแล้ว' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================




// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function VQListPage() {
    // ==========================================================================
    // URL Query Parameter: ?rfq_no=XXX (received from RFQ navigation shortcut)
    // ==========================================================================
    const [searchParams, setSearchParams] = useSearchParams();
    const rfqNoFilter = searchParams.get('rfq_no');

    const { filters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<VQStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'quotation_no',
            search2: 'vendor_name',
            search3: 'ref_rfq_no',
            search4: 'ref_pr_no'
        }
    });

    // Modal States
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        isViewMode: boolean;
        vqId: string | null;
    }>({
        isOpen: false,
        isViewMode: false,
        vqId: null
    });

    // Auto-inject rfq_no from URL into search3 filter (runs once on mount or when param changes)
    const hasInjected = useRef(false);
    const [initialRFQForCreate, setInitialRFQForCreate] = useState<RFQHeader | null>(null);

    useEffect(() => {
        if (rfqNoFilter && !hasInjected.current) {
            setFilters({ search3: rfqNoFilter, page: 1 });
            hasInjected.current = true;
        }

        // --- Handle Auto-Open for Creation ---
        const shouldCreate = searchParams.get('create') === 'true';
        const rfqId = searchParams.get('rfq_id');
        const vendorId = searchParams.get('vendor_id');

        if (shouldCreate && !modalConfig.isOpen) {
            if (rfqId) {
                // Fetch RFQ Detail to get items
                RFQService.getById(rfqId).then((rfqData: RFQHeader) => {
                    // Create a modified header if vendorId is provided
                    const header = { ...rfqData } as RFQHeader & { vendor_id?: string };
                    if (vendorId) {
                        header.vendor_id = vendorId; 
                    }
                    setInitialRFQForCreate(header as RFQHeader);
                    setModalConfig({ isOpen: true, isViewMode: false, vqId: null });
                }).catch((err: Error) => {
                    logger.error('[VQListPage] Failed to fetch RFQ for auto-creation:', err);
                    setModalConfig({ isOpen: true, isViewMode: false, vqId: null }); // Open anyway, just empty
                });
            } else {
                setModalConfig({ isOpen: true, isViewMode: false, vqId: null });
            }
            
            // Clear the creation params from URL to prevent reopening on refresh
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('create');
                next.delete('rfq_id');
                next.delete('vendor_id');
                return next;
            }, { replace: true });
        }
    }, [rfqNoFilter, setFilters, searchParams, modalConfig.isOpen, setSearchParams]);

    // Clear the URL filter (React Router — no hard refresh)
    const handleClearRfqFilter = useCallback(() => {
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('rfq_no');     // Remove shortcut param
            newParams.set('page', '1');
            return newParams;
        }, { replace: true });
        hasInjected.current = false;
    }, [setSearchParams]);

    // Convert to API filter format
    const apiFilters: VQListParams = {
        quotation_no: filters.search || undefined,
        vendor_name: filters.search2 || undefined,
        rfq_no: filters.search3 || undefined,
        pr_no: filters.search4 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined
    };

    // Data Fetching with React Query
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['vendor-quotations', apiFilters],
        queryFn: () => VQService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // Handlers
    const handleFilterChange = (name: string, value: string) => {
        setFilters({ [name]: value });
    };

    const handleOpenView = (vqId: string) => {
        setModalConfig({ isOpen: true, isViewMode: true, vqId });
    };

    const handleOpenEdit = (vqId: string) => {
        setModalConfig({ isOpen: true, isViewMode: false, vqId });
    };

    const handleOpenCreate = () => {
        setModalConfig({ isOpen: true, isViewMode: false, vqId: null });
    };

    const handleCloseModal = () => {
        setModalConfig({ isOpen: false, isViewMode: false, vqId: null });
        setInitialRFQForCreate(null);
    };

    // Columns Definition
    const columnHelper = createColumnHelper<VQListItem>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            footer: () => <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-bold text-sm text-gray-700 dark:text-gray-200">ยอดรวมทั้งหมด :</div>,
            size: 60,
            enableSorting: false,
        }),
        columnHelper.accessor('quotation_no', {
            header: 'เลขที่ VQ',
            cell: (info) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer block" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
            size: 140,
            enableSorting: true,
        }),
        columnHelper.accessor('quotation_date', {
            header: () => <div className="text-center w-full">วันที่เอกสาร</div>,
            cell: (info) => (
                <div className="text-center text-gray-600 dark:text-gray-300 whitespace-nowrap font-medium">
                    {formatThaiDate(info.getValue())}
                </div>
            ),
            size: 110,
            enableSorting: true,
        }),
        columnHelper.accessor('vendor_name', {
            header: 'ผู้ขาย',
            cell: (info) => {
                const item = info.row.original;
                return (
                    <div className="flex flex-col min-w-0">
                        <span className="text-gray-900 dark:text-gray-100 font-medium truncate" title={info.getValue() || ''}>
                            {info.getValue() || ''}
                        </span>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            เครดิต {item.payment_term_days || '-'} วัน | Lead {item.lead_time_days || '-'} วัน
                        </div>
                    </div>
                );
            },
            size: 180,
            enableSorting: false,
        }),
        columnHelper.accessor('rfq_no', {
            header: 'เอกสารอ้างอิง',
            cell: (info) => {
                const item = info.row.original;
                return (
                    <div className="flex flex-col py-1 min-w-0">
                        <span className="text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer leading-tight truncate" title={item.rfq_no || ''}>
                            {item.rfq_no || '-'}
                        </span>
                        {item.pr_no && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-1" title={`Ref: ${item.pr_no}`}>
                                Ref: {item.pr_no}
                            </span>
                        )}
                    </div>
                );
            },
            size: 140,
            enableSorting: false,
        }),
        columnHelper.accessor('total_amount', {
            header: () => <div className="text-right w-full">ยอดสุทธิ</div>,
            cell: (info) => (
                <div className="text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {info.getValue().toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            ),
            size: 120,
            enableSorting: true,
        }),
        columnHelper.accessor('valid_until', {
            header: () => <div className="text-center w-full">วันหมดเขต</div>,
            cell: (info) => (
                <div className="text-center text-[12.5px] text-gray-500 dark:text-gray-400 font-medium">
                    {info.getValue() ? formatThaiDate(info.getValue() as string) : '-'}
                </div>
            ),
            size: 110,
            enableSorting: true,
        }),
        columnHelper.accessor('status', {
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center">
                    <VQStatusBadge status={info.getValue()} />
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex flex-row items-center justify-center gap-3 whitespace-nowrap">
                        <button 
                            onClick={() => handleOpenView(item.quotation_id)}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors" 
                            title="ดูรายละเอียด"
                        >
                            <Eye size={18} />
                        </button>
                        
                        {(item.status === 'RECEIVED' || item.status === 'DRAFT') && (
                            <button 
                                onClick={() => handleOpenEdit(item.quotation_id)}
                                className="p-1 text-blue-500 hover:text-blue-700 transition-colors" 
                                title="แก้ไข"
                            >
                                <Edit size={18} />
                            </button>
                        )}
                    </div>
                );
            },
            footer: () => {
                 const total = (data?.data || []).reduce((sum, item) => sum + item.total_amount, 0) || 0;
                 return (
                     <div className="text-right font-bold text-base text-emerald-600 dark:text-emerald-400 whitespace-nowrap pr-2">
                         {total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                     </div>
                 );
            },
            size: 140,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, data?.data]);

    const filterConfig: FilterFieldConfig<keyof TableFilters<VQStatus>>[] = useMemo(() => [
        { name: 'search', label: 'เลขที่ใบเสนอราคา', type: 'text', placeholder: 'VQ-xxx' },
        { name: 'search2', label: 'ชื่อผู้ขาย', type: 'text', placeholder: 'ชื่อผู้ขาย' },
        { name: 'search3', label: 'เลขที่ RFQ อ้างอิง', type: 'text', placeholder: 'RFQ-xxx' },
        { name: 'search4', label: 'เลขที่ PR อ้างอิง', type: 'text', placeholder: 'PR-xxx' },
        { name: 'status', label: 'สถานะ', type: 'select' as const, options: VQ_STATUS_OPTIONS },
        { name: 'dateFrom', label: 'วันที่เริ่มต้น', type: 'date' },
        { name: 'dateTo', label: 'วันที่สิ้นสุด', type: 'date' },
    ], []);

    return (
        <>
            <PageListLayout
                title="รายการใบเสนอราคา"
                subtitle={rfqNoFilter ? `รายการใบเสนอราคาสำหรับ RFQ: ${rfqNoFilter} (ตอบกลับแล้ว ${data?.total || 0} ราย)` : 'Vendor Quotation (VQ)'}
                icon={FileText}
                accentColor="blue"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                searchForm={
                    <FilterFormBuilder<TableFilters<VQStatus>>
                        config={filterConfig}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onSearch={refetch}
                        onReset={resetFilters}
                        accentColor="blue"
                        onCreate={handleOpenCreate}
                        createLabel="สร้างใบเสนอราคาใหม่"
                    />
                }
            >
                <div className="h-full flex flex-col">
                    {/* ===== Active Filter Banner (shows only when filtered via URL param) ===== */}
                    {rfqNoFilter && (
                        <div className="flex items-center justify-between gap-3 px-4 py-2.5 mb-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                                <Filter size={15} className="text-blue-500 shrink-0" />
                                <span>
                                    กำลังแสดงใบเสนอราคาสำหรับ RFQ อ้างอิง: <strong className="text-blue-900 dark:text-blue-100">{rfqNoFilter}</strong>
                                </span>
                            </div>
                            <button
                                onClick={handleClearRfqFilter}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md border border-blue-300 dark:border-blue-700 transition-colors whitespace-nowrap"
                                title="ล้างตัวกรอง แสดงทั้งหมด"
                            >
                                <X size={13} />
                                ล้างตัวกรอง
                            </button>
                        </div>
                    )}

                    <SmartTable
                        data={data?.data ?? []}
                        columns={columns as ColumnDef<VQListItem>[]}
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
                        rowIdField="quotation_id"
                        className="flex-1"
                        showFooter={true}
                    />
                </div>
            </PageListLayout>

             {/* Modals - Only mount when open */}
            {modalConfig.isOpen && (
                <VQFormModal 
                    isOpen={modalConfig.isOpen}
                    onClose={handleCloseModal}
                    onSuccess={refetch}
                    initialRFQ={initialRFQForCreate}
                    vqId={modalConfig.vqId}
                    isViewMode={modalConfig.isViewMode}
                />
            )}
        </>
    );
}