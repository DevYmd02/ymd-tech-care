/**
 * @file VendorSearchModal.tsx
 * @description Modal สำหรับค้นหาและเลือกผู้ขาย (Vendor)
 * @usage เรียกใช้งานจาก PRHeader.tsx เมื่อกดปุ่ม "..."
 * @refactored ใช้ SearchModal component และ centralized types จาก vendor-types.ts
 */

import React, { useState, useEffect } from 'react';
import { SearchModal, type ColumnDef } from './SearchModal';
import { vendorService } from '../../services/vendorService';
import type { VendorSearchItem } from '../../types/vendor-types';

// Re-export for backward compatibility
export type Vendor = VendorSearchItem;

/** Props ของ VendorSearchModal */
interface Props {
    isOpen: boolean;                           // สถานะเปิด/ปิด Modal
    onClose: () => void;                       // Callback เมื่อปิด Modal
    onSelect: (vendor: VendorSearchItem) => void; // Callback เมื่อเลือกผู้ขาย
}

// ====================================================================================
// MOCK DATA - Fallback เมื่อ API ไม่พร้อม
// ====================================================================================

const FALLBACK_VENDORS: VendorSearchItem[] = [
    { code: 'V001', name: 'บริษัท ไอทีซัพพลาย จำกัด', address: '123 ถ.พระราม4 คลองเตย กทม.' },
    { code: 'V002', name: 'บริษัท ออฟฟิศเมท จำกัด', address: '456 ถ.สุขุมวิท วัฒนา กทม.' },
    { code: 'V003', name: 'บริษัท เทคโนโลยี โซลูชั่น จำกัด', address: '789 ถ.รัชดาภิเษก ห้วยขวาง กทม.' },
];

// ====================================================================================
// COLUMN CONFIGURATION
// ====================================================================================

const vendorColumns: ColumnDef<VendorSearchItem>[] = [
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
            <span className="text-xs text-gray-500 truncate">{v.address || '-'}</span>
        )
    },
];

// ====================================================================================
// COMPONENT - VendorSearchModal
// ====================================================================================

export const VendorSearchModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
    const [vendors, setVendors] = useState<VendorSearchItem[]>(FALLBACK_VENDORS);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch vendors when modal opens - fallback to mock if API fails
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;

        const fetchVendors = async () => {
            try {
                const data = await vendorService.getDropdown();
                if (!isMounted) return;

                if (data.length > 0) {
                    // Transform API data to VendorSearchItem format
                    const apiVendors: VendorSearchItem[] = data.map(v => ({
                        code: v.vendor_code,
                        name: v.vendor_name,
                        address: '',
                    }));
                    setVendors(apiVendors);
                } else {
                    // Fallback to mock data
                    setVendors(FALLBACK_VENDORS);
                }
            } catch {
                // Fallback to mock data on error
                if (isMounted) {
                    setVendors(FALLBACK_VENDORS);
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
        <SearchModal<VendorSearchItem>
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
