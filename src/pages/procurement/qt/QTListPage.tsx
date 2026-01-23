/**
 * @file QTListPage.tsx
 * @description หน้ารายการใบเสนอราคา (Quotation List)
 * @route /procurement/qt
 * @refactored Uses PageListLayout, FilterFormBuilder, useTableFilters, React Query
 */

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FileText, Plus, Eye, Edit, RefreshCw } from 'lucide-react';
import { formatThaiDate } from '../../../utils/dateUtils';
import { styles } from '../../../constants';
import { PageListLayout, FilterFormBuilder, QTStatusBadge } from '../../../components/shared';
import type { FilterFieldConfig } from '../../../components/shared/FilterFormBuilder';
import { useTableFilters, type TableFilters } from '../../../hooks';

// Services & Types
import { qtService } from '../../../services/qtService';
import type { QTListParams } from '../../../services/qtService';
import type { QTListItem, QTStatus } from '../../../types/qt-types';
import QTFormModal from './components/QTFormModal';
import { QCFormModal } from '../qc/components/QCFormModal';

// ====================================================================================
// STATUS OPTIONS
// ====================================================================================

const QT_STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'SUBMITTED', label: 'ได้รับแล้ว' },
    { value: 'SELECTED', label: 'เทียบราคาแล้ว' },
];

// ====================================================================================
// FILTER CONFIG
// ====================================================================================

type QTFilterKeys = keyof TableFilters<QTStatus>;

const QT_FILTER_CONFIG: FilterFieldConfig<QTFilterKeys>[] = [
    { name: 'search', label: 'เลขที่ใบเสนอราคา', type: 'text', placeholder: 'QT-xxx' },
    { name: 'search2', label: 'ชื่อผู้ขาย', type: 'text', placeholder: 'ชื่อผู้ขาย' },
    { name: 'search3', label: 'เลขที่ RFQ อ้างอิง', type: 'text', placeholder: 'RFQ2024-xxx' },
    { name: 'status', label: 'สถานะ', type: 'select', options: QT_STATUS_OPTIONS },
    { name: 'dateFrom', label: 'วันที่เริ่มต้น', type: 'date' },
    { name: 'dateTo', label: 'วันที่สิ้นสุด', type: 'date' },
];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function QTListPage() {
    // URL-based Filter State
    const { filters, setFilters, resetFilters } = useTableFilters<QTStatus>({
        defaultStatus: 'ALL',
    });

    // Convert to API filter format
    const apiFilters: QTListParams = {
        quotation_no: filters.search || undefined,
        vendor_name: filters.search2 || undefined,
        rfq_no: filters.search3 || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
    };

    // Data Fetching with React Query
    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['quotations', apiFilters],
        queryFn: () => qtService.getList(apiFilters),
        placeholderData: keepPreviousData,
    });

    const qtList = data?.data ?? [];

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isQCModalOpen, setIsQCModalOpen] = useState(false);
    const [selectedQTForQC, setSelectedQTForQC] = useState<QTListItem | null>(null);

    // Handlers
    const handleFilterChange = (name: QTFilterKeys, value: string) => {
        setFilters({ [name]: value });
    };

    const handleOpenQCModal = (qt: QTListItem) => {
        setSelectedQTForQC(qt);
        setIsQCModalOpen(true);
    };

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <>
            <PageListLayout
                title="รายการใบเสนอราคา"
                subtitle="Vendor Quotation (QT)"
                icon={FileText}
                accentColor="blue"
                isLoading={isLoading}
                searchForm={
                    <FilterFormBuilder
                        config={QT_FILTER_CONFIG}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onSearch={() => {}} // React Query auto-fetches on filter change
                        onReset={resetFilters}
                        accentColor="blue"
                        columns={{ sm: 2, md: 4, lg: 4 }}
                        actionButtons={
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                            >
                                <Plus size={18} />
                                สร้างใบเสนอราคาใหม่
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
                        <h2 className="text-lg font-bold text-white">รายการใบเสนอราคา</h2>
                        <span className="text-sm text-blue-100">
                            พบทั้งหมด <span className="font-semibold">{data?.total ?? 0}</span> รายการ
                        </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-blue-600 text-white">
                                <tr>
                                    <th className="px-2 py-3 text-left text-xs font-bold uppercase tracking-wider w-10 whitespace-nowrap">ลำดับ</th>
                                    <th className="px-2 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">เลขที่ใบเสนอราคา</th>
                                    <th className="px-2 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">วันที่</th>
                                    <th className="px-2 py-3 text-left text-xs font-bold uppercase tracking-wider">ผู้ขาย</th>
                                    <th className="px-2 py-3 text-left text-xs font-bold uppercase tracking-wider">RFQ อ้างอิง</th>
                                    <th className="px-2 py-3 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap">ยอดรวม</th>
                                    <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">สกุลเงิน</th>
                                    <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">ใช้ได้ถึง</th>
                                    <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">เงื่อนไข</th>
                                    <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">LEAD TIME</th>
                                    <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap sticky right-[180px] z-10 bg-blue-600 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">สถานะ</th>
                                    <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap sticky right-0 z-10 bg-blue-600 w-[180px] min-w-[180px]">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                {qtList.length > 0 ? (
                                    qtList.map((item, index) => (
                                        <tr key={item.quotation_id} className="hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors group">
                                            <td className="px-2 py-3 text-sm text-gray-600 dark:text-gray-300 text-center whitespace-nowrap">{index + 1}</td>
                                            <td className="px-2 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline break-words min-w-[140px]">{item.quotation_no}</td>
                                            <td className="px-2 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatThaiDate(item.quotation_date)}</td>
                                            <td className="px-2 py-3 text-sm text-gray-800 dark:text-gray-200 font-medium break-words max-w-[200px]">
                                                <div>{item.vendor_name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{item.vendor_id}</div>
                                            </td>
                                            <td className="px-2 py-3 text-sm text-purple-600 dark:text-purple-400 cursor-pointer hover:underline break-words min-w-[100px]">{item.rfq_no}</td>
                                            <td className="px-2 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right whitespace-nowrap">
                                                {item.total_amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-2 py-3 text-sm text-gray-600 dark:text-gray-300 text-center whitespace-nowrap">{item.currency_code || 'THB'}</td>
                                            <td className="px-2 py-3 text-sm text-gray-600 dark:text-gray-300 text-center whitespace-nowrap">{item.valid_until ? formatThaiDate(item.valid_until) : '-'}</td>
                                            <td className="px-2 py-3 text-sm text-gray-600 dark:text-gray-300 text-center whitespace-nowrap">{item.payment_term_days ? `${item.payment_term_days} วัน` : '-'}</td>
                                            <td className="px-2 py-3 text-sm text-gray-600 dark:text-gray-300 text-center whitespace-nowrap">{item.lead_time_days ? `${item.lead_time_days} วัน` : '-'}</td>
                                            <td className="px-2 py-3 text-center whitespace-nowrap sticky right-[180px] z-10 bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-gray-800 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                                                <div className="flex justify-center">
                                                    <QTStatusBadge status={item.status} />
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-center whitespace-nowrap sticky right-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-gray-800 w-[180px] min-w-[180px]">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button className="text-gray-500 hover:text-blue-600 transition-colors" title="ดูรายละเอียด"><Eye size={18} /></button>
                                                    
                                                    {/* Actions for SUBMITTED (Received) */}
                                                    {item.status === 'SUBMITTED' && (
                                                        <>
                                                            <button className="text-blue-500 hover:text-blue-700 transition-colors" title="แก้ไข"><Edit size={18} /></button>
                                                            <button 
                                                                onClick={() => handleOpenQCModal(item)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-bold rounded shadow transition-colors"
                                                            >
                                                                <RefreshCw size={14} /> ส่งเปรียบเทียบราคา
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={12} className="px-4 py-12 text-center text-gray-500">
                                            ไม่พบข้อมูลใบเสนอราคา
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageListLayout>

            {/* Modals */}
            <QTFormModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={() => refetch()}
            />

            <QCFormModal
                isOpen={isQCModalOpen}
                onClose={() => {
                    setIsQCModalOpen(false);
                    setSelectedQTForQC(null);
                }}
                initialRFQNo={selectedQTForQC?.rfq_no}
                onSuccess={() => refetch()}
            />
        </>
    );
}
