/**
 * @file VendorList.tsx
 * @description หน้ารายการข้อมูลเจ้าหนี้ (Vendor Master Data List)
 * @purpose แสดงรายการเจ้าหนี้ในรูปแบบตาราง พร้อมค้นหา กรอง และจัดการข้อมูล
 */

import { useState, useEffect } from 'react';
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
    Filter
} from 'lucide-react';
import { styles } from '../../constants';
import { VendorFormModal } from './VendorFormModal';

// ====================================================================================
// TYPES
// ====================================================================================

interface Vendor {
    id: string;
    vendorCode: string;
    vendorName: string;
    vendorNameEn: string;
    taxId: string;
    status: 'active' | 'inactive' | 'blocked';
    phone: string;
    email: string;
    createdAt: string;
}

// ====================================================================================
// MOCK DATA
// ====================================================================================

const mockVendors: Vendor[] = [
    {
        id: '1',
        vendorCode: 'VN001',
        vendorName: 'บริษัท ซัพพลายเออร์ จำกัด',
        vendorNameEn: 'Supplier Co., Ltd.',
        taxId: '0105548123456',
        status: 'active',
        phone: '02-123-4567',
        email: 'contact@supplier.co.th',
        createdAt: '2024-01-15'
    },
    {
        id: '2',
        vendorCode: 'VN002',
        vendorName: 'บริษัท วัสดุก่อสร้าง จำกัด',
        vendorNameEn: 'Construction Materials Co., Ltd.',
        taxId: '0105549876543',
        status: 'active',
        phone: '02-234-5678',
        email: 'info@construction.co.th',
        createdAt: '2024-02-20'
    },
    {
        id: '3',
        vendorCode: 'VN003',
        vendorName: 'ห้างหุ้นส่วนจำกัด อุปกรณ์ไฟฟ้า',
        vendorNameEn: 'Electrical Equipment Ltd. Part.',
        taxId: '0103555123789',
        status: 'inactive',
        phone: '02-345-6789',
        email: 'sales@electrical.co.th',
        createdAt: '2024-03-10'
    },
    {
        id: '4',
        vendorCode: 'VN004',
        vendorName: 'บริษัท เคมีภัณฑ์ จำกัด',
        vendorNameEn: 'Chemical Products Co., Ltd.',
        taxId: '0105550111222',
        status: 'blocked',
        phone: '02-456-7890',
        email: 'order@chemical.co.th',
        createdAt: '2024-04-05'
    },
    {
        id: '5',
        vendorCode: 'VN005',
        vendorName: 'บริษัท อิเล็กทรอนิกส์ จำกัด',
        vendorNameEn: 'Electronics Co., Ltd.',
        taxId: '0105551234567',
        status: 'active',
        phone: '02-567-8901',
        email: 'info@electronics.co.th',
        createdAt: '2024-05-12'
    },
];

// ====================================================================================
// COMPONENT
// ====================================================================================

export default function VendorList() {
    const navigate = useNavigate();
    
    // ==================== STATE ====================
    const [vendors] = useState<Vendor[]>(mockVendors);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Simulate API loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    //Filter Logic
    const filteredVendors = vendors.filter(vendor => {
        const matchesSearch = 
            vendor.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.vendorNameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.taxId.includes(searchTerm);
        
        const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    //Pagination
    const totalPages = Math.ceil(filteredVendors.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedVendors = filteredVendors.slice(startIndex, startIndex + rowsPerPage);

    //Handlers
    const handleCreateNew = () => {
        setIsModalOpen(true);
    };

    const handleEdit = (vendorId: string) => {
        navigate(`/master-data/vendor?id=${vendorId}`);
    };

    const handleDelete = (vendorId: string) => {
        if (confirm('คุณต้องการลบข้อมูลเจ้าหนี้นี้หรือไม่?')) {
            // TODO: Implement delete API call
            void vendorId;
        }
    };

    const getStatusBadge = (status: Vendor['status']) => {
        const badges = {
            active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
            blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        };
        const labels = {
            active: 'Active',
            inactive: 'Inactive',
            blocked: 'Blocked'
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-green-500' : status === 'blocked' ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                {labels[status]}
            </span>
        );
    };

    //Render
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
                <button
                    onClick={handleCreateNew}
                    className={`${styles.btnPrimary} flex items-center gap-2 whitespace-nowrap`}
                >
                    <Plus size={20} />
                    เพิ่มเจ้าหนี้ใหม่
                </button>
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
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className={`${styles.input} pl-10`}
                        />
                    </div>
                    <div className="relative w-full md:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'blocked');
                                setCurrentPage(1);
                            }}
                            className={`${styles.inputSelect} pl-10`}
                        >
                            <option value="all">สถานะทั้งหมด</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                </div>
            </div>

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
                            {paginatedVendors.length > 0 ? (
                                paginatedVendors.map((vendor) => (
                                    <tr key={vendor.id} className={styles.tableTr}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                                            {vendor.vendorCode}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{vendor.vendorName}</div>
                                            <div className="text-xs text-gray-500">{vendor.vendorNameEn}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                                            {vendor.taxId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                            {vendor.phone}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {getStatusBadge(vendor.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleEdit(vendor.id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="แก้ไข"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(vendor.id)}
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
                                        ไม่พบข้อมูลเจ้าหนี้
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                )}

                {/* ========== PAGINATION ========== */}
                {!isLoading && (
                <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>แสดง</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className={styles.inputSm}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span>รายการ</span>
                        <span className="hidden sm:inline">| {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredVendors.length)} จาก {filteredVendors.length}</span>
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
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    );
}
