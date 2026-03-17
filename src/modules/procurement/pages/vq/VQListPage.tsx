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

// Services & Types
import { VQService, type VQListParams } from '@/modules/procurement/services/vq.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';

import type { VQListItem, VQStatus, RFQHeader, VQPendingQueueItem } from '@/modules/procurement/types';
import { VQFormModal, VQVendorTrackingModal } from './components';
import { logger } from '@/shared/utils/logger';

import { getColumns, getPendingColumns } from './components/VQColumns';
import { RFQNoDisplay, PRNoDisplay } from './components/VQColumnComponents';
import { useVendorsBatchQuery } from './hooks/useVendorsBatchQuery';
import { VQ_STATUS_MAP, RFQ_VENDOR_STATUS_MAP } from './constants/vq.constants';


// ====================================================================================
// FILTER CONFIG
// ====================================================================================




// ====================================================================================
// MICRO-COMPONENTS FOR DATA HYDRATION
// ====================================================================================

// VendorNameDisplay removed (N+1 optimized)


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

    // Modal States (Consolidated)
    const [isVqModalOpen, setIsVqModalOpen] = useState(false);
    const [selectedVqId, setSelectedVqId] = useState<number | null>(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [initialRFQForCreate, setInitialRFQForCreate] = useState<RFQHeader | null>(null);

    const activeTab = (searchParams.get('tab') as 'ALL' | 'WAITING_VQ' | 'WAITING_RFQ') || 'ALL';

    const handleTabChange = useCallback((newTab: 'ALL' | 'WAITING_VQ' | 'WAITING_RFQ') => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('tab', newTab);
            next.set('page', '1'); // Reset page to 1 on tab switch
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const [isTrackingOpen, setIsTrackingOpen] = useState(false);
    const [selectedRfqId, setSelectedRfqId] = useState<number | null>(null);
    const [selectedRfqNo, setSelectedRfqNo] = useState<string>('');

    // Auto-inject rfq_no from URL into search3 filter (runs once on mount or when param changes)
    const hasInjected = useRef(false);

    useEffect(() => {
        if (rfqNoFilter && !hasInjected.current) {
            setFilters({ search3: rfqNoFilter, page: 1 });
            hasInjected.current = true;
        }

        // --- Handle Auto-Open for Creation via URL Params ---
        const shouldCreate = searchParams.get('create') === 'true';
        const rfqId = searchParams.get('rfq_id');
        const vendorId = searchParams.get('vendor_id');
        const rfqVendorId = searchParams.get('rfq_vendor_id');

        if (shouldCreate && !isVqModalOpen) {
            if (rfqId) {
                // Fetch RFQ Detail to get items for hydration
                RFQService.getById(Number(rfqId)).then((rfqData: RFQHeader) => {
                    const header = { 
                        ...rfqData,
                        vendor_id: vendorId ? Number(vendorId) : rfqData.vendor_id,
                        rfq_vendor_id: rfqVendorId ? Number(rfqVendorId) : rfqData.rfq_vendor_id
                    } as RFQHeader;
                    
                    setInitialRFQForCreate(header);
                    setSelectedVqId(null);
                    setIsViewMode(false);
                    setIsVqModalOpen(true);
                }).catch((err: Error) => {
                    logger.error('[VQListPage] Failed to fetch RFQ for auto-creation:', err);
                    // Open anyway, fallback to empty/manual
                    setSelectedVqId(null);
                    setIsViewMode(false);
                    setIsVqModalOpen(true);
                });
            } else {
                setSelectedVqId(null);
                setIsViewMode(false);
                setIsVqModalOpen(true);
            }
            
            // ✅ Clean URL immediately after state hydration to prevent redundant triggers
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('create');
                next.delete('rfq_id');
                next.delete('vendor_id');
                next.delete('rfq_vendor_id');
                return next;
            }, { replace: true });
        }
    }, [rfqNoFilter, setFilters, searchParams, isVqModalOpen, setSearchParams, setInitialRFQForCreate]);

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

    const { data: waitingVqData, isLoading: isWaitingVqLoading, refetch: refetchWaitingVq } = useQuery({
        queryKey: ['waiting-for-vq-vendor', apiFilters],
        queryFn: () => VQService.getWaitingForVQ(apiFilters),
        enabled: activeTab === 'WAITING_VQ',
        staleTime: 1 * 60 * 1000,
    });

    const { data: waitingRfqData, isLoading: isWaitingRfqLoading, refetch: refetchWaitingRfq } = useQuery({
        queryKey: ['waiting-for-rfq-vendor', apiFilters],
        queryFn: () => VQService.getWaitingForRFQ(apiFilters),
        enabled: activeTab === 'WAITING_RFQ',
        staleTime: 1 * 60 * 1000,
    });

    // ==========================================================================
    // DATA HYDRATION: Master Data for Lookups
    // ==========================================================================
    
    // Removed previous bulk hydration and lookup maps to use Micro-Components pattern.

    const totalAmount = useMemo(() => {
        return (data?.data ?? []).reduce((sum, item) => {
            // Include both DRAFT and RECORDED in total calculation
            if (!['RECORDED', 'DRAFT'].includes(item.status)) return sum;
            const amount = Number(item.base_total_amount);
            return isNaN(amount) ? sum : sum + amount;
        }, 0);
    }, [data?.data]);

    const handleVqSuccess = useCallback(() => {
        // 1. Refresh main list and pending queues
        refetch();
        refetchWaitingVq();
        refetchWaitingRfq();
        queryClient.invalidateQueries({ queryKey: ['waiting-for-vq-vendor'] });
        queryClient.invalidateQueries({ queryKey: ['waiting-for-rfq-vendor'] });
        
        // 2. Refresh RFQ Tracking if open
        if (selectedRfqId) {
            queryClient.invalidateQueries({ queryKey: ['rfq-vendors', selectedRfqId] });
        }

        // 3. Reset Modal State
        setIsVqModalOpen(false);
        setSelectedVqId(null);
    }, [refetch, refetchWaitingVq, refetchWaitingRfq, selectedRfqId, queryClient]);

    const handleOpenView = useCallback((vqId: number) => {
        setSelectedVqId(vqId);
        setIsViewMode(true);
        setIsVqModalOpen(true);
    }, [])

    const handleOpenEdit = useCallback((vqId: number) => {
        setSelectedVqId(vqId);
        setIsViewMode(false);
        setIsVqModalOpen(true);
    }, [])

    const handleOpenCreate = () => {
        setSelectedVqId(null);
        setInitialRFQForCreate(null);
        setIsViewMode(false);
        setIsVqModalOpen(true);
    };

    const handleOpenTracking = useCallback((rfqId: number | null | undefined, rfqNo: string | null | undefined) => {
        if (!rfqId) {
            logger.warn('[VQListPage] Cannot open tracking: rfq_id is missing');
            return;
        }
        setSelectedRfqId(rfqId);
        setSelectedRfqNo(rfqNo || '');
        setIsTrackingOpen(true);
    }, [])

    const handleCloseModal = () => {
        setIsVqModalOpen(false);
        setSelectedVqId(null);
        setInitialRFQForCreate(null);
    };

    // ==========================================================================
    // 📊 BATCH FETCHING & COLUMNS (N+1 Optimized)
    // ==========================================================================
    
    // 1. Extract IDs from active lists for current view mode (Strict No Over-fetching)
    const visibleVendorIds = useMemo(() => {
        const list = activeTab === 'ALL' 
            ? (data?.data ?? []) 
            : activeTab === 'WAITING_VQ' 
                ? (waitingVqData?.data ?? []) 
                : (waitingRfqData?.data ?? []);
        return Array.from(new Set(list.map((item: VQListItem | VQPendingQueueItem) => item.vendor_id).filter(Boolean))) as number[];
    }, [activeTab, data?.data, waitingVqData?.data, waitingRfqData?.data]);

    // 2. Fetch Batch
    const { vendorMap } = useVendorsBatchQuery(visibleVendorIds);

    // 3. Memoize Columns
    const columns = useMemo(() => getColumns({
        vendorMap,
        filters: { page: filters.page, limit: filters.limit },
        totalAmount,
        handleOpenView,
        handleOpenEdit,
        handleOpenTracking
    }), [vendorMap, filters.page, filters.limit, totalAmount, handleOpenView, handleOpenEdit, handleOpenTracking]);

    const pendingVqColumns = useMemo(() => getPendingColumns('WAITING_VQ', {
        vendorMap,
        filters: { page: filters.page, limit: filters.limit },
        totalAmount: 0,
        handleOpenView: () => {},
        handleOpenEdit: () => {},
        handleOpenTracking: () => {},
        setInitialRFQForCreate,
        setIsVqModalOpen,
        setSelectedVqId,
        setIsViewMode
    }), [filters.page, filters.limit, setInitialRFQForCreate, setIsVqModalOpen, setSelectedVqId, setIsViewMode, vendorMap]);

    const pendingRfqColumns = useMemo(() => getPendingColumns('WAITING_RFQ', {
        vendorMap,
        filters: { page: filters.page, limit: filters.limit },
        totalAmount: 0,
        handleOpenView: () => {},
        handleOpenEdit: () => {},
        handleOpenTracking: () => {},
        setInitialRFQForCreate,
        setIsVqModalOpen,
        setSelectedVqId,
        setIsViewMode
    }), [filters.page, filters.limit, setInitialRFQForCreate, setIsVqModalOpen, setSelectedVqId, setIsViewMode, vendorMap]);



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
                                    options={
                                        activeTab === 'ALL'
                                            ? Object.entries(VQ_STATUS_MAP).map(([val, {label}]) => ({ value: val, label }))
                                            : activeTab === 'WAITING_RFQ'
                                                ? Object.entries(RFQ_VENDOR_STATUS_MAP).filter(([val]) => val === 'ALL' || val === 'NEW' || val === 'WAITING').map(([val, {label}]) => ({ value: val, label }))
                                                : [{ value: 'ALL', label: 'ทั้งหมด (ส่ง RFQ แล้ว)' }] // for WAITING_VQ it is implicitly SENT status
                                    }
                                    value={localFilters.status || ''}
                                    onChange={(val) => handleFilterChange('status', val)}
                                    accentColor="blue"
                                    disabled={activeTab === 'WAITING_VQ'}
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
                                    className="h-10 px-6 flex items-center justify-center text-base font-medium rounded-md transition-colors bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-white dark:text-slate-900 dark:border-transparent dark:hover:bg-slate-200 whitespace-nowrap"
                                >
                                    ล้างค่า
                                </button>
                                
                                {/* 2. ค้นหา (Search) */}
                                <button
                                    type="submit"
                                    className="h-10 px-6 flex items-center justify-center gap-2 text-base font-medium rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
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
                    {/* ===== Tabs Header ===== */}
                    <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 mb-4 px-2">
                        <button
                            onClick={() => handleTabChange('ALL')}
                            className={`flex items-center gap-2 py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'ALL'
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            ใบเสนอราคาทั้งหมด
                        </button>
                        <button
                            onClick={() => handleTabChange('WAITING_VQ')}
                            className={`flex justify-between items-center py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'WAITING_VQ'
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            รอผู้ขายตอบกลับ (VQ) 
                            {waitingVqData && waitingVqData.total > 0 && (
                                <span className="inline-flex items-center justify-center w-5 h-5 ml-2 text-[10px] font-bold text-white bg-red-500 rounded-full">
                                    {waitingVqData.total}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('WAITING_RFQ')}
                            className={`flex justify-between items-center py-2.5 px-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'WAITING_RFQ'
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            รอดำเนินการ (RFQ)
                            {waitingRfqData && waitingRfqData.total > 0 && (
                                <span className="inline-flex items-center justify-center w-5 h-5 ml-2 text-[10px] font-bold text-gray-600 bg-gray-200 dark:text-gray-300 dark:bg-gray-700 rounded-full">
                                    {waitingRfqData.total}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* ===== Active Filter Banner (shows only when filtered via URL param) ===== */}
                    {activeTab === 'ALL' && rfqNoFilter && (
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
                        {activeTab === 'ALL' && (
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
                        )}
                        {activeTab === 'WAITING_VQ' && (
                            <SmartTable
                                // 🔥 TODO: Move filter logic to backend API (Pass status or has_vq flag)
                                // Only show RFQs that have been SENT to vendors
                                data={waitingVqData?.data ?? []}
                                columns={pendingVqColumns as ColumnDef<VQPendingQueueItem>[]}
                                isLoading={isWaitingVqLoading}
                                pagination={{
                                    pageIndex: filters.page,
                                    pageSize: filters.limit,
                                    totalCount: waitingVqData?.total ?? 0,
                                    onPageChange: handlePageChange,
                                    onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 })
                                }}
                                rowIdField="rfq_vendor_id"
                                className="flex-1"
                                showFooter={false}
                            />
                        )}
                        {activeTab === 'WAITING_RFQ' && (
                            <SmartTable
                                // 🔥 TODO: Move filter logic to backend API (Pass status or has_vq flag)
                                // RFQ Tab should only show items that haven't been sent or recorded yet.
                                data={waitingRfqData?.data ?? []}
                                columns={pendingRfqColumns as ColumnDef<VQPendingQueueItem>[]}
                                isLoading={isWaitingRfqLoading}
                                pagination={{
                                    pageIndex: filters.page,
                                    pageSize: filters.limit,
                                    totalCount: waitingRfqData?.total ?? 0,
                                    onPageChange: handlePageChange,
                                    onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 })
                                }}
                                rowIdField="rfq_vendor_id"
                                className="flex-1"
                                showFooter={false}
                            />
                        )}
                    </div>

                    {/* Mobile View: Cards (shared MobileListContainer + MobileListCard) */}
                    {activeTab === 'ALL' && (
                        <MobileListContainer
                            isLoading={isLoading}
                            isEmpty={!data?.data?.length}
                            pagination={data?.total ? { page: filters.page, total: data.total, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                        >
                            {(data?.data ?? []).map((item) => {
                            const vendorDisplay = item.vendor_name || item.vendor?.vendor_name || (item.vendor_id ? (vendorMap[item.vendor_id] || '-') : '-');
                            
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
                    )}
                    {(activeTab === 'WAITING_VQ' || activeTab === 'WAITING_RFQ') && (() => {
                        const targetData = activeTab === 'WAITING_VQ' ? waitingVqData : waitingRfqData;
                        const targetLoading = activeTab === 'WAITING_VQ' ? isWaitingVqLoading : isWaitingRfqLoading;
                        
                                                // Server-side filtered data
                        const filteredData = targetData?.data ?? [];

                        return (
                            <MobileListContainer
                                isLoading={targetLoading}
                                isEmpty={!filteredData.length}
                                pagination={targetData?.total ? { page: filters.page, total: targetData.total, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                            >
                                {filteredData.map((item) => (
                                    <MobileListCard
                                        key={item.rfq_vendor_id}
                                        title={<span className="text-gray-400 dark:text-slate-500 italic text-base">รอดำเนินการ</span>}
                                        subtitle={formatThaiDate(item.created_at)}
                                        statusBadge={
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                                                {item.status}
                                            </span>
                                        }
                                        details={[
                                            { label: 'ผู้ขาย:', value: item.vendor_name || '-' },
                                            { label: 'RFQ อ้างอิง:', value: <span className="font-semibold text-purple-600 dark:text-purple-400">{item.rfq_no || '-'}</span> },
                                            { label: 'PR อ้างอิง:', value: item.pr_no || '-' },
                                        ]}
                                        actions={
                                            activeTab === 'WAITING_VQ' && (
                                                <button
                                                    onClick={() => {
                                                        const rfqInit: Partial<RFQHeader> = {
                                                            rfq_id: item.rfq_id,
                                                            rfq_no: item.rfq_no,
                                                        };
                                                        
                                                        setInitialRFQForCreate({ 
                                                            ...rfqInit, 
                                                            vendor_id: item.vendor_id, 
                                                            rfq_vendor_id: item.rfq_vendor_id 
                                                        } as RFQHeader);
                                                        
                                                        setSelectedVqId(null);
                                                        setIsViewMode(false);
                                                        setIsVqModalOpen(true);
                                                    }}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 mt-2 shadow-sm"
                                                >
                                                    <Plus size={14} strokeWidth={2.5} /> สร้างใบเสนอราคา
                                                </button>
                                            )
                                        }
                                    />
                                ))}
                            </MobileListContainer>
                        );
                    })()}
                </div>

            </PageListLayout>

             {/* Modals - Only mount when open and positioned outside layout */}
            {isVqModalOpen && (
                <VQFormModal 
                    isOpen={isVqModalOpen}
                    onClose={handleCloseModal}
                    onSuccess={handleVqSuccess}
                    initialRFQ={initialRFQForCreate}
                    vqId={selectedVqId}
                    isViewMode={isViewMode}
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