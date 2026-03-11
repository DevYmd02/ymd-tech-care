/**
 * @file VQListPage.tsx
 * @description หน้ารายการใบเสนอราคา (Quotation List)
 * @route /procurement/vq
 * @supports URL auto-filter: /procurement/vq?rfq_no=XXX (from RFQ navigation)
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { Eye, Edit, Filter, FileText, X, Search, Plus } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, SmartTable, VQStatusBadge, FilterField, MobileListCard, MobileListContainer } from '@ui';

import { useTableFilters } from '@/shared/hooks';
import type { ColumnDef } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';

// Services & Types
import { VQService, type VQListParams } from '@/modules/procurement/services/vq.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { PRService } from '@/modules/procurement/services/pr.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { VQListItem, VQStatus, RFQHeader } from '@/modules/procurement/types';
import { VQFormModal, VQVendorTrackingModal } from './components';
import { logger } from '@/shared/utils/logger';

// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const VQ_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'PENDING', label: 'รอผู้ขายตอบกลับ' },
    { value: 'RECORDED', label: 'บันทึกแล้ว' },
    { value: 'DECLINED', label: 'ผู้ขายปฏิเสธ' },
    { value: 'EXPIRED', label: 'หมดอายุ' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================




// ====================================================================================
// MICRO-COMPONENTS FOR DATA HYDRATION
// ====================================================================================

const VendorNameDisplay = ({ vendorId }: { vendorId: number }) => {
    const { data: vendor, isLoading } = useQuery({
        queryKey: ['vendor', vendorId],
        queryFn: () => VendorService.getById(vendorId),
        enabled: !!vendorId,
        staleTime: 5 * 60 * 1000,
    });
    if (isLoading) return <span className="text-gray-400 font-normal italic">กำลังโหลด...</span>;
    return <span>{vendor?.vendor_name || `รออัปเดตชื่อผู้ขาย (ID: ${vendorId})`}</span>;
};

const RFQNoDisplay = ({ rfqId }: { rfqId: number }) => {
    const { data: rfq, isLoading } = useQuery({
        queryKey: ['rfq', rfqId],
        queryFn: () => RFQService.getById(rfqId),
        enabled: !!rfqId,
        staleTime: 5 * 60 * 1000,
    });
    if (isLoading) return <span className="text-gray-400 font-normal italic">กำลังโหลด...</span>;
    return <span>{rfq?.rfq_no || `รออัปเดตเลข RFQ (ID: ${rfqId})`}</span>;
};

const PRNoDisplay = ({ prId }: { prId: number }) => {
    const { data: pr, isLoading } = useQuery({
        queryKey: ['pr', prId],
        queryFn: () => PRService.getDetail(prId),
        enabled: !!prId,
        staleTime: 5 * 60 * 1000,
    });
    if (isLoading) return <span className="text-gray-400 font-normal italic">กำลังโหลด...</span>;
    return <span>{pr?.pr_no || `PR ID: ${prId}`}</span>;
};

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function VQListPage() {
    // ==========================================================================
    // URL Query Parameter: ?rfq_no=XXX (received from RFQ navigation shortcut)
    // ==========================================================================
    const [searchParams, setSearchParams] = useSearchParams();
    const rfqNoFilter = searchParams.get('rfq_no');
    const queryClient = useQueryClient();

    const { filters, localFilters, handleFilterChange, handleApplyFilters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<VQStatus>({
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
        vqId: number | null;
    }>({
        isOpen: false,
        isViewMode: false,
        vqId: null
    });

    const [isTrackingOpen, setIsTrackingOpen] = useState(false);
    const [selectedRfqId, setSelectedRfqId] = useState<number | null>(null);
    const [selectedRfqNo, setSelectedRfqNo] = useState<string>('');

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
                RFQService.getById(Number(rfqId)).then((rfqData: RFQHeader) => {
                    // Create a modified header if vendorId is provided
                    const header = { ...rfqData } as RFQHeader & { vendor_id?: number };
                    if (vendorId) {
                        header.vendor_id = Number(vendorId); 
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

    // ==========================================================================
    // DATA HYDRATION: Master Data for Lookups
    // ==========================================================================
    
    // Removed previous bulk hydration and lookup maps to use Micro-Components pattern.

    const handleVqSuccess = useCallback(() => {
        // 1. Refresh main VQ List
        refetch();
        
        // 2. Refresh RFQ Tracking Dashboard if open
        if (selectedRfqId) {
            queryClient.invalidateQueries({ queryKey: ['rfq-vendors', selectedRfqId] });
        }

        // 3. Close the View Modal
        setModalConfig(prev => ({ ...prev, vqId: null, isOpen: false }));
    }, [refetch, selectedRfqId, queryClient]);

    // handleFilterChange is provided by useTableFilters directly — no local wrapper needed

    const handleOpenView = (vqId: number) => {
        setModalConfig({ isOpen: true, isViewMode: true, vqId });
    };

    const handleOpenEdit = (vqId: number) => {
        setModalConfig({ isOpen: true, isViewMode: false, vqId });
    };

    const handleOpenCreate = () => {
        setModalConfig({ isOpen: true, isViewMode: false, vqId: null });
    };

    const handleOpenTracking = (rfqId: number | null | undefined, rfqNo: string | null | undefined) => {
        if (!rfqId) {
            logger.warn('[VQListPage] Cannot open tracking: rfq_id is missing');
            return;
        }
        setSelectedRfqId(rfqId);
        setSelectedRfqNo(rfqNo || '');
        setIsTrackingOpen(true);
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
        columnHelper.accessor('vq_no', {
            header: 'เลขที่ VQ',
            cell: (info) => {
                const item = info.row.original;
                const vqNo = info.getValue() || item.quotation_no;
                
                return vqNo ? (
                    <span className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer block" title={vqNo}>
                        {vqNo}
                    </span>
                ) : (
                    <span className="text-gray-400 dark:text-gray-600 font-medium">-</span>
                );
            },
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
                const vendorText = info.getValue() || item.vendor?.vendor_name;

                return (
                    <div className="flex flex-col min-w-0">
                        <span className="text-gray-900 dark:text-gray-100 font-medium truncate" title={vendorText as string | undefined}>
                            {vendorText || (item.vendor_id ? <VendorNameDisplay vendorId={item.vendor_id} /> : '-')}
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
                const rfqText = info.getValue() || item.rfq?.rfq_no;
                const rfqDisplay = rfqText || (item.rfq_id ? <RFQNoDisplay rfqId={item.rfq_id} /> : '-');
                
                const prText = item.pr_no || item.pr?.pr_no;
                const prDisplay = prText || (item.pr_id ? <PRNoDisplay prId={item.pr_id} /> : null);
                
                return (
                    <div className="flex flex-col py-1 min-w-0">
                        <button 
                            onClick={() => handleOpenTracking(item.rfq_id, rfqText as string | undefined)}
                            className="text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer leading-tight truncate text-left w-fit" 
                            title={rfqText ? `คลิกเพื่อดูภาพรวมการตอบกลับของกลุ่ม RFQ: ${rfqText}` : undefined}
                        >
                            {rfqDisplay}
                        </button>
                        {prDisplay && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-1">
                                Ref: {prDisplay}
                            </span>
                        )}
                    </div>
                );
            },
            size: 140,
            enableSorting: false,
        }),
        columnHelper.accessor('base_total_amount', {
            header: () => <div className="text-right w-full">ยอดสุทธิ</div>,
            cell: (info) => {
                const item = info.row.original;
                const amount = info.getValue();
                const isRecorded = item.status === 'RECORDED';
                
                return (
                    <div className={`text-right font-bold whitespace-nowrap ${isRecorded ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-200'}`}>
                        {amount
                            ? Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '-'
                        }
                    </div>
                );
            },
            size: 120,
            enableSorting: true,
        }),
        columnHelper.accessor('quotation_expiry_date', {
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
                // Simplified Action Logic Rules (PENDING -> RECORDED):
                // 1. Record Price is ONLY for PENDING records without a VQ number yet.
                const canRecord = item.status === 'PENDING' && !item.quotation_no;
                
                // 2. Edit and View logic:
                // - RECORDED or CANCELLED are read-only (View only)
                // - DRAFT or partials with VQ no. (if any) can be edited
                const isRecorded = item.status === 'RECORDED';
                const isCancelled = item.status === 'CANCELLED';
                const hasVqDocument = !!item.quotation_no || isRecorded || item.status === 'DRAFT';

                const canEdit = hasVqDocument && !isCancelled && !isRecorded;
                const canView = hasVqDocument || isCancelled;
                
                // If nothing can be done, render a dash
                if (!canRecord && !canEdit && !canView) {
                    return <div className="flex justify-center text-gray-400 font-bold">-</div>;
                }

                return (
                    <div className="flex flex-row items-center justify-center gap-2 whitespace-nowrap">
                        {/* View — PR pattern eye */}
                        {canView && (
                            <button 
                                onClick={() => handleOpenView(item.vq_header_id)}
                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
                                title="ดูรายละเอียด"
                            >
                                <Eye size={16} />
                            </button>
                        )}

                        {/* Edit — amber transparent-border compact (PR pattern) */}
                        {canEdit && (
                            <button 
                                onClick={() => handleOpenEdit(item.vq_header_id)}
                                className="flex items-center gap-1 pl-1.5 pr-2 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded shadow-sm border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all whitespace-nowrap"
                                title="แก้ไข"
                            >
                                <Edit size={14} />
                                <span className="text-[10px] font-bold">แก้ไข</span>
                            </button>
                        )}

                        {/* บันทึกราคา — blue solid (create-next-doc style, matching สร้าง RFQ) */}
                        {canRecord && (
                            <button 
                                onClick={() => handleOpenEdit(item.vq_header_id)}
                                className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                title="บันทึกราคา"
                            >
                                <Edit size={12} />
                                <span>บันทึกราคา</span>
                            </button>
                        )}
                    </div>
                );
            },
            footer: () => {
                 // Only sum RECORDED amounts for the grand total
                 const total = (data?.data ?? []).reduce((sum, item) => {
                    const amount = item.base_total_amount;
                    return item.status === 'RECORDED' && amount ? sum + Number(amount) : sum;
                 }, 0);
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
                    <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="w-full">
                        <div className="flex flex-col gap-4">
                            {/* The Input Grid (Responsive) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                <FilterField
                                    label="เลขที่ใบเสนอราคา"
                                    type="text"
                                    placeholder="VQ-xxx"
                                    value={localFilters.search || ''}
                                    onChange={(val) => handleFilterChange('search', val)}
                                    accentColor="blue"
                                />
                                <FilterField
                                    label="ชื่อผู้ขาย"
                                    type="text"
                                    placeholder="ชื่อผู้ขาย"
                                    value={localFilters.search2 || ''}
                                    onChange={(val) => handleFilterChange('search2', val)}
                                    accentColor="blue"
                                />
                                <FilterField
                                    label="เลขที่ RFQ อ้างอิง"
                                    type="text"
                                    placeholder="RFQ-xxx"
                                    value={localFilters.search3 || ''}
                                    onChange={(val) => handleFilterChange('search3', val)}
                                    accentColor="blue"
                                />
                                <FilterField
                                    label="เลขที่ PR อ้างอิง"
                                    type="text"
                                    placeholder="PR-xxx"
                                    value={localFilters.search4 || ''}
                                    onChange={(val) => handleFilterChange('search4', val)}
                                    accentColor="blue"
                                />
                                <FilterField
                                    label="สถานะ"
                                    type="select"
                                    options={VQ_STATUS_OPTIONS}
                                    value={localFilters.status || ''}
                                    onChange={(val) => handleFilterChange('status', val)}
                                    accentColor="blue"
                                />
                                <FilterField
                                    label="วันที่เริ่มต้น"
                                    type="date"
                                    value={localFilters.dateFrom || ''}
                                    onChange={(val) => handleFilterChange('dateFrom', val)}
                                    accentColor="blue"
                                />
                                <FilterField
                                    label="วันที่สิ้นสุด"
                                    type="date"
                                    value={localFilters.dateTo || ''}
                                    onChange={(val) => handleFilterChange('dateTo', val)}
                                    accentColor="blue"
                                />
                            </div>

                            {/* The Button Group (Isolated & Full Width) */}
                            <div className="flex justify-end items-center gap-4 border-t border-slate-200 dark:border-slate-700/60 pt-5 mt-5">
                                {/* 1. ล้างค่า (Clear) */}
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="h-10 px-6 flex items-center justify-center text-base font-medium rounded-md transition-colors bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-white dark:text-slate-900 dark:border-transparent dark:hover:bg-slate-200"
                                >
                                    ล้างค่า
                                </button>
                                
                                {/* 2. ค้นหา (Search) */}
                                <button
                                    type="submit"
                                    className="h-10 px-6 flex items-center justify-center gap-2 text-base font-medium rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    <Search className="w-4 h-4" /> ค้นหา
                                </button>
                                
                                {/* 3. สร้างใบเสนอราคาใหม่ (Create) */}
                                <button
                                    type="button"
                                    onClick={handleOpenCreate}
                                    className="w-full sm:w-auto h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                     <Plus size={16} strokeWidth={2.5} />สร้างใบเสนอราคาใหม่
                                </button>
                            </div>
                        </div>
                    </form>
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

                    {/* Desktop View: Table */}
                    <div className="hidden md:block flex-1 overflow-hidden">
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
                            rowIdField="vq_header_id"
                            className="flex-1"
                            showFooter={true}
                        />
                    </div>

                    {/* Mobile View: Cards (shared MobileListContainer + MobileListCard) */}
                    <MobileListContainer
                        isLoading={isLoading}
                        isEmpty={!data?.data?.length}
                        pagination={data?.total ? { page: filters.page, total: data.total, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                    >
                        {(data?.data ?? []).map((item) => {
                            const vendorDisplay = item.vendor_name || item.vendor?.vendor_name || (item.vendor_id ? <VendorNameDisplay vendorId={item.vendor_id} /> : '-');
                            
                            const rfqDisplay = item.rfq_no || item.rfq?.rfq_no || (item.rfq_id ? <RFQNoDisplay rfqId={item.rfq_id} /> : '-');
                            
                            const prDisplay = item.pr_no || item.pr?.pr_no || (item.pr_id ? <PRNoDisplay prId={item.pr_id} /> : '-');

                            return (
                                <MobileListCard
                                    key={item.vq_header_id}
                                    title={item.vq_no || item.quotation_no || <span className="text-gray-400 dark:text-slate-500 italic text-base">รอเลขใบเสนอราคา</span>}
                                    subtitle={formatThaiDate(item.quotation_date)}
                                    statusBadge={<VQStatusBadge status={item.status} />}
                                    details={[
                                        { label: 'ผู้ขาย:', value: vendorDisplay },
                                        { label: 'RFQ อ้างอิง:', value: <span className="font-semibold text-blue-600 dark:text-blue-400">{rfqDisplay}</span> },
                                        { label: 'PR อ้างอิง:', value: prDisplay },
                                        { label: 'เครดิต / Lead:', value: `${item.payment_term_days || '-'} วัน / ${item.lead_time_days || '-'} วัน` },
                                    ]}
                                    amountLabel="ยอดสุทธิ"
                                    amountValue={
                                        <span className={`font-bold text-lg ${
                                            item.status === 'RECORDED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-slate-200'
                                        }`}>
                                            {item.base_total_amount
                                                ? Number(item.base_total_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })
                                                : '-'}
                                        </span>
                                    }
                                    actions={
                                    <>
                                        {(!!item.quotation_no || item.status === 'RECORDED' || item.status === 'CANCELLED') && (
                                            <button
                                                onClick={() => handleOpenView(item.vq_header_id)}
                                                className="flex-1 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200 dark:border-slate-600"
                                            >
                                                <Eye size={14} /> ดู
                                            </button>
                                        )}
                                        {item.status === 'PENDING' && !item.quotation_no && (
                                            <button
                                                onClick={() => handleOpenEdit(item.vq_header_id)}
                                                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                            >
                                                <Edit size={14} /> บันทึกราคา
                                            </button>
                                        )}
                                        {!!item.quotation_no && item.status !== 'CANCELLED' && item.status !== 'RECORDED' && (
                                            <button
                                                onClick={() => handleOpenEdit(item.vq_header_id)}
                                                className="flex-1 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                            >
                                                <Edit size={14} /> แก้ไข
                                            </button>
                                        )}
                                    </>
                                    }
                                />
                            );
                        })}
                    </MobileListContainer>
                </div>

            </PageListLayout>

             {/* Modals - Only mount when open */}
            {modalConfig.isOpen && (
                <VQFormModal 
                    isOpen={modalConfig.isOpen}
                    onClose={handleCloseModal}
                    onSuccess={handleVqSuccess}
                    initialRFQ={initialRFQForCreate}
                    vqId={modalConfig.vqId}
                    isViewMode={modalConfig.isViewMode}
                />
            )}

            <VQVendorTrackingModal
                isOpen={isTrackingOpen}
                onClose={() => setIsTrackingOpen(false)}
                rfqId={selectedRfqId}
                rfqNo={selectedRfqNo}
            />
        </>
    );
}