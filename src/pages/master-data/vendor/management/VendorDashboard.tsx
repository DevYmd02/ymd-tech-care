/**
 * @file VendorDashboard.tsx
 * @description หน้ารายการเจ้าหนี้/ซัพพลายเออร์
 * @purpose แสดงรายการเจ้าหนี้พร้อม Summary Cards, Search/Filter และ Table
 * @reference Based on user's reference image design
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Star,
    FileText,
    TrendingUp,
    Plus,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';
import { styles } from '../../../../constants';

import { VendorService } from '@/services/procurement/vendor.service';
import type { VendorListItem, VendorStatus } from '../../../../types/vendor-types';
import { VendorStatusBadge } from '@ui/StatusBadge';

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function VendorDashboard() {
    const navigate = useNavigate();
    
    // States
    const [vendors, setVendors] = useState<VendorListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | VendorStatus>('ALL');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'COMPANY' | 'INDIVIDUAL' | 'GOVERNMENT'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Stats - Mock values for demo (will use real data when API provides these fields)
    const stats = {
        totalVendors: vendors.length,
        activeVendors: vendors.filter(v => v.status === 'ACTIVE').length,
        ratingA: Math.floor(vendors.length * 0.5), // Mock
        suspended: vendors.filter(v => v.status === 'SUSPENDED').length,
        totalPurchase: 68900000, // Mock value
    };

    // Fetch Data
    const fetchVendors = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await VendorService.getList();
            setVendors(response.data);
        } catch {
            setVendors([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    // Filtered vendors
    const filteredVendors = vendors.filter(v => {
        const matchesSearch = !searchTerm || 
            v.vendor_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.tax_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredVendors.length / rowsPerPage);
    const paginatedVendors = filteredVendors.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // Handlers
    const handleCreateNew = () => {
        navigate('/master-data/vendor/form');
    };



    const handleEdit = (vendorId: string) => {
        navigate(`/master-data/vendor/form?id=${vendorId}`);
    };

    const handleExportExcel = () => {
        // TODO: Implement export functionality
        alert('Export to Excel - Coming soon!');
    };



    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                        รายการเจ้าหนี้/ซัพพลายเออร์
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        จัดการข้อมูลเจ้าหนี้และซัพพลายเออร์ทั้งหมด
                    </p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className={`${styles.btnPrimary} flex items-center gap-2`}
                >
                    <Plus size={20} />
                    เพิ่มเจ้าหนี้ใหม่
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Active Vendors */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-green-600 dark:text-green-400">Active Vendors</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{stats.activeVendors}</p>
                        </div>
                        <div className="p-2 bg-green-200 dark:bg-green-800/50 rounded-lg">
                            <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                {/* Rating A */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Rating A</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{stats.ratingA}</p>
                        </div>
                        <div className="p-2 bg-blue-200 dark:bg-blue-800/50 rounded-lg">
                            <Star size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                {/* Total Vendors */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Total Vendors</p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{stats.totalVendors}</p>
                        </div>
                        <div className="p-2 bg-purple-200 dark:bg-purple-800/50 rounded-lg">
                            <FileText size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>

                {/* Suspended */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Suspended</p>
                            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">{stats.suspended}</p>
                        </div>
                        <div className="p-2 bg-orange-200 dark:bg-orange-800/50 rounded-lg">
                            <XCircle size={20} className="text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                </div>

                {/* Total Purchase */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-900/10 rounded-xl p-4 border border-pink-200 dark:border-pink-800">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-pink-600 dark:text-pink-400">Total Purchase</p>
                            <p className="text-lg font-bold text-pink-700 dark:text-pink-300 mt-1">
                                ฿{stats.totalPurchase.toLocaleString('th-TH')}
                            </p>
                        </div>
                        <div className="p-2 bg-pink-200 dark:bg-pink-800/50 rounded-lg">
                            <TrendingUp size={20} className="text-pink-600 dark:text-pink-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filter Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 space-y-4">
                    {/* Search and Filters Row */}
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="ค้นหา รหัส, ชื่อเจ้าหนี้, ผู้ติดต่อ, อีเมล..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`${styles.input} pl-10`}
                            />
                        </div>
                        
                        {/* Status Filter */}
                        <div className="w-full lg:w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                                className={styles.inputSelect}
                            >
                                <option value="ALL">สถานะทั้งหมด</option>
                                <option value="ACTIVE">ใช้งาน</option>
                                <option value="INACTIVE">ไม่ใช้งาน</option>
                                <option value="SUSPENDED">ระงับ</option>
                                <option value="BLACKLISTED">บัญชีดำ</option>
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div className="w-full lg:w-48">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                                className={styles.inputSelect}
                            >
                                <option value="ALL">ประเภททั้งหมด</option>
                                <option value="COMPANY">นิติบุคคล</option>
                                <option value="INDIVIDUAL">บุคคลธรรมดา</option>
                                <option value="GOVERNMENT">หน่วยงานราชการ</option>
                            </select>
                        </div>
                    </div>

                    {/* Results Count and Export */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Filter size={16} />
                            <span>พบ {filteredVendors.length} รายการ จาก {vendors.length} รายการ</span>
                        </div>
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <Download size={16} />
                            Export to Excel
                        </button>
                    </div>
                </div>

                {/* Data Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-blue-600 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">รหัสเจ้าหนี้</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">ชื่อเจ้าหนี้</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase hidden md:table-cell">ประเภท</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase hidden lg:table-cell">ผู้ติดต่อ</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase hidden lg:table-cell">โทรศัพท์</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase hidden md:table-cell">Rating</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedVendors.length > 0 ? (
                                    paginatedVendors.map((vendor) => (
                                        <tr 
                                            key={vendor.vendor_id} 
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                            onClick={() => handleEdit(vendor.vendor_id)}
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-gray-400" />
                                                    <span className="text-sm font-medium text-blue-600">{vendor.vendor_code}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{vendor.vendor_name}</div>
                                                <div className="text-xs text-gray-500">{vendor.vendor_name_en || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                                                    ผู้จัดจำหน่าย
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <div className="text-sm text-gray-700 dark:text-gray-300">-</div>
                                                <div className="text-xs text-gray-500">{vendor.email || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                                                {vendor.phone || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center hidden md:table-cell">
                                                <div className="flex items-center justify-center gap-1">
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold">
                                                        A
                                                    </span>
                                                    <span className="text-xs text-gray-500">(92.5)</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <VendorStatusBadge status={vendor.status} />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                            ไม่พบข้อมูลเจ้าหนี้
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && paginatedVendors.length > 0 && (
                    <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>แสดง</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span>รายการ จาก {filteredVendors.length}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronsLeft size={18} className="text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
                            </button>
                            
                            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                                หน้า {currentPage} / {totalPages || 1}
                            </span>
                            
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage >= totalPages}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage >= totalPages}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronsRight size={18} className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
}