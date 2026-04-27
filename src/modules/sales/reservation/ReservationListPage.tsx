import { useState, useMemo, useCallback } from 'react';
import { Package, Search, Plus } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { ReservationFormModal } from './components/ReservationFormModal';
import { useReservationList } from './hooks/useReservation';
import type { ReservationHeader } from './services/reservation.service';
import { useQuery } from '@tanstack/react-query';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { RSStatusBadge } from '@sales/shared/components/RSStatusBadge';
import { RSActionsCell } from './components/RSActionsCell';
import { SalesMobileCard } from '@sales/shared/components/SalesMobileCard';
import { ReservationService } from './services/reservation.service';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { logger } from '@utils/logger';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
// ====================================================================================
// CONSTANTS
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'CONFIRMED', label: 'ยืนยันแล้ว' },
    { value: 'RELEASED', label: 'จ่ายของแล้ว' },
    { value: 'EXPIRED', label: 'หมดอายุ' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function ReservationListPage() {
    const { toast } = useToast();
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
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

    // 🏗️ API Integration via Hook
    const filterParams = useMemo(() => ({
        reservation_no: rsNo,
        customer_name: customer,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        start_date: startDate,
        end_date: endDate,
        page,
        limit
    }), [rsNo, customer, statusFilter, startDate, endDate, page, limit]);

    const { data: apiData, isLoading, refetch } = useReservationList(filterParams);
    const { confirm } = useConfirmation();

    // 🏷️ Fetch Customers for Name Lookup (Pattern from Quotation)
    const { data: customerResponse } = useQuery({
        queryKey: ['master-customers'],
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

    // Handlers
    const handleCreateNew = useCallback(() => {
        setSelectedReservationId(undefined);
        setModalMode('create');
        setIsFormModalOpen(true);
    }, []);

    const handleEdit = useCallback((id: string) => {
        setSelectedReservationId(id);
        setModalMode('edit');
        setIsFormModalOpen(true);
    }, []);

    const handleView = useCallback((id: string) => {
        setSelectedReservationId(id);
        setModalMode('view');
        setIsFormModalOpen(true);
    }, []);

    const handleReset = useCallback(() => {
        setRsNo('');
        setCustomer('');
        setStatusFilter('ALL');
        setStartDate('');
        setEndDate('');
        setPage(1);
    }, []);

    const handleConfirmReservation = useCallback(async (id: string, row: ReservationHeader) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันใบสั่งจองสินค้า',
            description: `คุณต้องการยืนยันใบสั่งจองเลขที่ ${row.reservation_no} หรือไม่? เมื่อยืนยันแล้วจะไม่สามารถแก้ไขได้`,
            confirmText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            variant: 'success'
        });

        if (isConfirmed) {
            try {
                await ReservationService.confirm(id);
                toast('ยืนยันใบสั่งจองสำเร็จ', 'success');
                refetch();
            } catch (error) {
                logger.error('Failed to confirm reservation:', error);
                toast('เกิดข้อผิดพลาดในการยืนยันใบสั่งจอง', 'error');
            }
        }
    }, [confirm, refetch, toast]);

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
            size: 50,
            enableSorting: false,
        }),
        columnHelper.accessor('reservation_no', {
            header: 'เลขที่ใบสั่งจอง',
            cell: (info) => (
                <span 
                    onClick={() => handleView(String(info.row.original.reservation_id || info.row.original.id))}
                    className="text-purple-600 font-semibold cursor-pointer hover:underline"
                >
                    {info.getValue()}
                </span>
            ),
            size: 180,
            enableSorting: false,
        }),
        columnHelper.accessor('reservation_date', {
            header: 'วันที่',
            cell: (info) => {
                const val = info.getValue();
                if (!val) return '-';
                const d = new Date(val);
                return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-GB');
            },
            size: 100,
            enableSorting: false,
        }),
        columnHelper.accessor('customer_id', {
            header: 'ลูกค้า',
            cell: (info) => {
                const customerId = info.getValue();
                const displayName = customerMap.get(String(customerId)) || info.row.original.customer_name || 'ไม่ระบุ';
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
                        <span className="text-xs text-gray-500">{info.row.original.customer_code}</span>
                    </div>
                );
            },
            size: 280,
            enableSorting: false,
        }),
        columnHelper.accessor('base_total_amount', {
            header: () => <div className="text-right w-full pr-4">มูลค่ารวม (บาท)</div>,
            cell: (info) => {
                const quoteTotal = Number(info.row.original.quote_total_amount || 0);
                const baseTotal = Number(info.getValue() || 0);
                const currency = info.row.original.quote_currency_code || 'THB';
                
                return (
                    <div className="flex flex-col items-end pr-4 gap-0.5 w-full">
                        <div className="text-emerald-600 font-bold">
                            <span>฿ {baseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {currency !== 'THB' && (
                            <div className="text-[10px] text-gray-400 font-medium italic">
                                ({currency} {quoteTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                            </div>
                        )}
                    </div>
                );
            },
            size: 160,
            enableSorting: false,
        }),
        columnHelper.accessor('status', {
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center w-full">
                    <RSStatusBadge status={info.getValue()} />
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">การจัดการ</div>,
            cell: (info) => (
                <RSActionsCell 
                    row={info.row.original}
                    onView={handleView}
                    onEdit={handleEdit}
                    onConfirm={handleConfirmReservation}
                />
            ),
            size: 220,
            enableSorting: false,
        }),
    ], [columnHelper, page, limit, customerMap, handleView, handleEdit, handleConfirmReservation]);

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
                        renderMobileCard={(item) => (
                            <SalesMobileCard 
                                docNo={item.reservation_no}
                                customerName={customerMap.get(String(item.customer_id)) || item.customer_name || 'ไม่ระบุ'}
                                date={item.reservation_date ? new Date(item.reservation_date).toLocaleDateString('en-GB') : '-'}
                                amount={Number(item.base_total_amount || 0)}
                                statusBadge={<RSStatusBadge status={item.status} />}
                                onClick={() => handleView(String(item.reservation_id || item.id))}
                                actions={
                                    <div className="flex gap-2 w-full mt-2">
                                        <button 
                                            onClick={() => handleView(String(item.reservation_id || item.id))}
                                            className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <Search size={14} /> ดูรายละเอียด
                                        </button>
                                        {item.status === 'DRAFT' && (
                                            <button 
                                                onClick={() => handleEdit(String(item.reservation_id || item.id))}
                                                className="flex-1 h-9 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                            >
                                                <Plus size={14} className="rotate-45" /> แก้ไข
                                            </button>
                                        )}
                                    </div>
                                }
                            />
                        )}
                    />
                </div>
            </PageListLayout>

            <ReservationFormModal 
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                id={selectedReservationId}
                onSuccess={() => refetch()}
                readOnly={modalMode === 'view'}
            />
        </>
    );
}