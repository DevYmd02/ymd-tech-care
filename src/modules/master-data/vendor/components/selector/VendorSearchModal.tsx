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
import { Check, Building2 } from 'lucide-react';
import { DialogFormLayout } from '@ui';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { VendorStatusBadge } from '@/modules/master-data/vendor/components/VendorStatusBadge';
import type { 
    VendorListItem, 
    VendorSearchItem 
} from '@/modules/master-data/vendor/types/vendor-types';
import { logger } from '@/shared/utils/logger';

// Re-export for backward compatibility
export type Vendor = VendorSearchItem;

// ====================================================================================
// HELPER: Transform VendorMaster to VendorSearchItem
// ====================================================================================

const transformVendor = (v: VendorListItem): VendorSearchItem => ({
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
    status: v.status,
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

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            titleIcon={<Building2 size={24} />}
            width="max-w-6xl" // Maps to xl
        >
            <div className="flex flex-col h-full max-h-[75vh]">
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
                                        สถานะ
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
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                                        ที่อยู่
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredData.length > 0 ? (
                                    filteredData.map((vendor) => {
                                        const isSelectable = vendor.status === 'ACTIVE';
                                        return (
                                            <tr 
                                                key={vendor.code} 
                                                className={`transition-colors group ${!isSelectable ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60' : 'hover:bg-purple-50 dark:hover:bg-gray-700/50'}`}
                                            >
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleSelect(vendor)}
                                                        disabled={!isSelectable}
                                                        title={!isSelectable ? `ไม่สามารถเลือกได้ (${vendor.status})` : 'เลือกผู้ขาย'}
                                                        className={`px-3 py-1.5 text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-1 mx-auto ${
                                                            isSelectable 
                                                            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <Check size={14} />
                                                        เลือก
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {vendor.status && <VendorStatusBadge status={vendor.status} />}
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
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-500 truncate max-w-[200px]">
                                                    {vendor.address || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
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
        </DialogFormLayout>
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
    const [vendors, setVendors] = useState<VendorSearchItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch vendors when modal opens
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;

        const fetchVendors = async () => {
            setIsLoading(true);
            try {
                const response = await VendorService.getList();
                if (!isMounted) return;

                if (response.items && response.items.length > 0) {
                    const items: VendorSearchItem[] = response.items.map(transformVendor);
                    setVendors(items);
                } else {
                    setVendors([]);
                }
            } catch (error) {
                logger.error('[VendorSearchModal] fetchVendors error:', error);
                if (isMounted) {
                    setVendors([]);
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