/**
 * @file MasterDataDashboard.tsx
 * @description หน้า Dashboard รวมข้อมูล Master Data ทั้งหมด พร้อม Tab-based Navigation
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Database, Users, Building2, Warehouse, Tag, Layers, Ruler,
    CheckCircle, XCircle, RefreshCw, Plus, Search, Edit2, Trash2,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter
} from 'lucide-react';
import { styles } from '../../constants';

// Import mock data
import { mockBranches, mockWarehouses, mockProductCategories, mockItemTypes, mockUnits } from '../../__mocks__/masterDataMocks';
import { vendorService } from '../../services/vendorService';

// Import all FormModal components from module folders
import { VendorFormModal } from './vendor';
import { BranchFormModal } from './branch';
import { WarehouseFormModal } from './warehouse';
import { ProductCategoryFormModal } from './product-category';
import { ItemTypeFormModal } from './item-type';
import { UnitFormModal } from './unit';

// Import types
import type { VendorListItem } from '../../types/vendor-types';
import type { BranchListItem, WarehouseListItem, ProductCategoryListItem, ItemTypeListItem, UnitListItem } from '../../types/master-data-types';

// ====================================================================================
// TYPES
// ====================================================================================

type TabType = 'vendor' | 'branch' | 'warehouse' | 'product-category' | 'item-type' | 'unit';

interface TabConfig {
    id: TabType;
    label: string;
    icon: React.ElementType;
    color: string;
}

const TABS: TabConfig[] = [
    { id: 'vendor', label: 'เจ้าหนี้', icon: Users, color: 'blue' },
    { id: 'branch', label: 'สาขา', icon: Building2, color: 'emerald' },
    { id: 'warehouse', label: 'คลังสินค้า', icon: Warehouse, color: 'orange' },
    { id: 'product-category', label: 'หมวดสินค้า', icon: Tag, color: 'purple' },
    { id: 'item-type', label: 'ประเภทสินค้า', icon: Layers, color: 'pink' },
    { id: 'unit', label: 'หน่วยนับ', icon: Ruler, color: 'cyan' },
];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function MasterDataDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Get initial tab from URL or default to 'vendor'
    const initialTab = (searchParams.get('tab') as TabType) || 'vendor';
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // List states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    
    // Data states for each type
    const [vendors, setVendors] = useState<VendorListItem[]>([]);
    const [branches, setBranches] = useState<BranchListItem[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseListItem[]>([]);
    const [productCategories, setProductCategories] = useState<ProductCategoryListItem[]>([]);
    const [itemTypes, setItemTypes] = useState<ItemTypeListItem[]>([]);
    const [units, setUnits] = useState<UnitListItem[]>([]);

    // Summary stats
    const stats = {
        vendor: { total: vendors.length, active: vendors.filter(v => v.status === 'ACTIVE').length, inactive: vendors.filter(v => v.status !== 'ACTIVE').length },
        branch: { total: mockBranches.length, active: mockBranches.filter(b => b.is_active).length },
        warehouse: { total: mockWarehouses.length, active: mockWarehouses.filter(w => w.is_active).length },
        'product-category': { total: mockProductCategories.length, active: mockProductCategories.filter(c => c.is_active).length },
        'item-type': { total: mockItemTypes.length, active: mockItemTypes.filter(i => i.is_active).length },
        unit: { total: mockUnits.length, active: mockUnits.filter(u => u.is_active).length },
    };

    // ====================================================================================
    // DATA FETCHING
    // ====================================================================================

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        
        switch (activeTab) {
            case 'vendor':
                try {
                    const response = await vendorService.getList({ page: 1, limit: 100 });
                    setVendors(response.data);
                } catch {
                    setVendors([]);
                }
                break;
            case 'branch':
                setBranches([...mockBranches]);
                break;
            case 'warehouse':
                setWarehouses([...mockWarehouses]);
                break;
            case 'product-category':
                setProductCategories([...mockProductCategories]);
                break;
            case 'item-type':
                setItemTypes([...mockItemTypes]);
                break;
            case 'unit':
                setUnits([...mockUnits]);
                break;
        }
        
        setTimeout(() => setIsLoading(false), 200);
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Update URL when tab changes
    useEffect(() => {
        setSearchParams({ tab: activeTab });
        setSearchTerm('');
        setStatusFilter('ALL');
        setCurrentPage(1);
    }, [activeTab, setSearchParams]);

    // ====================================================================================
    // HANDLERS
    // ====================================================================================

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
    };

    const handleCreateNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
            console.log('Delete:', id);
            fetchData();
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
        fetchData();
    };

    // ====================================================================================
    // FILTER & PAGINATION
    // ====================================================================================

    const getFilteredData = () => {
        let data: Array<{ id: string; code: string; name: string; nameEn?: string; isActive: boolean; status?: string }> = [];
        
        switch (activeTab) {
            case 'vendor':
                data = vendors.map(v => ({
                    id: v.vendor_id,
                    code: v.vendor_code,
                    name: v.vendor_name,
                    nameEn: v.vendor_name_en,
                    isActive: v.status === 'ACTIVE',
                    status: v.status  // Keep original status for filtering
                }));
                break;
            case 'branch':
                data = branches.map(b => ({
                    id: b.branch_id,
                    code: b.branch_code,
                    name: b.branch_name,
                    isActive: b.is_active
                }));
                break;
            case 'warehouse':
                data = warehouses.map(w => ({
                    id: w.warehouse_id,
                    code: w.warehouse_code,
                    name: w.warehouse_name,
                    nameEn: w.branch_name,
                    isActive: w.is_active
                }));
                break;
            case 'product-category':
                data = productCategories.map(c => ({
                    id: c.category_id,
                    code: c.category_code,
                    name: c.category_name,
                    nameEn: c.category_name_en,
                    isActive: c.is_active
                }));
                break;
            case 'item-type':
                data = itemTypes.map(i => ({
                    id: i.item_type_id,
                    code: i.item_type_code,
                    name: i.item_type_name,
                    nameEn: i.item_type_name_en,
                    isActive: i.is_active
                }));
                break;
            case 'unit':
                data = units.map(u => ({
                    id: u.unit_id,
                    code: u.unit_code,
                    name: u.unit_name,
                    nameEn: u.unit_name_en,
                    isActive: u.is_active
                }));
                break;
        }

        // Apply filters - for vendor use status string, for others use isActive boolean
        if (statusFilter !== 'ALL') {
            if (activeTab === 'vendor') {
                // Vendor: filter by exact status match
                data = data.filter(d => d.status === statusFilter);
            } else {
                // Others: filter by active/inactive (boolean)
                data = data.filter(d => statusFilter === 'ACTIVE' ? d.isActive : !d.isActive);
            }
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            data = data.filter(d => 
                d.code.toLowerCase().includes(term) || 
                d.name.toLowerCase().includes(term) ||
                d.nameEn?.toLowerCase().includes(term)
            );
        }

        return data;
    };

    const filteredData = getFilteredData();
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // ====================================================================================
    // RENDER
    // ====================================================================================

    const totalAll = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
    const activeAll = Object.values(stats).reduce((sum, s) => sum + s.active, 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Database className="text-blue-600" />
                        Master Data Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        จัดการข้อมูลหลักทั้งหมดในระบบ
                    </p>
                </div>
                <button 
                    onClick={() => fetchData()} 
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors w-fit"
                    title="รีเฟรช"
                >
                    <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Database className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">ข้อมูลหลักทั้งหมด</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{totalAll}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">ใช้งานอยู่</p>
                            <p className="text-xl font-bold text-green-600">{activeAll}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <XCircle className="text-gray-500" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">ไม่ใช้งาน</p>
                            <p className="text-xl font-bold text-gray-500">{totalAll - activeAll}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 bg-${TABS.find(t => t.id === activeTab)?.color || 'blue'}-100 dark:bg-${TABS.find(t => t.id === activeTab)?.color || 'blue'}-900/30 rounded-lg`}>
                            {(() => {
                                const IconComponent = TABS.find(t => t.id === activeTab)?.icon || Database;
                                return <IconComponent className="text-blue-600" size={20} />;
                            })()}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{TABS.find(t => t.id === activeTab)?.label}</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{stats[activeTab].total}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Tab Headers */}
                <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
                    {TABS.map((tab) => {
                        const IconComponent = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                                    ${isActive 
                                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' 
                                        : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }
                                `}
                            >
                                <IconComponent size={18} />
                                <span>{tab.label}</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                    isActive 
                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' 
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700'
                                }`}>
                                    {stats[tab.id].total}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    {/* Search & Filter */}
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="ค้นหารหัส, ชื่อ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`${styles.input} pl-10`}
                            />
                        </div>
                        <div className="relative w-full md:w-48">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                                className={`${styles.inputSelect} pl-10`}
                            >
                                <option value="ALL">สถานะทั้งหมด</option>
                                <option value="ACTIVE">ใช้งาน</option>
                                <option value="INACTIVE">ไม่ใช้งาน</option>
                                <option value="SUSPENDED">พักใช้งาน</option>
                                <option value="BLACKLISTED">ระงับการใช้งาน</option>
                            </select>
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className={`${styles.btnPrimary} flex items-center gap-2 whitespace-nowrap`}
                        >
                            <Plus size={20} />
                            เพิ่มใหม่
                        </button>
                    </div>

                    {/* Data Table */}
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</span>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase">รหัส</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase">ชื่อ</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-200 uppercase hidden md:table-cell">ชื่อ EN / อื่นๆ</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-200 uppercase">สถานะ</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-200 uppercase">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {item.code}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                    {item.name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                                    {item.nameEn || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                                                        item.isActive 
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                                        {item.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button 
                                                            onClick={() => handleEdit(item.id)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title="แก้ไข"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            title="ลบ"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                                ไม่พบข้อมูล
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {!isLoading && paginatedData.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span>แสดง</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className={styles.inputSm}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                </select>
                                <span>รายการ | {filteredData.length} รายการ</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                                    <ChevronsLeft size={18} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                                    <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                                    หน้า {currentPage} / {totalPages || 1}
                                </span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                                    <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                                </button>
                                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                                    <ChevronsRight size={18} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* All Form Modals */}
            <VendorFormModal isOpen={isModalOpen && activeTab === 'vendor'} onClose={handleModalClose} />
            <BranchFormModal isOpen={isModalOpen && activeTab === 'branch'} onClose={handleModalClose} editId={editingId} />
            <WarehouseFormModal isOpen={isModalOpen && activeTab === 'warehouse'} onClose={handleModalClose} editId={editingId} />
            <ProductCategoryFormModal isOpen={isModalOpen && activeTab === 'product-category'} onClose={handleModalClose} editId={editingId} />
            <ItemTypeFormModal isOpen={isModalOpen && activeTab === 'item-type'} onClose={handleModalClose} editId={editingId} />
            <UnitFormModal isOpen={isModalOpen && activeTab === 'unit'} onClose={handleModalClose} editId={editingId} />
        </div>
    );
}
