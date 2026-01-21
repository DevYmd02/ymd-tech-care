/**
 * @file QCListPage.tsx
 * @description หน้ารายการใบเปรียบเทียบราคา - Quote Comparison Master (QC)
 * @route /procurement/qc
 */

import { useState, useEffect } from 'react';
import { Search, X, Calendar, Plus } from 'lucide-react';
import { styles } from '../../../constants';
import { qcService } from '../../../services/qcService';
import type { QCListParams } from '../../../services/qcService';
import type { QCListItem } from '../../../types/qc-types';
import { formatThaiDate } from '../../../utils/dateUtils';

// ====================================================================================
// STATUS BADGE COMPONENT
// ====================================================================================

const QCStatusBadge = ({ status }: { status: string }) => {
  let className = 'px-3 py-1 rounded-full text-xs font-semibold';
  let label = status;

  switch (status.toUpperCase()) {
    case 'APPROVED':
      className += ' bg-emerald-100 text-emerald-700';
      label = 'Approved';
      break;
    case 'SUBMITTED':
      className += ' bg-blue-100 text-blue-700';
      label = 'Submitted';
      break;
    case 'DRAFT':
    default:
      className += ' bg-gray-100 text-gray-700';
      label = 'Draft';
      break;
  }

  return <span className={className}>{label}</span>;
};

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function QCListPage() {
  const [qcList, setQcList] = useState<QCListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState<QCListParams>({
    qc_no: '',
    pr_no: '',
    status: 'ALL',
    date_from: '',
    date_to: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await qcService.getList(filters);
      setQcList(response.data);
    } catch (error) {
      console.error('Failed to fetch QC list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleSearch = () => {
    // fetchData is triggered by useEffect on filters change, 
    // but if we want manual trigger logic, we can keep this empty or manage state differently.
    // For now, simple re-fetch pattern via effect is sufficient.
  };

  const handleClearFilters = () => {
    setFilters({
      qc_no: '',
      pr_no: '',
      status: 'ALL',
      date_from: '',
      date_to: ''
    });
  };

  // Styles
  const inputClass = styles.input.replace('ring-blue-500', 'ring-blue-500'); 
  const labelClass = styles.label;

  return (
    <div className={styles.pageContainerCompact}>
      
      {/* HEADER */}
      <div className="bg-blue-600 rounded-lg p-4 shadow-lg mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
             {/* Scale icon substitute */}
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">รายการใบเปรียบเทียบราคา - Quote Comparison Master (QC)</h1>
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
            {/* QC No */}
            <div>
                <label className={labelClass}>เลขที่ใบ QC</label>
                <input 
                    type="text" 
                    placeholder="QC2024-xxx" 
                    className={inputClass}
                    value={filters.qc_no}
                    onChange={e => setFilters({...filters, qc_no: e.target.value})}
                />
            </div>

            {/* PR Ref */}
            <div>
                <label className={labelClass}>เลขที่ PR อ้างอิง</label>
                <input 
                    type="text" 
                    placeholder="PR2024-xxx" 
                    className={inputClass}
                    value={filters.pr_no}
                    onChange={e => setFilters({...filters, pr_no: e.target.value})}
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
                    <option value="DRAFT">Draft</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="APPROVED">Approved</option>
                </select>
            </div>

             {/* Spacer for 4th column on large screens to force next row */ }
             <div className="hidden lg:block"></div>

            {/* Date From */}
            <div>
                <label className={labelClass}>วันที่สร้าง จาก</label>
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
                <label className={labelClass}>ถึงวันที่</label>
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

            {/* Buttons: Search & Clear */}
            <div className="flex items-end gap-2">
                <button onClick={handleSearch} className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md flex items-center justify-center gap-2 transition-colors">
                    <Search size={16} /> ค้นหา
                </button>
                <button onClick={handleClearFilters} className="h-10 px-4 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                    <X size={16} /> ล้างค่า
                </button>
            </div>
            
            {/* Create Button */}
            <div className="flex items-end justify-end border-gray-100 dark:border-gray-700">
                <button 
                    onClick={() => { /* Handle Create Logic */ }}
                    className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-semibold flex items-center gap-2 transition-colors shadow-sm w-full justify-center whitespace-nowrap"
                >
                    <Plus size={18} />
                    สร้างใบเปรียบเทียบราคาใหม่
                </button>
            </div>
        </div>
      </div>

      {/* RESULTS TABLE */}
      <div className={styles.tableContainer}>
        {/* Table Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-600">
            <div className="flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
                 <h2 className="text-base font-bold text-white">รายการใบเปรียบเทียบราคา (Quote Comparison)</h2>
            </div>
            <span className="text-sm text-blue-100">พบ {qcList.length} รายการ</span>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">ลำดับ</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            เลขที่ใบ QC<br/>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            วันที่สร้าง<br/>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            เลขที่ PR อ้างอิง<br/>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            สถานะ<br/>
                        </th>
                         <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            จำนวน Vendors
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            ผู้เสนอราคาต่ำสุด
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            ราคาต่ำสุด (บาท)
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {isLoading ? (
                        <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-gray-500">กำลังโหลดข้อมูล...</td>
                        </tr>
                    ) : qcList.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-gray-500">ไม่พบข้อมูล</td>
                        </tr>
                    ) : (
                        qcList.map((item, index) => (
                            <tr key={item.qc_id} className="hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-center">{index + 1}</td>
                                
                                <td className="px-4 py-3">
                                    <a href="#" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline">
                                        {item.qc_no}
                                    </a>
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                    {formatThaiDate(item.created_at)}
                                </td>

                                <td className="px-4 py-3 text-sm font-medium text-blue-500 dark:text-blue-300">
                                    {item.pr_no}
                                </td>

                                <td className="px-4 py-3 text-center">
                                    <QCStatusBadge status={item.status} />
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-center">
                                    {item.vendor_count}
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                                    {item.lowest_bidder_name}
                                </td>

                                <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-white text-right">
                                    {item.lowest_bid_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
