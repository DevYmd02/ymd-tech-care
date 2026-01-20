/**
 * @file VendorList.tsx
 * @description หน้ารายการข้อมูลเจ้าหนี้ (Vendor Master Data List)
 * @purpose แสดงรายการเจ้าหนี้ในรูปแบบตาราง พร้อมค้นหา กรอง และจัดการข้อมูล
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Database,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Filter,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { styles } from '../../../constants';
import { VendorFormModal } from './VendorFormModal';
import { vendorService } from '../../../services/vendorService';
import type { VendorListItem, VendorStatus, VendorListParams } from '../../../types/vendor-types';
import { VendorStatusBadge } from '../../../components/shared';

// ====================================================================================
// COMPONENT
// ====================================================================================

export default function VendorList() {
    const navigate = useNavigate();
    
    // ==================== STATE ====================
    const [vendors, setVendors] = useState<VendorListItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | VendorStatus>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ==================== API CALLS ====================
    
    const fetchVendors = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const params: VendorListParams = {
                page: currentPage,
                limit: rowsPerPage,
                status: statusFilter !== 'ALL' ? statusFilter : undefined,
                search: searchTerm || undefined,
            };
            
            const response = await vendorService.getList(params);
            setVendors(response.data);
            setTotalItems(response.total);
        } catch {
            setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
            setVendors([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, rowsPerPage, statusFilter, searchTerm]);

    // Fetch on mount and when filters change
    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchTerm, rowsPerPage]);

    // ==================== PAGINATION ====================
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;

    // ==================== HANDLERS ====================
    const handleCreateNew = () => {
        setIsModalOpen(true);
    };

    const handleEdit = (vendorId: string) => {
        navigate(`/master-data/vendor?id=${vendorId}`);
    };

    const handleDelete = async (vendorId: string) => {
        if (confirm('คุณต้องการลบข้อมูลเจ้าหนี้นี้หรือไม่?')) {
            const result = await vendorService.delete(vendorId);
            if (result.success) {
                fetchVendors(); // Refresh list
            } else {
                alert(result.message || 'เกิดข้อผิดพลาดในการลบ');
            }
        }
    };

    const handleRefresh = () => {
        fetchVendors();
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        fetchVendors(); // Refresh after modal close
    };



    // ==================== RENDER ====================
    return (
        <div className="p-6 space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Database className="text-blue-600" />
                        ข้อมูลเจ้าหนี้ (Vendor Master)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        จัดการข้อมูลผู้ขายและคู่ค้าทั้งหมด
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="รีเฟรช"
                    >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleCreateNew}
                        className={`${styles.btnPrimary} flex items-center gap-2 whitespace-nowrap`}
                    >
                        <Plus size={20} />
                        เพิ่มเจ้าหนี้ใหม่
                    </button>
                </div>
            </div>

            {/* Search & Filter Section */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, รหัส, หรือเลขภาษี..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`${styles.input} pl-10`}
                        />
                    </div>
                    <div className="relative w-full md:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | VendorStatus)}
                            className={`${styles.inputSelect} pl-10`}
                        >
                            <option value="ALL">สถานะทั้งหมด</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="BLACKLISTED">Blacklisted</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <span className="text-red-700 dark:text-red-400">{error}</span>
                    <button
                        onClick={handleRefresh}
                        className="ml-auto text-red-600 hover:text-red-700 font-medium"
                    >
                        ลองใหม่
                    </button>
                </div>
            )}

            {/* Data Table */}
            <div className={styles.tableContainer}>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</span>
                    </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={styles.tableHeader}>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">รหัส</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">ชื่อเจ้าหนี้</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider hidden lg:table-cell">เลขผู้เสียภาษี</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider hidden md:table-cell">เบอร์โทรศัพท์</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">สถานะ</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {vendors.length > 0 ? (
                                vendors.map((vendor) => (
                                    <tr key={vendor.vendor_id} className={styles.tableTr}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                                            {vendor.vendor_code}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{vendor.vendor_name}</div>
                                            <div className="text-xs text-gray-500">{vendor.vendor_name_en}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                                            {vendor.tax_id || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                            {vendor.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <VendorStatusBadge status={vendor.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleEdit(vendor.vendor_id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="แก้ไข"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(vendor.vendor_id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="ลบ"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        {error ? 'เกิดข้อผิดพลาดในการโหลดข้อมูล' : 'ไม่พบข้อมูลเจ้าหนี้'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                )}

                {/* ========== PAGINATION ========== */}
                {!isLoading && vendors.length > 0 && (
                <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>แสดง</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className={styles.inputSm}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span>รายการ</span>
                        <span className="hidden sm:inline">| {startIndex + 1}-{Math.min(startIndex + rowsPerPage, totalItems)} จาก {totalItems}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronsLeft size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        
                        <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                            หน้า {currentPage} / {totalPages || 1}
                        </span>
                        
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage >= totalPages}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage >= totalPages}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronsRight size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
                )}
            </div>

            {/* Render Modal */}
            <VendorFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose} 
            />
        </div>
    );
}
