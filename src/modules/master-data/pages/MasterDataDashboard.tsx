/**
 * @file MasterDataDashboard.tsx
 * @description หน้า Master Data Management - ตามดีไซน์ใหม่
 * @purpose แสดง Tab-based navigation สำหรับ Master Data ต่างๆ พร้อม Card-based list และ Database Relations
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
    Users, Package, Building2, Warehouse as WarehouseIcon, 
    DollarSign, FolderKanban,
    ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight
} from 'lucide-react';

// Import services (NOT static mock data - services handle mock/real switching internally)
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { MasterDataService } from '@/core/api/master-data.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';

// Import Form Modals
import { VendorFormModal } from '@/modules/master-data/vendor/pages';
import { BranchFormModal } from '@/modules/master-data/company/pages/branch';
import { WarehouseFormModal } from '@/modules/master-data/inventory/pages/warehouse';
import { ItemMasterFormModal } from '@/modules/master-data/inventory/pages/item-master/ItemMasterFormModal';

// Import sub-components
import { MasterDataHeader } from './components/MasterDataHeader';
import { MasterDataTabs } from './components/MasterDataTabs';
import { MasterDataToolbar } from './components/MasterDataToolbar';

// Import extracted tab components
import { VendorTab } from './dashboard/tabs/VendorTab';
import { BranchTab } from './dashboard/tabs/BranchTab';
import { WarehouseTab } from './dashboard/tabs/WarehouseTab';
import { CostCenterTab } from './dashboard/tabs/CostCenterTab';
import { ProjectTab } from './dashboard/tabs/ProjectTab';
import { ItemTab } from './dashboard/tabs/ItemTab';

// Import types
import type { VendorListItem, VendorMaster } from '@/modules/master-data/vendor/types/vendor-types';
import type { 
    BranchListItem,
    WarehouseListItem, 
    CostCenter,
    Project,
    ItemListItem
} from '@/modules/master-data/types/master-data-types';
import type { TabType, TabConfig, TabLabel } from '../types';

// ====================================================================================
// DATABASE RELATIONS CONFIG
// ====================================================================================

const DB_RELATIONS: Record<TabType, { dbTable: string; relations: string[]; fk: string }> = {
    'vendor': {
        dbTable: 'vendor',
        relations: ['po_header', 'quotation_header', 'vendor_invoice_header'],
        fk: 'vendor_id'
    },
    'item': {
        dbTable: 'item_master',
        relations: ['po_detail', 'pr_detail', 'stock_transaction'],
        fk: 'item_id'
    },
    'branch': {
        dbTable: 'branch',
        relations: ['warehouse', 'user', 'document_header'],
        fk: 'branch_id'
    },
    'warehouse': {
        dbTable: 'warehouse',
        relations: ['stock_balance', 'stock_transaction', 'grn_header'],
        fk: 'warehouse_id'
    },
    'cost-center': {
        dbTable: 'cost_center',
        relations: ['pr_header', 'po_header', 'budget_allocation'],
        fk: 'cost_center_id'
    },
    'project': {
        dbTable: 'project',
        relations: ['pr_header', 'po_header', 'budget_project'],
        fk: 'project_id'
    }
};

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function MasterDataDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Get initial tab from URL or default to 'vendor'
    const initialTab = (searchParams.get('tab') as TabType) || 'vendor';
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    
    // Modal & UI states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<VendorMaster | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Data states
    const [vendors, setVendors] = useState<VendorListItem[]>([]);
    const [branches, setBranches] = useState<BranchListItem[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseListItem[]>([]);
    // Items handled by useQuery below
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // REFACTORED: Use useQuery for items (Cache Shared with ItemMasterList)
    const { data: response, refetch: refetchItems } = useQuery({
        queryKey: ['items'],
        queryFn: () => ItemMasterService.getAll(),
        staleTime: 1000 * 60 * 5,
    });
    
    const items = response?.items || [];

    // Master Data Menu Configuration
    const MASTER_DATA_MENU = [
        { id: 'vendor', label: 'Vendor', labelEn: 'ผู้ขาย', icon: Users, dbRelation: DB_RELATIONS['vendor'] },
        { id: 'item', label: 'Item', labelEn: 'สินค้า', icon: Package, dbRelation: DB_RELATIONS['item'] },
        { id: 'branch', label: 'Branch', labelEn: 'สาขา', icon: Building2, dbRelation: DB_RELATIONS['branch'] },
        { id: 'warehouse', label: 'Warehouse', labelEn: 'คลัง', icon: WarehouseIcon, dbRelation: DB_RELATIONS['warehouse'] },
        { id: 'cost-center', label: 'Cost Center', labelEn: 'ศูนย์ต้นทุน', icon: DollarSign, dbRelation: DB_RELATIONS['cost-center'] },
        { id: 'project', label: 'Project', labelEn: 'โครงการ', icon: FolderKanban, dbRelation: DB_RELATIONS['project'] },
    ] as const;

    // Tab configs with record counts
    const tabs: TabConfig[] = MASTER_DATA_MENU.map(menu => ({
        id: menu.id,
        label: menu.label,
        labelEn: menu.labelEn,
        icon: menu.icon,
        recordCount: (() => {
            switch (menu.id) {
                case 'vendor': return vendors?.length || 0;
                case 'branch': return branches?.length || 0;
                case 'warehouse': return warehouses?.length || 0;
                case 'item': return items?.length || 0;
                case 'cost-center': return costCenters?.length || 0;
                case 'project': return projects?.length || 0;
                default: return 0;
            }
        })(),
        ...menu.dbRelation
    }));

    // Fetch Data - uses services which internally switch between mock/real API
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        
        try {
            switch (activeTab) {
                case 'vendor': {
                    const response = await VendorService.getList();
                    setVendors(response.items || []);
                    break;
                }
                case 'branch': {
                    const data = await MasterDataService.getBranches();
                    setBranches(data || []);
                    break;
                }
                case 'warehouse': {
                    const data = await MasterDataService.getWarehouses();
                    setWarehouses(data || []);
                    break;
                }
                // Case 'item' handled by useQuery
                case 'cost-center': {
                    const data = await MasterDataService.getCostCenters();
                    setCostCenters(data || []);
                    break;
                }
                case 'project': {
                    const data = await MasterDataService.getProjects();
                    setProjects(data || []);
                    break;
                }
            }
        } catch (error) {
            console.error('[MasterDataDashboard] fetchData error:', error);
        }
        
        setIsLoading(false);
    }, [activeTab]);

    // Pre-fetch ALL tab counts on initial mount (so tab headers show correct counts)
    useEffect(() => {
        const fetchAllCounts = async () => {
            try {
                // Fetch all data in parallel for tab counts
                const [vendorRes, branchRes, warehouseRes, costCenterRes, projectRes] = await Promise.all([
                    VendorService.getList(),
                    MasterDataService.getBranches(),
                    MasterDataService.getWarehouses(),
                    // Items handled by useQuery
                    MasterDataService.getCostCenters(),
                    MasterDataService.getProjects()
                ]);
                
                setVendors(vendorRes.items || []);
                setBranches(branchRes || []);
                setWarehouses(warehouseRes || []);
                // items handled by useQuery
                setCostCenters(costCenterRes || []);
                setProjects(projectRes || []);
            } catch (error) {
                console.error('[MasterDataDashboard] fetchAllCounts error:', error);
            }
        };
        
        fetchAllCounts();
    }, []); // Run once on mount

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setSearchParams({ tab: activeTab });
        setSearchTerm('');
        setExpandedId(null);
        setCurrentPage(1);
    }, [activeTab, setSearchParams]);

    // Handlers
    const handleTabChange = (tabId: TabType) => {
        setActiveTab(tabId);
    };

    const handleAddNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = async (id: string) => {
        if (activeTab === 'vendor') {
            try {
                // Fetch full vendor data before opening modal
                const vendor = await VendorService.getById(id);
                if (vendor) {
                    setSelectedVendor(vendor);
                    setIsModalOpen(true);
                }
            } catch (error) {
                console.error('Error fetching vendor for edit:', error);
            }
            return;
        }
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('ต้องการลบข้อมูลนี้หรือไม่?')) {
            if (activeTab === 'vendor') {
                const result = await VendorService.delete(id);
                if (!result.success) {
                    alert(result.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
                    return;
                }
                fetchData();
            } else if (activeTab === 'item') {
                const success = await ItemMasterService.delete(id);
                if (success) {
                    refetchItems();
                } else {
                    alert('เกิดข้อผิดพลาดในการลบข้อมูล');
                }
            } else {
                // Simplified mock deletes for other tabs (implementation details might vary)
                fetchData();
            }
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setSelectedVendor(null);
        if (activeTab === 'item') {
             refetchItems();
        } else {
             fetchData();
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Get current tab config
    const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

    // Get tab label with Thai name
    const getTabLabel = (): TabLabel => {
        switch (activeTab) {
            case 'vendor': return { main: 'Vendor (ผู้ขาย)', desc: 'ทะเบียนผู้ขายและข้อมูลการติดต่อ' };
            case 'item': return { main: 'Item (สินค้า)', desc: 'รายการสินค้าและวัตถุดิบ' };
            case 'branch': return { main: 'Branch (สาขา)', desc: 'ข้อมูลสาขาและสถานที่ตั้ง' };
            case 'warehouse': return { main: 'Warehouse (คลัง)', desc: 'คลังสินค้าและสถานที่จัดเก็บ' };
            case 'cost-center': return { main: 'Cost Center', desc: 'ศูนย์ต้นทุนสำหรับการบัญชี' };
            case 'project': return { main: 'Project (โครงการ)', desc: 'โครงการและงานที่เกี่ยวข้อง' };
            default: return { main: 'Master Data', desc: '' };
        }
    };

 // Filter data based on search
    const getFilteredData = () => {
        const term = searchTerm.toLowerCase();
        
        // ใช้ (array || []) เพื่อรับประกันว่าจะเป็นอาเรย์เสมอ แม้ข้อมูลยังไม่มา
        switch (activeTab) {
            case 'vendor':
                return (vendors || []).filter(v => 
                    v.vendor_code?.toLowerCase().includes(term) ||
                    v.vendor_name?.toLowerCase().includes(term) ||
                    v.tax_id?.toLowerCase().includes(term)
                );
            case 'branch':
                return (branches || []).filter(b =>
                    b.branch_code?.toLowerCase().includes(term) ||
                    b.branch_name?.toLowerCase().includes(term)
                );
            case 'warehouse':
                return (warehouses || []).filter(w =>
                    w.warehouse_code?.toLowerCase().includes(term) ||
                    w.warehouse_name?.toLowerCase().includes(term)
                );
            case 'item':
                return (items || []).filter((i: ItemListItem) =>
                    i.item_code?.toLowerCase().includes(term) ||
                    i.item_name?.toLowerCase().includes(term)
                );
            case 'cost-center':
                return (costCenters || []).filter(c =>
                    c.cost_center_code?.toLowerCase().includes(term) ||
                    c.cost_center_name?.toLowerCase().includes(term)
                );
            case 'project':
                return (projects || []).filter(p =>
                    p.project_code?.toLowerCase().includes(term) ||
                    p.project_name?.toLowerCase().includes(term)
                );
            default:
                return [];
        }
    };

    // --- ส่วนนี้คือจุดที่ต้องระวังเป็นพิเศษ ---
    
    // ตรวจสอบให้แน่ใจว่าได้อาเรย์ออกมาเสมอ
    const filteredData = getFilteredData() || []; 
    
    // totalItems จะไม่อ่านค่าจาก undefined อีกต่อไป
    const totalItems = filteredData.length; 
    
    const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
    
    // ป้องกันค่า NaN หรือการหารด้วย 0
    const safeTotalPages = totalPages;

    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // ====================================================================================
    // RENDER HELPERS
    // ====================================================================================

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 min-w-[320px]">
            <MasterDataHeader />

            <MasterDataTabs 
                tabs={tabs} 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
            />

            <MasterDataToolbar 
                currentTab={currentTab}
                tabLabel={getTabLabel()}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onAddNew={handleAddNew}
                totalItems={totalItems}
            />

            {/* Data Cards */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">กำลังโหลดข้อมูล...</span>
                    </div>
                ) : activeTab === 'vendor' ? (
                    <VendorTab 
                        data={paginatedData as VendorListItem[]}
                        expandedId={expandedId}
                        toggleExpand={toggleExpand}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        dbRelation={currentTab}
                    />
                ) : activeTab === 'branch' ? (
                    <BranchTab 
                        data={paginatedData as BranchListItem[]}
                        expandedId={expandedId}
                        toggleExpand={toggleExpand}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        dbRelation={currentTab}
                    />
                ) : activeTab === 'warehouse' ? (
                    <WarehouseTab 
                        data={paginatedData as WarehouseListItem[]}
                        expandedId={expandedId}
                        toggleExpand={toggleExpand}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        dbRelation={currentTab}
                    />
                ) : activeTab === 'item' ? (
                     <ItemTab 
                        data={paginatedData as ItemListItem[]}
                        expandedId={expandedId}
                        toggleExpand={toggleExpand}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        dbRelation={currentTab}
                    />
                ) : activeTab === 'cost-center' ? (
                    <CostCenterTab 
                        data={paginatedData as CostCenter[]}
                        expandedId={expandedId}
                        toggleExpand={toggleExpand}
                        dbRelation={currentTab}
                    />
                ) : activeTab === 'project' ? (
                    <ProjectTab 
                        data={paginatedData as Project[]}
                        expandedId={expandedId}
                        toggleExpand={toggleExpand}
                        dbRelation={currentTab}
                    />
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p>{currentTab.label} - Coming Soon</p>
                    </div>
                )}
            </div>

            {/* Pagination Footer - Show for all tabs now */}
            {!isLoading && totalItems > 0 && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 w-full sm:w-auto justify-center sm:justify-start">
                        <span className="whitespace-nowrap">แสดง</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="whitespace-nowrap">รายการ จาก {totalItems}</span>
                    </div>

                    <div className="flex items-center justify-center gap-1 w-full sm:w-auto">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-2 aspect-square flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-white"
                        >
                            <ChevronsLeft size={18} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 aspect-square flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-white"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        
                        <span className="px-4 text-sm font-medium text-gray-700 dark:text-white whitespace-nowrap">
                            หน้า {currentPage} / {safeTotalPages}
                        </span>
                        
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(safeTotalPages, prev + 1))}
                            disabled={currentPage === safeTotalPages}
                            className="p-2 aspect-square flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-white"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(safeTotalPages)}
                            disabled={currentPage === safeTotalPages}
                            className="p-2 aspect-square flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-white"
                        >
                            <ChevronsRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Form Modals */}
            <VendorFormModal 
                isOpen={isModalOpen && activeTab === 'vendor'} 
                onClose={handleModalClose} 
                vendorId={editingId || undefined}
                initialData={selectedVendor}
                onSuccess={fetchData} 
                predictedVendorId={!editingId && activeTab === 'vendor' ? `V${String((currentTab.recordCount || 0) + 1).padStart(3, '0')}` : undefined}
            />
            <BranchFormModal isOpen={isModalOpen && activeTab === 'branch'} onClose={handleModalClose} editId={editingId} />
            <WarehouseFormModal isOpen={isModalOpen && activeTab === 'warehouse'} onClose={handleModalClose} editId={editingId} />
            <ItemMasterFormModal 
                isOpen={isModalOpen && activeTab === 'item'} 
                onClose={handleModalClose} 
                editId={editingId}
                onSuccess={() => {
                    refetchItems();
                    handleModalClose();
                }}
            />
        </div>
    );
}

// Remove unused import if we actually removed it
// import { ItemMasterList } from '@/modules/master-data/inventory/pages/item-master';
