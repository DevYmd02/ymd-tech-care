/**
 * @file InquiryListPage.tsx
 * @description หน้ารายการสำรวจความต้องการ (Inquiry List Page)
 * @route /sales/inquiry
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { InquiryService, type InquiryHeader } from '../../services/inquiry.service';

const STATUS_OPTIONS = [
    { value: 'ALL', label: '-- ทั้งหมด --' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Submitted' },
];

// ====================================================================================
// COMPONENTS
// ====================================================================================

const StatusBadge = ({ status }: { status: string }) => {
    const config = {
        DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
        SUBMITTED: 'bg-blue-100 text-blue-600 border-blue-200',
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

export default function InquiryListPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // API Integration
    const { data: apiData, isLoading } = useQuery({
        queryKey: ['sales-inquiries', searchTerm, customerSearch, statusFilter],
        queryFn: () => InquiryService.getList({
            inquiry_no: searchTerm,
            customer_name: customerSearch,
            status: statusFilter === 'ALL' ? undefined : statusFilter
        }),
    });

    // Data for display
    const displayData = useMemo(() => apiData?.data || [], [apiData]);

    // Columns Definition
    const columnHelper = createColumnHelper<InquiryHeader>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center w-full">ลำดับ</div>,
            cell: (info) => <div className="flex justify-center items-center w-full">{info.row.index + 1}</div>,
            size: 60,
        }),
        columnHelper.accessor('inquiry_no', {
            header: 'เลขที่เอกสาร',
            cell: (info) => (
                <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
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
            cell: (info) => info.getValue(),
            size: 250,
        }),
        columnHelper.accessor('status', {
            header: () => <div className="flex justify-center items-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center items-center w-full">
                    <StatusBadge status={info.getValue()} />
                </div>
            ),
            size: 120,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="flex justify-center items-center w-full">จัดการ</div>,
            cell: () => (
                <div className="flex justify-center items-center gap-4 w-full">
                    <button className="text-blue-600 hover:text-blue-800 transition-colors">
                        <Edit size={18} />
                    </button>
                    <button className="text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
            size: 120,
        }),
    ], [columnHelper]);

    return (
        <PageListLayout
            title="สำรวจความต้องการ (Inquiry)"
            subtitle="จัดการข้อมูลการสำรวจความต้องการของลูกค้า"
            icon={ClipboardList}
            accentColor="blue"
            totalCount={apiData?.total || 0}
            isLoading={isLoading}
            searchForm={
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <FilterField
                        label="เลขที่เอกสาร"
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="กรอกเลขที่เอกสาร"
                        accentColor="blue"
                    />
                    <FilterField
                        label="ชื่อลูกค้า"
                        value={customerSearch}
                        onChange={setCustomerSearch}
                        placeholder="กรอกชื่อลูกค้า"
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
                    <div className="md:col-span-3 flex flex-col sm:flex-row justify-between gap-4 mt-2">
                        <div className="flex gap-2">
                            <button className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
                                <Search size={18} />
                                ค้นหา
                            </button>
                            <button 
                                onClick={() => {
                                    setSearchTerm('');
                                    setCustomerSearch('');
                                    setStatusFilter('ALL');
                                }}
                                className="h-10 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} className="rotate-45" />
                                ล้างค่า
                            </button>
                        </div>
                        
                        <button className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
                            <Plus size={18} />
                            สร้าง Inquiry ใหม่
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
