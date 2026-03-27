/**
 * @file SalesOrderListPage.tsx
 * @description หน้ารายการคำสั่งขาย (Sales Order List Page)
 * @route /sales/order
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, Plus, Edit, Eye, CheckCircle, Clock } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { SalesOrderService, type SalesOrderHeader } from '../../services/sales-order.service';

// ====================================================================================
// CONSTANTS
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'Draft', label: 'แบบร่าง' },
    { value: 'Approved', label: 'อนุมัติแล้ว' },
    { value: 'Closed', label: 'ปิดรายการ' },
];

// ====================================================================================
// COMPONENTS
// ====================================================================================

const StatusBadge = ({ status }: { status: string }) => {
    const config = {
        Draft: {
            label: 'แบบร่าง',
            className: 'bg-gray-100 text-gray-600 border-gray-200',
            icon: Clock
        },
        Approved: {
            label: 'อนุมัติแล้ว',
            className: 'bg-emerald-100 text-emerald-600 border-emerald-200',
            icon: CheckCircle
        },
        Closed: {
            label: 'ปิดรายการ',
            className: 'bg-blue-100 text-blue-600 border-blue-200',
            icon: CheckCircle
        }
    }[status] || {
        label: status,
        className: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: Clock
    };

    const StatusIcon = config.icon;

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit ${config.className}`}>
            <StatusIcon size={14} />
            {config.label}
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

    // API Integration
    const { data: apiData, isLoading } = useQuery({
        queryKey: ['sales-orders', soNo, customer, statusFilter, startDate, endDate],
        queryFn: () => SalesOrderService.getList({
            so_no: soNo,
            customer_name: customer,
            status: statusFilter === 'ALL' ? undefined : statusFilter,
            start_date: startDate,
            end_date: endDate
        }),
    });

    const displayData = useMemo(() => apiData?.data || [], [apiData]);

    // Columns Definition
    const columnHelper = createColumnHelper<SalesOrderHeader>();
    
    const columns = useMemo(() => [
        columnHelper.accessor('so_no', {
            header: 'เลขที่ SO',
            cell: (info) => (
                <span className="text-emerald-600 font-semibold cursor-pointer hover:underline">
                    {info.getValue()}
                </span>
            ),
            size: 150,
        }),
        columnHelper.accessor('date', {
            header: 'วันที่',
            cell: (info) => info.getValue(),
            size: 120,
        }),
        columnHelper.accessor('customer_name', {
            header: 'ลูกค้า',
            cell: (info) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{info.getValue()}</span>
                    <span className="text-xs text-gray-500">{info.row.original.customer_code}</span>
                </div>
            ),
            size: 200,
        }),
        columnHelper.accessor('status', {
            header: 'สถานะ',
            cell: (info) => <StatusBadge status={info.getValue()} />,
            size: 140,
        }),
        columnHelper.accessor('amount', {
            header: 'ยอดเงิน',
            cell: (info) => (
                <div className="flex flex-col items-center">
                    <span className="font-semibold">{info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">฿</span>
                </div>
            ),
            size: 120,
        }),
        columnHelper.accessor('delivery_date', {
            header: 'วันส่งของ',
            cell: (info) => info.getValue(),
            size: 120,
        }),
        columnHelper.accessor('remarks', {
            header: 'หมายเหตุ',
            cell: (info) => info.getValue() || '-',
            size: 180,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'จัดการ',
            cell: () => (
                <div className="flex items-center gap-3">
                    <button className="text-blue-500 hover:text-blue-700 transition-colors">
                        <Eye size={18} />
                    </button>
                    <button className="text-orange-500 hover:text-orange-700 transition-colors">
                        <Edit size={18} />
                    </button>
                </div>
            ),
            size: 100,
        }),
    ], [columnHelper]);

    return (
        <PageListLayout
            title="คำสั่งขาย - Sales Order (SO)"
            subtitle="จัดการข้อมูลคำสั่งซื้อจากลูกค้า"
            icon={FileText}
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
                    
                    {/* Action Buttons Group */}
                    <div className="md:col-span-12 flex flex-col sm:flex-row justify-between gap-4 mt-2">
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
                        
                        <button className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
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
    );
}
