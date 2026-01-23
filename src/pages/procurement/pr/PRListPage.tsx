/**
 * @file PRListPage.tsx
 * @description หน้ารายการใบขอซื้อ (Purchase Requisition List)
 * @route /procurement/pr
 * @refactored Uses PageListLayout, FilterField, useTableFilters, React Query
 */

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Plus, Eye, Edit, Send, CheckCircle, Search, X } from 'lucide-react';
import { formatThaiDate } from '../../../utils/dateUtils';
import { styles } from '../../../constants';
import { PageListLayout, FilterField, ApprovalModal, PRStatusBadge } from '../../../components/shared';
import { useWindowManager } from '../../../hooks/useWindowManager';
import { useTableFilters } from '../../../hooks';
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
    { value: 'SUBMITTED', label: 'ส่งแล้ว' },
    { value: 'IN_APPROVAL', label: 'รออนุมัติ' },
    { value: 'APPROVED', label: 'อนุมัติแล้ว' },
    { value: 'REJECTED', label: 'ปฏิเสธ' },
    { value: 'CANCELLED', label: 'ยกเลิก' },
    { value: 'CONVERTED', label: 'แปลงแล้ว' },
    { value: 'CLOSED', label: 'ปิด' },
];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function PRListPage() {
    // URL-based Filter State
    // search = เลขที่เอกสาร, search2 = ผู้ขอ, search3 = แผนก
    const { 
        filters, 
        handleSearchChange, 
        handleSearch2Change,
        handleSearch3Change,
        handleStatusChange, 
        handleDateRangeChange,
        resetFilters 
    } = useTableFilters<PRStatus>({
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
            refetch(); // Refresh data
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Row 1: 4 filter fields */}
                        {/* เลขที่เอกสาร */}
                        <FilterField
                            label="เลขที่เอกสาร"
                            type="text"
                            value={filters.search}
                            onChange={handleSearchChange}
                            placeholder="PR2024-xxx"
                            accentColor="blue"
                        />
                        
                        {/* ผู้ขอ */}
                        <FilterField
                            label="ผู้ขอ"
                            type="text"
                            value={filters.search2}
                            onChange={handleSearch2Change}
                            placeholder="ชื่อผู้ขอ"
                            accentColor="blue"
                        />

                        {/* แผนก */}
                        <FilterField
                            label="แผนก"
                            type="text"
                            value={filters.search3}
                            onChange={handleSearch3Change}
                            placeholder="แผนก"
                            accentColor="blue"
                        />

                        {/* สถานะ */}
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={filters.status}
                            onChange={(val) => handleStatusChange(val as PRStatus | 'ALL')}
                            options={PR_STATUS_OPTIONS}
                            accentColor="blue"
                        />

                        {/* Row 2: 2 date fields + all action buttons inline */}
                        {/* วันที่เอกสาร จาก */}
                        <FilterField
                            label="วันที่เอกสาร จาก"
                            type="date"
                            value={filters.dateFrom}
                            onChange={(val) => handleDateRangeChange(val, filters.dateTo)}
                            accentColor="blue"
                        />

                        {/* ถึงวันที่ */}
                        <FilterField
                            label="ถึงวันที่"
                            type="date"
                            value={filters.dateTo}
                            onChange={(val) => handleDateRangeChange(filters.dateFrom, val)}
                            accentColor="blue"
                        />

                        {/* Action Buttons - all inline */}
                        <div className="lg:col-span-2 flex items-end justify-end gap-2 flex-wrap sm:flex-nowrap">
                            {/* Batch Approve - Shows when items are selected */}
                            {selectedIds.length > 0 && (
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
                            )}
                            
                            {/* Search Button */}
                            <button
                                type="button"
                                onClick={() => {}}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                            >
                                <Search size={16} />
                                ค้นหา
                            </button>

                            {/* Clear Button */}
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg border border-gray-300 flex items-center gap-2 transition-colors whitespace-nowrap"
                            >
                                <X size={16} />
                                ล้างค่า
                            </button>

                            {/* Create New Button */}
                            <button
                                onClick={() => openWindow('PR')}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                            >
                                <Plus size={18} />
                                สร้างใบขอซื้อใหม่
                            </button>
                        </div>
                    </div>
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

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase w-12">ลำดับ</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">เลขที่เอกสาร</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">วันที่</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">ผู้ขอ</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">แผนก</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">สถานะ</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">จำนวนรายการ</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">ยอดรวม (บาท)</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                {prList.length > 0 ? (
                                    prList.map((item, index) => (
                                        <tr key={item.pr_id} className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-4 py-4 text-gray-600 dark:text-gray-300 text-center">{index + 1}</td>
                                            <td className="px-4 py-4">
                                                <span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                                    {item.pr_no}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                                                {formatThaiDate(item.request_date)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-medium text-gray-700 dark:text-gray-200">{item.requester_name}</div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-600 dark:text-gray-300">
                                                {item.purpose || '-'}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <PRStatusBadge status={item.status as PRStatus} />
                                            </td>
                                            <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-300">
                                                {item.lines?.length || 0}
                                            </td>
                                            <td className="px-4 py-4 font-semibold text-gray-800 dark:text-gray-200 text-right">
                                                {item.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="ดูรายละเอียด">
                                                        <Eye size={18} />
                                                    </button>
                                                    
                                                    {item.status === 'APPROVED' ? (
                                                        <button 
                                                            onClick={() => handleCreateRFQ(item)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm transition-colors flex items-center gap-1"
                                                        >
                                                            <FileText size={14} /> สร้าง RFQ
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button className="text-orange-500 hover:text-orange-700 transition-colors" title="แก้ไข">
                                                                <Edit size={18} />
                                                            </button>
                                                            <button className="text-blue-500 hover:text-blue-700 transition-colors" title="ส่ง">
                                                                <Send size={18} />
                                                            </button>
                                                        </>
                                                    )}
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
