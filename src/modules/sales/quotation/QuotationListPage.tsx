/**
 * @file QuotationListPage.tsx
 * @description หน้ารายการใบเสนอราคาขาย (Sales Quotation List Page)
 */

import { useState, useMemo } from 'react';
import { FileText, Search, Plus, Edit, Eye, Send } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import type { QuotationHeader } from '@sales/quotation/services/quotation.service';
import { QuotationFormModal } from '@sales/quotation/components/QuotationFormModal';
import { useQuotationList } from '@sales/quotation/hooks/useQuotation';

// ====================================================================================
// CONSTANTS
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'Draft', label: 'แบบร่าง' },
    { value: 'Sent', label: 'รออนุมัติ' },
    { value: 'Approved', label: 'อนุมัติแล้ว' },
];

// ====================================================================================
// COMPONENTS
// ====================================================================================

const StatusBadge = ({ status }: { status: string }) => {
    const config = {
        Draft: { className: 'bg-gray-100 text-gray-600 border-gray-200', label: 'แบบร่าง' },
        Sent: { className: 'bg-blue-100 text-blue-600 border-blue-200', label: 'รออนุมัติ' },
        Approved: { className: 'bg-emerald-100 text-emerald-600 border-emerald-200', label: 'อนุมัติแล้ว' },
        Rejected: { className: 'bg-red-100 text-red-600 border-red-200', label: 'ไม่อนุมัติ' },
    }[status] || { className: 'bg-gray-100 text-gray-600 border-gray-200', label: status };

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
            {config.label}
        </span>
    );
};

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

    // 🏗️ Memoize query params to prevent unstable identities
    const queryParams = useMemo(() => ({
        sq_no: sqNo,
        customer_name: customer,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        start_date: startDate,
        end_date: endDate
    }), [sqNo, customer, statusFilter, startDate, endDate]);

    const { data: apiData, isLoading, refetch } = useQuotationList(queryParams);

    const displayData = useMemo(() => apiData?.data || [], [apiData]);

    const handleCreate = () => {
        setSelectedId(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setSelectedId(id);
        setIsModalOpen(true);
    };

    // Columns Definition
    const columnHelper = createColumnHelper<QuotationHeader>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: 'ลำดับ',
            cell: (info) => info.row.index + 1,
            size: 50,
        }),
        columnHelper.accessor('sq_no', {
            header: 'เลขที่ใบเสนอราคา',
            cell: (info) => (
                <span 
                    onClick={() => handleEdit(info.row.original.sq_no)}
                    className="text-blue-600 font-semibold cursor-pointer hover:underline"
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
            size: 200,
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
            size: 100,
        }),
        columnHelper.accessor('expiry_date', {
            header: 'หมดอายุ',
            cell: (info) => info.getValue(),
            size: 120,
        }),
        columnHelper.accessor('workflow_status', {
            header: 'สถานะงาน',
            cell: (info) => (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {info.getValue()}
                </span>
            ),
            size: 120,
        }),
        columnHelper.display({
            id: 'actions',
            header: 'การจัดการ',
            cell: (info) => {
                const status = info.row.original.status;
                const isDraft = status === 'Draft';
                
                return (
                    <div className="flex items-center gap-3">
                        <button 
                            className="text-blue-500 hover:text-blue-700 transition-colors" 
                            title="ดูรายละเอียด"
                        >
                            <Eye size={18} />
                        </button>
                        
                        {isDraft && (
                            <>
                                <button 
                                    onClick={() => handleEdit(info.row.original.sq_no)}
                                    className="text-orange-500 hover:text-orange-700 transition-colors"
                                    title="แก้ไข"
                                >
                                    <Edit size={18} />
                                </button>
                                <button 
                                    className="text-emerald-500 hover:text-emerald-700 transition-colors"
                                    title="ส่งอนุมัติ"
                                >
                                    <Send size={18} />
                                </button>
                            </>
                        )}
                    </div>
                );
            },
            size: 150,
        }),
    ], [columnHelper]);

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
                onSuccess={() => refetch()}
            />
        </PageListLayout>
    );
}
