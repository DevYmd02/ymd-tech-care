/**
 * @file QuotationListPage.tsx
 * @description หน้ารายการใบเสนอราคาขาย (Sales Quotation List Page)
 */

import { useState, useMemo } from 'react';
import { FileText, Search, Plus, Send } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { QuotationService } from '@sales/quotation/services/quotation.service';
import type { QuotationHeader, QuotationLineData } from '@sales/quotation/types/quotation.types';
import type { QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';
import { QuotationFormModal } from '@sales/quotation/components/QuotationFormModal';
import { useQuotationList } from '@sales/quotation/hooks/useQuotation';
import { useQuery } from '@tanstack/react-query';
import { CustomerService } from '@/modules/master-data/customer/customer-master/services/customer.service';
import { ConfirmationModal } from '@/shared/components/system/ConfirmationModal';
import { SQStatusBadge } from '@/modules/sales/shared/components/SQStatusBadge';
import { SQActionsCell } from './components/SQActionsCell';

// ====================================================================================
// CONSTANTS
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'PENDING', label: 'รออนุมัติ' },
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

    // 🏗️ Memoize query params to prevent unstable identities
    const queryParams = useMemo(() => ({
        sq_no: sqNo,
        customer_name: customer,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        start_date: startDate,
        end_date: endDate
    }), [sqNo, customer, statusFilter, startDate, endDate]);

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
                };

                await QuotationService.update(pendingApproveId, updatePayload);
            }
            
            refetch();
            setIsApproveConfirmOpen(false);
        } catch (error) {
            console.error('Failed to send for approval:', error);
        } finally {
            setIsApproveLoading(false);
            setPendingApproveId(null);
        }
    };

    // Columns Definition
    const columnHelper = createColumnHelper<QuotationHeader>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center w-full">ลำดับ</div>,
            cell: (info) => <div className="flex justify-center items-center w-full">{info.row.index + 1}</div>,
            size: 50,
            enableSorting: false,
        }),
        columnHelper.accessor('sq_no', {
            header: 'เลขที่ใบเสนอราคา',
            cell: (info) => (
                <span className="text-blue-600 font-semibold hover:underline cursor-default">
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
                const convertedAmount = totalAmount * rate;
                const currency = info.row.original.currency;

                return (
                    <div className="flex flex-col items-center gap-0.5 w-full">
                        <div className="flex items-center gap-1 text-emerald-600 font-bold">
                            <span className="text-xs">฿</span>
                            <span>{convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {currency !== 'THB' && (
                            <div className="text-[10px] text-gray-400 font-medium italic">
                                ({currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
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
                />
            ),
            size: 180,
            enableSorting: false,
        }),
    ], [columnHelper, customerMap]);

    return (
        <PageListLayout
            title="ใบเสนอราคาขาย - Sales Quotation (SQ)"
            subtitle="จัดการข้อมูลใบเสนอราคาให้ลูกค้า"
            icon={FileText}
            accentColor="blue"
            totalCount={apiData?.total || 0}
            isLoading={isLoading}
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
                    
                    {/* Action Buttons Group */}
                    <div className="md:col-span-5 flex flex-col sm:flex-row justify-end gap-4 mt-2">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    setSqNo('');
                                    setCustomer('');
                                    setStatusFilter('ALL');
                                    setStartDate('');
                                    setEndDate('');
                                }}
                                className="h-10 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} className="rotate-45" />
                                ล้างค่า
                            </button>
                            <button className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
                                <Search size={18} />
                                ค้นหา
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleCreate}
                            className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
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
                        pageIndex: 1,
                        pageSize: 10,
                        totalCount: apiData?.total || 0,
                        onPageChange: () => {},
                        onPageSizeChange: () => {},
                    }}
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
        </PageListLayout>
    );
}
