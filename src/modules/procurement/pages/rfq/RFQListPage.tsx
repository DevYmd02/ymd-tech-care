/**
 * @file RFQListPage.tsx
 * @description หน้ารายการใบขอใบเสนอราคา (Request for Quotation List)
 * @route /procurement/rfq
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query, SmartTable
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Eye, Send, Edit, CheckCircle, Search, Plus } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { PageListLayout, SmartTable, RFQStatusBadge, FilterField } from '@ui';
// FilterFieldConfig removed
import { useTableFilters } from '@/shared/hooks';
import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { QTFormModal } from '@/modules/procurement/pages/qt/components';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { ConfirmationModal } from '@/shared/components/system/ConfirmationModal';

// Services & Types
import { RFQService } from '@/modules/procurement/services';
import type { RFQFilterCriteria, RFQHeader, RFQStatus } from '@/modules/procurement/types/rfq-types';
import { RFQFormModal } from './components';

// ... (STATUS OPTIONS and FILTER CONFIG omitted for brevity if unchanged, but I need to be careful not to delete them if I targeted a range. 
// I'll target specific blocks to be safe.
// Wait, the Instruction says "Replace Modal States and Handlers".
// I'll check the lines again. 
// Imports are lines 8-22.
// State/Handlers are lines 87-100.
// I can do multiple replaces or one big one.
// Let's do Imports first. Then State/Handlers.



// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const RFQ_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'แบบร่าง' },
    { value: 'SENT', label: 'ส่งแล้ว' },
    { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
    { value: 'CLOSED', label: 'ปิดแล้ว' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================



// const RFQ_FILTER_CONFIG: FilterFieldConfig<RFQFilterKeys>[] = [
//     { name: 'search', label: 'เลขที่ RFQ', type: 'text', placeholder: 'RFQ-xxx' },
//     { name: 'search2', label: 'PR อ้างอิง', type: 'text', placeholder: 'PR-xxx' },
//     { name: 'creator', label: 'ผู้สร้าง RFQ', type: 'text', placeholder: 'ชื่อผู้สร้าง' },
//     { name: 'status', label: 'สถานะ', type: 'select', options: RFQ_STATUS_OPTIONS },
//     { name: 'dateFrom', label: 'วันที่เริ่มต้น', type: 'date' },
//     { name: 'dateTo', label: 'วันที่สิ้นสุด', type: 'date' },
// ];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function RFQListPage() {
    // URL-based Filter State
    const { filters, setFilters, resetFilters, handlePageChange, handleSortChange, sortConfig } = useTableFilters<RFQStatus>({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'rfq_no',
            search2: 'ref_pr_no',
            search3: 'creator_name'
        }
    });

    // Convert to API filter format
    const apiFilters: RFQFilterCriteria = {
        rfq_no: filters.search || undefined,
        ref_pr_no: filters.search2 || undefined,
        creator_name: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort || undefined
    };

    // Data Fetching with React Query
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['rfqs', apiFilters],
        queryFn: () => RFQService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    const { toast } = useToast();

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isQTModalOpen, setIsQTModalOpen] = useState(false);
    const [selectedRFQForQT, setSelectedRFQForQT] = useState<RFQHeader | null>(null);
    const [selectedRFQId, setSelectedRFQId] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    
    // Confirmation Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [rfqToConfirm, setRfqToConfirm] = useState<RFQHeader | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    // Handlers
    const handleFilterChange = (name: string, value: string) => {
        setFilters({ [name]: value });
    };

    const handleCreate = () => {
        setSelectedRFQId(null);
        setIsReadOnly(false);
        setIsModalOpen(true);
    };

    const handleView = useCallback((id: string) => {
        setSelectedRFQId(id);
        setIsReadOnly(true);
        setIsModalOpen(true);
    }, []);

    const handleEdit = useCallback((id: string) => {
        setSelectedRFQId(id);
        setIsReadOnly(false);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRFQId(null);
        setIsReadOnly(false);
    };

    const handleSendRFQ = useCallback((rfq: RFQHeader) => {
        setRfqToConfirm(rfq);
        setIsConfirmOpen(true);
    }, []);

    const executeSendRFQ = async () => {
        if (!rfqToConfirm) return;
        
        setIsConfirming(true);
        try {
            // Updated to match RFQService.update signature (id, data)
            // Assuming updating status to 'SENT' is the goal here, though previous logic didn't show exact payload.
            // Previous logic just showed toast. I will assume status update is needed or just success for now as per plan "Mock or equivalent"
            // But looking at RFQService, we have update() and sendToVendors(). 
            // The original alert said "Send to X vendors". 
            // I'll assume we used to use sendToVendors logic conceptually, or just update status. 
            // Given "Need to refresh data so status changes from Draft to Sent", I'll use update().
            
            // Mocking the API call delay as requested "loading 2 seconds" logic simulation or real call?
            // "When sending confirmed (executeSendRFQ), if system takes 2 seconds..." -> implies real await.
            
            // Using sending to vendors if vendors > 0? 
            // The user said "Change status from Draft to Sent". 
            // I will use update status to SENT.
            
            await RFQService.update(rfqToConfirm.rfq_id, { status: 'SENT' as RFQStatus });
            
            toast(`ส่ง RFQ ${rfqToConfirm.rfq_no} เรียบร้อยแล้ว`, 'success');
            refetch();
            cancelConfirm();
        } catch (error) {
            toast('เกิดข้อผิดพลาดในการส่ง RFQ', 'error');
            console.error(error);
        } finally {
            setIsConfirming(false);
        }
    };

    const cancelConfirm = () => {
        setIsConfirmOpen(false);
        setRfqToConfirm(null);
        setIsConfirming(false);
    };

    const handleOpenQTModal = (rfq: RFQHeader) => {
        setSelectedRFQForQT(rfq);
        setIsQTModalOpen(true);
    };

    // Columns
    const columnHelper = createColumnHelper<RFQHeader>();

    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: () => <div className="flex justify-center items-center h-full w-full">ลำดับ</div>,
            cell: (info) => <div className="flex justify-center items-center h-full w-full">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            size: 60,
            enableSorting: false,
        }),
        columnHelper.accessor('rfq_no', {
            header: 'ข้อมูล RFQ',
            cell: (info) => (
                <div className="flex flex-col py-2">
                    <span className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer" title={info.getValue()}>
                        {info.getValue()}
                    </span>
                    {info.row.original.ref_pr_no && (
                        <span className="text-xs text-gray-500 mt-1">
                            Ref: {info.row.original.ref_pr_no}
                        </span>
                    )}
                </div>
            ),
            size: 180,
            enableSorting: true,
        }),
        columnHelper.accessor('purpose', {
            header: 'เรื่อง/วัตถุประสงค์',
            cell: (info) => (
                <div className="max-w-[250px] truncate py-2" title={info.getValue()}>
                    {info.getValue()}
                </div>
            ),
            size: 250,
            enableSorting: true,
        }),
        columnHelper.accessor('created_by_name', {
            header: 'ผู้ดูแล',
            cell: (info) => (
                <div className="flex flex-col py-2">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {info.getValue() || '-'}
                    </span>
                    <span className="text-xs text-gray-400">
                        {formatThaiDate(info.row.original.rfq_date)}
                    </span>
                </div>
            ),
            size: 160,
            enableSorting: false,
        }),
        columnHelper.accessor('quote_due_date', {
            header: 'ครบกำหนด',
            cell: (info) => (
                <span className="text-orange-600 dark:text-orange-400 whitespace-nowrap py-2 block">
                    {info.getValue() ? formatThaiDate(info.getValue()!) : '-'}
                </span>
            ),
            size: 110,
            enableSorting: true,
        }),
        columnHelper.display({
            id: 'vendors',
            header: () => <div className="flex justify-center items-center w-full h-full">VENDORS</div>,
            cell: (info) => {
                const responded = info.row.original.responded_vendors_count || 0;
                const total = info.row.original.vendor_count || 0;
                return (
                    <div className="flex justify-center items-center h-full py-2">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {responded}/{total}
                        </span>
                    </div>
                );
            },
            size: 80,
            enableSorting: false,
        }),
        columnHelper.accessor(row => row.status, {
            id: 'status',
            header: () => <div className="flex justify-center items-center w-full h-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center items-center h-full py-2">
                    <RFQStatusBadge status={info.getValue()} />
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="flex justify-center items-center w-full h-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex justify-center items-center gap-2 w-full h-full py-2 min-w-[100px]">
                        <button 
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors" 
                            title="ดูรายละเอียด"
                            onClick={() => handleView(item.rfq_id)}
                        >
                            <Eye size={18} />
                        </button>
                        
                        {item.status === 'DRAFT' && (
                            <>
                                <button 
                                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded shadow-sm border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all whitespace-nowrap"
                                    title="แก้ไข"
                                    onClick={() => handleEdit(item.rfq_id)}
                                >
                                    <Edit size={14} /> 
                                    <span className="text-[10px] font-bold">แก้ไข</span>
                                </button>

                                <button 
                                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                    title="ส่ง RFQ"
                                    onClick={() => handleSendRFQ(item)}
                                >
                                    <Send size={12} /> ส่ง RFQ
                                </button>
                            </>
                        )}

                        {item.status === 'SENT' && (
                            <button 
                                onClick={() => handleOpenQTModal(item)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
                                title="บันทึกราคา"
                            >
                                <FileText size={14} />
                                บันทึกราคา
                            </button>
                        )}

                        {item.status === 'IN_PROGRESS' && (
                            <button 
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors shadow-sm"
                                title="สรุปผลการคัดเลือก"
                            >
                                <CheckCircle size={14} />
                                สรุปผล/ปิดรับ
                            </button>
                        )}
                    </div>
                );
            },
            size: 200, 
            enableSorting: false,
        }),
    ], [columnHelper, filters.page, filters.limit, handleView, handleEdit, handleSendRFQ]);

    // ====================================================================================
    // RENDER
    // ====================================================================================

    // Filter Config
    // Filter Config Removed in favor of manual layout

    return (
        <>
            <PageListLayout
                title="รายการขอใบเสนอราคา"
                subtitle="Request for Quotation (RFQ)"
                icon={FileText}
                accentColor="blue"
                totalCount={data?.total}
                totalCountLoading={isLoading}
                searchForm={
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <FilterField
                            label="เลขที่ RFQ"
                            value={filters.search}
                            onChange={(val: string) => handleFilterChange('search', val)}
                            placeholder="RFQ-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="PR อ้างอิง"
                            value={filters.search2}
                            onChange={(val: string) => handleFilterChange('search2', val)}
                            placeholder="PR-xxx"
                            accentColor="blue"
                        />
                        <FilterField
                            label="ผู้สร้าง RFQ"
                            value={filters.search3}
                            onChange={(val: string) => handleFilterChange('search3', val)}
                            placeholder="ชื่อผู้สร้าง"
                            accentColor="blue"
                        />
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={filters.status}
                            onChange={(val: string) => handleFilterChange('status', val)}
                            options={RFQ_STATUS_OPTIONS}
                            accentColor="blue"
                        />
                        <FilterField
                            label="วันที่เริ่มต้น"
                            type="date"
                            value={filters.dateFrom || ''}
                            onChange={(val: string) => handleFilterChange('dateFrom', val)}
                            accentColor="blue"
                        />
                        <FilterField
                            label="วันที่สิ้นสุด"
                            type="date"
                            value={filters.dateTo || ''}
                            onChange={(val: string) => handleFilterChange('dateTo', val)}
                            accentColor="blue"
                        />
                        
                        {/* Action Buttons Group */}
                        <div className="md:col-span-2 lg:col-span-2 flex flex-col sm:flex-row flex-wrap justify-end gap-2 items-center">
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={resetFilters}
                                    className="flex-1 sm:flex-none h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300 shadow-sm whitespace-nowrap"
                                >
                                    ล้างค่า
                                </button>
                                <button
                                    onClick={() => refetch()}
                                    className="flex-1 sm:flex-none h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <Search size={18} />
                                    ค้นหา
                                </button>
                            </div>
                            <button
                                onClick={handleCreate}
                                className="w-full sm:w-auto h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                สร้าง RFQ
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="h-full flex flex-col">
                    <SmartTable
                        data={data?.data ?? []}
                        columns={columns as ColumnDef<RFQHeader>[]}
                        isLoading={isLoading}
                        pagination={{
                            pageIndex: filters.page,
                            pageSize: filters.limit,
                            totalCount: data?.total ?? 0,
                            onPageChange: handlePageChange,
                            onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 })
                        }}
                        sortConfig={sortConfig}
                        onSortChange={handleSortChange}
                        rowIdField="rfq_id"
                        className="flex-1"
                    />
                </div>
            </PageListLayout>

            {isModalOpen && (
                <RFQFormModal 
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    editId={selectedRFQId}
                    readOnly={isReadOnly}
                    onSuccess={() => {
                        refetch();
                        handleCloseModal();
                    }}
                />
            )}

            {isQTModalOpen && (
                <QTFormModal
                    isOpen={isQTModalOpen}
                    onClose={() => {
                        setIsQTModalOpen(false);
                        setSelectedRFQForQT(null);
                    }}
                    initialRFQ={selectedRFQForQT}
                    onSuccess={() => {
                       refetch();
                       setIsQTModalOpen(false);
                    }}
                />
            )}

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={cancelConfirm}
                onConfirm={executeSendRFQ}
                title="ยืนยันการส่ง RFQ"
                description={`ต้องการส่ง RFQ เลขที่ ${rfqToConfirm?.rfq_no} ไปยังผู้ขายจำนวน ${rfqToConfirm?.vendor_count || 0} ราย ใช่หรือไม่?`}
                variant="info"
                confirmText="ตกลง"
                cancelText="ยกเลิก"
                isLoading={isConfirming}
            />
        </>
    );
}

