/**
 * @file VendorSearchModal.tsx
 * @description Modal สำหรับค้นหาและเลือกผู้ขาย (Vendor)
 * @usage เรียกใช้งานจาก PRHeader.tsx เมื่อกดปุ่ม "..."
 * @refactored ใช้ SearchModal component เพื่อลด duplicate code
 */

import React from 'react';
import { SearchModal, type ColumnDef } from './SearchModal';
import { MOCK_VENDORS, type Vendor } from '../../mocks/vendors';

// Re-export Vendor type for consumers
export type { Vendor } from '../../mocks/vendors';

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
    return (
        <SearchModal<Vendor>
            isOpen={isOpen}
            onClose={onClose}
            onSelect={onSelect}
            title="ค้นหาผู้ขาย"
            subtitle="กรอกข้อมูลเพื่อค้นหาผู้ขายในระบบ"
            searchLabel="รหัสผู้ขายหรือชื่อผู้ขาย"
            searchPlaceholder="รหัสผู้ขายหรือชื่อผู้ขาย"
            accentColor="emerald"
            data={MOCK_VENDORS}
            columns={vendorColumns}
            filterFn={(v, term) =>
                v.code.toLowerCase().includes(term) ||
                v.name.toLowerCase().includes(term)
            }
            getKey={(v) => v.code}
            emptyText="ไม่พบผู้ขายที่ค้นหา"
        />
    );
};
