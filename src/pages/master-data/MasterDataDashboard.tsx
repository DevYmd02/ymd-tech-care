/**
 * @file MasterDataDashboard.tsx
 * @description หน้า Master Data Management - ตามดีไซน์ใหม่
 * @purpose แสดง Tab-based navigation สำหรับ Master Data ต่างๆ พร้อม Card-based list และ Database Relations
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Database, Users, Package, Building2, Warehouse as WarehouseIcon, 
    DollarSign, FolderKanban, Plus, Search, Filter, Edit2, Trash2,
    ChevronDown, ChevronUp, Phone, Mail, MapPin
} from 'lucide-react';
import { styles } from '../../constants';

// Import mock data
import { mockBranches, mockWarehouses, mockItemTypes } from '../../__mocks__/masterDataMocks';
import { vendorService } from '../../services/vendorService';

// Import Form Modals
import { VendorFormModal } from './vendor';
import { BranchFormModal } from './branch';
import { WarehouseFormModal } from './warehouse';
import { ItemMasterList } from './item-master';

// Import types
import type { VendorListItem } from '../../types/vendor-types';
import type { 
    BranchListItem, 
    WarehouseListItem, 
} from '../../types/master-data-types';

// ====================================================================================
// TYPES
// ====================================================================================

type TabType = 'vendor' | 'item' | 'branch' | 'warehouse' | 'cost-center' | 'project';

interface TabConfig {
    id: TabType;
    label: string;
    labelEn: string;
    icon: React.ElementType;
    recordCount: number;
    dbTable: string;
    relations: string[];
    fk: string;
}

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
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Data states
    const [vendors, setVendors] = useState<VendorListItem[]>([]);
    const [branches, setBranches] = useState<BranchListItem[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseListItem[]>([]);


    // Tab configs with record counts
    const tabs: TabConfig[] = [
        { id: 'vendor', label: 'Vendor', labelEn: 'ผู้ขาย', icon: Users, recordCount: vendors.length, ...DB_RELATIONS['vendor'] },
        { id: 'item', label: 'Item', labelEn: 'สินค้า', icon: Package, recordCount: mockItemTypes.length, ...DB_RELATIONS['item'] },
        { id: 'branch', label: 'Branch', labelEn: 'สาขา', icon: Building2, recordCount: mockBranches.length, ...DB_RELATIONS['branch'] },
        { id: 'warehouse', label: 'Warehouse', labelEn: 'คลัง', icon: WarehouseIcon, recordCount: mockWarehouses.length, ...DB_RELATIONS['warehouse'] },
        { id: 'cost-center', label: 'Cost Center', labelEn: '', icon: DollarSign, recordCount: 4, ...DB_RELATIONS['cost-center'] },
        { id: 'project', label: 'Project', labelEn: 'โครงการ', icon: FolderKanban, recordCount: 3, ...DB_RELATIONS['project'] },
    ];

    // Fetch Data
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
            case 'item':
                // Item Master uses its own list component for now
                break;
            case 'cost-center':
            case 'project':
                // Mock data for now
                break;
        }
        
        setTimeout(() => setIsLoading(false), 200);
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setSearchParams({ tab: activeTab });
        setSearchTerm('');
        setExpandedId(null);
    }, [activeTab, setSearchParams]);

    // Handlers
    const handleTabChange = (tabId: TabType) => {
        setActiveTab(tabId);
    };

    const handleAddNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('ต้องการลบข้อมูลนี้หรือไม่?')) {
            if (activeTab === 'vendor') {
                await vendorService.delete(id);
            }
            fetchData();
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
        fetchData();
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Get current tab config
    const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

    // Get tab label with Thai name
    const getTabLabel = () => {
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
        
        switch (activeTab) {
            case 'vendor':
                return vendors.filter(v => 
                    v.vendor_code.toLowerCase().includes(term) ||
                    v.vendor_name.toLowerCase().includes(term) ||
                    v.tax_id?.toLowerCase().includes(term)
                );
            case 'branch':
                return branches.filter(b =>
                    b.branch_code.toLowerCase().includes(term) ||
                    b.branch_name.toLowerCase().includes(term)
                );
            case 'warehouse':
                return warehouses.filter(w =>
                    w.warehouse_code.toLowerCase().includes(term) ||
                    w.warehouse_name.toLowerCase().includes(term)
                );
            default:
                return [];
        }
    };

    // ====================================================================================
    // RENDER HELPERS
    // ====================================================================================

    const renderVendorCard = (vendor: VendorListItem, isExpanded: boolean) => (
        <div key={vendor.vendor_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Card Header */}
            <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => toggleExpand(vendor.vendor_id)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <Users size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {vendor.vendor_name}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                    vendor.status === 'ACTIVE' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {vendor.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                Code: {vendor.vendor_code} | Tax ID: {vendor.tax_id || '-'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">30 days</p>
                            <p className="text-xs text-gray-500">Payment Term</p>
                        </div>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
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
                                    789 ถนนสุขุมวิท กรุงเทพฯ
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
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Edit2 size={16} />
                            Edit
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(vendor.vendor_id); }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
                        <div className="grid grid-cols-3 gap-4 text-sm">
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                            <Building2 size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {branch.branch_name}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                    branch.is_active 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {branch.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                Code: {branch.branch_code}
                            </p>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>
            {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex gap-2 mb-4">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(branch.branch_id); }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Edit2 size={16} /> Edit
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(branch.branch_id); }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                        <Database size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            Master Data Management
                        </h1>
                        <p className="text-sm text-gray-500">
                            จัดการข้อมูลหลักสำหรับระบบจัดซื้อ - ครบถ้วนพร้อม Table Relationships
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                                activeTab === tab.id
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                        >
                            <div className={`p-3 rounded-xl ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                            }`}>
                                <tab.icon size={24} />
                            </div>
                            <div className="text-center">
                                <p className={`text-sm font-medium ${
                                    activeTab === tab.id
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                    {tab.label} {tab.labelEn && `(${tab.labelEn})`}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {tab.recordCount} records
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Section Header */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                        <currentTab.icon size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                            {getTabLabel().main}
                        </h2>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            {getTabLabel().desc}
                        </p>
                    </div>
                </div>
                {activeTab !== 'item' && (
                <button
                    onClick={handleAddNew}
                    className={`${styles.btnPrimary} flex items-center gap-2`}
                >
                    <Plus size={20} />
                    Add New
                </button>
                )}
            </div>

            {/* Search & Filter - Hide for Item tab as it has its own */}
            {activeTab !== 'item' && (
            <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={`Search ${currentTab.label} (${currentTab.labelEn})...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Filter size={20} className="text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">Filter</span>
                </button>
            </div>
            )}

            {/* Data Cards */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">กำลังโหลดข้อมูล...</span>
                    </div>
                ) : activeTab === 'vendor' ? (
                    getFilteredData().length > 0 ? (
                        (getFilteredData() as VendorListItem[]).map(vendor => 
                            renderVendorCard(vendor, expandedId === vendor.vendor_id)
                        )
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            ไม่พบข้อมูล {currentTab.label}
                        </div>
                    )
                ) : activeTab === 'branch' ? (
                    getFilteredData().length > 0 ? (
                        (getFilteredData() as BranchListItem[]).map(branch => 
                            renderBranchCard(branch, expandedId === branch.branch_id)
                        )
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            ไม่พบข้อมูล {currentTab.label}
                        </div>
                    )
                ) : activeTab === 'item' ? (
                     <ItemMasterList />
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p>{currentTab.label} - Coming Soon</p>
                    </div>
                )}
            </div>

            {/* Form Modals */}
            <VendorFormModal isOpen={isModalOpen && activeTab === 'vendor'} onClose={handleModalClose} />
            <BranchFormModal isOpen={isModalOpen && activeTab === 'branch'} onClose={handleModalClose} editId={editingId} />
            <WarehouseFormModal isOpen={isModalOpen && activeTab === 'warehouse'} onClose={handleModalClose} editId={editingId} />
            {/* Item Master modals are handled within ItemMasterList */}
        </div>
    );
}
