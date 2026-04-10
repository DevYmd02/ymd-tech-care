/**
 * @file ReservationListPage.tsx
 * @description หน้ารายการใบสั่งจอง (Sales Reservation List Page)
 * @route /sales/reservation
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Search, Plus, Edit, FileCheck } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { ReservationService, type ReservationHeader } from '@sales/reservation/services/reservation.service';
import { ReservationFormModal } from './components/ReservationFormModal';

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

    // Modal State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedReservationId, setSelectedReservationId] = useState<string | undefined>(undefined);

    // API Integration
    const { data: apiData, isLoading, refetch } = useQuery({
        queryKey: ['sales-reservations', rsNo, customer, statusFilter, startDate, endDate],
        queryFn: () => ReservationService.getList({
            rs_no: rsNo,
            customer_name: customer,
            status: statusFilter === 'ALL' ? undefined : statusFilter,
            start_date: startDate,
            end_date: endDate
        }),
    });

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

    // Columns Definition
    const columnHelper = createColumnHelper<ReservationHeader>();
    
    const columns = useMemo(() => [
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
                    <span className="font-medium text-gray-900">{info.getValue()}</span>
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
                    <span>{info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                    >
                        <Edit size={18} />
                    </button>
                    <button className="text-emerald-500 hover:text-emerald-700 transition-colors">
                        <FileCheck size={18} />
                    </button>
                </div>
            ),
            size: 120,
        }),
    ], [columnHelper]);

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
                            label="สถานะ"
                            type="select"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={STATUS_OPTIONS}
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
                        
                        {/* Action Buttons Group */}
                        <div className="md:col-span-5 flex flex-col sm:flex-row justify-between gap-4 mt-2">
                            <div className="flex gap-2">
                                <button className="h-10 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
                                    <Search size={18} />
                                    ค้นหา
                                </button>
                                <button 
                                    onClick={() => {
                                        setRsNo('');
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
                                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
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
                            pageIndex: 1,
                            pageSize: 10,
                            totalCount: apiData?.total || 0,
                            onPageChange: () => {},
                            onPageSizeChange: () => {},
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

