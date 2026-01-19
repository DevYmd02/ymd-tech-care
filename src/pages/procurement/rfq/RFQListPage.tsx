/**
 * @file RFQListPage.tsx
 * @description หน้ารายการใบขอเสนอราคา (Request for Quotation List)
 * @route /procurement/rfq
 * @refactored ใช้ Shared Components (SummaryCard, RFQStatusBadge) และ usePagination Hook
 */

import { useState, useEffect } from 'react';
import { FileText, Send, Clock, CheckCircle, Plus, Eye } from 'lucide-react';
import { rfqService } from '../../../services/rfqService';
import { getRFQStats } from '../../../__mocks__/rfqMocks';
import { formatThaiDate } from '../../../utils/dateUtils';
import { styles } from '../../../constants';
import { SummaryCard, RFQStatusBadge } from '../../../components/shared';
import { usePagination } from '../../../hooks/usePagination';
import { RFQFormModal } from './components/RFQFormModal';
import type { RFQHeader } from '../../../types/rfq-types';

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function RFQListPage() {
  const [rfqList, setRfqList] = useState<RFQHeader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ใช้ usePagination Hook แทน manual pagination
  const {
    paginatedData: paginatedList,
    currentPage,
    totalPages,
    startItem,
    endItem,
    totalItems,
    setPage,
    nextPage,
    prevPage,
  } = usePagination(rfqList, 10);

  // Fetch RFQ list
  useEffect(() => {
    const fetchRFQList = async () => {
      setIsLoading(true);
      try {
        const response = await rfqService.getList();
        setRfqList(response.data);
      } catch (error) {
        console.error('Failed to fetch RFQ list:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRFQList();
  }, []);

  // Stats
  const stats = getRFQStats(rfqList);

  const handleCreateRFQ = () => {
    setIsModalOpen(true);
  };

  return (
    <div className={styles.pageContainerCompact}>
      {/* ==================== PAGE HEADER ==================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            RFQ - Request for Quotation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            ส่งขอใบเสนอราคาจากผู้ขาย
          </p>
        </div>
        <button
          onClick={handleCreateRFQ}
          className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-md"
        >
          <Plus size={18} />
          สร้าง RFQ
        </button>
      </div>

      {/* ==================== SUMMARY CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="RFQ ทั้งหมด"
          count={stats.total}
          subtitle="รายการ"
          bgColor="bg-pink-50"
          icon={<FileText size={24} />}
        />
        <SummaryCard
          title="ส่งแล้ว"
          count={stats.sent}
          subtitle="รายการ"
          bgColor="bg-blue-50"
          icon={<Send size={24} />}
        />
        <SummaryCard
          title="กำลังดำเนินการ"
          count={stats.inProgress}
          subtitle="รายการ"
          bgColor="bg-yellow-50"
          icon={<Clock size={24} />}
        />
        <SummaryCard
          title="ปิดแล้ว"
          count={stats.closed}
          subtitle="รายการ"
          bgColor="bg-green-50"
          icon={<CheckCircle size={24} />}
        />
      </div>

      {/* ==================== DATA TABLE ==================== */}
      <div className={`${styles.card} overflow-hidden`}>
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            รายการ RFQ ทั้งหมด
          </h2>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</span>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                    เลขที่ RFQ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                    อ้างอิง PR
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                    สาขา
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                    วันที่ออก RFQ
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                    กำหนดส่งราคา
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                    ผู้สร้าง
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                    จำนวนผู้ขาย
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                    สถานะ
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {paginatedList.map((rfq) => (
                  <tr key={rfq.rfq_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-pink-500" />
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                          {rfq.rfq_no}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {rfq.pr_no || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {rfq.branch_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                      {formatThaiDate(rfq.rfq_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium text-red-600">
                      {formatThaiDate(rfq.quote_due_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {rfq.created_by_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{rfq.vendor_responded || 0}/{rfq.vendor_count || 0}</span>
                      <span className="text-xs text-gray-500 ml-1">ตอบกลับ</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <RFQStatusBadge status={rfq.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer - ใช้ usePagination Hook */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            แสดง {startItem} ถึง {endItem} จาก {totalItems} รายการ
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ก่อนหน้า
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setPage(page)}
                className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-yellow-400 text-gray-900'
                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>

      {/* RFQ Form Modal */}
      <RFQFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
