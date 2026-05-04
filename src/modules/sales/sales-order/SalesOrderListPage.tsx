/**
 * @file SalesOrderListPage.tsx
 * @description หน้ารายการใบสั่งขาย (Sales Order List Page)
 * @route /sales/order
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Search, Plus, Edit, Eye, Send } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { SalesOrderService, type SalesOrderHeader } from '@sales/sales-order/services/sales-order.service';
import { logger } from '@/shared/utils/logger';
import { SalesOrderFormModal } from './components/SalesOrderFormModal';
import { SalesMobileCard } from '@sales/shared/components/SalesMobileCard';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { formatNumber } from '@/shared/utils/numberUtils';
import { SQStatusBadge } from '@sales/shared/components/SQStatusBadge';
import { useConfirmation } from '@hooks/useConfirmation';

// ====================================================================================
// CONSTANTS
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'SUBMITTED', label: 'ส่งแล้ว' },
    { value: 'APPROVED', label: 'อนุมัติแล้ว' },
    { value: 'CONFIRMED', label: 'ยืนยันแล้ว' },
    { value: 'CLOSED', label: 'ปิดรายการ' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
];

// ====================================================================================
// HELPERS
// ====================================================================================

const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB'); // dd/mm/yyyy
    } catch {
        return dateStr || '-';
    }
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
    const [isViewOnly, setIsViewOnly] = useState(false);

    const { confirm } = useConfirmation();

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
        setIsViewOnly(false);
        setIsFormModalOpen(true);
    };

    const handleEdit = (id: string, viewOnly = false) => {
        setSelectedSoId(id);
        setIsViewOnly(viewOnly);
        setIsFormModalOpen(true);
    };

    const handleSubmit = useCallback(async (id: string) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันการส่งอนุมัติ',
            description: 'คุณต้องการส่งอนุมัติใบสั่งขายนี้ใช่หรือไม่?',
            variant: 'info',
            confirmText: 'ตกลง',
            cancelText: 'ยกเลิก'
        });

        if (!isConfirmed) return;

        try {
            await SalesOrderService.update(id, { status: 'APPROVED' });
            refetch();
        } catch (error) {
            logger.error('Failed to submit sales order:', error);
        }
    }, [confirm, refetch]);

    // Columns Definition
    const columnHelper = createColumnHelper<SalesOrderHeader>();

    const columns = useMemo(
        () => [
            columnHelper.display({
                id: 'index',
                header: () => <div className="text-center w-full">ลำดับ</div>,
                cell: (info) => <div className="text-center w-full text-slate-500">{(page - 1) * limit + info.row.index + 1}</div>,
                size: 60,
            }),
            columnHelper.accessor('so_no', {
                header: 'เลขที่ใบสั่งขาย',
                cell: (info) => (
                    <span
                        onClick={() => handleEdit(info.row.original.so_id)}
                        className="text-indigo-600 font-bold cursor-pointer hover:underline transition-all"
                    >
                        {info.getValue()}
                    </span>
                ),
                size: 160,
            }),
            columnHelper.accessor('so_date', {
                header: 'วันที่',
                cell: (info) => (
                    <div className="text-slate-700 dark:text-slate-100 font-medium">
                        {formatDisplayDate(info.getValue())}
                    </div>
                ),
                size: 120,
            }),
            columnHelper.accessor('customer_name', {
                header: 'ลูกค้า',
                cell: (info) => {
                    const customerId = info.row.original.customer_id;
                    const nameFromLookup = customerMap.get(String(customerId));
                    const displayName = nameFromLookup || info.getValue() || 'ไม่ระบุ';

                    return (
                        <span className="font-bold text-slate-700 dark:text-slate-100">
                            {displayName}
                        </span>
                    );
                },
                size: 250,
            }),
            columnHelper.accessor('total_amount', {
                header: () => <div className="text-center w-full">มูลค่ารวม (บาท)</div>,
                cell: (info) => {
                    const row = info.row.original;
                    // Use base_total_amount or total_amount, whichever is more likely to be correct
                    const amount = row.base_total_amount || row.total_amount || 0;
                    
                    return (
                        <div className="flex justify-center items-center gap-1.5 font-bold text-emerald-500">
                            <span className="text-xs">฿</span>
                            <span>
                                {formatNumber(amount)}
                            </span>
                        </div>
                    );
                },
                size: 150,
            }),
            columnHelper.accessor('status', {
                header: () => <div className="flex justify-center w-full text-center">สถานะ</div>,
                cell: (info) => (
                    <div className="flex justify-center w-full scale-90">
                        <SQStatusBadge status={info.getValue()} />
                    </div>
                ),
                size: 140,
            }),
            columnHelper.display({
                id: 'actions',
                header: () => <div className="text-center w-full">การจัดการ</div>,
                cell: (info) => (
                    <div className="flex items-center justify-center gap-3 w-full">
                        <button
                            onClick={() => handleEdit(info.row.original.so_id, true)}
                            className="text-slate-400 hover:text-indigo-400 transition-colors"
                            title="ดูรายละเอียด"
                        >
                            <Eye size={16} />
                        </button>
                        <button
                            onClick={() => handleEdit(info.row.original.so_id, false)}
                            className="flex items-center gap-1.5 text-amber-500 hover:text-amber-600 font-bold text-[12px] transition-colors"
                            title="แก้ไข"
                        >
                            <Edit size={14} />
                            <span>แก้ไข</span>
                        </button>
                        {info.row.original.status === 'DRAFT' && (
                            <button
                                onClick={() => handleSubmit(info.row.original.so_id)}
                                className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                            >
                                <Send size={12} /> 
                                <span>ส่งอนุมัติ</span>
                            </button>
                        )}
                    </div>
                ),
                size: 200,
            }),
        ],
        [columnHelper, page, limit, handleSubmit, customerMap]
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
                                customerName={customerMap.get(String(item.customer_id)) || item.customer_name || 'ไม่ระบุ'}
                                date={formatDisplayDate(item.so_date)}
                                amount={item.total_amount || 0}
                                statusBadge={<SQStatusBadge status={item.status} />}
                                onClick={() => handleEdit(item.so_id, true)}
                                actions={
                                    <div className="flex gap-2 w-full mt-2">
                                        <button 
                                            onClick={() => handleEdit(item.so_id, true)}
                                            className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <Eye size={14} /> ดูรายละเอียด
                                        </button>
                                        <button 
                                            onClick={() => handleEdit(item.so_id, false)}
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
                isViewOnly={isViewOnly}
                onSuccess={() => refetch()}
            />
        </>
    );
}
