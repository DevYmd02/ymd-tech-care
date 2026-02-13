
import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { FileText, Eye, Package, Database } from 'lucide-react'; // Added Database as placeholder icon
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { FilterFormBuilder } from '@ui';
import { PageListLayout, SmartTable } from '@ui';
import type { FilterFieldConfig } from '@ui';
import { useTableFilters, type TableFilters } from '@/shared/hooks';
import { PrtService } from '@/modules/procurement/services/prt.service'; // Fixed import path
import type { PRTListParams, PRTStatus, PurchaseReturn } from '@/modules/procurement/types/prt/prt-types';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import PRTFormModal from './components/PRTFormModal';

// ====================================================================================
// STATUS BADGE IMPL
// ====================================================================================
const PRTStatusBadge: React.FC<{ status: PRTStatus; className?: string }> = ({ status, className }) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    let label: string = status;

    switch (status) {
        case 'DRAFT':
            label = 'แบบร่าง';
            colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
            break;
        case 'POSTED':
            label = 'บันทึกแล้ว';
            colorClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            break;
        case 'CANCELLED':
            label = 'ยกเลิก';
            colorClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400';
            break;
    }

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colorClass} ${className || ''}`}>
            {label}
        </span>
    );
};

// ====================================================================================
// OPTIONS & FILTER CONFIG
// ====================================================================================

const PRT_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'POSTED', label: 'บันทึกแล้ว' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
];

type PRTFilterKeys = Extract<keyof TableFilters<PRTStatus>, string>;

const PRT_FILTER_CONFIG: FilterFieldConfig<PRTFilterKeys>[] = [
    { name: 'search', label: 'เลขที่ PRT', type: 'text', placeholder: 'PRT2024-xxx' },
    { name: 'search2', label: 'ผู้ขาย', type: 'text', placeholder: 'ชื่อผู้ขาย' },
    { name: 'search3', label: 'เลขที่ GRN อ้างอิง', type: 'text', placeholder: 'GRN2024-xxx' },
    { name: 'status', label: 'สถานะ', type: 'select', options: PRT_STATUS_OPTIONS },
    { name: 'dateFrom', label: 'วันที่เริ่มต้น', type: 'date' },
    { name: 'dateTo', label: 'วันที่สิ้นสุด', type: 'date' },
];

export default function PRTListPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { filters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<PRTStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'prt_no',
            search2: 'vendor_name',
            search3: 'ref_grn_no',
        }
    });

    // API Params
    const apiFilters: PRTListParams = {
        page: filters.page,
        limit: filters.limit,
        prt_no: filters.search || undefined,
        vendor_name: filters.search2 || undefined,
        ref_grn_no: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        sort: filters.sort || undefined,
    };

    // Data Fetching
    const { data, isLoading } = useQuery({
        queryKey: ['purchase-returns', apiFilters],
        queryFn: () => PrtService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // Handlers
    const handleView = (id: string) => alert(`ดูรายละเอียด PRT: ${id}`);
    const handleCN = (id: string) => alert(`ออก CN สำหรับ PRT: ${id}`);
    const handlePost = (id: string) => alert(`Post PRT: ${id}`);
    const handleFilterChange = (name: PRTFilterKeys, value: string) => {
        setFilters({ [name]: value });
    };

    const handleCreate = () => {
        setIsModalOpen(true);
    };

    const handleModalSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
        setIsModalOpen(false);
    };

    // Columns
    const columnHelper = createColumnHelper<PurchaseReturn>();
    
    const columns = useMemo(() => [
        columnHelper.accessor('prt_no', {
            header: 'เลขที่ PRT',
            cell: (info) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => handleView(info.row.original.prt_id)}>
                        {info.getValue()}
                    </span>
                    <span className="text-xs text-gray-400">สร้างโดย: {info.row.original.created_by}</span>
                </div>
            ),
            size: 140,
        }),
        columnHelper.accessor('prt_date', {
            header: 'วันที่คืน',
            cell: (info) => (
                <span className="text-gray-600 dark:text-gray-300">
                    {formatThaiDate(info.getValue())}
                </span>
            ),
            size: 110,
        }),
        columnHelper.accessor('vendor_name', {
            header: 'ผู้ขาย',
            cell: (info) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]" title={info.getValue()}>
                        {info.getValue()}
                    </span>
                    <span className="text-xs text-gray-500">{info.row.original.vendor_code}</span>
                </div>
            ),
            size: 200,
        }),
        columnHelper.accessor('ref_grn_no', {
            header: 'อ้างอิง GRN',
            cell: (info) => (
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                    {info.getValue() || '-'}
                </span>
            ),
            size: 130,
        }),
        columnHelper.accessor('total_qty', {
            header: () => <div className="text-right w-full">จำนวนคืน (QTY)</div>,
            cell: (info) => (
                <div className="text-right font-medium text-gray-700 dark:text-gray-300">
                    {info.getValue()?.toLocaleString()}
                </div>
            ),
            size: 100,
        }),
        columnHelper.accessor('total_amount', {
            header: () => <div className="text-right w-full">มูลค่ารวม (TOTAL)</div>,
            cell: (info) => (
                <div className="text-right font-bold text-gray-800 dark:text-white">
                    {info.getValue()?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            ),
            size: 130,
        }),
        columnHelper.accessor('status', {
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center">
                    <PRTStatusBadge status={info.getValue()} />
                </div>
            ),
            size: 100,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">การจัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center justify-center gap-2">
                         <button 
                            onClick={() => handleView(item.prt_id)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                            title="ดูรายละเอียด"
                        >
                            <Eye size={16} />
                        </button>
                        
                        {item.status === 'POSTED' && (
                             <button 
                                onClick={() => handleCN(item.prt_id)}
                                className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
                                title="Credit Note"
                            >
                                <FileText size={14} /> CN
                            </button>
                        )}

                        {item.status === 'DRAFT' && (
                            <button 
                                onClick={() => handlePost(item.prt_id)}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
                                title="Post PRT"
                            >
                                <Package size={14} /> Post
                            </button>
                        )}
                    </div>
                );
            },
            size: 120,
        }),
    ], [columnHelper]);

    return (
        <PageListLayout
            title="รายการใบคืนสินค้า (Purchase Return - PRT)"
            subtitle="จัดการและติดตามใบคืนสินค้าทั้งหมด"
            icon={Database} // Using Database icon as generic placeholder or use another if FileText is too common
            accentColor="blue"
            totalCount={data?.total}
            totalCountLoading={isLoading}
            isLoading={isLoading}
            searchForm={
                <FilterFormBuilder
                    config={PRT_FILTER_CONFIG}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSearch={() => {}} 
                    onReset={resetFilters}
                    accentColor="blue"
                    columns={{ sm: 1, md: 2, xl: 5 }} // Adjusted for 5 filters + actions
                    actionColSpan={{ md: 2, xl: 1 }}
                    actionAlign="end"
                    onCreate={handleCreate}
                    createLabel="สร้าง PRT ใหม่"
                />
            }
        >
             <div className="h-full flex flex-col">
                 <div className="hidden md:block flex-1 overflow-hidden">
                    <SmartTable
                        data={data?.data ?? []}
                        columns={columns as ColumnDef<PurchaseReturn>[]}
                        isLoading={isLoading}
                        pagination={{
                            pageIndex: filters.page,
                            pageSize: filters.limit,
                            totalCount: data?.total ?? 0,
                            onPageChange: handlePageChange,
                            onPageSizeChange: (size) => setFilters({ limit: size, page: 1 })
                        }}
                        sortConfig={sortConfig}
                        onSortChange={handleSortChange}
                        rowIdField="prt_id"
                        className="h-full"
                    />
                 </div>

                 {/* Mobile View (Optional - Simplified) */}
                 <div className="md:hidden flex-1 overflow-y-auto p-4">
                     {data?.data.map(item => (
                         <div key={item.prt_id} className="bg-white p-4 rounded-lg shadow mb-4 border">
                             <div className="flex justify-between mb-2">
                                 <span className="font-bold text-blue-600">{item.prt_no}</span>
                                 <PRTStatusBadge status={item.status} />
                             </div>
                             <div className="text-sm text-gray-600 mb-2">
                                 <div>{item.vendor_name}</div>
                                 <div className="text-xs text-gray-500">{formatThaiDate(item.prt_date)}</div>
                             </div>
                             <div className="flex justify-between items-center border-t pt-2">
                                 <span className="font-bold">{item.total_amount.toLocaleString()} บาท</span>
                                 <button onClick={() => handleView(item.prt_id)} className="text-blue-500 text-sm">ดูรายละเอียด</button>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>

             <PRTFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleModalSuccess}
             />
        </PageListLayout>
    );
}

