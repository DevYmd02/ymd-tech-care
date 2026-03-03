import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { FileText, Eye, Send, CheckCircle, Package, Edit } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { FilterFormBuilder } from '@ui';
import { PageListLayout, SmartTable } from '@ui';
import { POStatusBadge } from '@ui';
import type { FilterFieldConfig } from '@ui';
import { useTableFilters, useConfirmation, type TableFilters } from '@/shared/hooks';
import { POService } from '@/modules/procurement/services';
import type { POListParams, POStatus, POListItem, POFormData } from '@/modules/procurement/types';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { POFormModal, POApprovalModal } from './components';
import GRNFormModal from '@/modules/procurement/pages/grn/components/GRNFormModal';
import { logger } from '@/shared/utils/logger';

// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const PO_STATUS_OPTIONS = [
    { value: 'ALL',              label: 'ทั้งหมด' },
    { value: 'DRAFT',            label: 'แบบร่าง' },
    { value: 'PENDING_APPROVAL', label: 'รออนุมัติ' },
    { value: 'APPROVED',         label: 'อนุมัติแล้ว' },
    { value: 'ISSUED',           label: 'ออก PO แล้ว' },
    { value: 'COMPLETED',        label: 'ปิดรายการ' },
    { value: 'CANCELLED',        label: 'ยกเลิก' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================

type POFilterKeys = Extract<keyof TableFilters<POStatus>, string>;

const PO_FILTER_CONFIG: FilterFieldConfig<POFilterKeys>[] = [
    { name: 'search', label: 'เลขที่ PO', type: 'text', placeholder: 'PO2024-xxx' },
    { name: 'search2', label: 'เลขที่ PR อ้างอิง', type: 'text', placeholder: 'PR2024-xxx' },
    { name: 'search3', label: 'ชื่อผู้ขาย', type: 'text', placeholder: 'ชื่อผู้ขาย' },
    { name: 'status', label: 'สถานะ', type: 'select', options: PO_STATUS_OPTIONS },
    { name: 'dateFrom', label: 'วันที่เอกสาร จาก', type: 'date' },
    { name: 'dateTo', label: 'ถึงวันที่', type: 'date' },
];

export default function POListPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // -- Modal State (URL Driven) --
    // derived directly from URL search params
    const isCreateModalOpen = searchParams.get('mode') === 'create';
    const createFromQC = searchParams.get('createFromQC') === 'true';
    const vendorIdParam = searchParams.get('vendorId');
    const remarksParam = searchParams.get('remarks');

    // Derive initial values from URL params
    const initialCreateValues = useMemo<Partial<POFormData> | undefined>(() => {
        if (createFromQC) {
            return {
                vendor_id: vendorIdParam || undefined,
                remarks: remarksParam || undefined,
                lines: [], // Note: Lines should be loaded directly inside the PO Form asynchronously using the passed PO form mode
            };
        }
        // Fallback or simple create mode
        if (vendorIdParam) {
            return { vendor_id: vendorIdParam };
        }
        return undefined;
    }, [createFromQC, vendorIdParam, remarksParam]);

    // Handle closing the modal by updating URL params
    const handleCloseCreateModal = () => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('mode');
            newParams.delete('createFromQC');
            newParams.delete('vendorId');
            newParams.delete('qcNo');
            newParams.delete('remarks');
            return newParams;
        });
    };

    const { confirm } = useConfirmation();

    // -- View / Edit Modal State --
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPOId, setSelectedPOId]       = useState<string | undefined>(undefined);

    // -- GRN Modal State --
    const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
    const [selectedPOIdForGRN, setSelectedPOIdForGRN] = useState<string | undefined>(undefined);

    // -- Approval Modal State --
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [selectedPOIdForApproval, setSelectedPOIdForApproval] = useState<string | undefined>(undefined);

    const { filters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<POStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'po_no',
            search2: 'pr_no',
            search3: 'vendor_name'
        }
    });

    // Convert to API filter format
    const apiFilters: POListParams = {
        po_no: filters.search || undefined,
        pr_no: filters.search2 || undefined,
        vendor_name: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined,
    };

    // Data Fetching with React Query
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['purchase-orders', apiFilters],
        queryFn: () => POService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // Handlers
    const handleFilterChange = (name: POFilterKeys, value: string) => {
        setFilters({ [name]: value });
    };

    // Action Handlers
    const handleView = useCallback((id: string) => {
        setSelectedPOId(id);
        setIsViewModalOpen(true);
    }, []);

    const handleEdit = useCallback((id: string) => {
        setSelectedPOId(id);
        setIsEditModalOpen(true);
    }, []);

    const handleIssuePO = useCallback((item: POListItem) => {
        confirm({
            title:       'ยืนยันการออกใบสั่งซื้อ',
            description: `คุณต้องการออกใบสั่งซื้อเลขที่ ${item.po_no} ใช่หรือไม่?\nยอดรวม: ${item.total_amount?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท`,
            confirmText: 'ออก PO',
            cancelText:  'ยกเลิก',
            variant:     'info',
            icon:        Send,
            onConfirm:   async () => {
                await POService.issue(item.po_id || '');
            },
        }).then((confirmed) => {
            if (confirmed) {
                confirm({
                    title:       'ออก PO สำเร็จ!',
                    description: `ใบสั่งซื้อ ${item.po_no} ถูกส่งให้ผู้ขายแล้ว`,
                    confirmText: 'ตกลง',
                    hideCancel:  true,
                    variant:     'success',
                });
                refetch();
            }
        }).catch((error) => {
            logger.error('[POListPage] handleIssuePO error:', error);
        });
    }, [confirm, refetch]);
    
    const handleApprove = useCallback((id: string) => {
        setSelectedPOIdForApproval(id);
        setIsApprovalModalOpen(true);
    }, []);



    const handleGRN = useCallback((id: string) => {
        setSelectedPOIdForGRN(id);
        setIsGRNModalOpen(true);
    }, []);

    const columnHelper = createColumnHelper<POListItem>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            footer: () => <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-bold text-sm text-gray-700 dark:text-gray-200">ยอดรวมทั้งหมด :</div>,
            size: 40,
            enableSorting: false,
        }),
        columnHelper.accessor('po_no', {
            header: 'เลขที่ PO',
            cell: (info) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer block" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
            size: 130, // Optimized for balance
            enableSorting: true,
        }),
        columnHelper.accessor('po_date', {
            header: 'วันที่',
            cell: (info) => (
                <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {formatThaiDate(info.getValue())}
                </span>
            ),
            size: 110,
            enableSorting: true,
        }),
        columnHelper.accessor('qc_no', {
            id: 'ref_docs',
            header: 'เอกสารอ้างอิง',
            cell: (info) => {
                const item = info.row.original;
                return (
                    <div className="flex flex-col truncate">
                        <span
                            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer leading-tight whitespace-nowrap"
                            title={`QC: ${item.qc_no || '-'}`}
                            onClick={() => { if (item.qc_no) window.alert(`Open QC: ${item.qc_no}`); }}
                        >
                            {item.qc_no || '-'}
                        </span>
                        {item.pr_no && (
                            <span
                                className="text-xs text-slate-500 mt-0.5 truncate"
                                title={`PR: ${item.pr_no}`}
                            >
                                Ref: {item.pr_no}
                            </span>
                        )}
                    </div>
                );
            },
            size: 140,
            enableSorting: false,
        }),
        columnHelper.accessor('vendor_name', {
            header: 'ชื่อผู้ขาย',
            cell: (info) => (
                <div className="font-semibold text-gray-800 dark:text-gray-200 text-left truncate max-w-[220px]" title={info.getValue() || '-'}>
                    {info.getValue() || '-'}
                </div>
            ),
            size: 250, // Reduced to balance with Actions column
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center">
                    <POStatusBadge status={info.getValue()} className="whitespace-nowrap" />
                </div>
            ),
            size: 90,
            enableSorting: false,
        }),
        columnHelper.accessor('item_count', {
            header: () => <div className="text-center w-full whitespace-nowrap">จำนวนรายการ</div>,
            cell: (info) => (
                <div className="text-center text-gray-600 dark:text-gray-300">
                    {info.getValue()}
                </div>
            ),
            size: 80,
            enableSorting: false,
        }),
        columnHelper.accessor('total_amount', {
            header: () => <div className="text-right w-full whitespace-nowrap">ยอดรวม (บาท)</div>,
            cell: (info) => (
                <div className="text-right font-bold text-gray-800 dark:text-white whitespace-nowrap">
                    {info.getValue()?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            ),
            size: 120,
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center justify-center gap-1">
                        {/* Eye — PR pattern */}
                        <button
                            onClick={() => handleView(item.po_id || '')}
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
                            title="ดูรายละเอียด"
                        >
                            <Eye size={16} />
                        </button>

                        {/* DRAFT: Edit (amber) + ส่งอนุมัติ (emerald) */}
                        {item.status === 'DRAFT' && (
                            <>
                                <button
                                    onClick={() => handleEdit(item.po_id || '')}
                                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded shadow-sm border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all whitespace-nowrap"
                                    title="แก้ไข"
                                >
                                    <Edit size={14} />
                                    <span className="text-[10px] font-bold">แก้ไข</span>
                                </button>
                                <button
                                    onClick={() => handleApprove(item.po_id || '')}
                                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                >
                                    <Send size={12} />
                                    ส่งอนุมัติ
                                </button>
                            </>
                        )}

                        {/* PENDING_APPROVAL: อนุมัติ (emerald) */}
                        {item.status === 'PENDING_APPROVAL' && (
                            <button
                                onClick={() => handleApprove(item.po_id || '')}
                                className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                title="อนุมัติ PO"
                            >
                                <CheckCircle size={12} />
                                อนุมัติ
                            </button>
                        )}

                        {/* APPROVED: ออก PO (blue = create next doc) */}
                        {item.status === 'APPROVED' && (
                            <button
                                onClick={() => handleIssuePO(item)}
                                className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                title="ออก PO"
                            >
                                <Send size={12} />
                                ออก PO
                            </button>
                        )}

                        {/* ISSUED: เปิด GRN (violet = special process) */}
                        {item.status === 'ISSUED' && (
                            <button
                                onClick={() => handleGRN(item.po_id || '')}
                                className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                title="เปิดใบรับสินค้า"
                            >
                                <Package size={12} />
                                เปิด GRN
                            </button>
                        )}
                    </div>
                );
            },
            footer: () => {
                 const total = (data?.data || []).reduce((sum, item) => sum + item.total_amount, 0) || 0;
                 return (
                     <div className="text-right font-bold text-base text-emerald-600 dark:text-emerald-400 whitespace-nowrap pr-2">
                         {total.toLocaleString('en-US', { minimumFractionDigits: 2 })} บาท
                     </div>
                 );
            },
            size: 160,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, data?.data, handleGRN, handleApprove, handleIssuePO, handleView, handleEdit]);

    return (
        <>
            <PageListLayout
                title="รายการใบสั่งซื้อ"
                subtitle="Purchase Order (PO)"
                icon={FileText}
                accentColor="blue"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                isLoading={isLoading}
                searchForm={
                    <FilterFormBuilder
                        config={PO_FILTER_CONFIG}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onSearch={() => {}} // React Query auto-fetches
                        onReset={resetFilters}
                        accentColor="blue"
                        columns={{ sm: 1, md: 2, xl: 4 }}
                        actionColSpan={{ md: 2, xl: 2 }}
                        onCreate={() => setSearchParams({ mode: 'create' })}
                        createLabel="สร้างใบสั่งซื้อใหม่"
                    />
                }
            >
                <div className="h-full flex flex-col">
                    {/* Desktop View: Table */}
                    <div className="hidden md:block flex-1 overflow-hidden">
                        <SmartTable
                            data={data?.data ?? []}
                            columns={columns as ColumnDef<POListItem>[]}
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
                            rowIdField="po_id"
                            className="h-full"
                            showFooter={true}
                        />
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="md:hidden flex-1 overflow-y-auto p-2 space-y-3 pb-20">
                        {isLoading ? (
                            <div className="text-center py-4 text-gray-500">กำลังโหลด...</div>
                        ) : data?.data.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                                ไม่พบข้อมูล
                            </div>
                        ) : (
                            data?.data.map((item) => (
                                <div key={item.po_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                                    {/* Header: PO No + Status */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                                {item.po_no}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatThaiDate(item.po_date)}
                                            </span>
                                        </div>
                                        <POStatusBadge status={item.status} />
                                    </div>

                                    {/* Content Info */}
                                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5 border-t border-b border-gray-50 py-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">ผู้ขาย:</span>
                                            <span className="font-medium text-right truncate max-w-[200px]">{item.vendor_name || '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-gray-500 mt-0.5">เอกสารอ้างอิง:</span>
                                            <div className="flex flex-col items-end">
                                                <span className="font-semibold text-blue-600">{item.qc_no || '-'}</span>
                                                {item.pr_no && <span className="text-xs text-slate-500">Ref: {item.pr_no}</span>}
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">จำนวนรายการ:</span>
                                            <span className="font-medium">{item.item_count} รายการ</span>
                                        </div>
                                    </div>

                                    {/* Footer: Amount + Actions */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-gray-900 dark:text-white">ยอดรวมสุทธิ</span>
                                            <span className="font-bold text-lg text-emerald-600">
                                                {item.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button 
                                                onClick={() => handleView(item.po_id)}
                                                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200"
                                            >
                                                <Eye size={14} /> ดู
                                            </button>

                                            {item.status === 'DRAFT' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleEdit(item.po_id)}
                                                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Edit size={14} /> แก้ไข
                                                    </button>
                                                    <button 
                                                        onClick={() => handleApprove(item.po_id)}
                                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm whitespace-nowrap"
                                                    >
                                                        <Send size={14} /> ส่งอนุมัติ
                                                    </button>
                                                </>
                                            )}

                                            {item.status === 'PENDING_APPROVAL' && (
                                                <button
                                                    onClick={() => handleApprove(item.po_id || '')}
                                                    className="flex-[2] bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                                >
                                                    <CheckCircle size={14} /> อนุมัติ
                                                </button>
                                            )}
                                            
                                            {item.status === 'APPROVED' && (
                                                <button
                                                    onClick={() => handleIssuePO(item)}
                                                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                                >
                                                    <Send size={14} /> ออก PO
                                                </button>
                                            )}

                                            {item.status === 'ISSUED' && (
                                                <button
                                                    onClick={() => handleGRN(item.po_id || '')}
                                                    className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                                >
                                                    <Package size={14} /> เปิด GRN
                                                </button>
                                            )}
                                            {/* COMPLETED / CANCELLED: Eye only */}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Pagination for Mobile */}
                        {data?.total ? (
                            <div className="flex justify-between items-center pt-2 text-sm text-gray-600">
                                 <div>ทั้งหมด {data.total} รายการ</div>
                                 <div className="flex gap-2">
                                     <button
                                        disabled={filters.page === 1}
                                        onClick={() => handlePageChange(filters.page - 1)}
                                        className="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                                     >
                                        &lt;
                                     </button>
                                     <span>{filters.page} / {Math.ceil(data.total / filters.limit)}</span>
                                     <button
                                        disabled={filters.page >= Math.ceil(data.total / filters.limit)}
                                        onClick={() => handlePageChange(filters.page + 1)}
                                        className="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                                     >
                                        &gt;
                                     </button>
                                 </div>
                            </div>
                         ) : null}
                    </div>
                </div>
            </PageListLayout>
            
            <POFormModal 
                isOpen={isCreateModalOpen} 
                onClose={handleCloseCreateModal} 
                onSuccess={() => { 
                    handleCloseCreateModal();
                    refetch();
                }} 
                initialValues={initialCreateValues}
            />

            {/* View Modal (read-only) */}
            {isViewModalOpen && selectedPOId && (
                <POFormModal
                    isOpen={isViewModalOpen}
                    onClose={() => { setIsViewModalOpen(false); setSelectedPOId(undefined); }}
                    onSuccess={() => { setIsViewModalOpen(false); refetch(); }}
                    isViewMode={true}
                />
            )}

            {/* Edit Modal */}
            {isEditModalOpen && selectedPOId && (
                <POFormModal
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setSelectedPOId(undefined); }}
                    onSuccess={() => { setIsEditModalOpen(false); refetch(); }}
                />
            )}

            <GRNFormModal
                isOpen={isGRNModalOpen}
                onClose={() => {
                    setIsGRNModalOpen(false);
                    setSelectedPOIdForGRN(undefined);
                }}
                initialPOId={selectedPOIdForGRN}
                onSuccess={() => {
                   // Refresh list if needed, or navigate to GRN list
                   setIsGRNModalOpen(false);
                }}
            />

            {selectedPOIdForApproval && (
                <POApprovalModal
                    isOpen={isApprovalModalOpen}
                    onClose={() => {
                        setIsApprovalModalOpen(false);
                        setSelectedPOIdForApproval(undefined);
                    }}
                    poId={selectedPOIdForApproval}
                    onSuccess={() => {
                        setIsApprovalModalOpen(false);
                        refetch();
                    }}
                />
            )}
        </>
    );
}