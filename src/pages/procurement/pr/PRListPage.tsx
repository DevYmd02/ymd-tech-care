/**
 * @file PRListPage.tsx
 * @description หน้ารายการใบขอซื้อ (Purchase Requisition List)
 * @route /procurement/pr
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query
 */

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Eye, Edit, Send, CheckCircle } from 'lucide-react';
import { formatThaiDate } from '../../../utils/dateUtils';
import { styles } from '../../../constants';
import { PageListLayout, FilterFormBuilder, ApprovalModal, PRStatusBadge } from '../../../components/shared';
import type { FilterFieldConfig } from '../../../components/shared/FilterFormBuilder';
import { useWindowManager } from '../../../hooks/useWindowManager';
import { useTableFilters, type TableFilters } from '../../../hooks';
import RFQFormModal from '../rfq/components/RFQFormModal';

// Services & Types
import { prService } from '../../../services/prService';
import type { PRListParams } from '../../../services/prService';
import type { PRHeader, PRStatus } from '../../../types/pr-types';

// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const PR_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'DRAFT', label: 'ร่าง' },
    { value: 'PENDING', label: 'รออนุมัติ' },
    { value: 'APPROVED', label: 'อนุมัติแล้ว' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================

type PRFilterKeys = keyof TableFilters<PRStatus>;

const PR_FILTER_CONFIG: FilterFieldConfig<PRFilterKeys>[] = [
    { name: 'search', label: 'เลขที่เอกสาร', type: 'text', placeholder: 'PR2024-xxx' },
    { name: 'search2', label: 'ผู้ขอ', type: 'text', placeholder: 'ชื่อผู้ขอ' },
    { name: 'search3', label: 'แผนก', type: 'text', placeholder: 'แผนก' },
    { name: 'status', label: 'สถานะ', type: 'select', options: PR_STATUS_OPTIONS },
    { name: 'dateFrom', label: 'วันที่เอกสาร จาก', type: 'date' },
    { name: 'dateTo', label: 'ถึงวันที่', type: 'date' },
];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function PRListPage() {
    // URL-based Filter State
    const { filters, setFilters, resetFilters } = useTableFilters<PRStatus>({
        defaultStatus: 'ALL',
    });

    // Convert to API filter format
    const apiFilters: PRListParams = {
        pr_no: filters.search || undefined,
        requester_name: filters.search2 || undefined,
        department: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
    };

    // Data Fetching with React Query
    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['prs', apiFilters],
        queryFn: () => prService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // Window Manager
    const { openWindow } = useWindowManager();

    // Modal States
    const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
    const [selectedPR, setSelectedPR] = useState<PRHeader | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; action: 'approve' | 'reject' }>({
        isOpen: false,
        action: 'approve'
    });

    // Handlers
    const handleFilterChange = (name: PRFilterKeys, value: string) => {
        setFilters({ [name]: value });
    };

    const handleCreateRFQ = (pr: PRHeader) => {
        setSelectedPR(pr);
        setIsRFQModalOpen(true);
    };

    const handleApprovalConfirm = async (remark: string) => {
        try {
            await Promise.all(
                selectedIds.map(id => prService.approve({
                    pr_id: id,
                    action: approvalModal.action === 'approve' ? 'APPROVE' : 'REJECT',
                    remark: remark
                }))
            );
            refetch();
        } finally {
            setSelectedIds([]);
            setApprovalModal({ isOpen: false, action: 'approve' });
        }
    };

    const prList = data?.data ?? [];
    const totalAmount = prList.reduce((sum, item) => sum + item.total_amount, 0);

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <>
            <PageListLayout
                title="รายการใบขอซื้อ"
                subtitle="Purchase Requisition Master"
                icon={FileText}
                accentColor="blue"
                isLoading={isLoading}
                searchForm={
                    <FilterFormBuilder
                        config={PR_FILTER_CONFIG}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onSearch={() => {}} // React Query auto-fetches on filter change
                        onReset={resetFilters}
                        accentColor="blue"
                        columns={{ sm: 2, md: 4, lg: 4 }}
                        onCreate={() => openWindow('PR')}
                        createLabel="สร้างใบขอซื้อใหม่"
                        actionButtons={
                            selectedIds.length > 0 ? (
                                <div className="flex items-center gap-2 mr-auto">
                                    <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                        เลือก <strong>{selectedIds.length}</strong> รายการ
                                    </span>
                                    <button
                                        onClick={() => setApprovalModal({ isOpen: true, action: 'approve' })}
                                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap"
                                    >
                                        <CheckCircle size={16} />
                                        อนุมัติ
                                    </button>
                                </div>
                            ) : undefined
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
                        <h2 className="text-lg font-bold text-white">รายการใบขอซื้อ</h2>
                        <span className="text-sm text-blue-100">
                            พบทั้งหมด <span className="font-semibold">{data?.total ?? 0}</span> รายการ
                        </span>
                    </div>

                    {/* Table - Responsive Fixed Layout */}
                    <div className="overflow-hidden">
                        <table className="w-full table-fixed">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="w-[4%] px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">ลำดับ</th>
                                    <th className="w-[13%] px-2 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">เลขที่เอกสาร</th>
                                    <th className="w-[10%] px-2 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">วันที่</th>
                                    <th className="w-[12%] px-2 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">ผู้ขอ</th>
                                    <th className="w-[17%] px-2 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">วัตถุประสงค์</th>
                                    <th className="w-[10%] px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">สถานะ</th>
                                    <th className="w-[6%] px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">รายการ</th>
                                    <th className="w-[11%] px-2 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">ยอดรวม</th>
                                    <th className="w-[17%] px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                {prList.length > 0 ? (
                                    prList.map((item, index) => (
                                        <tr key={item.pr_id} className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-2 py-3 text-gray-600 dark:text-gray-300 text-center text-xs">{index + 1}</td>
                                            <td className="px-2 py-3">
                                                <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-xs truncate block" title={item.pr_no}>
                                                    {item.pr_no}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 text-gray-600 dark:text-gray-300 text-xs whitespace-nowrap">
                                                {formatThaiDate(item.request_date)}
                                            </td>
                                            <td className="px-2 py-3">
                                                <div className="font-medium text-gray-700 dark:text-gray-200 text-xs truncate" title={item.requester_name}>{item.requester_name}</div>
                                            </td>
                                            <td className="px-2 py-3 text-gray-600 dark:text-gray-300 text-xs">
                                                <span className="truncate block" title={item.purpose || '-'}>{item.purpose || '-'}</span>
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                <PRStatusBadge status={item.status as PRStatus} />
                                            </td>
                                            <td className="px-2 py-3 text-center text-gray-600 dark:text-gray-300 text-xs">
                                                {item.lines?.length || 0}
                                            </td>
                                            <td className="px-2 py-3 font-semibold text-gray-800 dark:text-gray-200 text-right text-xs whitespace-nowrap">
                                                {item.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="ดูรายละเอียด">
                                                        <Eye size={16} />
                                                    </button>
                                                    
                                                    {/* Edit button - only for DRAFT */}
                                                    {item.status === 'DRAFT' && (
                                                        <button className="p-1 text-orange-500 hover:text-orange-700 transition-colors" title="แก้ไข">
                                                            <Edit size={16} />
                                                        </button>
                                                    )}
                                                    
                                                    {/* Submit button - only for DRAFT */}
                                                    {item.status === 'DRAFT' && (
                                                        <button className="p-1 text-blue-500 hover:text-blue-700 transition-colors" title="ส่งอนุมัติ">
                                                            <Send size={16} />
                                                        </button>
                                                    )}
                                                    
                                                    {/* Create RFQ button - Enabled ONLY for APPROVED status */}
                                                    {item.status === 'APPROVED' ? (
                                                        <button 
                                                            onClick={() => handleCreateRFQ(item)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm transition-colors flex items-center gap-0.5 whitespace-nowrap"
                                                            title="สร้างใบขอใบเสนอราคา"
                                                        >
                                                            <FileText size={12} /> สร้าง RFQ
                                                        </button>
                                                    ) : item.status !== 'DRAFT' ? (
                                                        <button 
                                                            disabled
                                                            className="bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-2 py-1 rounded shadow-sm cursor-not-allowed flex items-center gap-0.5 whitespace-nowrap"
                                                            title={item.status === 'PENDING' ? 'ต้องอนุมัติก่อนจึงจะสร้าง RFQ ได้' : 'ไม่สามารถสร้าง RFQ ได้ (สถานะ: ยกเลิก)'}
                                                        >
                                                            <FileText size={12} /> สร้าง RFQ
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                                            ไม่พบข้อมูลใบขอซื้อ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer - Total */}
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">ยอดรวมทั้งหมด:</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                        </span>
                    </div>
                </div>
            </PageListLayout>

            {/* Modals */}
            <ApprovalModal
                isOpen={approvalModal.isOpen}
                onClose={() => setApprovalModal({ isOpen: false, action: 'approve' })}
                onConfirm={handleApprovalConfirm}
                action={approvalModal.action}
                count={selectedIds.length}
            />

            <RFQFormModal
                isOpen={isRFQModalOpen}
                onClose={() => {
                    setIsRFQModalOpen(false);
                    setSelectedPR(null);
                }}
                initialPR={selectedPR}
            />
        </>
    );
}
