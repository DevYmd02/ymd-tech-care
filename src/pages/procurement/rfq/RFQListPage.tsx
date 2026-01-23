/**
 * @file RFQListPage.tsx
 * @description หน้ารายการขอใบเสนอราคา (Request for Quotation List)
 * @route /procurement/rfq
 * @refactored Uses PageListLayout, FilterField, React Query, and URL-based filters
 */

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Plus, Eye, Send, Search, X } from 'lucide-react';
import { formatThaiDate } from '../../../utils/dateUtils';
import { styles } from '../../../constants';
import { PageListLayout, FilterField, RFQStatusBadge } from '../../../components/shared';
import { useWindowManager } from '../../../hooks/useWindowManager';
import { useTableFilters } from '../../../hooks';
import QTFormModal from '../qt/components/QTFormModal';

// Services & Types
import { rfqService } from '../../../services/rfqService';
import type { RFQHeader, RFQStatus, RFQFilterCriteria } from '../../../types/rfq-types';

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
// MAIN COMPONENT
// ====================================================================================

export default function RFQListPage() {
    // URL-based Filter State
    // search = เลขที่ RFQ, search2 = เลขที่ PR อ้างอิง, search3 = ผู้สร้าง RFQ
    const { 
        filters, 
        handleSearchChange, 
        handleSearch2Change,
        handleSearch3Change,
        handleStatusChange, 
        handleDateRangeChange,
        resetFilters 
    } = useTableFilters<RFQStatus>({
        defaultStatus: 'ALL',
    });

    // Convert to API filter format
    const apiFilters: RFQFilterCriteria = {
        rfq_no: filters.search || undefined,
        pr_no: filters.search2 || undefined,
        created_by_name: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
    };

    // Data Fetching with React Query
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['rfqs', apiFilters],
        queryFn: () => rfqService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    // QT Modal State
    const [isQTModalOpen, setIsQTModalOpen] = useState(false);
    const [selectedRFQForQT, setSelectedRFQForQT] = useState<RFQHeader | null>(null);
    
    // Window Manager
    const { openWindow } = useWindowManager();

    // Handlers
    const handleOpenQT = (rfq: RFQHeader) => {
        setSelectedRFQForQT(rfq);
        setIsQTModalOpen(true);
    };

    const rfqList = data?.data ?? [];

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <>
            <PageListLayout
                title="รายการใบขอเสนอราคา"
                subtitle="Request for Quotation (RFQ)"
                icon={FileText}
                accentColor="teal"
                isLoading={isLoading}
                searchForm={
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Row 1 */}
                        {/* เลขที่ RFQ */}
                        <FilterField
                            label="เลขที่ RFQ"
                            type="text"
                            value={filters.search}
                            onChange={handleSearchChange}
                            placeholder="RFQ2024-xxx"
                            accentColor="teal"
                        />
                        
                        {/* เลขที่ PR อ้างอิง */}
                        <FilterField
                            label="เลขที่ PR อ้างอิง"
                            type="text"
                            value={filters.search2}
                            onChange={handleSearch2Change}
                            placeholder="PR2024-xxx"
                            accentColor="teal"
                        />

                        {/* ผู้สร้าง RFQ */}
                        <FilterField
                            label="ผู้สร้าง RFQ"
                            type="text"
                            value={filters.search3}
                            onChange={handleSearch3Change}
                            placeholder="ชื่อผู้สร้าง"
                            accentColor="teal"
                        />

                        {/* สถานะ */}
                        <FilterField
                            label="สถานะ"
                            type="select"
                            value={filters.status}
                            onChange={(val) => handleStatusChange(val as RFQStatus | 'ALL')}
                            options={RFQ_STATUS_OPTIONS}
                            accentColor="teal"
                        />

                        {/* Row 2 */}
                        {/* วันที่เริ่มต้น */}
                        <FilterField
                            label="วันที่เริ่มต้น"
                            type="date"
                            value={filters.dateFrom}
                            onChange={(val) => handleDateRangeChange(val, filters.dateTo)}
                            accentColor="teal"
                        />

                        {/* วันที่สิ้นสุด */}
                        <FilterField
                            label="วันที่สิ้นสุด"
                            type="date"
                            value={filters.dateTo}
                            onChange={(val) => handleDateRangeChange(filters.dateFrom, val)}
                            accentColor="teal"
                        />

                        {/* Action Buttons - inline */}
                        <div className="lg:col-span-2 flex items-end justify-end gap-2 flex-wrap sm:flex-nowrap">
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

                            {/* Create Button */}
                            <button
                                onClick={() => openWindow('RFQ')}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                            >
                                <Plus size={18} />
                                สร้าง RFQ ใหม่
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
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600" />
                        </div>
                    )}

                    {/* Results Header */}
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-teal-600">
                        <h2 className="text-lg font-bold text-white">ผลลัพธ์การค้นหา</h2>
                        <span className="text-sm text-teal-100">
                            พบทั้งหมด <span className="font-semibold">{data?.total ?? 0}</span> รายการ
                        </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase w-12">ลำดับ</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">เลขที่ RFQ</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">วันที่สร้าง</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">PR อ้างอิง</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">ผู้สร้าง</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">สถานะ</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">ใช้ได้ถึงวันที่</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">จน.เจ้าหนี้</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                {rfqList.length > 0 ? (
                                    rfqList.map((rfq, index) => (
                                        <tr key={rfq.rfq_id} className="hover:bg-teal-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-4 py-4 text-gray-500 dark:text-gray-400 text-center">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-semibold text-teal-600 hover:text-teal-800 hover:underline cursor-pointer">
                                                    {rfq.rfq_no}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                                                {formatThaiDate(rfq.rfq_date)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-semibold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer">
                                                    {rfq.pr_no || '-'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-gray-700 dark:text-gray-300">
                                                {rfq.created_by_name || '-'}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex justify-center">
                                                    <RFQStatusBadge status={rfq.status} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                                                {formatThaiDate(rfq.quote_due_date || '')}
                                            </td>
                                            <td className="px-4 py-4 text-center font-medium text-gray-700 dark:text-gray-300">
                                                {rfq.vendor_count} ราย
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button className="text-gray-500 hover:text-gray-700 transition-colors" title="ดูรายละเอียด">
                                                        <Eye size={20} />
                                                    </button>
                                                    
                                                    {rfq.status === 'DRAFT' && (
                                                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded shadow transition-colors">
                                                            <Send size={14} /> ส่ง RFQ
                                                        </button>
                                                    )}

                                                    {rfq.status === 'SENT' && (
                                                        <button 
                                                            onClick={() => handleOpenQT(rfq)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded shadow transition-colors"
                                                        >
                                                            <FileText size={14} /> บันทึกราคา
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                                            ไม่พบข้อมูล RFQ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageListLayout>

            {/* QT Form Modal */}
            <QTFormModal
                isOpen={isQTModalOpen}
                onClose={() => {
                    setIsQTModalOpen(false);
                    setSelectedRFQForQT(null);
                }}
                initialRFQ={selectedRFQForQT}
            />
        </>
    );
}
