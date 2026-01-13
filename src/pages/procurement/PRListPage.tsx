/**
 * @file PRListPage.tsx
 * @description หน้ารายการใบขอซื้อ (Purchase Requisition List)
 * @route /procurement/pr
 * @purpose แสดงรายการใบขอซื้อทั้งหมด พร้อมฟังก์ชันค้นหา กรองข้อมูล และอนุมัติ
 * 
 * @features
 * - Search & Filter: ค้นหาตามเลขที่, ผู้ขอ, แผนก, สถานะ, วันที่
 * - Batch Approval: เลือกหลายรายการแล้วอนุมัติพร้อมกัน
 * - Approver Info: แสดงผู้อนุมัติที่คาดหวัง และผู้ที่อนุมัติแล้ว
 */

import { useState } from 'react';
import { Search, X, Plus, FileText, Calendar, CheckCircle } from 'lucide-react';
import { PRFormModal } from '../../components/pr-form';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ApprovalModal } from '../../components/shared/ApprovalModal';
import { formatThaiDate, formatDateTime } from '../../utils/dateUtils';
import { styles } from '../../constants';
import { MOCK_PR_LIST } from '../../mocks';
import type { PRItem } from '../../mocks';


// ====================================================================================
// MAIN COMPONENT - PRListPage
// ====================================================================================

export default function PRListPage() {
    // ==================== STATE ====================
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [prList, setPrList] = useState<PRItem[]>(MOCK_PR_LIST);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; action: 'approve' | 'reject' }>({
        isOpen: false,
        action: 'approve'
    });

    // Search filters state
    const [filters, setFilters] = useState({
        doc_no: '',
        requester: '',
        department: '',
        status: 'ทั้งหมด',
        dateFrom: '',
        dateTo: ''
    });

    // ==================== HANDLERS ====================
    const handleSearch = () => {
        console.log('Searching with filters:', filters);
    };

    const handleClearFilters = () => {
        setFilters({
            doc_no: '',
            requester: '',
            department: '',
            status: 'ทั้งหมด',
            dateFrom: '',
            dateTo: ''
        });
    };

    // Checkbox handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const pendingIds = filteredPRList
                .filter(item => item.status === 'รออนุมัติ')
                .map(item => item.id);
            setSelectedIds(pendingIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        }
    };

    // Approval handlers
    const handleApprovalConfirm = (remark: string) => {
        const now = new Date();
        const dateTimeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        setPrList(prList.map(item => {
            if (selectedIds.includes(item.id)) {
                return {
                    ...item,
                    status: 'อนุมัติแล้ว' as const,
                    pendingApprover: undefined,
                    approver: {
                        name: 'ผู้ใช้ปัจจุบัน',
                        position: 'ผจก.ฝ่ายจัดซื้อ',
                        approvedAt: dateTimeStr,
                        remark: remark || undefined
                    }
                };
            }
            return item;
        }));

        setSelectedIds([]);
        setApprovalModal({ isOpen: false, action: 'approve' });
    };

    // ==================== FILTERED DATA ====================
    const filteredPRList = prList.filter(item => {
        if (filters.doc_no && !item.doc_no.toLowerCase().includes(filters.doc_no.toLowerCase())) {
            return false;
        }
        if (filters.requester && !item.requester.toLowerCase().includes(filters.requester.toLowerCase())) {
            return false;
        }
        if (filters.department && !item.department.toLowerCase().includes(filters.department.toLowerCase())) {
            return false;
        }
        if (filters.status !== 'ทั้งหมด' && item.status !== filters.status) {
            return false;
        }
        if (filters.dateFrom) {
            const itemDate = new Date(item.date);
            const fromDate = new Date(filters.dateFrom);
            if (itemDate < fromDate) return false;
        }
        if (filters.dateTo) {
            const itemDate = new Date(item.date);
            const toDate = new Date(filters.dateTo);
            if (itemDate > toDate) return false;
        }
        return true;
    });

    const totalAmount = filteredPRList.reduce((sum, item) => sum + item.totalAmount, 0);
    const pendingCount = filteredPRList.filter(item => item.status === 'รออนุมัติ').length;
    const allPendingSelected = pendingCount > 0 && selectedIds.length === pendingCount;

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
                            placeholder="PR2026-xxx"
                            className={inputClass}
                            value={filters.doc_no}
                            onChange={(e) => setFilters({ ...filters, doc_no: e.target.value })}
                        />
                    </div>

                    {/* ผู้ขอ */}
                    <div>
                        <label className={labelClass}>ผู้ขอ</label>
                        <input
                            type="text"
                            placeholder="ชื่อผู้ขอ"
                            className={inputClass}
                            value={filters.requester}
                            onChange={(e) => setFilters({ ...filters, requester: e.target.value })}
                        />
                    </div>

                    {/* แผนก */}
                    <div>
                        <label className={labelClass}>แผนก</label>
                        <input
                            type="text"
                            placeholder="แผนก"
                            className={inputClass}
                            value={filters.department}
                            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                        />
                    </div>

                    {/* สถานะ */}
                    <div>
                        <label className={labelClass}>สถานะ</label>
                        <select
                            className={inputClass}
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="ทั้งหมด">ทั้งหมด</option>
                            <option value="รออนุมัติ">รออนุมัติ</option>
                            <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                            <option value="ยกเลิก">ยกเลิก</option>
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
                </div>
            </div>

            {/* ==================== BATCH ACTIONS & CREATE BUTTON ==================== */}
            <div className="flex flex-wrap items-center justify-between gap-3">
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

                {/* Create Button */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-md"
                >
                    <Plus size={18} />
                    สร้างใบขอซื้อใหม่
                </button>
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
                    <table className="w-full">
                        <thead className={styles.tableHeader}>
                            <tr>
                                {/* ✅ ปิดไว้ชั่วคราว - Checkbox header
                                <th className="px-3 py-3 text-center w-12">
                                    <input
                                        type="checkbox"
                                        checked={allPendingSelected}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                </th>
                                */}
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider w-16">ลำดับ</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">เลขที่เอกสาร</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">วันที่</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">ผู้ขอซื้อ</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">รออนุมัติจาก</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">สถานะ</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">ยอดรวม (บาท)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredPRList.map((item: PRItem, index: number) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    {/* ✅ ปิดไว้ชั่วคราว - Checkbox cell
                                    <td className="px-3 py-3 text-center">
                                        {item.status === 'รออนุมัติ' ? (
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    */}

                                    {/* ลำดับ */}
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-center">{index + 1}</td>

                                    {/* เลขที่เอกสาร */}
                                    <td className="px-4 py-3">
                                        <a href="#" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                                            {item.doc_no}
                                        </a>
                                    </td>

                                    {/* วันที่ */}
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatThaiDate(item.date)}</td>

                                    {/* ผู้ขอซื้อ */}
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.requester}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">({item.requesterPosition} - {item.department})</div>
                                    </td>

                                    {/* รออนุมัติจาก / ผู้อนุมัติ */}
                                    <td className="px-4 py-3">
                                        {item.status === 'รออนุมัติ' && item.pendingApprover ? (
                                            <div>
                                                <div className="text-sm font-medium text-orange-600 dark:text-orange-400">{item.pendingApprover.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">({item.pendingApprover.position})</div>
                                            </div>
                                        ) : item.approver ? (
                                            <div>
                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.approver.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    ({item.approver.position}) - {formatDateTime(item.approver.approvedAt!)}
                                                </div>
                                                {item.approver.remark && (
                                                    <div className="text-xs text-red-500 italic">"{item.approver.remark}"</div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>

                                    {/* สถานะ */}
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge status={item.status} />
                                    </td>

                                    {/* ยอดรวม */}
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white text-right">
                                        {item.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer - Total */}
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">ยอดรวมทั้งหมด:</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                    </span>
                </div>
            </div>

            {/* ==================== MODALS ==================== */}
            <PRFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

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
