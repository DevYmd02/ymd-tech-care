/**
 * @file QTListPage.tsx
 * @description หน้ารายการใบเสนอราคา (Quotation List)
 * @route /procurement/qt
 */

import { useState, useEffect } from 'react';
import { Search, X, FileText, Calendar, Eye, Edit, RefreshCw, Plus } from 'lucide-react';
import { styles } from '../../../constants';
import { qtService } from '../../../services/qtService';
import type { QTListParams } from '../../../services/qtService';
import type { QTListItem } from '../../../types/qt-types';
import { formatThaiDate } from '../../../utils/dateUtils';

// ====================================================================================
// STATUS BADGE COMPONENT
// ====================================================================================

import { QTStatusBadge } from '../../../components/shared/StatusBadge';
import QTFormModal from './components/QTFormModal';

export default function QTListPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [qtList, setQtList] = useState<QTListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState<QTListParams>({
    quotation_no: '',
    vendor_name: '',
    rfq_no: '',
    status: 'ALL',
    date_from: '',
    date_to: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await qtService.getList(filters);
      setQtList(response.data);
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleSearch = () => {
     // Re-trigger effect by updating state if needed, or just keep it simple. 
     // Currently handleSearch called fetchData which was outside.
     // To fix this properly without infinite loop if we used fetchData as dep:
     // Best pattern:
  };

  const handleClearFilters = () => {
    setFilters({
      quotation_no: '',
      vendor_name: '',
      rfq_no: '',
      status: 'ALL',
      date_from: '',
      date_to: ''
    });
    // Trigger fetch immediately after clear? Or let user click search?
    // Let's trigger fetch for better UX
    setTimeout(fetchData, 0); 
  };

  // Styles
  const inputClass = styles.input.replace('ring-blue-500', 'ring-blue-500'); // Keep blue for standard inputs
  const labelClass = styles.label;

  return (
    <div className={styles.pageContainerCompact}>
      
      {/* HEADER */}
      <div className="bg-blue-600 rounded-lg p-4 shadow-lg mb-6">
        <div className="flex items-center space-x-3">
          <FileText size={24} className="text-white" />
          <div>
            <h1 className="text-xl font-bold text-white">รายการใบเสนอราคา - Vendor Quotation (QT)</h1>
          </div>
        </div>
      </div>

      {/* SEARCH FORM */}
      <div className={`${styles.card} p-4 mb-6`}>
        <div className="flex items-center gap-2 mb-4">
            <Search size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-gray-700 dark:text-white">ฟอร์มค้นหาข้อมูล</h2>
        </div>

        <div className={styles.grid4}>
            {/* QT No */}
            <div>
                <label className={labelClass}>เลขที่ใบเสนอราคา</label>
                <input 
                    type="text" 
                    placeholder="QT-xxx" 
                    className={inputClass}
                    value={filters.quotation_no}
                    onChange={e => setFilters({...filters, quotation_no: e.target.value})}
                />
            </div>

            {/* Vendor */}
            <div>
                <label className={labelClass}>ชื่อผู้ขาย</label>
                <input 
                    type="text" 
                    placeholder="ชื่อผู้ขาย" 
                    className={inputClass}
                    value={filters.vendor_name}
                    onChange={e => setFilters({...filters, vendor_name: e.target.value})}
                />
            </div>

            {/* RFQ Ref */}
            <div>
                <label className={labelClass}>เลขที่ RFQ อ้างอิง</label>
                <input 
                    type="text" 
                    placeholder="RFQ2024-xxx" 
                    className={inputClass}
                    value={filters.rfq_no}
                    onChange={e => setFilters({...filters, rfq_no: e.target.value})}
                />
            </div>

            {/* Status */}
            <div>
                <label className={labelClass}>สถานะ</label>
                <select 
                    className={inputClass}
                    value={filters.status}
                    onChange={e => setFilters({...filters, status: e.target.value})}
                >
                    <option value="ALL">ทั้งหมด</option>
                    <option value="SUBMITTED">ได้รับแล้ว</option>
                    <option value="SELECTED">เทียบราคาแล้ว</option>
                </select>
            </div>

            {/* Date From */}
            <div>
                <label className={labelClass}>วันที่เริ่มต้น</label>
                <div className="relative">
                    <input 
                        type="date" 
                        className={inputClass}
                        value={filters.date_from}
                        onChange={e => setFilters({...filters, date_from: e.target.value})}
                    />
                    <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Date To */}
            <div>
                <label className={labelClass}>วันที่สิ้นสุด</label>
                <div className="relative">
                    <input 
                        type="date" 
                        className={inputClass}
                        value={filters.date_to}
                        onChange={e => setFilters({...filters, date_to: e.target.value})}
                    />
                    <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Buttons */}
            <div className="flex items-end justify-between gap-2 col-span-1 md:col-span-2">
                <div className="flex items-center gap-2">
                    <button onClick={handleSearch} className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md flex items-center justify-center gap-2 transition-colors">
                        <Search size={16} /> ค้นหา
                    </button>
                    <button onClick={handleClearFilters} className="h-10 px-6 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-md flex items-center justify-center gap-2 transition-colors">
                        <X size={16} /> ล้างฟิลเตอร์
                    </button>
                </div>

                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-semibold flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    สร้างใบเสนอราคาใหม่
                </button>
            </div>
        </div>
      </div>

      {/* Tables & Content */}
      {/* ... (Existing Table Code) ... */}
      
      {/* Create Modal */}
      <QTFormModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchData}
      />

      {/* RESULTS TABLE */}
      <div className={styles.tableContainer}>
        {/* Table Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">ผลลัพธ์การค้นหา</h2>
            <span className="text-sm text-gray-500">พบทั้งหมด {qtList.length} รายการ</span>
        </div>

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
                    {isLoading ? (
                        <tr>
                            <td colSpan={12} className="px-2 py-8 text-center text-gray-500 whitespace-nowrap">กำลังโหลดข้อมูล...</td>
                        </tr>
                    ) : qtList.length === 0 ? (
                        <tr>
                            <td colSpan={12} className="px-2 py-8 text-center text-gray-500 whitespace-nowrap">ไม่พบข้อมูล</td>
                        </tr>
                    ) : (
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
                                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-bold rounded shadow transition-colors">
                                                    <RefreshCw size={14} /> ส่งเปรียบเทียบราคา
                                                </button>
                                            </>
                                        )}
                                        
                                        {/* Actions for SELECTED (Compared) are handled by default showing only Eye */}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
