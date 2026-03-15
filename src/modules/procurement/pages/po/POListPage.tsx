import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Eye, Send, CheckCircle, Package, Edit, Search, Plus } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, SmartTable, FilterField, MobileListCard, MobileListContainer } from '@ui';
import { POStatusBadge } from '@ui';
import { usePOList, usePOActions, PO_STATUS_OPTIONS } from './hooks';
import type { POListItem } from '@/modules/procurement/types';
import type { POFormData } from '@/modules/procurement/schemas/po-schemas';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { POFormModal, POApprovalModal, DocumentSourceSelectorModal } from './components';
import GRNFormModal from '@/modules/procurement/pages/grn/components/GRNFormModal';

export default function POListPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // ── Hooks (Business Logic) ────────────────────────────────────────────────
    const {
        data, isLoading,
        filters, localFilters, handleFilterChange, handleApplyFilters,
        setFilters, resetFilters,
        handlePageChange, handleSortChange, sortConfig,
    } = usePOList();

    const { handleIssuePO, handleDirectSubmit } = usePOActions();

    // ── Modal State (URL Driven) ──────────────────────────────────────────────
    const isCreateInterceptorOpen = searchParams.get('mode') === 'select-source';
    const isCreateModalOpen = searchParams.get('mode') === 'create';
    const createFromQC = searchParams.get('createFromQC') === 'true';
    const vendorIdParam = searchParams.get('vendorId');
    const qcIdParam = searchParams.get('sourceQcId');
    const prIdParam = searchParams.get('sourcePrId');
    const winningVqIdParam = searchParams.get('winningVqId');
    const remarksParam = searchParams.get('remarks');

    const initialCreateValues = useMemo<Partial<POFormData> | undefined>(() => {
        if (createFromQC) {
            return {
                vendor_id: vendorIdParam ? Number(vendorIdParam) : undefined,
                qc_id: qcIdParam ? Number(qcIdParam) : undefined,
                pr_id: prIdParam ? Number(prIdParam) : undefined,
                winning_vq_id: winningVqIdParam ? Number(winningVqIdParam) : undefined,
                remarks: remarksParam || undefined,
                po_lines: [],
            };
        }
        if (vendorIdParam) {
            return { vendor_id: Number(vendorIdParam) };
        }
        return undefined;
    }, [createFromQC, vendorIdParam, qcIdParam, prIdParam, winningVqIdParam, remarksParam]);

    const handleCloseCreateModal = () => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('mode');
            newParams.delete('createFromQC');
            newParams.delete('vendorId');
            newParams.delete('qcNo');
            newParams.delete('sourceQcId');
            newParams.delete('winningVqId');
            newParams.delete('sourcePrId');
            newParams.delete('remarks');
            return newParams;
        });
    };

    // ── View / Edit Modal State ───────────────────────────────────────────────
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPOId, setSelectedPOId]       = useState<number | undefined>(undefined);

    // ── GRN Modal State ───────────────────────────────────────────────────────
    const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
    const [selectedPOIdForGRN, setSelectedPOIdForGRN] = useState<number | undefined>(undefined);

    // ── Approval Modal State ──────────────────────────────────────────────────
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [selectedPOIdForApproval, setSelectedPOIdForApproval] = useState<number | undefined>(undefined);

    // ── Action Handlers (UI-only: open modals) ────────────────────────────────
    const handleView = useCallback((id: number) => {
        setSelectedPOId(id);
        setIsViewModalOpen(true);
    }, []);

    const handleEdit = useCallback((id: number) => {
        setSelectedPOId(id);
        setIsEditModalOpen(true);
    }, []);

    const handleApprove = useCallback((id: number) => {
        setSelectedPOIdForApproval(id);
        setIsApprovalModalOpen(true);
    }, []);

    const handleGRN = useCallback((id: number) => {
        setSelectedPOIdForGRN(id);
        setIsGRNModalOpen(true);
    }, []);

    // ── Columns ───────────────────────────────────────────────────────────────
    const columnHelper = createColumnHelper<POListItem>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center w-full">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            footer: () => <div className="absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap font-bold text-sm text-gray-700 dark:text-gray-200">ยอดรวมทั้งหมด :</div>,
            size: 50,
            enableSorting: false,
        }),
        columnHelper.accessor('po_no', {
            header: () => <div className="text-left whitespace-nowrap">เลขที่ PO</div>,
            cell: (info) => (
                <span className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
            size: 120,
            enableSorting: true,
        }),
        columnHelper.accessor('po_date', {
            header: 'วันที่',
            cell: (info) => (
                <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs">
                    {formatThaiDate(info.getValue())}
                </span>
            ),
            size: 90,
            enableSorting: true,
        }),
        columnHelper.accessor('qc_no', {
            id: 'ref_docs',
            header: () => <div className="text-left whitespace-nowrap">เอกสารอ้างอิง</div>,
            cell: (info) => {
                const item = info.row.original;
                // Smart Fallback Mapping for PR/RFQ/QC
                const prDisplay = item.pr_no || (item.pr_id ? `PR ID: ${item.pr_id}` : null);
                const qcDisplay = item.qc_no || (item.qc_id ? `QC ID: ${item.qc_id}` : null);
                
                return (
                    <div className="flex flex-col whitespace-nowrap">
                        <span
                            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer leading-tight"
                            title={`QC: ${qcDisplay || '-'}`}
                        >
                            {qcDisplay || '-'}
                        </span>
                        {prDisplay && (
                            <span
                                className="text-[10px] text-slate-500 mt-0.5"
                                title={`PR: ${prDisplay}`}
                            >
                                Ref: {prDisplay}
                            </span>
                        )}
                    </div>
                );
            },
            size: 130,
            enableSorting: false,
        }),
        columnHelper.accessor('vendor_name', {
            header: 'ชื่อผู้ขาย',
            cell: (info) => {
                const item = info.row.original;
                // Smart Fallback Mapping for Vendor
                // @ts-expect-error - handled dynamic mapping from API
                const vendorDisplayName = item.vendor?.vendor_name || item.vendor_name || (item.vendor_id ? `Vendor ID: ${item.vendor_id}` : '-');
                
                return (
                    <div className="truncate font-medium text-slate-700 dark:text-gray-200 text-left max-w-[120px] lg:max-w-[180px]" title={vendorDisplayName}>
                        {vendorDisplayName}
                    </div>
                );
            },
            size: 200,
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center" title={info.row.original.reject_reason || undefined}>
                    <POStatusBadge status={info.getValue()} className="whitespace-nowrap scale-[0.9]" />
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.accessor('item_count', {
            header: () => <div className="text-right w-full whitespace-nowrap">รายการ</div>,
            cell: (info) => {
                const item = info.row.original;
                // Safe Array Access
                // @ts-expect-error - handle dynamic mapping
                const count = item.item_count || item.po_lines?.length;
                return (
                    <div className="text-right text-gray-600 dark:text-gray-300 w-full text-xs font-medium">
                        {count !== undefined ? `${count} รายการ` : '-'}
                    </div>
                );
            },
            size: 70,
            enableSorting: false,
        }),
        columnHelper.accessor('total_amount', {
            header: () => <div className="text-right w-full whitespace-nowrap">ยอดรวม (บาท)</div>,
            cell: (info) => {
                const item = info.row.original;
                // Strict Number Formatting - Using base_total_amount as priority
                // @ts-expect-error - handle string to number conversion from API
                const val = Number(item.base_total_amount || item.total_amount || 0);
                return (
                    <div className="text-right font-bold text-gray-800 dark:text-white whitespace-nowrap w-full text-xs">
                        {new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}
                    </div>
                );
            },
            size: 130,
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
                            onClick={() => handleView(item.po_id)}
                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                            title="ดูรายละเอียด"
                        >
                            <Eye size={14} />
                        </button>

                        {/* DRAFT only: Edit (amber) + ส่งอนุมัติ (emerald) */}
                        {item.status === 'DRAFT' && (
                            <>
                                <button
                                    onClick={() => handleEdit(item.po_id)}
                                    className="flex items-center gap-1 px-1.5 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded shadow-sm border border-transparent hover:border-amber-200 transition-all"
                                    title="แก้ไข"
                                >
                                    <Edit size={12} />
                                    <span className="text-[10px] font-bold">แก้ไข</span>
                                </button>
                                <button
                                    onClick={() => handleDirectSubmit(item)}
                                    className="flex items-center gap-1 px-1.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-all"
                                >
                                    <Send size={10} />
                                    ส่งอนุมัติ
                                </button>
                            </>
                        )}

                        {/* PENDING_APPROVAL: อนุมัติ (emerald) */}
                        {item.status === 'PENDING_APPROVAL' && (
                            <button
                                onClick={() => handleApprove(item.po_id)}
                                className="flex items-center gap-1 px-1.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-all"
                                title="อนุมัติ PO"
                            >
                                <CheckCircle size={10} />
                                อนุมัติ
                            </button>
                        )}

                        {/* APPROVED: ออก PO (blue = create next doc) */}
                        {item.status === 'APPROVED' && (
                            <button
                                onClick={() => handleIssuePO(item)}
                                className="flex items-center gap-1 px-1.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded shadow-sm transition-all"
                                title="ออก PO"
                            >
                                <Send size={10} />
                                ออก PO
                            </button>
                        )}

                        {/* ISSUED: เปิด GRN (violet = special process) */}
                        {item.status === 'ISSUED' && (
                            <button
                                onClick={() => handleGRN(item.po_id)}
                                className="flex items-center gap-1 px-1.5 py-1 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold rounded shadow-sm transition-all"
                                title="เปิดใบรับสินค้า"
                            >
                                <Package size={10} />
                                เปิด GRN
                            </button>
                        )}
                    </div>
                );
            },
            footer: () => {
                 // Safe Math calculation - base_total_amount might be a string
                 const total = (data?.data || []).reduce((sum, item) => {
                     // @ts-expect-error - string to number coercion
                     const amount = Number(item.base_total_amount || item.total_amount || 0);
                     return sum + amount;
                 }, 0);
                 
                 return (
                     <div className="text-right font-bold text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap pr-2">
                         {new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(total)} บาท
                     </div>
                 );
            },
            size: 140,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, data?.data, handleGRN, handleApprove, handleIssuePO, handleDirectSubmit, handleView, handleEdit]);

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
                    <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        {/* Row 1 */}
                        <FilterField
                            label="เลขที่ PO"
                            value={localFilters.search}
                            onChange={(val: string) => handleFilterChange('search', val)}
                            placeholder="PO-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="เลขที่ PR อ้างอิง"
                            value={localFilters.search2}
                            onChange={(val: string) => handleFilterChange('search2', val)}
                            placeholder="PR-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="ชื่อผู้ขาย"
                            value={localFilters.search3}
                            onChange={(val: string) => handleFilterChange('search3', val)}
                            placeholder="ชื่อผู้ขาย"
                            accentColor="blue"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={localFilters.status}
                            onChange={(val: string) => handleFilterChange('status', val)}
                            options={PO_STATUS_OPTIONS}
                            accentColor="blue"
                        />

                        {/* Row 2 */}
                        <FilterField
                            label="วันที่เอกสาร จาก"
                            type="date"
                            value={localFilters.dateFrom || ''}
                            onChange={(val: string) => handleFilterChange('dateFrom', val)}
                            accentColor="blue"
                        />
                        <FilterField
                            label="ถึงวันที่"
                            type="date"
                            value={localFilters.dateTo || ''}
                            onChange={(val: string) => handleFilterChange('dateTo', val)}
                            accentColor="blue"
                        />
                        
                        {/* Action Buttons Group (Col 3 & 4 Right Aligned) */}
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
                                onClick={() => setSearchParams({ mode: 'select-source' })}
                                className="w-full sm:w-auto h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                สร้างใบสั่งซื้อใหม่
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
                            rowIdField="po_header_id"
                            className="h-full"
                            showFooter={true}
                        />
                    </div>

                    {/* Mobile View: Cards (shared MobileListContainer + MobileListCard) */}
                    <MobileListContainer
                        isLoading={isLoading}
                        isEmpty={!data?.data.length}
                        pagination={data?.total ? { page: filters.page, total: data.total, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                    >
                        {data?.data.map((item) => (
                            <MobileListCard
                                key={item.po_header_id || item.po_id}
                                title={item.po_no}
                                subtitle={formatThaiDate(item.po_date)}
                                statusBadge={<POStatusBadge status={item.status} />}
                                details={[
                                    { label: 'ผู้ขาย:', value: item.vendor_name || '-' },
                                    {
                                        label: 'เอกสารอ้างอิง:',
                                        value: (
                                            <div className="flex flex-col items-end">
                                                <span className="font-semibold text-blue-600 dark:text-blue-400">{item.qc_no || '-'}</span>
                                                {item.pr_no && <span className="text-xs text-slate-500">{item.pr_no}</span>}
                                            </div>
                                        ),
                                    },
                                    { label: 'จำนวนรายการ:', value: `${item.item_count} รายการ` },
                                ]}
                                amountLabel="ยอดรวมสุทธิ"
                                amountValue={
                                    <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                        {item.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                }
                                actions={
                                    <>
                                        <button
                                            onClick={() => handleView(item.po_id)}
                                            className="flex-1 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1 border border-gray-200 dark:border-slate-600"
                                        >
                                            <Eye size={14} /> ดู
                                        </button>
                                        {item.status === 'DRAFT' && (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(item.po_id)}
                                                    className="flex-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Edit size={14} /> แก้ไข
                                                </button>
                                                <button
                                                    onClick={() => handleDirectSubmit(item)}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm whitespace-nowrap"
                                                >
                                                    <Send size={14} /> ส่งอนุมัติ
                                                </button>
                                            </>
                                        )}
                                        {item.status === 'PENDING_APPROVAL' && (
                                            <button
                                                onClick={() => handleApprove(item.po_id)}
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
                                                onClick={() => handleGRN(item.po_id)}
                                                className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                                            >
                                                <Package size={14} /> เปิด GRN
                                            </button>
                                        )}
                                    </>
                                }
                            />
                        ))}
                    </MobileListContainer>
                </div>
            </PageListLayout>

            {/* Smart Intercept Modal */}
            <DocumentSourceSelectorModal
                isOpen={isCreateInterceptorOpen}
                onClose={() => handleCloseCreateModal()}
                onSelectSource={(sourceType: 'QC' | 'BLANK', prId?: number, qcId?: number, vendorId?: number, winningVqId?: number) => {
                    if (sourceType === 'QC' && (prId || qcId)) {
                        setSearchParams({ 
                            mode: 'create', 
                            createFromQC: 'true', 
                            ...(prId ? { sourcePrId: String(prId) } : {}),
                            ...(qcId ? { sourceQcId: String(qcId) } : {}),
                            ...(vendorId ? { vendorId: String(vendorId) } : {}),
                            ...(winningVqId ? { winningVqId: String(winningVqId) } : {})
                        });
                    } else {
                        setSearchParams({ mode: 'create' });
                    }
                }}
            />
            
            <POFormModal 
                isOpen={isCreateModalOpen} 
                onClose={handleCloseCreateModal} 
                onSuccess={() => { 
                    handleCloseCreateModal();
                    handleApplyFilters();
                }} 
                initialValues={initialCreateValues}
            />

            {/* View Modal (read-only) */}
            {isViewModalOpen && selectedPOId && (
                <POFormModal
                    isOpen={isViewModalOpen}
                    poId={selectedPOId}
                    onClose={() => { setIsViewModalOpen(false); setSelectedPOId(undefined); }}
                    onSuccess={() => { setIsViewModalOpen(false); handleApplyFilters(); }}
                    isViewMode={true}
                />
            )}

            {/* Edit Modal */}
            {isEditModalOpen && selectedPOId && (
                <POFormModal
                    isOpen={isEditModalOpen}
                    poId={selectedPOId}
                    onClose={() => { setIsEditModalOpen(false); setSelectedPOId(undefined); }}
                    onSuccess={() => { setIsEditModalOpen(false); handleApplyFilters(); }}
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
                        handleApplyFilters();
                    }}
                />
            )}
        </>
    );
}