/**
 * @file RFQListPage.tsx
 * @description หน้ารายการใบขอใบเสนอราคา (Request for Quotation List)
 * @role "Request Manager & Monitor" — NO data-entry actions (ย้ายไป QT/QC แล้ว)
 * @route /procurement/rfq
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { FileText, Eye, Send, Edit, Search, Plus } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, SmartTable, RFQStatusBadge, FilterField, MobileListCard, MobileListContainer } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import { createColumnHelper } from '@tanstack/react-table';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { logger } from '@/shared/utils/logger';
// Services & Types
import { RFQService } from '@/modules/procurement/services';
import type { RFQFilterCriteria, RFQHeader, RFQStatus, SendRFQToVendorPayload } from '@/modules/procurement/types';
import { RFQFormModal, RFQSendConfirmModal } from './components';




// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const RFQ_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'SENT', label: 'ส่งแล้ว' },
    { value: 'CLOSED', label: 'ปิดแล้ว' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================



// const RFQ_FILTER_CONFIG: FilterFieldConfig<RFQFilterKeys>[] = [
//     { name: 'search', label: 'เลขที่ RFQ', type: 'text', placeholder: 'RFQ-xxx' },
//     { name: 'search2', label: 'PR อ้างอิง', type: 'text', placeholder: 'PR-xxx' },
//     { name: 'creator', label: 'ผู้สร้าง RFQ', type: 'text', placeholder: 'ชื่อผู้สร้าง' },
//     { name: 'status', label: 'สถานะ', type: 'select', options: RFQ_STATUS_OPTIONS },
//     { name: 'dateFrom', label: 'วันที่เริ่มต้น', type: 'date' },
//     { name: 'dateTo', label: 'วันที่สิ้นสุด', type: 'date' },
// ];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function RFQListPage() {
    // URL-based Filter State
    const { filters, localFilters, handleFilterChange, handleApplyFilters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<RFQStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'rfq_no',
            search2: 'ref_pr_no',
            search3: 'creator_name'
        }
    });

    // Convert to API filter format using APPLIED filters (from URL)
    const apiFilters: RFQFilterCriteria = {
        rfq_no: filters.search || undefined,
        ref_pr_no: filters.search2 || undefined,
        creator_name: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined
    };

    // Data Fetching — driven by applied filters (URL params only)
    const { data, isLoading } = useQuery({
        queryKey: ['rfqs', apiFilters],
        queryFn: () => RFQService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Modal States (RFQ Form only — QT modal removed, belongs to QT page)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRFQId, setSelectedRFQId] = useState<number | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isInviteMode, setIsInviteMode] = useState(false);

    // Send RFQ Modal State (replaces old ConfirmationModal)
    const [sendingRFQ, setSendingRFQ] = useState<RFQHeader | null>(null);
    const [isSending, setIsSending] = useState(false);

    // Handlers

    const handleCreate = () => {
        setSelectedRFQId(null);
        setIsReadOnly(false);
        setIsInviteMode(false);
        setIsModalOpen(true);
    };

    const handleView = useCallback((id: number) => {
        setSelectedRFQId(id);
        setIsReadOnly(true);
        setIsInviteMode(false);
        setIsModalOpen(true);
    }, []);

    const handleEdit = useCallback((item: RFQHeader) => {
        setSelectedRFQId(item.rfq_id);
        setIsReadOnly(false);
        setIsInviteMode(false);
        setIsModalOpen(true);
    }, []);

    const handleAddMoreVendors = useCallback((item: RFQHeader) => {
        setSendingRFQ(item);
    }, []);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRFQId(null);
        setIsReadOnly(false);
        setIsInviteMode(false);
    };

    // --- Send RFQ: opens Pre-flight modal ---
    const handleSendRFQ = useCallback((rfq: RFQHeader) => {
        setSendingRFQ(rfq);
    }, []);

    const executeSendRFQ = async (
        batchData: Array<{ rfqVendorId: number; payload: SendRFQToVendorPayload }>
    ) => {
        if (!sendingRFQ || batchData.length === 0) return;

        setIsSending(true);
        try {
            logger.info(`[RFQListPage] Executing batch send for ${batchData.length} vendors`);
            
            // Execute multiple PATCH calls in parallel
            // We use allSettled to ensure we try all even if some fail
            const results = await Promise.allSettled(
                batchData.map(item => RFQService.sendToVendor(item.rfqVendorId, item.payload))
            );

            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                logger.error('[RFQListPage] Some RFQ sends failed:', failures);
                toast(`ส่งสำเร็จ ${batchData.length - failures.length} รายการ, ล้มเหลว ${failures.length} รายการ`, 'error');
            } else {
                toast(`ส่ง RFQ ${sendingRFQ.rfq_no} เรียบร้อยแล้วทุกรายการ`, 'success');
            }

            // Always invalidate to get fresh X/Y counters
            // Delay 100ms to ensure backend consistency (Gold Standard pattern)
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['rfqs'] });
                handleApplyFilters();
            }, 100);
            setSendingRFQ(null);
        } catch (error) {
            logger.error('[RFQListPage] executeSendRFQ unexpected error:', error);
            toast('เกิดข้อผิดพลาดไม่คาดคิดในการส่ง RFQ', 'error');
        } finally {
            setIsSending(false);
        }
    };

    // Columns
    const columnHelper = createColumnHelper<RFQHeader>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center h-full w-full">ลำดับ</div>,
            cell: (info) => <div className="flex justify-center items-center h-full w-full">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            size: 60,
            enableSorting: false,
        }),
        columnHelper.accessor('rfq_no', {
            header: 'ข้อมูล RFQ',
            cell: (info) => {
                const item = info.row.original;
                const prNumber = item.ref_pr_no || item.pr_no || item.pr?.pr_no;

                return (
                    <div className="flex flex-col py-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer" title={info.getValue()}>
                            {info.getValue()}
                        </span>
                        {prNumber && (
                            <span className="text-xs text-gray-500 mt-1">
                                Ref: {prNumber}
                            </span>
                        )}
                    </div>
                );
            },
            size: 180,
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'purpose',
            header: 'หมายเหตุ',
            cell: ({ row }) => {
                const item = row.original;
                // API list endpoint ไม่ส่ง `purpose` มาโดยตรง — fallback ไปใช้บรรทัดแรกของ remarks
                const purposeText = item.purpose || item.remarks?.split('\n')[0]?.trim() || '-';
                return (
                    <div className="max-w-[250px] truncate py-2" title={purposeText}>
                        {purposeText}
                    </div>
                );
            },
            size: 250,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'creator',
            header: 'ผู้สร้าง RFQ',
            cell: ({ row }) => {
                const item = row.original;
                const u = item.requested_by_user;
                const creatorName = u
                    ? `${u.employee_firstname_th} ${u.employee_lastname_th}`.trim()
                    : (item.created_by_name || item.creator_name || '-');
                return (
                    <div className="flex flex-col py-2">
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {creatorName}
                        </span>
                        <span className="text-xs text-gray-400">
                            {formatThaiDate(item.rfq_date)}
                        </span>
                    </div>
                );
            },
            size: 160,
            enableSorting: false,
        }),
        columnHelper.accessor('quotation_due_date', {
            header: 'ครบกำหนด',
            cell: (info) => {
                const dateStr = info.getValue();
                if (!dateStr) return <span className="text-slate-400 py-2 block text-center">-</span>;

                // Smart date color: Overdue → rose, Approaching (0-3 days) → amber, Future → slate
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDate = new Date(dateStr);
                dueDate.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                let colorClass = 'text-slate-600 dark:text-slate-400'; // Future (> 3 days)
                if (diffDays < 0) {
                    colorClass = 'text-rose-600 dark:text-rose-400 font-semibold'; // Overdue
                } else if (diffDays <= 3) {
                    colorClass = 'text-amber-600 dark:text-amber-400 font-semibold'; // Approaching
                }

                return (
                    <span className={`${colorClass} whitespace-nowrap py-2 block`}>
                        {formatThaiDate(dateStr)}
                    </span>
                );
            },
            size: 110,
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'vendors',
            header: () => <div className="flex justify-center items-center w-full h-full">ผู้ขาย (ส่ง/ทั้งหมด)</div>,
            cell: ({ row }) => {
                const item = row.original;
                // UI Counters from Backend (X / Y)
                const sentCount = item.vendor_sent ?? item.sent_vendors_count ?? 0;
                const total = item.vendor_total ?? item.vendor_count ?? 0;

                return (
                    <div className="flex flex-col items-center justify-center h-full py-2">
                        <span className="text-gray-700 dark:text-gray-300 font-medium leading-none mb-0.5">
                            {`${sentCount} / ${total}`}
                        </span>
                    </div>
                );
            },
            size: 80,
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: () => <div className="flex justify-center items-center w-full h-full">สถานะ</div>,
            cell: (info) => {
                const item = info.row.original;
                
                let dynamicStatus = info.getValue() as string;
                
                // Override status dynamically based on X/Y logic from backend
                const sentCount = item.vendor_sent ?? 0;
                const total = item.vendor_total ?? 0;
                
                if (total > 0 && sentCount === total) {
                    dynamicStatus = 'SENT';
                } else if (total > 0 && sentCount > 0 && sentCount < total) {
                    // Partially sent can still show DRAFT or maybe a new "PARTIAL" if we had one
                    // but according to prompt: SENT if sent===total, else DRAFT
                    dynamicStatus = 'DRAFT';
                }

                return (
                    <div className="flex justify-center items-center h-full py-2">
                        <RFQStatusBadge status={dynamicStatus as RFQStatus} />
                    </div>
                );
            },
            size: 100,
            enableSorting: false,
        }),
        // ==========================================================================
        // ACTION COLUMN — Strict State Machine
        // Role: RFQ = "Request Manager & Monitor" ONLY
        // Data entry → QTListPage | Comparison → QCListPage
        // ==========================================================================
        columnHelper.display({
            id: 'actions',
            header: () => <div className="flex justify-center items-center w-full h-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;

                return (
                    <div className="flex flex-row items-center justify-center gap-2 w-full h-full py-1 whitespace-nowrap">
                        
                        {/* Eye — always visible */}
                        <button 
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
                            title="ดูรายละเอียด"
                            onClick={() => handleView(item.rfq_id)}
                        >
                            <Eye size={16} />
                        </button>
                        
                        {item.status !== 'CLOSED' && item.status !== 'CANCELLED' && (
                            <>
                                {/* DRAFT: [แก้ไข] + [ส่ง RFQ] */}
                                {item.status === 'DRAFT' && (
                                    <>
                                        <button 
                                            className="flex items-center gap-1 pl-1.5 pr-2 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded shadow-sm border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all whitespace-nowrap"
                                            title="แก้ไข"
                                            onClick={() => handleEdit(item)}
                                        >
                                            <Edit size={14} />
                                            <span className="text-[10px] font-bold">แก้ไข</span>
                                        </button>
                                        <button 
                                            className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                            title="ส่ง RFQ"
                                            onClick={() => handleSendRFQ(item)}
                                        >
                                            <Send size={12} /> ส่ง RFQ
                                        </button>
                                    </>
                                )}
                                
                                {/* SENT: [ส่งเพิ่ม] */}
                                {item.status === 'SENT' && (
                                    <button 
                                        className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                        title="ส่งเพิ่ม"
                                        onClick={() => handleAddMoreVendors(item)}
                                    >
                                        <Send size={12} /> ส่งเพิ่ม
                                    </button>
                                )}

                                {/* IN_PROGRESS: (ไม่มี action พิเศษเพราะย้ายไป QT) */}
                            </>
                        )}
                    </div>
                );
            },
            size: 220, 
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, handleView, handleEdit, handleSendRFQ, handleAddMoreVendors]);

    // ====================================================================================
    // RENDER
    // ====================================================================================

    // Filter Config
    // Filter Config Removed in favor of manual layout

    return (
        <>
            <PageListLayout
                title="รายการขอใบเสนอราคา"
                subtitle="Request for Quotation (RFQ)"
                icon={FileText}
                accentColor="blue"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                searchForm={
                    <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <FilterField
                            label="เลขที่ RFQ"
                            value={localFilters.search}
                            onChange={(val: string) => handleFilterChange('search', val)}
                            placeholder="RFQ-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="PR อ้างอิง"
                            value={localFilters.search2}
                            onChange={(val: string) => handleFilterChange('search2', val)}
                            placeholder="PR-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="ผู้สร้าง RFQ"
                            value={localFilters.search3}
                            onChange={(val: string) => handleFilterChange('search3', val)}
                            placeholder="ชื่อผู้สร้าง"
                            accentColor="blue"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={localFilters.status}
                            onChange={(val: string) => handleFilterChange('status', val)}
                            options={RFQ_STATUS_OPTIONS}
                            accentColor="blue"
                        />
                        <FilterField
                            label="วันที่เริ่มต้น"
                            type="date"
                            value={localFilters.dateFrom || ''}
                            onChange={(val: string) => handleFilterChange('dateFrom', val)}
                            accentColor="blue"
                        />
                        <FilterField
                            label="วันที่สิ้นสุด"
                            type="date"
                            value={localFilters.dateTo || ''}
                            onChange={(val: string) => handleFilterChange('dateTo', val)}
                            accentColor="blue"
                        />
                        
                        {/* Action Buttons Group */}
                        <div className="md:col-span-2 lg:col-span-2 flex flex-col sm:flex-row flex-wrap justify-end gap-2 items-center">
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
                                สร้าง RFQ
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
                            rowIdField="rfq_id"
                            className="flex-1"
                        />
                    </div>

                    {/* Mobile View: Cards (shared MobileListContainer + MobileListCard) */}
                    <MobileListContainer
                        isLoading={isLoading}
                        isEmpty={!data?.data.length}
                        pagination={data?.total ? { page: filters.page, total: data.total, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                    >
                        {data?.data.map((item) => {
                            const prNumber = item.ref_pr_no || item.pr_no || item.pr?.pr_no;
                            return (
                                <MobileListCard
                                    key={item.rfq_id}
                                    title={item.rfq_no}
                                    subtitle={formatThaiDate(item.rfq_date)}
                                    statusBadge={<RFQStatusBadge status={item.status} />}
                                    details={[
                                        ...(prNumber ? [{ label: 'PR อ้างอิง:', value: <span className="font-medium text-blue-600 dark:text-blue-400">{prNumber}</span> }] : []),
                                        { label: 'ผู้สร้าง:', value: (() => {
                                            const u = item.requested_by_user;
                                            return u
                                                ? `${u.employee_firstname_th} ${u.employee_lastname_th}`.trim()
                                                : (item.created_by_name || item.creator_name || '-');
                                        })() },
                                        { label: 'Vendors:', value: (() => {
                                            const rfqVendors = item.rfqVendors || item.vendors;
                                            let sentCount = item.sent_vendors_count || 0;
                                            let total = item._count?.rfqVendors ?? item.vendor_count ?? 0;
                                            if (Array.isArray(rfqVendors)) {
                                                total = rfqVendors.length;
                                                sentCount = rfqVendors.filter(v => v.status === 'SENT').length;
                                            }
                                            return `${sentCount} / ${total} ราย`;
                                        })() },
                                        ...(item.quotation_due_date ? [{ label: 'ครบกำหนด:', value: formatThaiDate(item.quotation_due_date) }] : []),
                                    ]}
                                    actions={
                                        <>
                                            <button
                                                onClick={() => handleView(item.rfq_id)}
                                                className="flex-1 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200 dark:border-slate-600"
                                            >
                                                <Eye size={14} /> ดู
                                            </button>
                                            {item.status === 'DRAFT' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="flex-1 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Edit size={14} /> แก้ไข
                                                    </button>
                                                    <button
                                                        onClick={() => handleSendRFQ(item)}
                                                        className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                                    >
                                                        <Send size={14} /> ส่ง RFQ
                                                    </button>
                                                </>
                                            )}
                                            {item.status === 'SENT' && (
                                                <button
                                                    onClick={() => handleAddMoreVendors(item)}
                                                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                                >
                                                    <Send size={14} /> ส่งเพิ่ม
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

            {isModalOpen && (
                <RFQFormModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    editId={selectedRFQId}
                    readOnly={isReadOnly}
                    isInviteMode={isInviteMode}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['rfqs'] });
                        handleApplyFilters();
                        handleCloseModal();
                    }}
                />
            )}

            {/* ===== Pre-flight Review: ส่ง RFQ ===== */}
            <RFQSendConfirmModal
                isOpen={!!sendingRFQ}
                rfq={sendingRFQ}
                onClose={() => setSendingRFQ(null)}
                onConfirm={executeSendRFQ}
                isLoading={isSending}
            />
        </>
    );
}