/**
 * @file QTListPage.tsx
 * @description หน้ารายการใบเสนอราคา (Quotation List)
 * @route /procurement/qt
 * @supports URL auto-filter: /procurement/qt?rfq_no=XXX (from RFQ navigation)
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Eye, Edit, RefreshCw, X, Filter, XCircle } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, FilterFormBuilder, SmartTable, QTStatusBadge } from '@ui';
import { ConfirmationModal } from '@/shared/components/system/ConfirmationModal';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import type { FilterFieldConfig } from '@/shared/components/ui/filters/FilterFormBuilder';
import { useTableFilters, type TableFilters } from '@/shared/hooks';
import type { ColumnDef } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';

// Services & Types
import { QTService, type QTListParams } from '@/modules/procurement/services/qt.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import type { QTListItem, QTStatus } from '@/modules/procurement/types/qt-types';
import type { RFQHeader } from '@/modules/procurement/types/rfq-types';
import { QTFormModal, QTVendorTrackingModal } from './components';
import { QCFormModal } from '@/modules/procurement/pages/qc/components';
import { Users } from 'lucide-react';

// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const QT_STATUS_OPTIONS = [
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

export default function QTListPage() {
    const { toast } = useToast();

    // ==========================================================================
    // URL Query Parameter: ?rfq_no=XXX (received from RFQ navigation shortcut)
    // ==========================================================================
    const [searchParams, setSearchParams] = useSearchParams();
    const rfqNoFilter = searchParams.get('rfq_no');

    const { filters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<QTStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'quotation_no',
            search2: 'vendor_name',
            search3: 'ref_rfq_no',
            search4: 'ref_pr_no'
        }
    });

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isQCModalOpen, setIsQCModalOpen] = useState(false);
    const [selectedQTForQC, setSelectedQTForQC] = useState<QTListItem | null>(null);

    // Tracking Modal State
    const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
    const [qtForTracking, setQtForTracking] = useState<QTListItem | null>(null);

    // Confirmation Modal State (ปิดรับราคา / Close Bidding)
    const [isCloseBiddingOpen, setIsCloseBiddingOpen] = useState(false);
    const [qtToClose, setQtToClose] = useState<QTListItem | null>(null);
    const [isClosing, setIsClosing] = useState(false);

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

        if (shouldCreate && !isCreateModalOpen) {
            if (rfqId) {
                // Fetch RFQ Detail to get items
                RFQService.getById(rfqId).then((rfqData: RFQHeader) => {
                    // Create a modified header if vendorId is provided
                    const header = { ...rfqData } as RFQHeader & { vendor_id?: string };
                    if (vendorId) {
                        header.vendor_id = vendorId; 
                    }
                    setInitialRFQForCreate(header as RFQHeader);
                    setIsCreateModalOpen(true);
                }).catch((err: Error) => {
                    console.error('Failed to fetch RFQ for auto-creation:', err);
                    setIsCreateModalOpen(true); // Open anyway, just empty
                });
            } else {
                setIsCreateModalOpen(true);
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
    }, [rfqNoFilter, setFilters, searchParams, isCreateModalOpen, setSearchParams]);

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
    const apiFilters: QTListParams = {
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
        queryKey: ['quotations', apiFilters],
        queryFn: () => QTService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // Handlers
    const handleFilterChange = (name: string, value: string) => {
        setFilters({ [name]: value });
    };

    const handleOpenQCModal = useCallback((qt: QTListItem) => {
        setSelectedQTForQC(qt);
        setIsQCModalOpen(true);
    }, []);

    const handleOpenTracking = useCallback((qt: QTListItem) => {
        setQtForTracking(qt);
        setIsTrackModalOpen(true);
    }, []);

    // --- Close Bidding: ปิดรับราคา (Lock bidding, status → CLOSED) ---
    const handleCloseQuotationPhase = useCallback((qt: QTListItem) => {
        setQtToClose(qt);
        setIsCloseBiddingOpen(true);
    }, []);

    const executeCloseQuotation = async () => {
        if (!qtToClose) return;
        setIsClosing(true);
        try {
            await QTService.update(qtToClose.quotation_id, { status: 'CLOSED' });
            toast(`ปิดรับราคาสำหรับ ${qtToClose.rfq_no} เรียบร้อยแล้ว`, 'success');
            refetch();
            cancelCloseQuotation();
        } catch (error) {
            toast('เกิดข้อผิดพลาดในการปิดรับราคา', 'error');
            console.error(error);
        } finally {
            setIsClosing(false);
        }
    };

    const cancelCloseQuotation = () => {
        setIsCloseBiddingOpen(false);
        setQtToClose(null);
        setIsClosing(false);
    };

    // Columns Definition
    const columnHelper = createColumnHelper<QTListItem>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            footer: () => <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-bold text-sm text-gray-700 dark:text-gray-200">ยอดรวมทั้งหมด :</div>,
            size: 40,
            enableSorting: false,
        }),
        columnHelper.accessor('quotation_no', {
            header: 'เลขที่ QT',
            cell: (info) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer block" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
            size: 155,
            enableSorting: true,
        }),
        columnHelper.accessor('quotation_date', {
            header: 'วันที่',
            cell: (info) => (
                <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {formatThaiDate(info.getValue())}
                </span>
            ),
            size: 90,
            enableSorting: true,
        }),
        columnHelper.accessor('vendor_name', {
            header: 'ผู้ขาย',
            cell: (info) => {
                const item = info.row.original;
                return (
                    <div>
                        <span className="text-gray-700 dark:text-gray-200 block truncate" title={info.getValue() || ''}>{info.getValue() || ''}</span>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate" title={`เครดิต ${item.payment_term_days || '-'} วัน | Lead ${item.lead_time_days || '-'} วัน`}>
                            เครดิต {item.payment_term_days || '-'} วัน | Lead {item.lead_time_days || '-'} วัน
                        </div>
                    </div>
                );
            },
            size: 200,
            enableSorting: false,
        }),
        columnHelper.accessor('rfq_no', {
            header: 'เอกสารอ้างอิง',
            cell: (info) => {
                const item = info.row.original;
                return (
                    <div className="flex flex-col py-1">
                        <span className="text-purple-600 dark:text-purple-400 font-medium hover:underline cursor-pointer leading-tight truncate" title={item.rfq_no || ''}>
                            {item.rfq_no || '-'}
                        </span>
                        {item.pr_no && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-0.5" title={`Ref: ${item.pr_no}`}>
                                Ref: {item.pr_no}
                            </span>
                        )}
                    </div>
                );
            },
            size: 155,
            enableSorting: false,
        }),
        columnHelper.accessor('total_amount', {
            header: () => <div className="text-right whitespace-nowrap">ยอดรวม (บาท)</div>,
            cell: (info) => (
                <div className="text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {info.getValue().toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            ),
            size: 120,
            enableSorting: true,
        }),
        columnHelper.accessor('valid_until', {
            header: () => <div className="text-center">ใช้ได้ถึง</div>,
            cell: (info) => (
                <div className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {info.getValue() ? formatThaiDate(info.getValue()!) : '-'}
                </div>
            ),
            size: 90,
            enableSorting: true,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center">
                    <QTStatusBadge status={info.getValue()} />
                </div>
            ),
            size: 85,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                const isInProgress = item.status === 'IN_PROGRESS';
                
                return (
                    <div className={isInProgress ? "flex flex-col items-center justify-center gap-2 py-1.5" : "flex flex-row items-center justify-center gap-3 whitespace-nowrap"}>
                        {/* Icon Actions Group (Always horizontal) */}
                        <div className="flex items-center justify-center gap-1.5">
                            <button 
                                onClick={() => handleOpenTracking(item)}
                                className="p-1 text-gray-500 hover:text-blue-600 transition-colors" 
                                title="ดูสถานะการตอบกลับ"
                            >
                                <Eye size={16} />
                            </button>
                            
                            {item.status === 'SUBMITTED' && (
                                <button className="p-1 text-blue-500 hover:text-blue-700 transition-colors" title="แก้ไข">
                                    <Edit size={16} />
                                </button>
                            )}
                        </div>

                        {/* Status-specific Action Buttons */}
                        {item.status === 'IN_PROGRESS' && (
                            <div className="flex flex-col items-center gap-2">
                                <button 
                                    onClick={() => handleCloseQuotationPhase(item)}
                                    className="flex items-center justify-center gap-1.5 w-[150px] px-3 py-1.5 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 hover:border-rose-400 text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                    title="ปิดรับราคา"
                                >
                                    <XCircle size={12} /> ปิดรับราคา
                                </button>
                                
                                {item.rfq_no && (
                                    <button 
                                        onClick={() => handleOpenTracking(item)}
                                        className="flex items-center justify-center gap-1.5 w-[150px] px-3 py-1.5 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:border-blue-400 text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                        title="ติดตามการขอราคา"
                                    >
                                        <Users size={12} /> ติดตามการขอราคา
                                    </button>
                                )}
                            </div>
                        )}

                        {item.status === 'CLOSED' && (
                            <button 
                                onClick={() => handleOpenQCModal(item)}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#a855f7] hover:bg-[#9333ea] text-white text-[10px] font-bold rounded shadow transition-colors whitespace-nowrap"
                                title="ส่งเปรียบเทียบราคา"
                            >
                                <RefreshCw size={12} /> ส่งเปรียบเทียบราคา
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
            size: 190,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, handleOpenQCModal, handleCloseQuotationPhase, handleOpenTracking, data?.data]);

    const filterConfig: FilterFieldConfig<keyof TableFilters<QTStatus>>[] = useMemo(() => [
        { name: 'search', label: 'เลขที่ใบเสนอราคา', type: 'text', placeholder: 'QT-xxx' },
        { name: 'search2', label: 'ชื่อผู้ขาย', type: 'text', placeholder: 'ชื่อผู้ขาย' },
        { name: 'search3', label: 'เลขที่ RFQ อ้างอิง', type: 'text', placeholder: 'RFQ-xxx' },
        { name: 'search4', label: 'เลขที่ PR อ้างอิง', type: 'text', placeholder: 'PR-xxx' },
        { name: 'status', label: 'สถานะ', type: 'select' as const, options: QT_STATUS_OPTIONS },
        { name: 'dateFrom', label: 'วันที่เริ่มต้น', type: 'date' },
        { name: 'dateTo', label: 'วันที่สิ้นสุด', type: 'date' },
    ], []);

    return (
        <>
            <PageListLayout
                title="รายการใบเสนอราคา"
                subtitle={rfqNoFilter ? `รายการใบเสนอราคาสำหรับ RFQ: ${rfqNoFilter} (ตอบกลับแล้ว ${data?.total || 0} ราย)` : 'Vendor Quotation (QT)'}
                icon={FileText}
                accentColor="blue"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                searchForm={
                    <FilterFormBuilder<TableFilters<QTStatus>>
                        config={filterConfig}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onSearch={refetch}
                        onReset={resetFilters}
                        accentColor="blue"
                        onCreate={() => setIsCreateModalOpen(true)}
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
                        columns={columns as ColumnDef<QTListItem>[]}
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
            {isCreateModalOpen && (
                <QTFormModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setInitialRFQForCreate(null);
                    }} 
                    onSuccess={() => refetch()}
                    initialRFQ={initialRFQForCreate}
                />
            )}

            {isQCModalOpen && (
                <QCFormModal
                    isOpen={isQCModalOpen}
                    onClose={() => {
                        setIsQCModalOpen(false);
                        setSelectedQTForQC(null);
                    }}
                    initialRFQNo={selectedQTForQC?.rfq_no}
                    onSuccess={() => refetch()}
                />
            )}

            {isTrackModalOpen && (
                <QTVendorTrackingModal
                    isOpen={isTrackModalOpen}
                    onClose={() => {
                        setIsTrackModalOpen(false);
                        setQtForTracking(null);
                    }}
                    rfqId={qtForTracking?.qc_id || null}
                    rfqNo={qtForTracking?.rfq_no || '-'}
                />
            )}

            {/* ===== Confirmation: ปิดรับราคา (Close Bidding) ===== */}
            <ConfirmationModal
                isOpen={isCloseBiddingOpen}
                onClose={cancelCloseQuotation}
                onConfirm={executeCloseQuotation}
                title="ยืนยันการปิดรับราคา"
                description={`ต้องการปิดรับราคาสำหรับ RFQ อ้างอิง ${qtToClose?.rfq_no} ใช่หรือไม่? เมื่อปิดแล้วระบบจะพร้อมให้ทำการเทียบราคาต่อไป`}
                variant="danger"
                confirmText="ปิดรับราคา"
                cancelText="ยกเลิก"
                isLoading={isClosing}
            />
        </>
    );
}