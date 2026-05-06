/**
 * @file QuotationListPage.tsx
 * @description หน้ารายการใบเสนอราคาขาย (Sales Quotation List Page)
 * @tables quotation_header (D7)
 */

import { useState, useMemo } from 'react';
import { FileText, Search, Plus, Send } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { QuotationService } from '@sales/quotation/services/quotation.service';
import { logger } from '@/shared/utils';
import type { QuotationHeader, QuotationLineData } from '@sales/quotation/types/quotation.types';
import type { QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';
import { QuotationFormModal } from '@sales/quotation/components/QuotationFormModal';
import { useQuotationList } from '@sales/quotation/hooks/useQuotation';
import { useQuery } from '@tanstack/react-query';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { ConfirmationModal } from '@system/ConfirmationModal';
import { SQStatusBadge } from '@sales/shared/components/SQStatusBadge';
import { SQActionsCell } from './components/SQActionsCell';
import { AQHistoryModal } from '@sales/shared/components/AQHistoryModal';
import { SalesMobileCard } from '@sales/shared/components/SalesMobileCard';
import { useToast } from '@ui/feedback/Toast';
import { formatNumber } from '@/shared/utils';

// ====================================================================================
// CONSTANTS
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'PENDING', label: 'รออนุมัติ' },
    { value: 'REJECTED', label: 'ไม่อนุมัติ' },
    { value: 'SENT', label: 'ส่งแล้ว' },
    { value: 'ACCEPTED', label: 'อนุมัติแล้ว' },
];

// ====================================================================================
// COMPONENTS
// ====================================================================================


// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function QuotationListPage() {
    const { toast } = useToast();
    const [sqNo, setSqNo] = useState('');
    const [customer, setCustomer] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
    const [selectedData, setSelectedData] = useState<QuotationHeader | undefined>(undefined);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
    const [isApproveLoading, setIsApproveLoading] = useState(false);
    const [pendingApproveId, setPendingApproveId] = useState<string | null>(null);
    
    // 📄 Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    
    // 🏷️ History Modal State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historySqId, setHistorySqId] = useState<number | undefined>(undefined);
    const [historySqNo, setHistorySqNo] = useState<string>('');

    // 🏗️ Memoize query params to prevent unstable identities
    const queryParams = useMemo(() => ({
        sq_no: sqNo,
        customer_name: customer,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        start_date: startDate,
        end_date: endDate,
        page,
        limit
    }), [sqNo, customer, statusFilter, startDate, endDate, page, limit]);

    const { data: apiData, isLoading, refetch } = useQuotationList(queryParams);

    // 🏷️ Fetch Customers for Name Lookup
    const { data: customerResponse } = useQuery({
        queryKey: ['master-customers-lookup'],
        queryFn: () => CustomerService.getList({ limit: 1000 }),
        staleTime: 30 * 60 * 1000,
    });

    const customerMap = useMemo(() => {
        const map = new Map<string | number, string>();
        (customerResponse?.data || []).forEach(c => {
            map.set(String(c.customer_id), c.customer_name_th || c.customer_name || '');
        });
        return map;
    }, [customerResponse]);

    const displayData = useMemo(() => apiData?.data || [], [apiData]);

    const handleClearFilter = () => {
        setSqNo('');
        setCustomer('');
        setStatusFilter('ALL');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    const handleCreate = () => {
        setSelectedId(undefined);
        setSelectedData(undefined);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleView = (id: string, row?: QuotationHeader) => {
        setSelectedId(id);
        setSelectedData(row);
        setModalMode('view');
        setIsModalOpen(true);
    };

    const handleEdit = (id: string, row?: QuotationHeader) => {
        setSelectedId(id);
        setSelectedData(row);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleSendApprove = (id: string) => {
        setPendingApproveId(id);
        setIsApproveConfirmOpen(true);
    };

    const confirmSendApprove = async () => {
        if (!pendingApproveId) return;
        setIsApproveLoading(true);
        try {
            // 🔍 Resilience Strategy: Use type-safe casting instead of 'any' to satisfy Lint rules.
            const rawRecord = displayData.find(item => String(item.id) === pendingApproveId) as unknown;
            const record = rawRecord as Record<string, unknown>;
            
            if (record) {
                // Map List Record to Partial Form Values to satisfy Backend mandatory fields.
                // 🛡️ Resolution Priority: 
                // 1. Existing tax_code_id in record
                // 2. Hidden tax_code_id in rawData 
                // 3. undefined (to prevent sending '0' which backend rejects)
                const rawData = (record.rawData || {}) as Record<string, unknown>;
                const resolvedTaxCode = record.tax_code_id || rawData.tax_code_id;
                
                const updatePayload: Partial<QuotationFormValues> = {
                    status: 'PENDING' as const,
                    sq_status: 'PENDING' as const,
                    // 🛡️ Rescue Lines: Explicitly map and cast types to satisfy QuotationLineSchema requirements
                    lines: ((record.lines || []) as QuotationLineData[]).map(line => ({
                        sq_line_id: line.sq_line_id ? String(line.sq_line_id) : undefined,
                        sq_id: line.sq_id ? String(line.sq_id) : undefined,
                        item_id: Number(line.item_id || 0),
                        item_code: line.item_code,
                        item_name: line.item_name,
                        qty: Number(line.qty || 0),
                        uom_id: Number(line.uom_id || 0),
                        unit_price: Number(line.unit_price || 0),
                        discount_expression: line.discount_expression,
                        line_discount: Number(line.line_discount || 0),
                        tax_code_id: line.tax_code_id ? Number(line.tax_code_id) : null,
                        line_total: Number(line.line_total || 0),
                        note: line.note,
                        price_source: line.price_source,
                        price_source_name: line.price_source_name
                    })),
                    sq_date: String(record.date || record.sq_date || new Date().toISOString().split('T')[0]),
                    customer_id: record.customer_id ? Number(record.customer_id) : undefined,
                    branch_id: record.branch_id ? Number(record.branch_id) : undefined,
                    lead_id: record.lead_id ? Number(record.lead_id) : null,
                    // 🛡️ Resolve tracking IDs: Prioritize mapped record values, then rawData fallback to satisfy backend integer requirements
                    sale_area_id: (record.sale_area_id ?? record.emp_area_id ?? (record.rawData as Record<string, unknown>)?.sale_area_id ?? (record.rawData as Record<string, unknown>)?.emp_area_id) ? Number(record.sale_area_id ?? record.emp_area_id ?? (record.rawData as Record<string, unknown>)?.sale_area_id ?? (record.rawData as Record<string, unknown>)?.emp_area_id) : undefined,
                    emp_sale_id: (record.emp_sale_id ?? (record.rawData as Record<string, unknown>)?.emp_sale_id) ? Number(record.emp_sale_id ?? (record.rawData as Record<string, unknown>)?.emp_sale_id) : undefined,
                    emp_dept_id: (record.emp_dept_id ?? (record.rawData as Record<string, unknown>)?.emp_dept_id) ? Number(record.emp_dept_id ?? (record.rawData as Record<string, unknown>)?.emp_dept_id) : undefined,
                    project_id: (record.project_id ?? (record.rawData as Record<string, unknown>)?.project_id) ? Number(record.project_id ?? (record.rawData as Record<string, unknown>)?.project_id) : undefined,
                    tax_code_id: resolvedTaxCode ? Number(resolvedTaxCode) : undefined,
                    exchange_rate_date: String(record.exchange_rate_date || record.date || new Date().toISOString().split('T')[0]),
                    // 🛡️ Financial Integrity: Must preserve currency and rate to prevent reset to THB/1
                    base_currency_code: String(record.base_currency_code || (record.rawData as Record<string, unknown>)?.base_currency_code || 'THB'),
                    quote_currency_code: String(record.quote_currency_code || (record.rawData as Record<string, unknown>)?.quote_currency_code || 'THB'),
                    exchange_rate: Number(record.exchange_rate || (record.rawData as Record<string, unknown>)?.exchange_rate || 1),
                    discount_expression: String(record.discount_expression || (record.rawData as Record<string, unknown>)?.discount_expression || '0'),
                    
                    // 🛡️ Critical Fix: Preserve header fields that are often missing from the list view but exist in rawData
                    payment_term_days: Number((record.rawData as Record<string, unknown>)?.payment_term_days ?? record['payment_term_days'] ?? 0),
                    valid_until: String(record.expiry_date || (record.rawData as Record<string, unknown>)?.valid_until || ''),
                    remarks: String(record.remarks || (record.rawData as Record<string, unknown>)?.remarks || ''),
                    onhold: String((record.rawData as Record<string, unknown>)?.onhold || 'N') as 'Y' | 'N',
                };

                await QuotationService.update(pendingApproveId, updatePayload);
            }
            
            refetch();
            setIsApproveConfirmOpen(false);
            toast('ส่งใบเสนอราคาเพื่อรออนุมัติเรียบร้อยแล้ว', 'success');
        } catch (error) {
            logger.error('Failed to send for approval:', error);
            toast('เกิดข้อผิดพลาดในการส่งอนุมัติ กรุณาลองใหม่อีกครั้ง', 'error');
        } finally {
            setIsApproveLoading(false);
            setPendingApproveId(null);
        }
    };

    const handleViewHistory = (row: QuotationHeader) => {
        setHistorySqId(Number(row.sq_id || row.id));
        setHistorySqNo(row.sq_no || '');
        setIsHistoryOpen(true);
    };

    // Columns Definition
    const columnHelper = createColumnHelper<QuotationHeader>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center w-full">ลำดับ</div>,
            cell: (info) => <div className="flex justify-center items-center w-full">{(page - 1) * limit + info.row.index + 1}</div>,
            size: 50,
            enableSorting: false,
        }),
        columnHelper.accessor('sq_no', {
            header: 'เลขที่ใบเสนอราคา',
            cell: (info) => (
                <span 
                    onClick={() => handleViewHistory(info.row.original)}
                    className="text-blue-600 font-semibold hover:underline cursor-pointer transition-all"
                >
                    {info.getValue()}
                </span>
            ),
            size: 150,
            enableSorting: false,
        }),
        columnHelper.accessor('date', {
            header: 'วันที่',
            cell: (info) => {
                const val = info.getValue();
                if (!val) return '-';
                const d = new Date(val);
                return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-GB');
            },
            size: 120,
            enableSorting: false,
        }),
        columnHelper.accessor('customer_name', {
            header: 'ลูกค้า',
            cell: (info) => {
                const customerId = info.row.original.customer_id;
                const nameFromLookup = customerMap.get(String(customerId));
                const displayName = nameFromLookup || info.getValue() || 'ไม่ระบุ';

                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
                        <span className="text-xs text-gray-500">{info.row.original.customer_code}</span>
                    </div>
                );
            },
            size: 200,
            enableSorting: false,
        }),
        columnHelper.accessor('total_amount', {
            header: () => <div className="text-center w-full">มูลค่ารวม (บาท)</div>,
            cell: (info) => {
                const raw = info.row.original.rawData as Record<string, unknown>;
                const rate = Number(raw?.exchange_rate || 1);
                const totalAmount = Number(info.getValue()) || 0;
                
                // 🎯 Absolute Priority: Use pre-calculated base total from backend (.99)
                // if it exists, otherwise fallback to on-the-fly multiplication.
                const baseTotal = info.row.original.base_total_amount;
                const convertedAmount = (baseTotal && baseTotal > 0) 
                    ? baseTotal 
                    : (totalAmount * rate);

                const currency = info.row.original.currency;

                return (
                    <div className="flex flex-col items-center gap-0.5 w-full">
                        <div className="flex items-center gap-1 text-emerald-600 font-bold">
                            <span className="text-xs">฿</span>
                            <span>{formatNumber(convertedAmount)}</span>
                        </div>
                        {currency !== 'THB' && (
                            <div className="text-[10px] text-gray-400 font-medium italic">
                                ({currency} {formatNumber(totalAmount)})
                            </div>
                        )}
                    </div>
                );
            },
            size: 150,
            enableSorting: false,
        }),
        columnHelper.accessor('expiry_date', {
            header: 'หมดอายุ',
            cell: (info) => {
                const val = info.getValue();
                if (!val) return '-';
                const d = new Date(val);
                return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-GB');
            },
            size: 120,
            enableSorting: false,
        }),
        columnHelper.accessor('status', {
            header: () => <div className="flex justify-center items-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center items-center w-full">
                    <SQStatusBadge status={info.getValue()} />
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="flex justify-center items-center w-full">การจัดการ</div>,
            cell: (info) => (
                <SQActionsCell 
                    row={info.row.original}
                    onView={handleView}
                    onEdit={handleEdit}
                    onSendApprove={handleSendApprove}
                    onViewHistory={handleViewHistory}
                />
            ),
            size: 180,
            enableSorting: false,
        }),
    ], [columnHelper, customerMap, page, limit]);

    return (
        <PageListLayout
            title="ใบเสนอราคาขาย - Sales Quotation (SQ)"
            subtitle="จัดการข้อมูลใบเสนอราคาให้ลูกค้า"
            icon={FileText}
            accentColor="blue"
            totalCount={apiData?.total || 0}
            searchForm={
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <FilterField
                        label="เลขที่ใบเสนอราคา"
                        value={sqNo}
                        onChange={setSqNo}
                        placeholder="SQ-xxxx"
                        accentColor="blue"
                    />
                    <FilterField
                        label="ลูกค้า"
                        value={customer}
                        onChange={setCustomer}
                        placeholder="ชื่อลูกค้า"
                        accentColor="blue"
                    />
                    <FilterField
                        label="วันที่ตั้งแต่"
                        type="date"
                        value={startDate}
                        onChange={setStartDate}
                        accentColor="blue"
                    />
                    <FilterField
                        label="ถึงวันที่"
                        type="date"
                        value={endDate}
                        onChange={setEndDate}
                        accentColor="blue"
                    />
                    <FilterField
                        label="สถานะ"
                        type="select"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={STATUS_OPTIONS}
                        accentColor="blue"
                    />
                    
                    {/* Buttons Layout: 2 Rows on Mobile, 1 Row on Desktop */}
                    <div className="md:col-span-5 flex flex-col md:flex-row md:justify-end gap-3 mt-2">
                        <div className="grid grid-cols-2 md:flex gap-2">
                            <button
                                onClick={handleClearFilter}
                                className="h-10 bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-lg font-medium transition-all flex items-center justify-center px-4 gap-2"
                            >
                                <Plus size={18} className="rotate-45 text-slate-500" strokeWidth={2.5} />
                                ล้างค่า
                            </button>
                            <button
                                onClick={() => { setPage(1); refetch(); }}
                                className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center px-6 gap-2"
                            >
                                <Search size={18} strokeWidth={3} />
                                ค้นหา
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleCreate}
                            className="h-10 w-full md:w-auto px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            สร้างใบเสนอราคาใหม่
                        </button>
                    </div>
                </div>
            }
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <SmartTable
                    data={displayData}
                    columns={columns}
                    isLoading={isLoading}
                    pagination={{
                        pageIndex: page,
                        pageSize: limit,
                        totalCount: apiData?.total || 0,
                        onPageChange: (p) => setPage(p),
                        onPageSizeChange: (s) => { setLimit(s); setPage(1); },
                    }}
                    renderMobileCard={(item) => (
                        <SalesMobileCard 
                            docNo={item.sq_no}
                            customerName={customerMap.get(String(item.customer_id)) || item.customer_name || 'ไม่ระบุ'}
                            date={item.date ? new Date(item.date).toLocaleDateString('en-GB') : '-'}
                            amount={item.base_total_amount || (Number(item.total_amount) * Number((item.rawData as Record<string, unknown>)?.exchange_rate || 1))}
                            statusBadge={<SQStatusBadge status={item.status} />}
                            onClick={() => handleViewHistory(item)}
                            actions={
                                <div className="flex gap-2 w-full mt-2">
                                    {/* 1. VIEW Button */}
                                    <button 
                                        onClick={() => handleView(String(item.id || item.sq_id), item)}
                                        className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        <FileText size={14} /> ดูรายละเอียด
                                    </button>

                                    {/* 2. EDIT Button (For Draft/Pending/Rejected) */}
                                    {(item.status === 'DRAFT' || item.status === 'PENDING' || item.status === 'REJECTED') && (
                                        <button 
                                            onClick={() => handleEdit(String(item.id || item.sq_id), item)}
                                            className="flex-1 h-9 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <Plus size={14} className={item.status === 'REJECTED' ? '' : 'rotate-45'} /> 
                                            {item.status === 'REJECTED' ? 'แก้ไขและส่งใหม่' : 'แก้ไข'}
                                        </button>
                                    )}

                                    {/* 3. SEND APPROVE (For Draft Only) - High Priority Action */}
                                    {item.status === 'DRAFT' && (
                                        <button 
                                            onClick={() => handleSendApprove(String(item.id || item.sq_id))}
                                            className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                                        >
                                            <Send size={14} /> ส่งอนุมัติ
                                        </button>
                                    )}

                                    {/* 4. HISTORY (For Approved/Rejected) */}
                                    {(item.status === 'ACCEPTED' || item.status === 'APPROVED' || item.status === 'REJECTED') && (
                                        <button 
                                            onClick={() => handleViewHistory(item)}
                                            className="h-9 px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center transition-all active:scale-95"
                                            title="ประวัติการอนุมัติ"
                                        >
                                            <Search size={14} />
                                        </button>
                                    )}
                                </div>
                            }
                        />
                    )}
                />
            </div>

            {/* Form Modal */}
            <QuotationFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                id={selectedId}
                initialData={selectedData}
                onSuccess={() => refetch()}
                readOnly={modalMode === 'view'}
            />

            {/* Send Approve Confirmation */}
            <ConfirmationModal 
                isOpen={isApproveConfirmOpen}
                onClose={() => !isApproveLoading && setIsApproveConfirmOpen(false)}
                onConfirm={confirmSendApprove}
                title="ยืนยันการส่งอนุมัติ"
                description="คุณต้องการส่งใบเสนอราคานี้เพื่อขออนุมัติใช่หรือไม่? เมื่อส่งแล้วสถานะจะเปลี่ยนเป็น 'รออนุมัติ'"
                confirmText="ยืนยันส่งอนุมัติ"
                cancelText="ยกเลิก"
                variant="info"
                isLoading={isApproveLoading}
                icon={Send}
            />

            {/* Approval History Modal */}
            <AQHistoryModal 
                isOpen={isHistoryOpen}
                onClose={() => {
                    setIsHistoryOpen(false);
                    setHistorySqId(undefined);
                    setHistorySqNo('');
                }}
                sqId={historySqId}
                sqNo={historySqNo}
            />
        </PageListLayout>
    );
}
