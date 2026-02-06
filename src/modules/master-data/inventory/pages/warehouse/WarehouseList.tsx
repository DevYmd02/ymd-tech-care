/**
 * @file WarehouseList.tsx
 * @description หน้ารายการข้อมูลคลังสินค้า (Warehouse Master Data List)
 */

import { useState, useEffect, useCallback } from 'react';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Warehouse,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    RefreshCw
} from 'lucide-react';
import { styles } from '@/shared/constants/styles';

import { WarehouseFormModal } from './WarehouseFormModal';
import { WarehouseService } from '@/modules/master-data/inventory/services/warehouse.service';
import type { WarehouseListItem } from '@/modules/master-data/types/master-data-types';
import { ActiveStatusBadge } from '@ui/StatusBadge';

// ====================================================================================
// COMPONENT
// ====================================================================================

export default function WarehouseList() {
    // ==================== STATE ====================
    const [warehouses, setWarehouses] = useState<WarehouseListItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ==================== DATA FETCHING ====================
    const fetchData = useCallback(() => {
        setIsLoading(true);
        const fetchWarehouses = async () => {
            const data = await WarehouseService.getList();
            let filtered = [...data];
            
            if (statusFilter !== 'ALL') {
                filtered = filtered.filter(w => 
                    statusFilter === 'ACTIVE' ? w.is_active : !w.is_active
                );
            }
            
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(w => 
                    w.warehouse_code.toLowerCase().includes(term) ||
                    w.warehouse_name.toLowerCase().includes(term) ||
                    (w.branch_name && w.branch_name.toLowerCase().includes(term))
                );
            }
            
            setWarehouses(filtered);
            setWarehouses(filtered);
            setIsLoading(false);
        };
        fetchWarehouses();
    }, [statusFilter, searchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchTerm, rowsPerPage]);

    // ==================== PAGINATION ====================
    const totalItems = warehouses.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = warehouses.slice(startIndex, startIndex + rowsPerPage);

    // ==================== HANDLERS ====================
    const handleCreateNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('คุณต้องการลบข้อมูลคลังสินค้านี้หรือไม่?')) {
            WarehouseService.delete(id).then(() => fetchData());
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
        fetchData();
    };



    // ==================== RENDER ====================
    return (
        <div className="p-6 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Warehouse className="text-blue-600" />
                        กำหนดรหัสคลังสินค้า (Warehouse)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        จัดการข้อมูลคลังสินค้าทั้งหมด
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
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
                        เพิ่มคลังสินค้าใหม่
                    </button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหารหัส ชื่อคลัง หรือสาขา..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`${styles.input} pl-10`}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                        className={`${styles.inputSelect} w-full md:w-40`}
                    >
                        <option value="ALL">ทั้งหมด</option>
                        <option value="ACTIVE">ใช้งาน</option>
                        <option value="INACTIVE">ไม่ใช้งาน</option>
                    </select>
                </div>
            </div>

            {/* Table */}
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
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">รหัสคลัง</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">ชื่อคลังสินค้า</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider hidden md:table-cell">สาขา</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">สถานะ</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((item) => (
                                    <tr key={item.warehouse_id} className={styles.tableTr}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                                            {item.warehouse_code}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {item.warehouse_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                            {item.branch_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <ActiveStatusBadge isActive={item.is_active} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleEdit(item.warehouse_id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="แก้ไข"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.warehouse_id)}
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
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        ไม่พบข้อมูลคลังสินค้า
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                )}

                {/* Pagination */}
                {!isLoading && paginatedData.length > 0 && (
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
                        </select>
                        <span>รายการ | {startIndex + 1}-{Math.min(startIndex + rowsPerPage, totalItems)} จาก {totalItems}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronsLeft size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">หน้า {currentPage} / {totalPages || 1}</span>
                        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage >= totalPages} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ChevronsRight size={18} className="text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
                )}
            </div>

            {/* Modal */}
            <WarehouseFormModal 
                isOpen={isModalOpen} 
                onClose={handleModalClose}
                editId={editingId}
            />
        </div>
    );
}
