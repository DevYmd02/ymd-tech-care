/**
 * @file VendorList.tsx
 * @description หน้ารายการข้อมูลเจ้าหนี้ (Vendor Master Data List)
 * @purpose แสดงรายการเจ้าหนี้ในรูปแบบตาราง พร้อมค้นหา กรอง และจัดการข้อมูล
 */

import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    Database,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { styles } from '@/shared/constants/styles';

import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { VendorStatus, VendorListParams } from '@/modules/master-data/vendor/types/vendor-types';
import { VendorStatusBadge } from '@/shared/components/ui/StatusBadge';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import FilterFormBuilder, { type FilterFieldConfig } from '@/shared/components/FilterFormBuilder';
import { VendorFormModal } from './VendorFormModal';

// ====================================================================================
// COMPONENT
// ====================================================================================

export default function VendorList() {
    
    // ==================== STATE ====================
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

    // ==================== FILTERS ====================
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters<VendorStatus>({
        defaultLimit: 10,
        customParamKeys: {
            search: 'q',
            status: 'status'
        }
    });

    // ==================== FILTER CONFIG ====================
    const filterConfig: FilterFieldConfig<keyof typeof filters>[] = useMemo(() => [
        { 
            name: 'search', 
            label: 'ค้นหาเจ้าหนี้', 
            type: 'text', 
            placeholder: 'ค้นหาชื่อ, รหัส, หรือเลขภาษี...' 
        },
        { 
            name: 'status', 
            label: 'สถานะ', 
            type: 'select', 
            options: [
                { value: 'ALL', label: 'สถานะทั้งหมด' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'BLACKLISTED', label: 'Blacklisted' },
                { value: 'SUSPENDED', label: 'Suspended' },
            ] 
        },
    ], []);

    // ==================== QUERY PARAMS ====================
    // Note: We use values from the filters object provided by useTableFilters
    const queryParams: VendorListParams = {
        page: filters.page,
        limit: filters.limit,
        status: filters.status !== 'ALL' ? filters.status : undefined,
        search: filters.search || undefined,
    };

    // ==================== DATA FETCHING (React Query) ====================
    const { 
        data, 
        isLoading, 
        isError, 
        error: queryError, 
        refetch 
    } = useQuery({
        queryKey: ['vendors', queryParams],
        queryFn: () => VendorService.getList(),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    const allVendors = data?.items || [];


    // ==================== LOCAL FILTERING & PAGINATION ====================
    const filteredVendors = allVendors.filter(v => {
        // Search
        if (filters.search) {
            const term = filters.search.toLowerCase();
            const matchesSearch = 
                v.vendor_code.toLowerCase().includes(term) ||
                v.vendor_name.toLowerCase().includes(term) ||
                (v.tax_id && v.tax_id.toLowerCase().includes(term));
            
            if (!matchesSearch) return false;
        }

        // Status
        if (filters.status !== 'ALL') {
             if (v.status !== filters.status) return false;
        }

        return true;
    });

    const vendors = filteredVendors.slice(
        (filters.page - 1) * filters.limit,
        filters.page * filters.limit
    );

    // ==================== PAGINATION ====================
    const totalItems = filteredVendors.length;
    const totalPages = Math.ceil(totalItems / filters.limit);

    // ==================== HANDLERS ====================
    const handleCreateNew = () => {
        setSelectedVendorId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (vendorId: string) => {
        setSelectedVendorId(vendorId);
        setIsModalOpen(true);
    };

    const handleDelete = async (vendorId: string) => {
        if (confirm('คุณต้องการลบข้อมูลเจ้าหนี้นี้หรือไม่?')) {
            try {
                const result = await VendorService.delete(vendorId);
                if (result.success) {
                    refetch(); // Refresh list via React Query
                } else {
                    alert(result.message || 'เกิดข้อผิดพลาดในการลบ');
                }
            } catch (err) {
                console.error('Delete failed', err);
                alert('เกิดข้อผิดพลาดในการลบ');
            }
        }
    };

    const handleRefresh = () => {
        refetch();
    };

    const handleRowsPerPageChange = (val: number) => {
        setFilters({ limit: val, page: 1 });
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

            {/* Search & Filter Section (Standardized) */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <FilterFormBuilder
                    config={filterConfig}
                    filters={filters}
                    onFilterChange={(name, value) => setFilters({ [name]: value })}
                    onSearch={() => handlePageChange(1)}
                    onReset={resetFilters}
                    onCreate={handleCreateNew}
                    createLabel="เพิ่มเจ้าหนี้ใหม่"
                    accentColor="indigo"
                />
            </div>

            {/* Error Message */}
            {isError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <span className="text-red-700 dark:text-red-400">
                        {queryError instanceof Error ? queryError.message : 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง'}
                    </span>
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
                                        {isError ? 'เกิดข้อผิดพลาดในการโหลดข้อมูล' : 'ไม่พบข้อมูลเจ้าหนี้'}
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
                            value={filters.limit}
                            onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                            className={styles.inputSm}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span>รายการ</span>
                        <span className="hidden sm:inline">| {(filters.page - 1) * filters.limit + 1}-{Math.min(filters.page * filters.limit, totalItems)} จาก {totalItems}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={filters.page === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronsLeft size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                            onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                            disabled={filters.page === 1}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        
                        <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                            หน้า {filters.page} / {totalPages || 1}
                        </span>
                        
                        <button
                            onClick={() => handlePageChange(Math.min(totalPages, filters.page + 1))}
                            disabled={filters.page >= totalPages}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={filters.page >= totalPages}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronsRight size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
                )}
            </div>

            {/* Modal */}
            <VendorFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                vendorId={selectedVendorId || undefined}
                onSuccess={() => {
                    refetch();
                    setIsModalOpen(false);
                }}
            />

        </div>
    );
}
