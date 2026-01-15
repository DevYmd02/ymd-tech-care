/**
 * @file VendorSearchModal.tsx
 * @description Modal สำหรับค้นหาและเลือกผู้ขาย (Vendor)
 * @usage เรียกใช้งานจาก PRHeader.tsx เมื่อกดปุ่ม "..."
 * @refactored ใช้ SearchModal component และ centralized types
 */

import React, { useState, useEffect } from 'react';
import { SearchModal, type ColumnDef } from './SearchModal';
import { vendorService } from '../../services/vendorService';
import { LEGACY_VENDORS } from '../../mocks/vendors';
import type { VendorDropdownItem } from '../../types/vendor-types';

// Re-export Vendor type for backward compatibility
export interface Vendor {
    code: string;
    name: string;
    address: string;
    contact?: string;
    phone?: string;
    taxId?: string;
}

/** Props ของ VendorSearchModal */
interface Props {
    isOpen: boolean;                    // สถานะเปิด/ปิด Modal
    onClose: () => void;                // Callback เมื่อปิด Modal
    onSelect: (vendor: Vendor) => void; // Callback เมื่อเลือกผู้ขาย
}

// ====================================================================================
// COLUMN CONFIGURATION
// ====================================================================================

const vendorColumns: ColumnDef<Vendor>[] = [
    { key: 'action', header: 'เลือก', width: '80px', align: 'center' },
    {
        key: 'code', header: 'รหัสผู้ขาย', width: '100px', render: (v) => (
            <span className="text-sm font-bold text-emerald-600">{v.code}</span>
        )
    },
    {
        key: 'name', header: 'ชื่อผู้ขาย', width: '1fr', render: (v) => (
            <span className="text-sm text-gray-700">{v.name}</span>
        )
    },
    {
        key: 'address', header: 'ที่อยู่', width: '1fr', render: (v) => (
            <span className="text-xs text-gray-500 truncate">{v.address}</span>
        )
    },
];

// ====================================================================================
// COMPONENT - VendorSearchModal
// ====================================================================================

export const VendorSearchModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
    const [vendors, setVendors] = useState<Vendor[]>(LEGACY_VENDORS);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch vendors when modal opens - fallback to mock if API fails
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            vendorService.getDropdown()
                .then((data: VendorDropdownItem[]) => {
                    if (data.length > 0) {
                        // Use API data if available
                        const apiVendors: Vendor[] = data.map(v => ({
                            code: v.vendor_code,
                            name: v.vendor_name,
                            address: '',
                        }));
                        setVendors(apiVendors);
                    } else {
                        // Fallback to mock data
                        setVendors(LEGACY_VENDORS);
                    }
                })
                .catch(() => {
                    // Fallback to mock data on error
                    setVendors(LEGACY_VENDORS);
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen]);

    return (
        <SearchModal<Vendor>
            isOpen={isOpen}
            onClose={onClose}
            onSelect={onSelect}
            title="ค้นหาผู้ขาย"
            subtitle={isLoading ? 'กำลังโหลด...' : 'กรอกข้อมูลเพื่อค้นหาผู้ขายในระบบ'}
            searchLabel="รหัสผู้ขายหรือชื่อผู้ขาย"
            searchPlaceholder="รหัสผู้ขายหรือชื่อผู้ขาย"
            accentColor="emerald"
            data={vendors}
            columns={vendorColumns}
            filterFn={(v, term) =>
                v.code.toLowerCase().includes(term) ||
                v.name.toLowerCase().includes(term)
            }
            getKey={(v) => v.code}
            emptyText={isLoading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบผู้ขายที่ค้นหา'}
        />
    );
};
