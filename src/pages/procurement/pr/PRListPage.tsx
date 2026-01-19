/**
 * @file PRListPage.tsx
 * @description หน้ารายการใบขอซื้อ (Purchase Requisition List) - เชื่อมต่อกับ Backend API
 * @route /procurement/pr
 * @purpose แสดงรายการใบขอซื้อทั้งหมด พร้อมฟังก์ชันค้นหา กรองข้อมูล และอนุมัติ
 * 
 * @features
 * - Search & Filter: ค้นหาตามเลขที่, ผู้ขอ, สถานะ, วันที่
 * - Status: แสดงสถานะตาม Database Schema (DRAFT, SUBMITTED, IN_APPROVAL, etc.)
 * - Approval Info: แสดงผู้อนุมัติจาก approval_tasks
 */

import { useState, useEffect } from 'react';
import { Search, X, Plus, FileText, Calendar, CheckCircle } from 'lucide-react';
import { useWindowManager } from '../../../hooks/useWindowManager';
import { ApprovalModal, PRStatusBadge } from '../../../components/shared';
import { formatThaiDate } from '../../../utils/dateUtils';
import { styles } from '../../../constants';
import { prService } from '../../../services/prService';
import { masterDataService } from '../../../services/masterDataService';
import type { PRHeader, PRStatus } from '../../../types/pr-types';
import type { CostCenter } from '../../../types/master-data-types';

// ====================================================================================
// STATUS UTILITIES - ใช้ shared PRStatusBadge แทน local component
// ====================================================================================

// ====================================================================================
// STATUS UTILITIES - ใช้ shared PRStatusBadge แทน local component
// ====================================================================================

// Helper to find cost center name from list
const findCostCenterName = (costCenters: CostCenter[], id: string): string => {
  const cc = costCenters.find(c => c.cost_center_id === id);
  return cc ? cc.cost_center_name : '-';
};

// ====================================================================================
// MAIN COMPONENT - PRListPage
// ====================================================================================

export default function PRListPage() {
  // ==================== STATE ====================
  const { openWindow } = useWindowManager();
  const [prList, setPrList] = useState<PRHeader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; action: 'approve' | 'reject' }>({
    isOpen: false,
    action: 'approve'
  });

  // Search filters state
  const [filters, setFilters] = useState({
    pr_no: '',
    requester_name: '',
    status: 'ALL' as PRStatus | 'ALL',
    dateFrom: '',
    dateTo: ''
  });

  // ==================== FETCH DATA FROM API ====================
  // ==================== FETCH DATA FROM API ====================
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prResponse, ccList] = await Promise.all([
          prService.getList(),
          masterDataService.getCostCenters()
        ]);
        setPrList(prResponse.data);
        setCostCenters(ccList);
      } catch (error) {
        void error; // TODO: Implement proper error handling/UI feedback
        console.error('Failed to fetch data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ==================== HANDLERS ====================
  const handleSearch = () => {
    // TODO: Implement search with API call using filters
  };

  const handleClearFilters = () => {
    setFilters({
      pr_no: '',
      requester_name: '',
      status: 'ALL',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Checkbox handlers (ปิดไว้ชั่วคราว - จะเปิดใช้เมื่อเพิ่ม checkbox ใน table)
  // const handleSelectAll = (checked: boolean) => { ... };
  // const handleSelectOne = (id: string, checked: boolean) => { ... };

  // Approval handlers
  const handleApprovalConfirm = (remark: string) => {
    const now = new Date().toISOString();

    setPrList(prList.map(item => {
      if (selectedIds.includes(item.pr_id)) {
        return {
          ...item,
          status: 'APPROVED' as PRStatus,
          updated_at: now,
          approval_tasks: [
            ...(item.approval_tasks || []),
            {
              task_id: `task-${Date.now()}`,
              document_type: 'PR' as const,
              document_id: item.pr_id,
              document_no: item.pr_no,
              approver_user_id: 'current-user',
              approver_name: 'ผู้ใช้ปัจจุบัน',
              approver_position: 'ผจก.ฝ่ายจัดซื้อ',
              status: 'APPROVED' as const,
              created_at: now,
              approved_at: now,
              remark: remark || undefined,
            }
          ]
        };
      }
      return item;
    }));

    setSelectedIds([]);
    setApprovalModal({ isOpen: false, action: 'approve' });
  };

  // ==================== FILTERED DATA ====================
  const filteredPRList = prList.filter(item => {
    if (filters.pr_no && !item.pr_no.toLowerCase().includes(filters.pr_no.toLowerCase())) {
      return false;
    }
    if (filters.requester_name && !item.requester_name.toLowerCase().includes(filters.requester_name.toLowerCase())) {
      return false;
    }
    if (filters.status !== 'ALL' && item.status !== filters.status) {
      return false;
    }
    if (filters.dateFrom) {
      const itemDate = new Date(item.request_date);
      const fromDate = new Date(filters.dateFrom);
      if (itemDate < fromDate) return false;
    }
    if (filters.dateTo) {
      const itemDate = new Date(item.request_date);
      const toDate = new Date(filters.dateTo);
      if (itemDate > toDate) return false;
    }
    return true;
  });

  const totalAmount = filteredPRList.reduce((sum, item) => sum + item.total_amount, 0);
  // Checkbox state (ปิดไว้ชั่วคราว)
  // const pendingCount = filteredPRList.filter(item => item.status === 'IN_APPROVAL' || item.status === 'SUBMITTED').length;
  // const allPendingSelected = pendingCount > 0 && selectedIds.length === pendingCount;

  // ==================== STYLE CLASSES ====================
  const inputClass = styles.input.replace('ring-blue-500', 'ring-emerald-500');
  const labelClass = styles.label;

  // ==================== RENDER ====================
  return (
    <div className={styles.pageContainerCompact}>

      {/* ==================== PAGE HEADER ==================== */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <FileText size={24} className="text-white" />
          <div>
            <h1 className="text-xl font-bold text-white">รายการใบขอซื้อ</h1>
            <p className="text-emerald-100 text-sm">Purchase Requisition List</p>
          </div>
        </div>
      </div>

      {/* ==================== SEARCH FORM ==================== */}
      <div className={`${styles.card} p-4`}>
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} className="text-emerald-600" />
          <h2 className="text-base font-bold text-gray-700 dark:text-white">ฟอร์มค้นหาข้อมูล</h2>
        </div>

        <div className={styles.grid4}>
          {/* เลขที่เอกสาร */}
          <div>
            <label className={labelClass}>เลขที่เอกสาร</label>
            <input
              type="text"
              placeholder="PR-202601-xxxx"
              className={inputClass}
              value={filters.pr_no}
              onChange={(e) => setFilters({ ...filters, pr_no: e.target.value })}
            />
          </div>

          {/* ผู้ขอ */}
          <div>
            <label className={labelClass}>ผู้ขอ</label>
            <input
              type="text"
              placeholder="ชื่อผู้ขอ"
              className={inputClass}
              value={filters.requester_name}
              onChange={(e) => setFilters({ ...filters, requester_name: e.target.value })}
            />
          </div>

          {/* สถานะ */}
          <div>
            <label className={labelClass}>สถานะ</label>
            <select
              className={inputClass}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as PRStatus | 'ALL' })}
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="DRAFT">ร่าง</option>
              <option value="SUBMITTED">ส่งแล้ว</option>
              <option value="IN_APPROVAL">รออนุมัติ</option>
              <option value="APPROVED">อนุมัติแล้ว</option>
              <option value="REJECTED">ปฏิเสธ</option>
              <option value="CANCELLED">ยกเลิก</option>
              <option value="CONVERTED">แปลงแล้ว</option>
              <option value="CLOSED">ปิด</option>
            </select>
          </div>

          {/* วันที่เอกสาร จาก */}
          <div>
            <label className={labelClass}>วันที่เอกสาร จาก</label>
            <div className="relative">
              <input
                type="date"
                className={inputClass}
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
              <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* ถึงวันที่ */}
          <div>
            <label className={labelClass}>ถึงวันที่</label>
            <div className="relative">
              <input
                type="date"
                className={inputClass}
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
              <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-2 col-span-1 md:col-span-2">
            <button
              onClick={handleSearch}
              className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md flex items-center justify-center gap-2 transition-colors"
            >
              <Search size={16} />
              ค้นหา
            </button>
            <button
              onClick={handleClearFilters}
              className="flex-1 h-10 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold rounded-md flex items-center justify-center gap-2 transition-colors"
            >
              <X size={16} />
              ล้างค่า
            </button>
          </div>
          
          {/* Create Button - Right Aligned in Grid */}
          <div className="flex items-end justify-end col-span-1 border-gray-100 dark:border-gray-700">
            <button
              onClick={() => openWindow('PR')}
              className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold flex items-center gap-2 transition-colors shadow-sm w-full md:w-auto justify-center"
            >
              <Plus size={18} />
              สร้างใบขอซื้อใหม่
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Batch Actions */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                เลือก <strong>{selectedIds.length}</strong> รายการ
              </span>
              <button
                onClick={() => setApprovalModal({ isOpen: true, action: 'approve' })}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
              >
                <CheckCircle size={16} />
                อนุมัติที่เลือก
              </button>
            </>
          )}
        </div>
      </div>

      {/* ==================== DATA TABLE ==================== */}
      <div className={`${styles.tableContainer}`}>

        {/* Table Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-white" />
            <h2 className="text-base font-bold text-white">รายการใบขอซื้อ</h2>
          </div>
          <span className="text-sm text-blue-100">พบ {filteredPRList.length} รายการ</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</span>
            </div>
          ) : (
          <table className="w-full">
            <thead className={styles.tableHeader}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider w-16">ลำดับ</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">เลขที่เอกสาร</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">วันที่ขอ</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">ผู้ขอซื้อ</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">ศูนย์ต้นทุน</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">วัตถุประสงค์</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">สถานะ</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">ยอดรวม (บาท)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredPRList.map((item: PRHeader, index: number) => (
                <tr key={item.pr_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {/* ลำดับ */}
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-center">{index + 1}</td>

                  {/* เลขที่เอกสาร */}
                  <td className="px-4 py-3">
                    <a href="#" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                      {item.pr_no}
                    </a>
                  </td>

                  {/* วันที่ขอ */}
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {formatThaiDate(item.request_date)}
                  </td>

                  {/* ผู้ขอซื้อ */}
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.requester_name}</div>
                  </td>

                  {/* ศูนย์ต้นทุน */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {findCostCenterName(costCenters, item.cost_center_id)}
                    </div>
                  </td>

                  {/* วัตถุประสงค์ */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[200px]" title={item.purpose}>
                      {item.purpose}
                    </div>
                  </td>

                  {/* สถานะ */}
                  <td className="px-4 py-3 text-center">
                    <PRStatusBadge status={item.status} />
                  </td>

                  {/* ยอดรวม */}
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white text-right">
                    {item.total_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        {/* Table Footer - Total */}
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">ยอดรวมทั้งหมด:</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
          </span>
        </div>
      </div>



      <ApprovalModal
        isOpen={approvalModal.isOpen}
        onClose={() => setApprovalModal({ isOpen: false, action: 'approve' })}
        onConfirm={handleApprovalConfirm}
        action={approvalModal.action}
        count={selectedIds.length}
      />

    </div>
  );
}
