/**
 * @file SalesOrderListPage.tsx
 * @description หน้ารายการคำสั่งขาย (Sales Order List Page)
 * @route /sales/order
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Search, Plus, Edit, Eye, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { SalesOrderService, type SalesOrderHeader } from '@sales/sales-order/services/sales-order.service';
import { SalesOrderFormModal } from './components/SalesOrderFormModal';

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
            className: 'bg-emerald-100 text-emerald-600 border-emerald-200',
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

    // Modal State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedSoId, setSelectedSoId] = useState<string | undefined>(undefined);

    // API Integration
    const { data: apiData, isLoading, refetch } = useQuery({
        queryKey: ['sales-orders', soNo, customer, statusFilter, startDate, endDate],
        queryFn: () =>
            SalesOrderService.getList({
                so_no: soNo,
                customer_name: customer,
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                start_date: startDate,
                end_date: endDate,
            }),
    });

    const displayData = useMemo(() => apiData?.data || [], [apiData]);

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
            columnHelper.accessor('so_no', {
                header: 'เลขที่ SO',
                cell: (info) => (
                    <span
                        onClick={() => handleEdit(info.row.original.so_id)}
                        className="text-emerald-600 font-semibold cursor-pointer hover:underline"
                    >
                        {info.getValue()}
                    </span>
                ),
                size: 150,
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
                size: 220,
            }),
            columnHelper.accessor('cust_po_no', {
                header: 'เลขที่ PO ลูกค้า',
                cell: (info) => info.getValue() || '-',
                size: 140,
            }),
            columnHelper.accessor('status', {
                header: 'สถานะ',
                cell: (info) => <StatusBadge status={info.getValue()} />,
                size: 140,
            }),
            columnHelper.accessor('onhold', {
                header: 'OnHold',
                cell: (info) =>
                    info.getValue() === 'Y' ? (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded border border-orange-200">
                            ON HOLD
                        </span>
                    ) : (
                        <span className="text-gray-400 text-xs">-</span>
                    ),
                size: 90,
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
                size: 130,
            }),
            columnHelper.accessor('ship_date', {
                header: 'วันที่กำหนดส่ง',
                cell: (info) => info.getValue() || '-',
                size: 130,
            }),
            columnHelper.accessor('remarks', {
                header: 'หมายเหตุ',
                cell: (info) => info.getValue() || '-',
                size: 180,
            }),
            columnHelper.display({
                id: 'actions',
                header: 'จัดการ',
                cell: (info) => (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleEdit(info.row.original.so_id)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
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
                size: 100,
            }),
        ],
        [columnHelper]
    );

    return (
        <>
            <PageListLayout
                title="คำสั่งขาย - Sales Order (SO)"
                subtitle="จัดการข้อมูลคำสั่งซื้อจากลูกค้า"
                icon={ShoppingCart}
                accentColor="emerald"
                totalCount={apiData?.total || 0}
                isLoading={isLoading}
                searchForm={
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <FilterField
                            label="เลขที่คำสั่งขาย"
                            value={soNo}
                            onChange={setSoNo}
                            placeholder="SO-xxxx"
                            accentColor="emerald"
                        />
                        <FilterField
                            label="ลูกค้า"
                            value={customer}
                            onChange={setCustomer}
                            placeholder="ชื่อลูกค้า"
                            accentColor="emerald"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={STATUS_OPTIONS}
                            accentColor="emerald"
                        />
                        <FilterField
                            label="วันที่ตั้งแต่"
                            type="date"
                            value={startDate}
                            onChange={setStartDate}
                            accentColor="emerald"
                        />
                        <FilterField
                            label="ถึงวันที่"
                            type="date"
                            value={endDate}
                            onChange={setEndDate}
                            accentColor="emerald"
                        />

                        {/* Action Buttons */}
                        <div className="md:col-span-5 flex flex-col sm:flex-row justify-between gap-4 mt-2">
                            <div className="flex gap-2">
                                <button className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
                                    <Search size={18} />
                                    ค้นหา
                                </button>
                                <button
                                    onClick={() => {
                                        setSoNo('');
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
                            </div>

                            <button
                                onClick={handleCreateNew}
                                className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
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
                            pageIndex: 1,
                            pageSize: 10,
                            totalCount: apiData?.total || 0,
                            onPageChange: () => {},
                            onPageSizeChange: () => {},
                        }}
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
