/**
 * @file RFQListPage.tsx
 * @description หน้ารายการขอใบเสนอราคา (Request for Quotation List)
 * @route /procurement/rfq
 * @refactored ปรับ UI ตาม Reference Image ที่ user ส่งมา
 */

import { useState, useEffect } from 'react';
import { FileText, Search, X, Plus } from 'lucide-react';
import { rfqService } from '../../../services/rfqService';
import { formatThaiDate } from '../../../utils/dateUtils';
import { styles } from '../../../constants';
import { RFQStatusBadge } from '../../../components/shared';
import { useWindowManager } from '../../../hooks/useWindowManager';
import type { RFQHeader, RFQFilterCriteria } from '../../../types/rfq-types';

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function RFQListPage() {
    const [rfqList, setRfqList] = useState<RFQHeader[]>([]);
    const [filteredList, setFilteredList] = useState<RFQHeader[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Window Manager
    const { openWindow } = useWindowManager();
    
    // Filter state
    const [filters, setFilters] = useState<RFQFilterCriteria>({
        rfq_no: '',
        pr_no: '',
        created_by_name: '',
        status: 'ALL',
        date_from: '',
        date_to: '',
    });

    // Fetch RFQ list
    useEffect(() => {
        const fetchRFQList = async () => {
            setIsLoading(true);
            try {
                const response = await rfqService.getList();
                setRfqList(response.data);
                setFilteredList(response.data);
            } catch (error) {
                console.error('Failed to fetch RFQ list:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRFQList();
    }, []);

    // Handle search
    const handleSearch = () => {
        let result = [...rfqList];
        
        if (filters.rfq_no) {
            result = result.filter(r => r.rfq_no.toLowerCase().includes(filters.rfq_no!.toLowerCase()));
        }
        if (filters.pr_no) {
            result = result.filter(r => r.pr_no?.toLowerCase().includes(filters.pr_no!.toLowerCase()));
        }
        if (filters.created_by_name) {
            result = result.filter(r => r.created_by_name?.toLowerCase().includes(filters.created_by_name!.toLowerCase()));
        }
        if (filters.status && filters.status !== 'ALL') {
            result = result.filter(r => r.status === filters.status);
        }
        // Date filters could be added here
        
        setFilteredList(result);
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setFilters({
            rfq_no: '',
            pr_no: '',
            created_by_name: '',
            status: 'ALL',
            date_from: '',
            date_to: '',
        });
        setFilteredList(rfqList);
    };

    // Handle filter change
    const handleFilterChange = (field: keyof RFQFilterCriteria, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className={styles.pageContainer}>
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-lg p-4 flex items-center gap-3 shadow-md">
                <FileText size={24} className="text-white" />
                <h1 className="text-lg font-semibold text-white">ใบขอเสนอราคา - Request for Quotation (RFQ)</h1>
            </div>

            {/* Search Form Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-4">
                    <Search size={18} />
                    <span className="font-medium">ฟอร์มค้นหาข้อมูล</span>
                </div>

                {/* Filter Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* เลขที่ RFQ */}
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">เลขที่ RFQ</label>
                        <input
                            type="text"
                            placeholder="RFQ2024-xxx"
                            value={filters.rfq_no}
                            onChange={(e) => handleFilterChange('rfq_no', e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    
                    {/* เลขที่ PR อ้างอิง */}
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">เลขที่ PR อ้างอิง</label>
                        <input
                            type="text"
                            placeholder="PR2024-xxx"
                            value={filters.pr_no}
                            onChange={(e) => handleFilterChange('pr_no', e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    
                    {/* ผู้สร้าง RFQ */}
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">ผู้สร้าง RFQ</label>
                        <input
                            type="text"
                            placeholder="ชื่อผู้สร้าง"
                            value={filters.created_by_name}
                            onChange={(e) => handleFilterChange('created_by_name', e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    
                    {/* สถานะ */}
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">สถานะ</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className={styles.inputSelect}
                        >
                            <option value="ALL">ทั้งหมด</option>
                            <option value="DRAFT">แบบร่าง</option>
                            <option value="SENT">ส่งแล้ว</option>
                            <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                            <option value="CLOSED">ปิดแล้ว</option>
                            <option value="CANCELLED">ยกเลิก</option>
                        </select>
                    </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">วันที่เริ่มต้น</label>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(e) => handleFilterChange('date_from', e.target.value)}
                            className={styles.input}
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">วันที่สิ้นสุด</label>
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(e) => handleFilterChange('date_to', e.target.value)}
                            className={styles.input}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={handleSearch}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                        >
                            <Search size={16} />
                            ค้นหา
                        </button>
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X size={16} />
                            ล้างฟิลเตอร์
                        </button>
                    </div>
                    
                    <button
                        onClick={() => openWindow('RFQ')}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-md"
                    >
                        <Plus size={16} />
                        สร้าง RFQ ใหม่
                    </button>
                </div>
            </div>

            {/* Results Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Results Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">ผลลัพธ์การค้นหา</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        พบทั้งหมด <span className="font-semibold text-teal-600">{filteredList.length}</span> รายการ
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                            <span className="ml-3 text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</span>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-blue-600 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">ลำดับ</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">เลขที่ RFQ</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">วันที่สร้าง</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">PR อ้างอิง</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">ผู้สร้าง</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase">สถานะ</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">ใช้ได้ถึงวันที่</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredList.length > 0 ? (
                                    filteredList.map((rfq, index) => (
                                        <tr key={rfq.rfq_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-semibold text-teal-600 hover:underline cursor-pointer">
                                                    {rfq.rfq_no}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {formatThaiDate(rfq.rfq_date)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer">
                                                    {rfq.pr_no || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {rfq.created_by_name || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <RFQStatusBadge status={rfq.status} />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {rfq.quote_due_date ? formatThaiDate(rfq.quote_due_date) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                            ไม่พบข้อมูล RFQ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
}
