/**
 * @file VendorSearchModal.tsx
 * @description Modal สำหรับค้นหาและเลือกผู้ขาย (Vendor)
 * 
 * @refactored 2026-01-22: Decoupled data fetching from UI
 * - VendorSearchModalBase: Pure/Dumb component ที่รับ data ผ่าน props
 * - VendorSearchModal: Smart wrapper ที่ fetch data และส่งต่อให้ Base
 */

import React, { useState, useEffect } from 'react';
import { SearchModal, type ColumnDef } from './SearchModal';
import { vendorService } from '../../services/vendorService';
import type { VendorSearchItem } from '../../types/vendor-types';
import { MOCK_VENDORS } from '../../__mocks__';

// Re-export for backward compatibility
export type Vendor = VendorSearchItem;

// ====================================================================================
// COLUMN CONFIGURATION (Shared)
// ====================================================================================

const vendorColumns: ColumnDef<VendorSearchItem>[] = [
    { key: 'action', header: 'เลือก', width: '60px', align: 'center' },
    {
        key: 'code', header: 'รหัสผู้ขาย', width: '180px', render: (v) => (
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{v.code}</span>
        )
    },
    {
        key: 'name', header: 'ชื่อผู้ขาย', width: '250px', render: (v) => (
            <span className="text-sm text-gray-800 dark:text-gray-200">{v.name}</span>
        )
    },
    {
        key: 'phone', header: 'ชื่อผู้ขาย (ENG)', width: '200px', render: (v) => (
            <span className="text-xs text-gray-600 dark:text-gray-400">{v.phone || '-'}</span>
        )
    },
    {
        key: 'address', header: 'ที่อยู่', width: '1fr', render: (v) => (
            <span className="text-xs text-gray-500 dark:text-gray-500 truncate">{v.address || '-'}</span>
        )
    },
];

// ====================================================================================
// BASE COMPONENT - Pure/Dumb Component (Receives data via props)
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
    /** Custom subtitle */
    subtitle?: string;
    /** Custom empty text */
    emptyText?: string;
}

/**
 * VendorSearchModalBase - Pure/Dumb Component
 * 
 * @description รับ data ผ่าน props ไม่ fetch เอง - สามารถ reuse ได้ง่าย
 * @usage ใช้เมื่อต้องการควบคุม data source เอง
 * 
 * @example
 * ```tsx
 * const myVendors = [...];
 * <VendorSearchModalBase 
 *   isOpen={open} 
 *   onClose={close} 
 *   onSelect={handleSelect}
 *   data={myVendors}
 * />
 * ```
 */
export const VendorSearchModalBase: React.FC<VendorSearchModalBaseProps> = ({
    isOpen,
    onClose,
    onSelect,
    data,
    isLoading = false,
    title = 'ค้นหาผู้ขาย - Find Vendor',
    subtitle,
    emptyText,
}) => {
    const displaySubtitle = subtitle ?? (isLoading ? 'กำลังโหลด...' : 'ค้นหารหัส หรือ ชื่อผู้ขาย...');
    const displayEmptyText = emptyText ?? (isLoading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบผู้ขายที่ค้นหา');

    return (
        <SearchModal<VendorSearchItem>
            isOpen={isOpen}
            onClose={onClose}
            onSelect={onSelect}
            title={title}
            subtitle={displaySubtitle}
            searchLabel="ค้นหา"
            searchPlaceholder="ค้นหารหัส หรือ ชื่อผู้ขาย..."
            accentColor="blue"
            data={data}
            columns={vendorColumns}
            filterFn={(v, term) =>
                v.code.toLowerCase().includes(term) ||
                v.name.toLowerCase().includes(term) ||
                (v.phone?.toLowerCase().includes(term) || false)
            }
            getKey={(v) => v.code}
            emptyText={displayEmptyText}
        />
    );
};

// ====================================================================================
// SMART WRAPPER - Handles data fetching (Backward Compatible)
// ====================================================================================

/** Props for VendorSearchModal - Smart Wrapper */
interface VendorSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (vendor: VendorSearchItem) => void;
}

/**
 * Transform MOCK_VENDORS to VendorSearchItem format
 */
const transformMockVendors = (): VendorSearchItem[] => {
    if (MOCK_VENDORS.length === 0) return [];
    return MOCK_VENDORS.map(v => ({
        code: v.vendor_code,
        name: v.vendor_name,
        address: [v.address_line1, v.address_line2].filter(Boolean).join(' ') || '-',
        phone: v.phone,
        taxId: v.tax_id,
    }));
};

/**
 * VendorSearchModal - Smart Component (Handles fetching)
 * 
 * @description Wrapper ที่ fetch data แล้วส่งต่อให้ VendorSearchModalBase
 * @usage ใช้เมื่อต้องการให้ component จัดการ fetch เอง (backward compatible)
 * 
 * @example
 * ```tsx
 * <VendorSearchModal 
 *   isOpen={open} 
 *   onClose={close} 
 *   onSelect={handleSelect}
 * />
 * ```
 */
export const VendorSearchModal: React.FC<VendorSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [vendors, setVendors] = useState<VendorSearchItem[]>(transformMockVendors());
    const [isLoading, setIsLoading] = useState(false);

    // Fetch vendors when modal opens
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;

        const fetchVendors = async () => {
            try {
                const data = await vendorService.getDropdown();
                if (!isMounted) return;

                if (data.length > 0) {
                    const apiVendors: VendorSearchItem[] = data.map(v => ({
                        code: v.vendor_code,
                        name: v.vendor_name,
                        address: '',
                    }));
                    setVendors(apiVendors);
                } else {
                    setVendors(transformMockVendors());
                }
            } catch {
                if (isMounted) {
                    setVendors(transformMockVendors());
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        setIsLoading(true);
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
