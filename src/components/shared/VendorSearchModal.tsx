/**
 * @file VendorSearchModal.tsx
 * @description Modal สำหรับค้นหาและเลือกผู้ขาย (Vendor) - Redesigned UI
 * 
 * @features
 * - Purple search button for vendor code/tax ID search
 * - Filter by vendor name and tax ID
 * - Data table matching schema: vendor_code, vendor_name, tax_id, phone, address
 * - Deep clone on selection to prevent mutation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, Building2 } from 'lucide-react';
import { vendorService } from '../../services/vendorService';
import type { VendorMaster, VendorSearchItem } from '../../types/vendor-types';
import { MOCK_VENDORS } from '../../__mocks__';

// Re-export for backward compatibility
export type Vendor = VendorSearchItem;

// ====================================================================================
// HELPER: Transform VendorMaster to VendorSearchItem
// ====================================================================================

const transformVendor = (v: VendorMaster): VendorSearchItem => ({
    vendor_id: v.vendor_id,
    code: v.vendor_code,
    name: v.vendor_name,
    name_en: v.vendor_name_en,
    address: v.address_line1 || '-',
    phone: v.phone,
    email: v.email,
    taxId: v.tax_id,
    payment_term_days: v.payment_term_days,
    vat_registered: v.vat_registered,
    is_active: v.is_active ?? v.status === 'ACTIVE',
});

// ====================================================================================
// PROPS
// ====================================================================================

/** Props for VendorSearchModalBase - Dumb Component */
export interface VendorSearchModalBaseProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (vendor: VendorSearchItem) => void;
    /** Vendor data to display - passed from parent */
    data: VendorSearchItem[];
    /** Loading state indicator */
    isLoading?: boolean;
    /** Custom title */
    title?: string;
}

/** Props for VendorSearchModal - Smart Wrapper */
interface VendorSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (vendor: VendorSearchItem) => void;
}

// ====================================================================================
// BASE COMPONENT - Pure/Dumb Component (Receives data via props)
// ====================================================================================

export const VendorSearchModalBase: React.FC<VendorSearchModalBaseProps> = ({
    isOpen,
    onClose,
    onSelect,
    data,
    isLoading = false,
    title = 'ค้นหาผู้ขาย - Find Vendor',
}) => {
    // Filter states
    const [searchCode, setSearchCode] = useState('');
    const [searchName, setSearchName] = useState('');
    const [searchTaxId, setSearchTaxId] = useState('');
    const [filteredData, setFilteredData] = useState<VendorSearchItem[]>(data);

    // Update filtered data when data or filters change
    useEffect(() => {
        let result = [...data];

        if (searchCode.trim()) {
            const term = searchCode.toLowerCase();
            result = result.filter(v => 
                v.code.toLowerCase().includes(term) ||
                v.taxId?.toLowerCase().includes(term)
            );
        }

        if (searchName.trim()) {
            const term = searchName.toLowerCase();
            result = result.filter(v => v.name.toLowerCase().includes(term));
        }

        if (searchTaxId.trim()) {
            const term = searchTaxId.toLowerCase();
            result = result.filter(v => v.taxId?.toLowerCase().includes(term));
        }

        setFilteredData(result);
    }, [data, searchCode, searchName, searchTaxId]);

    // Reset filters when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchCode('');
            setSearchName('');
            setSearchTaxId('');
        }
    }, [isOpen]);

    // Handle selection with deep clone to prevent mutation
    const handleSelect = useCallback((vendor: VendorSearchItem) => {
        const clonedVendor = structuredClone(vendor);
        onSelect(clonedVendor);
        onClose();
    }, [onSelect, onClose]);

    // Handle click outside to close
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* ==================== HEADER ==================== */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Building2 className="text-white" size={24} />
                        <div>
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                            <p className="text-purple-100 text-sm">เลือกผู้ขายจากรายการ Master Data</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* ==================== SEARCH & FILTER SECTION ==================== */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search by Code / Tax ID */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                รหัสผู้ขาย / เลขผู้เสียภาษี
                            </label>
                            <input
                                type="text"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                placeholder="V001 หรือ 0105562012345"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Filter by Vendor Name */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                ชื่อผู้ขาย
                            </label>
                            <input
                                type="text"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                placeholder="ค้นหาชื่อผู้ขาย..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Filter by Tax ID */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                เลขผู้เสียภาษี (Tax ID)
                            </label>
                            <input
                                type="text"
                                value={searchTaxId}
                                onChange={(e) => setSearchTaxId(e.target.value)}
                                placeholder="0105562012345"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* ==================== DATA TABLE ==================== */}
                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                            <span className="ml-3 text-gray-600 dark:text-gray-300">กำลังโหลดข้อมูล...</span>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase w-20">
                                        เลือก
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase w-28">
                                        รหัสผู้ขาย
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                                        ชื่อผู้ขาย
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase w-36">
                                        เลขผู้เสียภาษี
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase w-32">
                                        เบอร์โทร
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                                        ที่อยู่
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase w-20">
                                        VAT
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredData.length > 0 ? (
                                    filteredData.map((vendor) => (
                                        <tr 
                                            key={vendor.code} 
                                            className="hover:bg-purple-50 dark:hover:bg-gray-700/50 transition-colors group"
                                        >
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleSelect(vendor)}
                                                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-1 mx-auto"
                                                >
                                                    <Check size={14} />
                                                    เลือก
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-purple-600 dark:text-purple-400">
                                                    {vendor.code}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800 dark:text-gray-200">
                                                    {vendor.name}
                                                </div>
                                                {vendor.name_en && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {vendor.name_en}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                {vendor.taxId || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {vendor.phone || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-500 truncate max-w-[200px]">
                                                {vendor.address || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {vendor.vat_registered ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                        VAT
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                            <Building2 size={48} className="mx-auto mb-3 opacity-30" />
                                            <p className="text-lg font-medium">ไม่พบผู้ขายที่ค้นหา</p>
                                            <p className="text-sm">ลองเปลี่ยนคำค้นหาหรือเพิ่มผู้ขายใหม่ใน Master Data</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ==================== FOOTER ==================== */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        พบ <span className="font-bold text-purple-600">{filteredData.length}</span> รายการ
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    );
};

// ====================================================================================
// SMART WRAPPER - Handles data fetching (Backward Compatible)
// ====================================================================================

/**
 * VendorSearchModal - Smart Component (Handles fetching)
 * 
 * @description Wrapper ที่ fetch data แล้วส่งต่อให้ VendorSearchModalBase
 * @usage ใช้เมื่อต้องการให้ component จัดการ fetch เอง (backward compatible)
 */
export const VendorSearchModal: React.FC<VendorSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
    // Initialize with MOCK_VENDORS for immediate display
    const [vendors, setVendors] = useState<VendorSearchItem[]>(() => MOCK_VENDORS.map(transformVendor));
    const [isLoading, setIsLoading] = useState(false);

    // Fetch vendors when modal opens
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;

        const fetchVendors = async () => {
            setIsLoading(true);
            try {
                // Try getting from service first
                const response = await vendorService.getList({ status: 'ACTIVE' });
                if (!isMounted) return;

                if (response.data.length > 0) {
                    // Transform API data to VendorSearchItem format
                    const items: VendorSearchItem[] = response.data.map(v => ({
                        vendor_id: v.vendor_id,
                        code: v.vendor_code,
                        name: v.vendor_name,
                        name_en: v.vendor_name_en,
                        phone: v.phone,
                        email: v.email,
                        taxId: v.tax_id,
                        address: '-',
                        is_active: v.status === 'ACTIVE',
                    }));
                    setVendors(items);
                } else {
                    // Fallback to mock data
                    setVendors(MOCK_VENDORS.map(transformVendor));
                }
            } catch {
                // On error, fallback to mock data
                if (isMounted) {
                    setVendors(MOCK_VENDORS.map(transformVendor));
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchVendors();

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    return (
        <VendorSearchModalBase
            isOpen={isOpen}
            onClose={onClose}
            onSelect={onSelect}
            data={vendors}
            isLoading={isLoading}
        />
    );
};
