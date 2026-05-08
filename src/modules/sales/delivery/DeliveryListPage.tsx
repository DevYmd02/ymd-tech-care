/**
 * @file DeliveryListPage.tsx
 * @description หน้ารายการใบจัดส่งสินค้า (Delivery Order List Page)
 * @route /sales/delivery
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Search, Plus, Eye, Edit } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { DeliveryService, type DeliveryHeader } from './services/delivery.service';
import { logger } from '@/shared/utils';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { useConfirmation } from '@hooks/useConfirmation';
import { DeliveryFormModal } from './components/DeliveryFormModal';
import { DeliveryStatusBadge } from './components/DeliveryStatusBadge';
import { SalesMobileCard } from '@sales/shared/components/SalesMobileCard';

// ====================================================================================
// CONSTANTS
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'SHIPPED', label: 'จัดส่งแล้ว' },
    { value: 'DELIVERED', label: 'ถึงปลายทาง' },
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
        return d.toLocaleDateString('en-GB');
    } catch {
        return dateStr || '-';
    }
};

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function DeliveryListPage() {
    const [deliveryNo, setDeliveryNo] = useState('');
    const [soNo, setSoNo] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Modal State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | undefined>(undefined);
    const [isViewOnly, setIsViewOnly] = useState(false);

    const { confirm } = useConfirmation();

    // Customer Lookup
    const { data: customerResponse } = useQuery({
        queryKey: ['master-customers-lookup'],
        queryFn: () => CustomerService.getList({ limit: 1000 }),
        staleTime: 30 * 60 * 1000,
    });

    const customerMap = useMemo(() => {
        const map = new Map<string | number, string>();
        (customerResponse?.data || []).forEach((c) => {
            map.set(String(c.customer_id), c.customer_name_th || c.customer_name || '');
        });
        return map;
    }, [customerResponse]);

    // API Integration
    const { data: apiData, isLoading, refetch } = useQuery({
        queryKey: ['deliveries', deliveryNo, soNo, customerFilter, statusFilter, startDate, endDate, page, limit],
        queryFn: () =>
            DeliveryService.getList({
                delivery_no: deliveryNo,
                so_no: soNo,
                customer_name: customerFilter,
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                start_date: startDate,
                end_date: endDate,
                page,
                limit,
            }),
    });

    const displayData = useMemo(() => apiData?.data || [], [apiData]);

    const handleClearFilter = () => {
        setDeliveryNo('');
        setSoNo('');
        setCustomerFilter('');
        setStatusFilter('ALL');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    // Handlers
    const isStatusEditable = (status?: string) => {
        const s = (status || '').toUpperCase();
        return s === 'DRAFT';
    };

    const handleCreateNew = () => {
        setSelectedDeliveryId(undefined);
        setIsViewOnly(false);
        setIsFormModalOpen(true);
    };

    const handleEdit = (id: string, viewOnly = false) => {
        setSelectedDeliveryId(id);
        setIsViewOnly(viewOnly);
        setIsFormModalOpen(true);
    };

    const handleUpdateStatus = useCallback(
        async (id: string, newStatus: 'SHIPPED' | 'DELIVERED' | 'CANCELLED') => {
            const statusLabels: Record<string, string> = {
                SHIPPED: 'จัดส่งแล้ว',
                DELIVERED: 'ถึงปลายทาง',
                CANCELLED: 'ยกเลิก',
            };
            const isConfirmed = await confirm({
                title: `ยืนยันการเปลี่ยนสถานะ`,
                description: `คุณต้องการเปลี่ยนสถานะเป็น "${statusLabels[newStatus]}" ใช่หรือไม่?`,
                variant: 'warning',
                confirmText: 'ตกลง',
                cancelText: 'ยกเลิก',
            });

            if (!isConfirmed) return;

            try {
                await DeliveryService.updateStatus(id, newStatus);
                refetch();
            } catch (error) {
                logger.error('[DeliveryListPage] updateStatus failed:', error);
            }
        },
        [confirm, refetch]
    );

    // Columns
    const columnHelper = createColumnHelper<DeliveryHeader>();

    const columns = useMemo(
        () => [
            columnHelper.display({
                id: 'index',
                header: () => <div className="text-center w-full">ลำดับ</div>,
                cell: (info) => (
                    <div className="text-center w-full text-slate-500">
                        {(page - 1) * limit + info.row.index + 1}
                    </div>
                ),
                size: 60,
            }),
            columnHelper.accessor('delivery_no', {
                header: 'เลขที่รายการจัดส่ง',
                cell: (info) => (
                    <span
                        onClick={() => handleEdit(info.row.original.delivery_id, true)}
                        className="text-amber-600 font-bold cursor-pointer hover:underline transition-all"
                    >
                        {info.getValue() || '-'}
                    </span>
                ),
                size: 150,
            }),
            columnHelper.accessor('so_no', {
                header: 'เลขที่ SO',
                cell: (info) => (
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm whitespace-nowrap">
                        {info.getValue() || '-'}
                    </span>
                ),
                size: 170,
            }),
            columnHelper.accessor('delivery_date', {
                header: 'วันที่จัดส่ง',
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
                        <span className="font-bold text-slate-700 dark:text-slate-100 truncate block" title={displayName}>
                            {displayName}
                        </span>
                    );
                },
                size: 200,
            }),
            columnHelper.accessor('tracking_no', {
                header: 'Tracking No.',
                cell: (info) => (
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                        {info.getValue() || '-'}
                    </span>
                ),
                size: 130,
            }),
            columnHelper.accessor('status', {
                header: () => <div className="flex justify-center w-full text-center">สถานะ</div>,
                cell: (info) => (
                    <div className="flex justify-center w-full scale-90">
                        <DeliveryStatusBadge status={info.getValue()} />
                    </div>
                ),
                size: 110,
            }),
            columnHelper.display({
                id: 'actions',
                header: () => <div className="text-center w-full">การจัดการ</div>,
                cell: (info) => {
                    const row = info.row.original;
                    return (
                        <div className="flex items-center justify-center gap-3 w-full">
                            {/* View */}
                            <button
                                onClick={() => handleEdit(row.delivery_id, true)}
                                className="text-slate-400 dark:text-white/60 hover:text-amber-500 transition-colors"
                                title="ดูรายละเอียด"
                            >
                                <Eye size={16} />
                            </button>

                            {/* Edit - only DRAFT */}
                            {isStatusEditable(row.status) && (
                                <button
                                    onClick={() => handleEdit(row.delivery_id, false)}
                                    className="flex items-center gap-1.5 text-amber-500 hover:text-amber-600 font-bold text-[12px] transition-colors"
                                    title="แก้ไข"
                                >
                                    <Edit size={14} />
                                    <span>แก้ไข</span>
                                </button>
                            )}

                            {/* Mark as Shipped */}
                            {row.status === 'DRAFT' && (
                                <button
                                    onClick={() => handleUpdateStatus(row.delivery_id, 'SHIPPED')}
                                    className="h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                                    title="ยืนยันจัดส่ง"
                                >
                                    <Truck size={12} />
                                    <span>จัดส่ง</span>
                                </button>
                            )}

                            {/* Mark as Delivered */}
                            {row.status === 'SHIPPED' && (
                                <button
                                    onClick={() => handleUpdateStatus(row.delivery_id, 'DELIVERED')}
                                    className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                                    title="ถึงปลายทาง"
                                >
                                    ✓ ถึงแล้ว
                                </button>
                            )}
                        </div>
                    );
                },
                size: 190,
            }),
        ],
        [columnHelper, page, limit, handleUpdateStatus, customerMap]
    );

    return (
        <>
            <PageListLayout
                title="รายการจัดส่งสินค้า - Delivery Order (DO)"
                subtitle="จัดการข้อมูลการจัดส่งสินค้าให้ลูกค้า"
                icon={Truck}
                accentColor="amber"
                totalCount={apiData?.total || 0}
                isLoading={isLoading}
                searchForm={
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <FilterField
                            label="เลขที่รายการจัดส่ง"
                            value={deliveryNo}
                            onChange={setDeliveryNo}
                            placeholder="DO-xxxx"
                            accentColor="amber"
                        />
                        <FilterField
                            label="เลขที่ SO"
                            value={soNo}
                            onChange={setSoNo}
                            placeholder="SO-xxxx"
                            accentColor="amber"
                        />
                        <FilterField
                            label="ลูกค้า"
                            value={customerFilter}
                            onChange={setCustomerFilter}
                            placeholder="ชื่อลูกค้า"
                            accentColor="amber"
                        />
                        <FilterField
                            label="วันที่ตั้งแต่"
                            type="date"
                            value={startDate}
                            onChange={setStartDate}
                            accentColor="amber"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={STATUS_OPTIONS}
                            accentColor="amber"
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
                                    className="h-10 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center px-6 gap-2"
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
                                สร้างรายการจัดส่งใหม่
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
                                docNo={item.delivery_no || '-'}
                                customerName={
                                    customerMap.get(String(item.customer_id)) || item.customer_name || 'ไม่ระบุ'
                                }
                                date={formatDisplayDate(item.delivery_date)}
                                amount={0}
                                statusBadge={<DeliveryStatusBadge status={item.status} />}
                                onClick={() => handleEdit(item.delivery_id, true)}
                                actions={
                                    <div className="flex gap-2 w-full mt-2">
                                        <button
                                            onClick={() => handleEdit(item.delivery_id, true)}
                                            className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <Eye size={14} /> รายละเอียด
                                        </button>
                                        {isStatusEditable(item.status) && (
                                            <button
                                                onClick={() => handleEdit(item.delivery_id, false)}
                                                className="flex-1 h-9 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                            >
                                                <Edit size={14} /> แก้ไข
                                            </button>
                                        )}
                                    </div>
                                }
                            />
                        )}
                    />
                </div>
            </PageListLayout>

            {/* Delivery Form Modal */}
            <DeliveryFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                id={selectedDeliveryId}
                isViewOnly={isViewOnly}
                onSuccess={() => refetch()}
            />
        </>
    );
}
