/**
 * @file SalesOrderListPage.tsx
 * @description หน้ารายการใบสั่งขาย (Sales Order List Page)
 * @route /sales/order
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Search, Plus, Edit, Eye, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { SalesOrderService, type SalesOrderHeader } from '@sales/sales-order/services/sales-order.service';
import { SalesOrderFormModal } from './components/SalesOrderFormModal';
import { SalesMobileCard } from '@sales/shared/components/SalesMobileCard';

// ====================================================================================
// CONSTANTS
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'Draft (แบบร่าง)' },
    { value: 'SUBMITTED', label: 'Submitted (ส่งแล้ว)' },
    { value: 'APPROVED', label: 'Approved (อนุมัติแล้ว)' },
    { value: 'CONFIRMED', label: 'Confirmed (ยืนยันแล้ว)' },
    { value: 'CLOSED', label: 'Closed (ปิดรายการ)' },
    { value: 'CANCELLED', label: 'Cancelled (ยกเลิก)' },
];

// ====================================================================================
// STATUS BADGE COMPONENT
// ====================================================================================

const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { label: string; className: string; icon: typeof Clock }> = {
        DRAFT: {
            label: 'Draft',
            className: 'bg-gray-100 text-gray-600 border-gray-200',
            icon: Clock,
        },
        SUBMITTED: {
            label: 'Submitted',
            className: 'bg-blue-100 text-blue-600 border-blue-200',
            icon: AlertCircle,
        },
        APPROVED: {
            label: 'Approved',
            className: 'bg-indigo-100 text-indigo-600 border-indigo-200',
            icon: CheckCircle,
        },
        CONFIRMED: {
            label: 'Confirmed',
            className: 'bg-teal-100 text-teal-600 border-teal-200',
            icon: CheckCircle,
        },
        CLOSED: {
            label: 'Closed',
            className: 'bg-slate-100 text-slate-600 border-slate-200',
            icon: CheckCircle,
        },
        CANCELLED: {
            label: 'Cancelled',
            className: 'bg-red-100 text-red-600 border-red-200',
            icon: XCircle,
        },
    };

    const current = config[status] || {
        label: status,
        className: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: Clock,
    };

    const StatusIcon = current.icon;

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit ${current.className}`}
        >
            <StatusIcon size={14} />
            {current.label}
        </span>
    );
};

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function SalesOrderListPage() {
    const [soNo, setSoNo] = useState('');
    const [customer, setCustomer] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Modal State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedSoId, setSelectedSoId] = useState<string | undefined>(undefined);

    // API Integration
    const { data: apiData, isLoading, refetch } = useQuery({
        queryKey: ['sales-orders', soNo, customer, statusFilter, startDate, endDate, page, limit],
        queryFn: () =>
            SalesOrderService.getList({
                so_no: soNo,
                customer_name: customer,
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                start_date: startDate,
                end_date: endDate,
                page,
                limit,
            }),
    });

    const displayData = useMemo(() => apiData?.data || [], [apiData]);

    const handleClearFilter = () => {
        setSoNo('');
        setCustomer('');
        setStatusFilter('ALL');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    // Handlers
    const handleCreateNew = () => {
        setSelectedSoId(undefined);
        setIsFormModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setSelectedSoId(id);
        setIsFormModalOpen(true);
    };

    // Columns Definition
    const columnHelper = createColumnHelper<SalesOrderHeader>();

    const columns = useMemo(
        () => [
            columnHelper.display({
                id: 'index',
                header: 'ลำดับ',
                cell: (info) => (page - 1) * limit + info.row.index + 1,
                size: 50,
            }),
            columnHelper.accessor('so_no', {
                header: 'เลขที่ SO',
                cell: (info) => (
                    <span
                        onClick={() => handleEdit(info.row.original.so_id)}
                        className="text-indigo-600 font-semibold cursor-pointer hover:underline"
                    >
                        {info.getValue()}
                    </span>
                ),
                size: 130,
            }),
            columnHelper.accessor('so_date', {
                header: 'วันที่ SO',
                cell: (info) => info.getValue(),
                size: 110,
            }),
            columnHelper.accessor('customer_name', {
                header: 'ลูกค้า',
                cell: (info) => (
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{info.getValue()}</span>
                        <span className="text-xs text-gray-500">
                            {info.row.original.customer_code}
                        </span>
                    </div>
                ),
                size: 200,
            }),
            columnHelper.accessor('total_amount', {
                header: 'มูลค่าสุทธิ',
                cell: (info) => (
                    <div className="flex flex-col items-end">
                        <span className="font-semibold">
                            {(info.getValue() || 0).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                            })}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">
                            {info.row.original.currency_code}
                        </span>
                    </div>
                ),
                size: 110,
            }),
            columnHelper.accessor('ship_date', {
                header: 'วันที่กำหนดส่ง',
                cell: (info) => info.getValue() || '-',
                size: 110,
            }),
            columnHelper.accessor('remarks', {
                header: 'หมายเหตุ',
                cell: (info) => info.getValue() || '-',
                size: 150,
            }),
            columnHelper.accessor('status', {
                header: 'สถานะ',
                cell: (info) => <StatusBadge status={info.getValue()} />,
                size: 120,
            }),
            columnHelper.display({
                id: 'actions',
                header: 'จัดการ',
                cell: (info) => (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleEdit(info.row.original.so_id)}
                            className="text-indigo-500 hover:text-indigo-700 transition-colors"
                            title="ดูรายละเอียด"
                        >
                            <Eye size={18} />
                        </button>
                        <button
                            onClick={() => handleEdit(info.row.original.so_id)}
                            className="text-orange-500 hover:text-orange-700 transition-colors"
                            title="แก้ไข"
                        >
                            <Edit size={18} />
                        </button>
                    </div>
                ),
                size: 90,
            }),
        ],
        [columnHelper, page, limit]
    );

    return (
        <>
            <PageListLayout
                title="ใบสั่งขาย - Sales Order (SO)"
                subtitle="จัดการข้อมูลใบสั่งขายจากลูกค้า"
                icon={ShoppingCart}
                accentColor="indigo"
                totalCount={apiData?.total || 0}
                isLoading={isLoading}
                searchForm={
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <FilterField
                            label="เลขที่ใบสั่งขาย"
                            value={soNo}
                            onChange={setSoNo}
                            placeholder="SO-xxxx"
                            accentColor="indigo"
                        />
                        <FilterField
                            label="ลูกค้า"
                            value={customer}
                            onChange={setCustomer}
                            placeholder="ชื่อลูกค้า"
                            accentColor="indigo"
                        />
                        <FilterField
                            label="วันที่ตั้งแต่"
                            type="date"
                            value={startDate}
                            onChange={setStartDate}
                            accentColor="indigo"
                        />
                        <FilterField
                            label="ถึงวันที่"
                            type="date"
                            value={endDate}
                            onChange={setEndDate}
                            accentColor="indigo"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={STATUS_OPTIONS}
                            accentColor="indigo"
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
                                className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center px-6 gap-2"
                            >
                                <Search size={18} strokeWidth={3} />
                                ค้นหา
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleCreateNew}
                            className="h-10 w-full md:w-auto px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            สร้างใบสั่งขายใหม่
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
                                docNo={item.so_no}
                                customerName={item.customer_name || 'ไม่ระบุ'}
                                date={item.so_date}
                                amount={item.total_amount || 0}
                                statusBadge={<StatusBadge status={item.status} />}
                                onClick={() => handleEdit(item.so_id)}
                                actions={
                                    <div className="flex gap-2 w-full mt-2">
                                        <button 
                                            onClick={() => handleEdit(item.so_id)}
                                            className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <Eye size={14} /> ดูรายละเอียด
                                        </button>
                                        <button 
                                            onClick={() => handleEdit(item.so_id)}
                                            className="flex-1 h-9 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <Edit size={14} /> แก้ไข
                                        </button>
                                    </div>
                                }
                            />
                        )}
                    />
                </div>
            </PageListLayout>

            {/* Sales Order Form Modal */}
            <SalesOrderFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                id={selectedSoId}
                onSuccess={() => refetch()}
            />
        </>
    );
}
