/**
 * @file ReservationListPage.tsx
 * @description หน้ารายการใบสั่งจอง (Sales Reservation List Page)
 * @route /sales/reservation
 */

import { useState, useMemo } from 'react';
import { Package, Search, Plus, Edit, FileCheck } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { ReservationFormModal } from './components/ReservationFormModal';
import { useReservationList } from './hooks/useReservation';
import type { ReservationHeader } from './services/reservation.service';

// ====================================================================================
// CONSTANTS
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'RELEASED', label: 'Released' },
];

// ====================================================================================
// COMPONENTS
// ====================================================================================

const StatusBadge = ({ status }: { status: string }) => {
    const config = {
        DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
        CONFIRMED: 'bg-blue-100 text-blue-600 border-blue-200',
        RELEASED: 'bg-emerald-100 text-emerald-600 border-emerald-200',
        CANCELLED: 'bg-red-100 text-red-600 border-red-200',
        EXPIRED: 'bg-orange-100 text-orange-600 border-orange-200',
    }[status] || 'bg-gray-100 text-gray-600 border-gray-200';

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config}`}>
            {status}
        </span>
    );
};

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function ReservationListPage() {
    const [rsNo, setRsNo] = useState('');
    const [customer, setCustomer] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Modal State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedReservationId, setSelectedReservationId] = useState<string | undefined>(undefined);

    // API Integration via Hook
    const filterParams = useMemo(() => ({
        rs_no: rsNo,
        customer_name: customer,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        start_date: startDate,
        end_date: endDate,
        page,
        limit
    }), [rsNo, customer, statusFilter, startDate, endDate, page, limit]);

    const { data: apiData, isLoading, refetch } = useReservationList(filterParams);

    const displayData = useMemo(() => apiData?.data || [], [apiData]);

    // Handlers
    const handleCreateNew = () => {
        setSelectedReservationId(undefined);
        setIsFormModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setSelectedReservationId(id);
        setIsFormModalOpen(true);
    };

    const handleReset = () => {
        setRsNo('');
        setCustomer('');
        setStatusFilter('ALL');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    // Columns Definition
    const columnHelper = createColumnHelper<ReservationHeader>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => (
                <div className="text-center font-medium text-gray-500 w-full">
                    {(page - 1) * limit + info.row.index + 1}
                </div>
            ),
            size: 60,
        }),
        columnHelper.accessor('rs_no', {
            header: 'เลขที่ใบสั่งจอง',
            cell: (info) => (
                <span 
                    onClick={() => handleEdit(info.row.original.reservation_id)}
                    className="text-purple-600 font-semibold cursor-pointer hover:underline"
                >
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
                    <span className="font-medium text-gray-900 dark:text-gray-100">{info.getValue()}</span>
                    <span className="text-xs text-gray-500">{info.row.original.customer_code}</span>
                </div>
            ),
            size: 250,
        }),
        columnHelper.accessor('total_amount', {
            header: 'มูลค่ารวม',
            cell: (info) => (
                <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <span>{info.row.original.currency === 'USD' ? '$' : '฿'}</span>
                    <span>{(info.getValue() || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
            ),
            size: 150,
        }),
        columnHelper.accessor('status', {
            header: 'สถานะ',
            cell: (info) => <StatusBadge status={info.getValue()} />,
            size: 120,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'การจัดการ',
            cell: (info) => (
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleEdit(info.row.original.reservation_id)}
                        className="text-orange-500 hover:text-orange-700 transition-colors"
                        title="แก้ไข"
                    >
                        <Edit size={18} />
                    </button>
                    <button 
                        className="text-emerald-500 hover:text-emerald-700 transition-colors"
                        title="ยืนยัน"
                    >
                        <FileCheck size={18} />
                    </button>
                </div>
            ),
            size: 120,
        }),
    ], [columnHelper, page, limit]);

    return (
        <>
            <PageListLayout
                title="ใบสั่งจอง - Reservation (RS)"
                subtitle="จัดการข้อมูลการจองสินค้าให้ลูกค้า"
                icon={Package}
                accentColor="purple"
                totalCount={apiData?.total || 0}
                isLoading={isLoading}
                searchForm={
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <FilterField
                            label="เลขที่ใบสั่งจอง"
                            value={rsNo}
                            onChange={setRsNo}
                            placeholder="RS-xxxx"
                            accentColor="purple"
                        />
                        <FilterField
                            label="ลูกค้า"
                            value={customer}
                            onChange={setCustomer}
                            placeholder="ชื่อลูกค้า"
                            accentColor="purple"
                        />
                        <FilterField
                            label="วันที่ตั้งแต่"
                            type="date"
                            value={startDate}
                            onChange={setStartDate}
                            accentColor="purple"
                        />
                        <FilterField
                            label="ถึงวันที่"
                            type="date"
                            value={endDate}
                            onChange={setEndDate}
                            accentColor="purple"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={STATUS_OPTIONS}
                            accentColor="purple"
                        />
                        
                        {/* Buttons Layout: 2 Rows on Mobile, 1 Row on Desktop */}
                        <div className="md:col-span-5 flex flex-col md:flex-row md:justify-end gap-3 mt-2">
                            <div className="grid grid-cols-2 md:flex gap-2">
                                <button 
                                    onClick={handleReset}
                                    className="h-10 bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-lg font-medium transition-all flex items-center justify-center px-4 gap-2"
                                >
                                    <Plus size={18} className="rotate-45 text-slate-500" strokeWidth={2.5} />
                                    ล้างค่า
                                </button>
                                <button 
                                    onClick={() => { setPage(1); refetch(); }}
                                    className="h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center px-6 gap-2"
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
                                สร้างใบสั่งจองใหม่
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
                    />
                </div>
            </PageListLayout>

            <ReservationFormModal 
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                id={selectedReservationId}
                onSuccess={() => refetch()}
            />
        </>
    );
}