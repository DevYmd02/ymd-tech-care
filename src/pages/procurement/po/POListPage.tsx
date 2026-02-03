import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { FileText, Plus, Eye, Send, CheckCircle, Package, Edit } from 'lucide-react';
import { formatThaiDate } from '@utils/dateUtils';
import { FilterFormBuilder } from '@shared';
import { SmartTable } from '@ui/SmartTable';
import { PageListLayout } from '@layout/PageListLayout';
import { POStatusBadge } from '@ui/StatusBadge';
import type { FilterFieldConfig } from '@shared/FilterFormBuilder';
import { useTableFilters, type TableFilters } from '@hooks';
import { poService } from '@services/POService';
import type { POListParams, POStatus, POListItem, POFormData } from '@project-types/po-types';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import POFormModal from './components/POFormModal';

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

type POFilterKeys = Extract<keyof TableFilters<POStatus>, string>;

const PO_FILTER_CONFIG: FilterFieldConfig<POFilterKeys>[] = [
    { name: 'search', label: 'เลขที่ PO', type: 'text', placeholder: 'PO2024-xxx' },
    { name: 'search2', label: 'เลขที่ PR อ้างอิง', type: 'text', placeholder: 'PR2024-xxx' },
    { name: 'search3', label: 'ชื่อผู้ขาย', type: 'text', placeholder: 'ชื่อผู้ขาย' },
    { name: 'status', label: 'สถานะ', type: 'select', options: PO_STATUS_OPTIONS },
    { name: 'dateFrom', label: 'วันที่เอกสาร จาก', type: 'date' },
    { name: 'dateTo', label: 'ถึงวันที่', type: 'date' },
];

export default function POListPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // -- Modal State (URL Driven) --
    // derived directly from URL search params
    const isCreateModalOpen = searchParams.get('mode') === 'create';
    const createFromQC = searchParams.get('createFromQC') === 'true';
    const vendorIdParam = searchParams.get('vendorId');
    const remarksParam = searchParams.get('remarks');

    // Derive initial values from URL params
    const initialCreateValues = useMemo<Partial<POFormData> | undefined>(() => {
        if (createFromQC) {
            return {
                vendor_id: vendorIdParam || undefined,
                remarks: remarksParam || undefined,
                items: [] 
            };
        }
        // Fallback or simple create mode
        if (vendorIdParam) {
            return { vendor_id: vendorIdParam };
        }
        return undefined;
    }, [createFromQC, vendorIdParam, remarksParam]);

    // Handle closing the modal by updating URL params
    const handleCloseCreateModal = () => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('mode');
            newParams.delete('createFromQC');
            newParams.delete('vendorId');
            newParams.delete('qcNo');
            newParams.delete('remarks');
            return newParams;
        });
    };

    const { filters, setFilters, resetFilters, handlePageChange } = useTableFilters<POStatus>({
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
        // POListParams likely has pagination like others
        page: filters.page,
        limit: filters.limit,
    };

    // Data Fetching with React Query
    const { data, isLoading } = useQuery({
        queryKey: ['purchase-orders', apiFilters],
        queryFn: () => poService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // Handlers
    const handleFilterChange = (name: POFilterKeys, value: string) => {
        setFilters({ [name]: value });
    };

    // Action Handlers (Mock)
    const handleView = (id: string) => window.alert(`Coming Soon: View PO ${id}`);
    const handleEdit = (id: string) => window.alert(`Coming Soon: Edit PO ${id}`);
    const handleApprove = (id: string) => alert(`ส่งอนุมัติ PO: ${id}`);
    const handleIssue = (id: string) => alert(`ออก PO: ${id}`);
    const handleGRN = (id: string) => alert(`เปิด GRN สำหรับ PO: ${id}`);

    const columnHelper = createColumnHelper<POListItem>();
    
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            footer: () => <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-bold text-sm text-gray-700 dark:text-gray-200">ยอดรวมทั้งหมด :</div>,
            size: 40,
            enableSorting: false,
        }),
        columnHelper.accessor('po_no', {
            header: 'เลขที่ PO',
            cell: (info) => (
                <span className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer block" title={info.getValue()}>
                    {info.getValue()}
                </span>
            ),
            size: 140,
            enableSorting: true,
        }),
        columnHelper.accessor('po_date', {
            header: 'วันที่',
            cell: (info) => (
                <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {formatThaiDate(info.getValue())}
                </span>
            ),
            size: 110,
            enableSorting: true,
        }),
        columnHelper.accessor('pr_no', {
            header: 'เลขที่ PR',
            cell: (info) => (
                <span className="text-purple-600 dark:text-purple-400 hover:underline cursor-pointer" title={info.getValue() || ''}>
                    {info.getValue() || '-'}
                </span>
            ),
            size: 140,
            enableSorting: false,
        }),
        columnHelper.accessor('vendor_name', {
            header: 'ชื่อผู้ขาย',
            cell: (info) => (
                <div className="font-semibold text-gray-800 dark:text-gray-200 text-left whitespace-nowrap" title={info.getValue() || '-'}>
                    {info.getValue() || '-'}
                </div>
            ),
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center">
                    <POStatusBadge status={info.getValue()} className="whitespace-nowrap" />
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.accessor('item_count', {
            header: () => <div className="text-center w-full whitespace-nowrap">จำนวนรายการ</div>,
            cell: (info) => (
                <div className="text-center text-gray-600 dark:text-gray-300">
                    {info.getValue()}
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.accessor('total_amount', {
            header: () => <div className="text-center w-full whitespace-nowrap">ยอดรวม (บาท)</div>,
            cell: (info) => (
                <div className="text-center font-bold text-gray-800 dark:text-white whitespace-nowrap">
                    {info.getValue()?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            ),
            footer: () => {
                 const total = data?.data.reduce((sum, item) => sum + item.total_amount, 0) || 0;
                 return (
                     <div className="text-center font-bold text-base text-blue-600 dark:text-blue-400 whitespace-nowrap">
                         {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                     </div>
                 );
            },
            size: 140,
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
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
                );
            },
            size: 160,
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, data?.data]);

    return (
        <>
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
                        columns={{ sm: 2, md: 3, lg: 4 }}
                        actionButtons={
                            <button
                                onClick={() => setSearchParams({ mode: 'create' })}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm font-medium w-full sm:w-auto whitespace-nowrap"
                            >
                                <Plus size={20} />
                                สร้างใบสั่งซื้อใหม่
                            </button>
                        }
                    />
                }
            >
                <div className="h-full flex flex-col">
                    <SmartTable
                        data={data?.data ?? []}
                        columns={columns as ColumnDef<POListItem>[]}
                        isLoading={isLoading}
                        pagination={{
                            pageIndex: filters.page,
                            pageSize: filters.limit,
                            totalCount: data?.total ?? 0,
                            onPageChange: handlePageChange,
                            onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 })
                        }}
                        rowIdField="po_id"
                        className="flex-1"
                        showFooter={true}
                    />
                </div>
            </PageListLayout>
            
            <POFormModal 
                isOpen={isCreateModalOpen} 
                onClose={handleCloseCreateModal} 
                onSuccess={() => { 
                    handleCloseCreateModal();
                    window.location.reload(); 
                }} 
                initialValues={initialCreateValues}
            />
        </>
    );
}
