import { useState, useMemo } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, SmartTable, FilterField, MobileListCard, MobileListContainer } from '@ui';
import { POStatusBadge } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { usePOAList, POA_STATUS_OPTIONS } from './hooks/usePOAList';
import type { POListItem } from '@/modules/procurement/types';
import { POAFormModal } from './components';

export default function POAListPage() {
    // ── Hooks (Business Logic) ────────────────────────────────────────────────
    const {
        data, isLoading,
        filters, localFilters, handleFilterChange, handleApplyFilters,
        setFilters, resetFilters,
        handlePageChange,
    } = usePOAList();

    // ── View / Approve Modal State ─────────────────────────────────────────
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<POListItem | undefined>(undefined);

    const handleApprove = (item: POListItem) => {
        setSelectedPO(item);
        setIsApprovalModalOpen(true);
    };

    const handleTestOpenModal = () => {
        const mockItem: POListItem = {
            po_id: 99999,
            po_no: 'PO-TEST-001',
            po_date: new Date().toISOString(),
            vendor_name: 'บริษัท ทดสอบ จำกัด (Vendor Test)',
            status: 'PENDING_APPROVAL',
            subtotal: 1000,
            total_amount: 1070,
            currency_code: 'THB',
        } as any;
        
        (mockItem as any).po_lines = [
            {
                id: 1,
                item_id: 101,
                item_code: 'ITEM001',
                item_name: 'สินค้าทดสอบ 1 (Test Product 1)',
                qty_ordered: 10,
                unit_price: 100,
                is_approved: true,
                line_remark: 'ด่วน',
                line_no: 1
            },
            {
                id: 2,
                item_id: 102,
                item_code: 'ITEM002',
                item_name: 'สินค้าทดสอบ 2 (Test Product 2)',
                qty_ordered: 5,
                unit_price: 200,
                is_approved: true,
                line_no: 2
            }
        ];
        
        setSelectedPO(mockItem);
        setIsApprovalModalOpen(true);
    };

    // ── Columns ───────────────────────────────────────────────────────────────
    const columnHelper = createColumnHelper<POListItem>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full whitespace-nowrap">ลำดับ</div>,
            cell: (info) => <div className="text-center w-full">{info.row.index + 1 + (filters.page - 1) * (filters.limit || 10)}</div>,
            size: 50,
            enableSorting: false,
        }),
        columnHelper.accessor('po_no', {
            header: () => <div className="text-left whitespace-nowrap">เลขที่ PO</div>,
            cell: (info) => (
                <span className="font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
            size: 140,
            enableSorting: true,
        }),
        columnHelper.accessor('po_date', {
            header: 'วันที่',
            cell: (info) => (
                <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs">
                    {formatThaiDate(info.getValue())}
                </span>
            ),
            size: 100,
            enableSorting: true,
        }),
        columnHelper.accessor('qc_no', {
            id: 'ref_docs',
            header: () => <div className="text-left whitespace-nowrap">เอกสารอ้างอิง</div>,
            cell: (info) => {
                const item = info.row.original;
                const prDisplay = item.pr_no || (item.pr_id ? `ID: ${item.pr_id}` : null);
                const qcDisplay = item.qc_no || (item.qc_id ? `ID: ${item.qc_id}` : null);
                
                return (
                    <div className="flex flex-col whitespace-nowrap">
                        {qcDisplay ? (
                            <>
                                <span className="font-semibold text-slate-700 dark:text-gray-200 leading-tight">QC: {qcDisplay}</span>
                                {prDisplay && <span className="text-[10px] text-slate-500 mt-0.5">PR: {prDisplay}</span>}
                            </>
                        ) : prDisplay ? (
                            <span className="font-semibold text-slate-700 dark:text-gray-200 leading-tight">PR: {prDisplay}</span>
                        ) : (
                            <span className="text-gray-400">-</span>
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const vendorDisplayName = (item as any).vendor?.vendor_name || item.vendor_name || (item.vendor_id ? `Vendor ID: ${item.vendor_id}` : '-');
                return (
                    <div className="truncate font-medium text-slate-700 dark:text-gray-200 text-left max-w-[200px]" title={vendorDisplayName}>
                        {vendorDisplayName}
                    </div>
                );
            },
            size: 220,
            enableSorting: true,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center">
                    <POStatusBadge status={info.getValue()} className="whitespace-nowrap scale-[0.9]" />
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.accessor('total_amount', {
            header: () => <div className="text-right w-full whitespace-nowrap">ยอดรวม (บาท)</div>,
            cell: (info) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const val = Number((info.row.original as any).base_total_amount || info.getValue() || 0);
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
                    <div className="flex items-center justify-center">
                        <button
                            onClick={() => handleApprove(item)}
                            className="flex items-center gap-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-sm transition-all whitespace-nowrap"
                            title="อนุมัติเอกสาร"
                        >
                            <CheckCircle size={12} /> พิจารณาอนุมัติ
                        </button>
                    </div>
                );
            },
            size: 150,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit]);

    return (
        <>
            <PageListLayout
                title="รายการอนุมัติใบสั่งซื้อ"
                subtitle="Purchase Order Approval (POA)"
                icon={CheckCircle}
                accentColor="emerald"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                isLoading={isLoading}
                searchForm={
                    <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <FilterField
                                label="เลขที่เอกสาร PO"
                                value={localFilters.search}
                                onChange={(val: string) => handleFilterChange('search', val)}
                                placeholder="กรอกเลขที่เอกสาร"
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
                                value={localFilters.status || ''}
                                onChange={(val: string) => handleFilterChange('status', val as any)}
                                options={POA_STATUS_OPTIONS}
                                accentColor="emerald"
                            />
                            <div className="md:col-span-2 lg:col-span-4 flex flex-col sm:flex-row flex-wrap justify-end gap-2 items-center">
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={handleTestOpenModal}
                                        className="flex-1 sm:flex-none h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        เปิด Modal (ทดสอบ)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="flex-1 sm:flex-none h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300 shadow-sm whitespace-nowrap"
                                    >
                                        ล้างค่า
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 sm:flex-none h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        <Search size={18} /> ค้นหา
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                }
            >
                <div className="h-full flex flex-col">
                    <div className="hidden md:block flex-1 overflow-hidden">
                        <SmartTable
                            data={data?.data ?? []}
                            columns={columns as ColumnDef<POListItem>[]}
                            isLoading={isLoading}
                            enableRowSelection={false}
                            pagination={{
                                pageIndex: filters.page,
                                pageSize: filters.limit,
                                totalCount: data?.total ?? 0,
                                onPageChange: handlePageChange,
                                onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 })
                            }}
                            rowIdField="po_id"
                        />
                    </div>

                    <MobileListContainer
                        isLoading={isLoading}
                        isEmpty={!data?.data.length}
                        pagination={data?.total ? { page: filters.page, total: data.total, limit: filters.limit, onPageChange: handlePageChange } : undefined}
                    >
                        {data?.data.map((item) => (
                            <MobileListCard
                                key={item.po_id}
                                title={item.po_no}
                                subtitle={formatThaiDate(item.po_date)}
                                statusBadge={<POStatusBadge status={item.status} />}
                                details={[
                                    { label: 'ผู้ขาย:', value: item.vendor_name || '-' },
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    { label: 'ยอดรวมสุทธิ', value: <span className="font-bold text-emerald-600">{Number((item as any).base_total_amount || item.total_amount || 0).toLocaleString()}</span> }
                                ]}
                                actions={
                                    <button
                                        onClick={() => handleApprove(item)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 shadow-sm"
                                    >
                                        <CheckCircle size={14} /> พิจารณาอนุมัติ
                                    </button>
                                }
                            />
                        ))}
                    </MobileListContainer>
                </div>
            </PageListLayout>

            {isApprovalModalOpen && selectedPO && (
                <POAFormModal
                    isOpen={isApprovalModalOpen}
                    onClose={() => {
                        setIsApprovalModalOpen(false);
                        setSelectedPO(undefined);
                    }}
                    onSuccess={() => {
                        setIsApprovalModalOpen(false);
                        handleApplyFilters();
                    }}
                    poId={selectedPO.po_id}
                    initialValues={selectedPO}
                />
            )}
        </>
    );
}
