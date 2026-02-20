/**
 * @file RFQListPage.tsx
 * @description หน้ารายการใบขอใบเสนอราคา (Request for Quotation List)
 * @role "Request Manager & Monitor" — NO data-entry actions (ย้ายไป QT/QC แล้ว)
 * @route /procurement/rfq
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Eye, Send, Edit, ExternalLink, XCircle, Search, Plus } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, SmartTable, RFQStatusBadge, FilterField } from '@ui';
import { useTableFilters } from '@/shared/hooks';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { ConfirmationModal } from '@/shared/components/system/ConfirmationModal';

// Services & Types
import { RFQService } from '@/modules/procurement/services';
import type { RFQFilterCriteria, RFQHeader, RFQStatus } from '@/modules/procurement/types/rfq-types';
import { RFQFormModal, RFQSendConfirmModal } from './components';




// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const RFQ_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'SENT', label: 'ส่งแล้ว' },
    { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
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
    const { filters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<RFQStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'rfq_no',
            search2: 'ref_pr_no',
            search3: 'creator_name'
        }
    });

    // Convert to API filter format
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

    // Data Fetching with React Query
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['rfqs', apiFilters],
        queryFn: () => RFQService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    const { toast } = useToast();

    const navigate = useNavigate();

    // Modal States (RFQ Form only — QT modal removed, belongs to QT page)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRFQId, setSelectedRFQId] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Send RFQ Modal State (replaces old ConfirmationModal)
    const [sendingRFQ, setSendingRFQ] = useState<RFQHeader | null>(null);
    const [isSending, setIsSending] = useState(false);

    // Confirmation Modal State (ปิดรับราคา / Close Bidding)
    const [isCloseBiddingOpen, setIsCloseBiddingOpen] = useState(false);
    const [rfqToClose, setRfqToClose] = useState<RFQHeader | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    // Handlers
    const handleFilterChange = (name: string, value: string) => {
        setFilters({ [name]: value });
    };

    const handleCreate = () => {
        setSelectedRFQId(null);
        setIsReadOnly(false);
        setIsModalOpen(true);
    };

    const handleView = useCallback((id: string) => {
        setSelectedRFQId(id);
        setIsReadOnly(true);
        setIsModalOpen(true);
    }, []);

    const handleEdit = useCallback((id: string) => {
        setSelectedRFQId(id);
        setIsReadOnly(false);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRFQId(null);
        setIsReadOnly(false);
    };

    // --- Send RFQ: opens Pre-flight modal ---
    const handleSendRFQ = useCallback((rfq: RFQHeader) => {
        setSendingRFQ(rfq);
    }, []);

    const executeSendRFQ = async (selectedVendorIds: string[]) => {
        if (!sendingRFQ) return;
        
        setIsSending(true);
        try {
            // Use sendToVendors API with filtered vendor IDs (Clean Payload)
            await RFQService.sendToVendors(sendingRFQ.rfq_id, selectedVendorIds);
            
            toast(`ส่ง RFQ ${sendingRFQ.rfq_no} ไปยังผู้ขาย ${selectedVendorIds.length} ราย เรียบร้อยแล้ว`, 'success');
            refetch();
            setSendingRFQ(null);
        } catch (error) {
            toast('เกิดข้อผิดพลาดในการส่ง RFQ', 'error');
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    // --- Navigation: ดูใบเสนอราคา (View QTs) — shortcut to QT page filtered by this RFQ ---
    const handleViewQTs = useCallback((rfqNo: string) => {
        navigate(`/procurement/qt?rfq_no=${encodeURIComponent(rfqNo)}`);
    }, [navigate]);

    // --- Close Bidding: ปิดรับราคา (Lock bidding, status → CLOSED) ---
    const handleCloseBidding = useCallback((rfq: RFQHeader) => {
        setRfqToClose(rfq);
        setIsCloseBiddingOpen(true);
    }, []);

    const executeCloseBidding = async () => {
        if (!rfqToClose) return;
        setIsClosing(true);
        try {
            await RFQService.update(rfqToClose.rfq_id, { status: 'CLOSED' as RFQStatus });
            toast(`ปิดรับราคา RFQ ${rfqToClose.rfq_no} เรียบร้อยแล้ว`, 'success');
            refetch();
            cancelCloseBidding();
        } catch (error) {
            toast('เกิดข้อผิดพลาดในการปิดรับราคา', 'error');
            console.error(error);
        } finally {
            setIsClosing(false);
        }
    };

    const cancelCloseBidding = () => {
        setIsCloseBiddingOpen(false);
        setRfqToClose(null);
        setIsClosing(false);
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
            cell: (info) => (
                <div className="flex flex-col py-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer" title={info.getValue()}>
                        {info.getValue()}
                    </span>
                    {info.row.original.ref_pr_no && (
                        <span className="text-xs text-gray-500 mt-1">
                            Ref: {info.row.original.ref_pr_no}
                        </span>
                    )}
                </div>
            ),
            size: 180,
            enableSorting: true,
        }),
        columnHelper.accessor('purpose', {
            header: 'เรื่อง/วัตถุประสงค์',
            cell: (info) => (
                <div className="max-w-[250px] truncate py-2" title={info.getValue()}>
                    {info.getValue()}
                </div>
            ),
            size: 250,
            enableSorting: true,
        }),
        columnHelper.accessor('created_by_name', {
            header: 'ผู้ดูแล',
            cell: (info) => (
                <div className="flex flex-col py-2">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {info.getValue() || '-'}
                    </span>
                    <span className="text-xs text-gray-400">
                        {formatThaiDate(info.row.original.rfq_date)}
                    </span>
                </div>
            ),
            size: 160,
            enableSorting: false,
        }),
        columnHelper.accessor('quote_due_date', {
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
            header: () => <div className="flex justify-center items-center w-full h-full">VENDORS</div>,
            cell: (info) => {
                const responded = info.row.original.responded_vendors_count || 0;
                const total = info.row.original.vendor_count || 0;
                const status = info.row.original.status;

                return (
                    <div className="flex flex-col items-center justify-center h-full py-2">
                        <span className="text-gray-700 dark:text-gray-300 font-medium leading-none mb-0.5">
                            {`${responded}/${total}`}
                        </span>
                        {status === 'SENT' && (
                            <span className="text-[10px] text-slate-500 leading-none">รอตอบกลับ</span>
                        )}
                        {(status === 'IN_PROGRESS' || status === 'CLOSED') && (
                            <span className="text-[9px] text-slate-500 leading-none">ตอบกลับแล้ว</span>
                        )}
                    </div>
                );
            },
            size: 80,
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: () => <div className="flex justify-center items-center w-full h-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center items-center h-full py-2">
                    <RFQStatusBadge status={info.getValue()} />
                </div>
            ),
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
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                const total = item.vendor_count || 0;
                const responded = item.responded_vendors_count || 0;
                const allResponded = total > 0 && responded >= total;

                return (
                    // 1. Container: flex row, centered vertically.
                    <div className="flex items-center justify-center gap-3 w-full h-full py-1">
                        
                        {/* 2. Left Element: Eye icon, horizontally un-cluttered */}
                        <button 
                            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-blue-600 transition-colors" 
                            title="ดูรายละเอียด"
                            onClick={() => handleView(item.rfq_id)}
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* 3. Right Element: Button Stack (flex-col, gap-1) */}
                        {item.status !== 'CLOSED' && item.status !== 'CANCELLED' && (
                            <div className="flex flex-col gap-1 min-w-[130px]">
                                {/* ===== DRAFT: [แก้ไข] + [ส่ง RFQ] ===== */}
                                {item.status === 'DRAFT' && (
                                    <>
                                        <button 
                                            className="flex items-center justify-center gap-1.5 w-full px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all"
                                            title="แก้ไข"
                                            onClick={() => handleEdit(item.rfq_id)}
                                        >
                                            <Edit className="w-3.5 h-3.5" /> แก้ไข
                                        </button>
                                        <button 
                                            className="flex items-center justify-center gap-1.5 w-full px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium rounded shadow-sm transition-all"
                                            title="ส่ง RFQ"
                                            onClick={() => handleSendRFQ(item)}
                                        >
                                            <Send className="w-3.5 h-3.5" /> ส่ง RFQ
                                        </button>
                                    </>
                                )}

                                {/* ===== SENT: [ดูใบเสนอราคา] (Hide if no QT) ===== */}
                                {item.status === 'SENT' && item.has_quotation && (
                                    <button 
                                        onClick={() => handleViewQTs(item.rfq_no)}
                                        className="flex items-center justify-center gap-1 w-full px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 hover:border-blue-400 transition-all"
                                        title="ดูใบเสนอราคาในหน้า QT"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" /> ดูใบเสนอราคา
                                    </button>
                                )}

                                {/* ===== IN_PROGRESS: Stack [ดูใบเสนอราคา] and [ปิดรับราคา] ===== */}
                                {item.status === 'IN_PROGRESS' && (
                                    <>
                                        {/* Top: View QT */}
                                        {item.has_quotation && (
                                            <button 
                                                onClick={() => handleViewQTs(item.rfq_no)}
                                                className="flex items-center justify-center gap-1 w-full px-2 py-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 hover:border-blue-400 transition-all"
                                                title="ดูใบเสนอราคาในหน้า QT"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" /> ดูใบเสนอราคา
                                            </button>
                                        )}

                                        {/* Bottom: Close Bidding */}
                                        {item.has_quotation && (
                                            <button 
                                                onClick={() => handleCloseBidding(item)}
                                                className={`flex items-center justify-center gap-1 w-full px-2 py-1 rounded shadow-sm transition-all text-[11px] font-medium ${
                                                    allResponded
                                                        ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse border border-transparent'
                                                        : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 hover:border-rose-400'
                                                }`}
                                                title={allResponded ? `ตอบครบแล้ว รอกดปิดรับราคาได้เลย!` : 'ปิดรับราคา'}
                                            >
                                                <XCircle className="w-3.5 h-3.5" /> ปิดรับราคา
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                );
            },
            size: 210, 
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, handleView, handleEdit, handleSendRFQ, handleViewQTs, handleCloseBidding]);

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <FilterField
                            label="เลขที่ RFQ"
                            value={filters.search}
                            onChange={(val: string) => handleFilterChange('search', val)}
                            placeholder="RFQ-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="PR อ้างอิง"
                            value={filters.search2}
                            onChange={(val: string) => handleFilterChange('search2', val)}
                            placeholder="PR-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="ผู้สร้าง RFQ"
                            value={filters.search3}
                            onChange={(val: string) => handleFilterChange('search3', val)}
                            placeholder="ชื่อผู้สร้าง"
                            accentColor="blue"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={filters.status}
                            onChange={(val: string) => handleFilterChange('status', val)}
                            options={RFQ_STATUS_OPTIONS}
                            accentColor="blue"
                        />
                        <FilterField
                            label="วันที่เริ่มต้น"
                            type="date"
                            value={filters.dateFrom || ''}
                            onChange={(val: string) => handleFilterChange('dateFrom', val)}
                            accentColor="blue"
                        />
                        <FilterField
                            label="วันที่สิ้นสุด"
                            type="date"
                            value={filters.dateTo || ''}
                            onChange={(val: string) => handleFilterChange('dateTo', val)}
                            accentColor="blue"
                        />
                        
                        {/* Action Buttons Group */}
                        <div className="md:col-span-2 lg:col-span-2 flex flex-col sm:flex-row flex-wrap justify-end gap-2 items-center">
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
                                สร้าง RFQ
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="h-full flex flex-col">
                    <SmartTable
                        data={data?.data ?? []}
                        columns={columns as ColumnDef<RFQHeader>[]}
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
            </PageListLayout>

            {isModalOpen && (
                <RFQFormModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    editId={selectedRFQId}
                    readOnly={isReadOnly}
                    onSuccess={() => {
                        refetch();
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


            {/* ===== Confirmation: ปิดรับราคา (Close Bidding) ===== */}
            <ConfirmationModal
                isOpen={isCloseBiddingOpen}
                onClose={cancelCloseBidding}
                onConfirm={executeCloseBidding}
                title="ยืนยันการปิดรับราคา"
                description={`ต้องการปิดรับราคา RFQ เลขที่ ${rfqToClose?.rfq_no} ใช่หรือไม่? เมื่อปิดแล้ว ผู้ขายจะไม่สามารถส่งราคาเพิ่มเติมได้อีก`}
                variant="danger"
                confirmText="ปิดรับราคา"
                cancelText="ยกเลิก"
                isLoading={isClosing}
            />
        </>
    );
}

