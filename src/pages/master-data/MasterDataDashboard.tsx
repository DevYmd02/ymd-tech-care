/**
 * @file MasterDataDashboard.tsx
 * @description หน้า Master Data Management - ตามดีไซน์ใหม่
 * @purpose แสดง Tab-based navigation สำหรับ Master Data ต่างๆ พร้อม Card-based list และ Database Relations
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
    Database, Users, Package, Building2, Warehouse as WarehouseIcon, 
    DollarSign, FolderKanban, Edit2, Trash2,
    ChevronDown, ChevronUp, Phone, Mail, MapPin, 
    ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight
} from 'lucide-react';

// Import services (NOT static mock data - services handle mock/real switching internally)
import { vendorService } from '@services/VendorService';
import { masterDataService } from '@services/MasterDataService';
import { ItemMasterService } from '@services/ItemMasterService';

// Import Form Modals
import { VendorFormModal } from './vendor';
import { BranchFormModal } from './branch';
import { WarehouseFormModal } from './warehouse';
import { ItemMasterList } from './item-master';

// Import sub-components
import { MasterDataHeader } from './components/MasterDataHeader';
import { MasterDataTabs } from './components/MasterDataTabs';
import { MasterDataToolbar } from './components/MasterDataToolbar';

// Import types
import type { VendorListItem, VendorMaster } from '@project-types/vendor-types';
import type { 
    BranchListItem,
    WarehouseListItem, 
    CostCenter,
    Project
} from '@project-types/master-data-types';
import type { TabType, TabConfig, TabLabel } from './types';

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
    const navigate = useNavigate();
    
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
    const { data: items = [] } = useQuery({
        queryKey: ['items'],
        queryFn: ItemMasterService.getAll,
        staleTime: 1000 * 60 * 5,
    });

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
                    const response = await vendorService.getList({ page: 1, limit: 50 });
                    setVendors(response.data || []);
                    break;
                }
                case 'branch': {
                    const data = await masterDataService.getBranches();
                    setBranches(data || []);
                    break;
                }
                case 'warehouse': {
                    const data = await masterDataService.getWarehouses();
                    setWarehouses(data || []);
                    break;
                }
                // Case 'item' handled by useQuery
                case 'cost-center': {
                    const data = await masterDataService.getCostCenters();
                    setCostCenters(data || []);
                    break;
                }
                case 'project': {
                    const data = await masterDataService.getProjects();
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
                    vendorService.getList({ page: 1, limit: 50 }),
                    masterDataService.getBranches(),
                    masterDataService.getWarehouses(),
                    // Items handled by useQuery
                    masterDataService.getCostCenters(),
                    masterDataService.getProjects()
                ]);
                
                setVendors(vendorRes.data || []);
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
        if (activeTab === 'item') {
            navigate('/master-data/item');
            return;
        }
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = async (id: string) => {
        if (activeTab === 'vendor') {
            try {
                // Fetch full vendor data before opening modal
                const vendor = await vendorService.getById(id);
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
                const result = await vendorService.delete(id);
                if (!result.success) {
                    alert(result.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
                    return;
                }
            }
            fetchData();
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setSelectedVendor(null);
        fetchData();
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
                return (items || []).filter(i =>
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

    /**
     * Helper to format vendor address
     * Handles both flat fields (legacy) and nested addresses array (backend API)
     */
    const formatVendorAddress = (vendor: VendorListItem): string => {
        // First try nested addresses array (from backend API)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vendorAny = vendor as any;
        const addresses = vendor.addresses || vendorAny.vendorAddresses || [];
        
        if (addresses && addresses.length > 0) {
            // Find REGISTERED address or use first one
            const primaryAddr = addresses.find((a: { address_type?: string }) => a.address_type === 'REGISTERED') || addresses[0];
            if (primaryAddr) {
                const parts = [
                    primaryAddr.address,
                    primaryAddr.sub_district,
                    primaryAddr.district,
                    primaryAddr.province,
                    primaryAddr.postal_code
                ];
                const validParts = parts.filter(part => part && String(part).trim() !== '');
                if (validParts.length > 0) {
                    return validParts.join(' ');
                }
            }
        }
        
        // Fallback to flat fields (legacy/mock data)
        const addressParts = [
            vendor.address_line1,
            vendor.sub_district,
            vendor.district,
            vendor.province,
            vendor.postal_code
        ];

        // Filter out null, undefined, or empty strings
        const validParts = addressParts.filter(part => part && part.trim() !== '');

        return validParts.length > 0 ? validParts.join(' ') : '';
    };

    const renderVendorCard = (vendor: VendorListItem, isExpanded: boolean) => (
        <div key={vendor.vendor_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => toggleExpand(vendor.vendor_id)}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                            <Users size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mb-0.5">
                                <span className="font-semibold text-gray-900 dark:text-white line-clamp-2" title={vendor.vendor_name}>
                                    {vendor.vendor_name}
                                </span>
                                {vendor.status && (
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                                        vendor.status === 'ACTIVE' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {vendor.status}
                                    </span>
                                )}
                            </div>
                            <div className="text-sm text-gray-500 flex flex-wrap gap-x-2">
                                <span className="whitespace-nowrap">Code: {vendor.vendor_code}</span>
                                <span className="hidden sm:inline text-gray-300">|</span>
                                <span className="whitespace-nowrap">Tax ID: {vendor.tax_id || '-'}</span>
                            </div>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="shrink-0 text-gray-400 mt-1" /> : <ChevronDown size={20} className="shrink-0 text-gray-400 mt-1" />}
                </div>
                </div>


            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Address */}
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Address</p>
                            <div className="flex items-start gap-2">
                                <MapPin size={16} className="text-gray-400 mt-0.5" />
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {formatVendorAddress(vendor) || '-'}
                                    </p>
                            </div>
                        </div>
                        
                        {/* Contact */}
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Contact</p>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {vendor.phone || '02-123-4567'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-gray-400" />
                                    <a href={`mailto:${vendor.email}`} className="text-sm text-blue-600 hover:underline">
                                        {vendor.email || 'sales@techdigital.co.th'}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Tax Settings */}
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Tax Settings</p>
                            <div className="flex gap-2">
                                <span className="px-2 py-1 text-xs font-medium border border-green-500 text-green-600 rounded">
                                    VAT Registered
                                </span>
                                <span className="px-2 py-1 text-xs font-medium border border-orange-500 text-orange-600 rounded">
                                    WHT Applicable
                                </span>
                            </div>
                        </div>

                        {/* Currency */}
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Currency</p>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">THB</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-4 pb-4 flex gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(vendor.vendor_id); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Edit2 size={16} />
                            Edit
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(vendor.vendor_id); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    </div>

                    {/* Database Relations */}
                    <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Database size={16} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Database Relations</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Table:</p>
                                <p className="text-blue-600 font-mono">{currentTab.dbTable}</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Relations:</p>
                                <p className="text-blue-600 font-mono text-xs">
                                    {currentTab.relations.join(', ')}
                                </p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">FK:</p>
                                <p className="text-blue-600 font-mono">{currentTab.fk}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderBranchCard = (branch: BranchListItem, isExpanded: boolean) => (
        <div key={branch.branch_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => toggleExpand(branch.branch_id)}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                            <Building2 size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mb-0.5">
                                <span className="font-semibold text-gray-900 dark:text-white line-clamp-2" title={branch.branch_name}>
                                    {branch.branch_name}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                                    branch.is_active 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {branch.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                                Code: {branch.branch_code}
                            </p>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="shrink-0 text-gray-400 mt-1" /> : <ChevronDown size={20} className="shrink-0 text-gray-400 mt-1" />}
                </div>
            </div>
            {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex gap-2 mb-4">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(branch.branch_id); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Edit2 size={16} /> Edit
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(branch.branch_id); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                    </div>
                    {/* Database Relations */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Database size={16} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-600">Database Relations</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Table:</p>
                                <p className="text-blue-600 font-mono">{currentTab.dbTable}</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Relations:</p>
                                <p className="text-blue-600 font-mono text-xs">{currentTab.relations.join(', ')}</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">FK:</p>
                                <p className="text-blue-600 font-mono">{currentTab.fk}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderWarehouseCard = (warehouse: WarehouseListItem, isExpanded: boolean) => (
        <div key={warehouse.warehouse_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => toggleExpand(warehouse.warehouse_id)}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shrink-0">
                            <WarehouseIcon size={24} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mb-0.5">
                                <span className="font-semibold text-gray-900 dark:text-white line-clamp-2" title={warehouse.warehouse_name}>
                                    {warehouse.warehouse_name}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                                    warehouse.is_active 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {warehouse.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-500 flex flex-wrap gap-x-2">
                                <span className="whitespace-nowrap">Code: {warehouse.warehouse_code}</span>
                                <span className="hidden sm:inline text-gray-300">|</span>
                                <span className="truncate">Branch: {warehouse.branch_name}</span>
                            </div>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="shrink-0 text-gray-400 mt-1" /> : <ChevronDown size={20} className="shrink-0 text-gray-400 mt-1" />}
                </div>
            </div>
            {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex gap-2 mb-4">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(warehouse.warehouse_id); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Edit2 size={16} /> Edit
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(warehouse.warehouse_id); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                    </div>
                    {/* Database Relations */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Database size={16} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-600">Database Relations</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Table:</p>
                                <p className="text-blue-600 font-mono">{currentTab.dbTable}</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Relations:</p>
                                <p className="text-blue-600 font-mono text-xs">{currentTab.relations.join(', ')}</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">FK:</p>
                                <p className="text-blue-600 font-mono">{currentTab.fk}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderCostCenterCard = (cc: CostCenter, isExpanded: boolean) => (
        <div key={cc.cost_center_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => toggleExpand(cc.cost_center_id)}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
                            <DollarSign size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mb-0.5">
                                <span className="font-semibold text-gray-900 dark:text-white line-clamp-2" title={cc.cost_center_name}>
                                    {cc.cost_center_name}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                                    cc.is_active 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {cc.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-500 flex flex-wrap gap-x-2">
                                <span className="whitespace-nowrap">Code: {cc.cost_center_code}</span>
                                <span className="hidden sm:inline text-gray-300">|</span>
                                <span className="truncate">Manager: {cc.manager_name}</span>
                            </div>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="shrink-0 text-gray-400 mt-1" /> : <ChevronDown size={20} className="shrink-0 text-gray-400 mt-1" />}
                </div>
            </div>
            {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                     <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Description</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{cc.description}</p>
                    </div>
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Budget Amount</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {cc.budget_amount.toLocaleString('en-US', { style: 'currency', currency: 'THB' })}
                        </p>
                    </div>
                    {/* Database Relations */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                         <div className="flex items-center gap-2 mb-3">
                            <Database size={16} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-600">Database Relations</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Table:</p>
                                <p className="text-blue-600 font-mono">{currentTab.dbTable}</p>
                            </div>
                             <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Relations:</p>
                                <p className="text-blue-600 font-mono text-xs">{currentTab.relations.join(', ')}</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">FK:</p>
                                <p className="text-blue-600 font-mono">{currentTab.fk}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderProjectCard = (project: Project, isExpanded: boolean) => (
        <div key={project.project_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
             <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => toggleExpand(project.project_id)}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center shrink-0">
                            <FolderKanban size={24} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start gap-x-2 gap-y-1 mb-0.5">
                                <span className="font-semibold text-gray-900 dark:text-white line-clamp-2" title={project.project_name}>
                                    {project.project_name}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                                    project.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                    project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                    project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {project.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <span className="whitespace-nowrap">Code: {project.project_code}</span>
                                <span className="hidden sm:inline text-gray-300">|</span>
                                <span className="text-xs sm:text-sm">{project.start_date} - {project.end_date}</span>
                            </div>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="shrink-0 text-gray-400 mt-1" /> : <ChevronDown size={20} className="shrink-0 text-gray-400 mt-1" />}
                </div>
            </div>
             {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Description</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{project.description}</p>
                    </div>
                     <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Budget Amount</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {project.budget_amount.toLocaleString('en-US', { style: 'currency', currency: 'THB' })}
                        </p>
                    </div>
                    {/* Database Relations */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                         <div className="flex items-center gap-2 mb-3">
                            <Database size={16} className="text-gray-500" />
                            <span className="text-sm font-medium text-gray-600">Database Relations</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                             <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Table:</p>
                                <p className="text-blue-600 font-mono">{currentTab.dbTable}</p>
                            </div>
                             <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Relations:</p>
                                <p className="text-blue-600 font-mono text-xs">{currentTab.relations.join(', ')}</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">FK:</p>
                                <p className="text-blue-600 font-mono">{currentTab.fk}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

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
                    paginatedData.length > 0 ? (
                        (paginatedData as VendorListItem[]).map(vendor => 
                            renderVendorCard(vendor, expandedId === vendor.vendor_id)
                        )
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            ไม่พบข้อมูล {currentTab.label}
                        </div>
                    )
                ) : activeTab === 'branch' ? (
                    paginatedData.length > 0 ? (
                        (paginatedData as BranchListItem[]).map(branch => 
                            renderBranchCard(branch, expandedId === branch.branch_id)
                        )
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            ไม่พบข้อมูล {currentTab.label}
                        </div>
                    )
                ) : activeTab === 'warehouse' ? (
                    paginatedData.length > 0 ? (
                        (paginatedData as WarehouseListItem[]).map(warehouse => 
                            renderWarehouseCard(warehouse, expandedId === warehouse.warehouse_id)
                        )
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                             ไม่พบข้อมูล {currentTab.label}
                        </div>
                    )
                ) : activeTab === 'item' ? (
                     <ItemMasterList />
                ) : activeTab === 'cost-center' ? (
                    paginatedData.length > 0 ? (
                        (paginatedData as CostCenter[]).map(cc => 
                            renderCostCenterCard(cc, expandedId === cc.cost_center_id)
                        )
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                             ไม่พบข้อมูล {currentTab.label}
                         </div>
                    )
                ) : activeTab === 'project' ? (
                     paginatedData.length > 0 ? (
                        (paginatedData as Project[]).map(project => 
                            renderProjectCard(project, expandedId === project.project_id)
                        )
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                             ไม่พบข้อมูล {currentTab.label}
                         </div>
                    )
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p>{currentTab.label} - Coming Soon</p>
                    </div>
                )}
            </div>

            {/* Pagination Footer - Hide for Item Master (it has its own SmartTable pagination) */}
            {!isLoading && totalItems > 0 && activeTab !== 'item' && (
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
            {/* Item Master modals are handled within ItemMasterList */}
        </div>
    );
}
