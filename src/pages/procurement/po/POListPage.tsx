import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Plus, Eye, Send, CheckCircle, Package, Edit } from 'lucide-react';
import { formatThaiDate } from '../../../utils/dateUtils';
import { styles } from '../../../constants';
import { PageListLayout, FilterFormBuilder, POStatusBadge } from '../../../components/shared';
import type { FilterFieldConfig } from '../../../components/shared/FilterFormBuilder';
import { useTableFilters, type TableFilters } from '../../../hooks';
import { poService } from '../../../services/poService';
import type { POListParams, POStatus, POListItem } from '../../../types/po-types';

// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const PO_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'APPROVED', label: 'อนุมัติแล้ว' },
    { value: 'ISSUED', label: 'ออกแล้ว' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================

type POFilterKeys = keyof TableFilters<POStatus>;

const PO_FILTER_CONFIG: FilterFieldConfig<POFilterKeys>[] = [
    { name: 'search', label: 'เลขที่ PO', type: 'text', placeholder: 'PO2024-xxx' },
    { name: 'search2', label: 'เลขที่ PR อ้างอิง', type: 'text', placeholder: 'PR2024-xxx' },
    { name: 'search3', label: 'ชื่อผู้ขาย', type: 'text', placeholder: 'ชื่อผู้ขาย' },
    { name: 'status', label: 'สถานะ', type: 'select', options: PO_STATUS_OPTIONS },
    { name: 'dateFrom', label: 'วันที่เอกสาร จาก', type: 'date' },
    { name: 'dateTo', label: 'ถึงวันที่', type: 'date' },
];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function POListPage() {
    // URL-based Filter State
    const { filters, setFilters, resetFilters } = useTableFilters<POStatus>({
        defaultStatus: 'ALL',
    });

    // Convert to API filter format
    const apiFilters: POListParams = {
        po_no: filters.search || undefined,
        pr_no: filters.search2 || undefined,
        vendor_name: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
    };

    // Data Fetching with React Query
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['purchase-orders', apiFilters],
        queryFn: () => poService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    const poList = data?.data ?? [];

    // Handlers
    const handleFilterChange = (name: POFilterKeys, value: string) => {
        setFilters({ [name]: value });
    };

    // Action Handlers (Mock)
    const handleView = (id: string) => console.log('View PO:', id);
    const handleEdit = (id: string) => console.log('Edit PO:', id);
    const handleApprove = (id: string) => alert(`ส่งอนุมัติ PO: ${id}`);
    const handleIssue = (id: string) => alert(`ออก PO: ${id}`);
    const handleGRN = (id: string) => alert(`เปิด GRN สำหรับ PO: ${id}`);

    return (
        <PageListLayout
            title="รายการใบสั่งซื้อ"
            subtitle="Purchase Order (PO) Master"
            icon={FileText}
            accentColor="blue"
            isLoading={isLoading}
            searchForm={
                <FilterFormBuilder
                    config={PO_FILTER_CONFIG}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSearch={() => {}} // React Query auto-fetches
                    onReset={resetFilters}
                    accentColor="blue"
                    columns={{ sm: 2, md: 3, lg: 3 }}
                    actionButtons={
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm font-medium w-full sm:w-auto mt-7 whitespace-nowrap"
                        >
                            <Plus size={20} />
                            สร้างใบสั่งซื้อใหม่
                        </button>
                    }
                />
            }
        >
            {/* Results Section */}
            <div className={`${styles.tableContainer} relative`}>
                {/* Fetching indicator */}
                {isFetching && !isLoading && (
                    <div className="absolute top-2 right-2 z-10">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                    </div>
                )}

                {/* Results Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-blue-600">
                    <h2 className="text-lg font-bold text-white">รายการใบสั่งซื้อ</h2>
                    <span className="text-sm text-blue-100">
                        พบทั้งหมด <span className="font-semibold">{data?.total ?? 0}</span> รายการ
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="w-[5%] px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ลำดับ</th>
                                <th className="w-[12%] px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">เลขที่ PO</th>
                                <th className="w-[10%] px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">วันที่</th>
                                <th className="w-[12%] px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">เลขที่ PR</th>
                                <th className="w-[15%] px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ชื่อผู้ขาย</th>
                                <th className="w-[10%] px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">สถานะ</th>
                                <th className="w-[8%] px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">จำนวน<br/>รายการ</th>
                                <th className="w-[13%] px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ยอดรวม<br/>(บาท)</th>
                                <th className="w-[15%] px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900 text-sm">
                            {poList.length > 0 ? (
                                poList.map((item: POListItem, index: number) => (
                                    <tr key={item.po_id} className="hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
                                        <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 font-medium">
                                            {index + 1}
                                        </td>
                                        
                                        <td className="px-4 py-4">
                                            <span className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer block">
                                                {item.po_no}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {formatThaiDate(item.po_date)}
                                        </td>

                                        <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                                            {item.pr_no || '-'}
                                        </td>

                                        <td className="px-4 py-4 text-gray-700 dark:text-gray-200">
                                            <div className="font-medium truncate max-w-[200px]" title={item.vendor_name}>
                                                {item.vendor_name}
                                            </div>
                                        </td>
                                        
                                        <td className="px-4 py-4 text-center">
                                            <POStatusBadge status={item.status} className="whitespace-nowrap" />
                                        </td>

                                        <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-300">
                                            {item.item_count}
                                        </td>

                                        <td className="px-4 py-4 text-right font-bold text-gray-800 dark:text-white">
                                            {item.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* View Button - Always visible */}
                                                <button 
                                                    onClick={() => handleView(item.po_id)}
                                                    className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-gray-800 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    title="ดูรายละเอียด"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                {/* Draft Status Actions */}
                                                {item.status === 'DRAFT' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleEdit(item.po_id)}
                                                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors bg-white dark:bg-gray-800 p-1 rounded hover:bg-blue-50 dark:hover:bg-gray-700 border border-blue-200"
                                                            title="แก้ไข"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        
                                                        {/* Send Approval Button (Purple Plane) */}
                                                        <button 
                                                            onClick={() => handleApprove(item.po_id)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors shadow-sm ml-1 whitespace-nowrap"
                                                        >
                                                            <Send size={14} className="" />
                                                            ส่งอนุมัติ
                                                        </button>
                                                    </>
                                                )}

                                                {/* Approved Status Actions */}
                                                {item.status === 'APPROVED' && (
                                                    <button 
                                                        onClick={() => handleIssue(item.po_id)}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
                                                    >
                                                        <CheckCircle size={14} />
                                                        ออก PO
                                                    </button>
                                                )}

                                                {/* Issued Status Actions */}
                                                {item.status === 'ISSUED' && (
                                                    <button 
                                                        onClick={() => handleGRN(item.po_id)}
                                                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
                                                    >
                                                        <Package size={14} />
                                                        เปิด GRN
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText size={48} className="text-gray-300 mb-2" />
                                            <p>ไม่พบรายการใบสั่งซื้อ</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageListLayout>
    );
}
