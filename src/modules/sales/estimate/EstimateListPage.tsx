/**
 * @file EstimateListPage.tsx
 * @description หน้ารายการประมาณการราคา (Estimate List Page)
 * @route /sales/estimate
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calculator, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { EstimateService, type EstimateHeader } from '@sales/estimate/services/estimate.service';

// ====================================================================================
// CONSTANTS
// ====================================================================================

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

export default function EstimateListPage() {
    const [estimateNo, setEstimateNo] = useState('');
    const [inquiryNo, setInquiryNo] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // API Integration
    const { data: apiData, isLoading } = useQuery({
        queryKey: ['sales-estimates', estimateNo, inquiryNo, statusFilter],
        queryFn: () => EstimateService.getList({
            estimate_no: estimateNo,
            inquiry_no: inquiryNo,
            status: statusFilter === 'ALL' ? undefined : statusFilter
        }),
    });

    const displayData = useMemo(() => apiData?.data || [], [apiData]);

    // Columns Definition
    const columnHelper = createColumnHelper<EstimateHeader>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center w-full">ลำดับ</div>,
            cell: (info) => <div className="flex justify-center items-center w-full">{info.row.index + 1}</div>,
            size: 60,
        }),
        columnHelper.accessor('estimate_no', {
            header: 'เลขที่ Estimate',
            cell: (info) => (
                <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                    {info.getValue()}
                </span>
            ),
            size: 150,
        }),
        columnHelper.accessor('inquiry_no', {
            header: 'อ้าง Inquiry',
            cell: (info) => info.getValue(),
            size: 150,
        }),
        columnHelper.accessor('markup', {
            header: 'Markup',
            cell: (info) => info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 }),
            size: 150,
        }),
        columnHelper.accessor('total_price', {
            header: 'ราคารวม',
            cell: (info) => (
                <span className="font-bold">
                    {info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            ),
            size: 150,
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
            title="รายการประมาณการ"
            subtitle="Sales Estimate"
            icon={Calculator}
            accentColor="blue"
            totalCount={apiData?.total || 0}
            searchForm={
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <FilterField
                        label="เลขที่ Estimate"
                        value={estimateNo}
                        onChange={setEstimateNo}
                        placeholder="กรอกเลขที่ Estimate"
                        accentColor="blue"
                    />
                    <FilterField
                        label="เลขที่ Inquiry"
                        value={inquiryNo}
                        onChange={setInquiryNo}
                        placeholder="กรอกเลขที่ Inquiry"
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
                    
                    {/* Buttons Layout: 2 Rows on Mobile, 1 Row on Desktop */}
                    <div className="md:col-span-3 flex flex-col md:flex-row md:justify-end gap-3 mt-2">
                        <div className="grid grid-cols-2 md:flex gap-2">
                            <button 
                                onClick={() => {
                                    setEstimateNo('');
                                    setInquiryNo('');
                                    setStatusFilter('ALL');
                                }}
                                className="h-10 bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-lg font-medium transition-all flex items-center justify-center px-4 gap-2"
                            >
                                <Plus size={18} className="rotate-45 text-slate-500" strokeWidth={2.5} />
                                ล้างค่า
                            </button>
                            <button className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center px-6 gap-2">
                                <Search size={18} strokeWidth={3} />
                                ค้นหา
                            </button>
                        </div>
                        
                        <button className="h-10 w-full md:w-auto px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                            <Plus size={18} />
                            สร้าง Estimate ใหม่
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
