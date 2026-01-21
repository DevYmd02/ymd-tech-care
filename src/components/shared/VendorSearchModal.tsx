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
import { RELATED_VENDORS } from '../../__mocks__/relatedMocks';

// Re-export for backward compatibility
export type Vendor = VendorSearchItem;

/** Props ของ VendorSearchModal */
interface Props {
    isOpen: boolean;                           // สถานะเปิด/ปิด Modal
    onClose: () => void;                       // Callback เมื่อปิด Modal
    onSelect: (vendor: VendorSearchItem) => void; // Callback เมื่อเลือกผู้ขาย
}

// ====================================================================================
// MOCK DATA - Fallback เมื่อ API ไม่พร้อม (ใช้ข้อมูลจาก relatedMocks)
// ====================================================================================

const FALLBACK_VENDORS: VendorSearchItem[] = RELATED_VENDORS.length > 0
    ? RELATED_VENDORS.map(v => ({
        code: v.vendor_code,
        name: v.vendor_name,
        address: [v.address_line1, v.address_line2].filter(Boolean).join(' ') || '-',
        phone: v.phone,
        taxId: v.tax_id,
    }))
    : [
        { code: 'EQ-ASS-BBP-003', name: 'หจก. ปะกาจัง จำกัด', address: 'เลขที่22/3อาทิตย์ ต่างประเทศปร ต.บางบอ' },
        { code: 'EQ-ASS-SLL-004', name: 'สมหมาย สามเสน จำกัด', address: 'เลขที่22/3ธนัว ต่างประเทศรวมสุข อ.บางบวง' },
        { code: 'EQ-ASS-SLO-013', name: 'สต๊าฟ ไลท์ องมีแวน จำกัด', address: 'อาคารนครสยม การวงค์ ชีลอบสุระ E907-910 เลข' },
        { code: 'EQ-ASS-SRR-005', name: 'สมหมาย สามเสน จำกัด', address: 'เลขที่20 ซอมพุทธรณาคร4 ถนนพรรณาคร' },
        { code: 'EQ-ASS-VSC-006', name: 'บริษัท วีอธซีคอม จำกัด', address: 'เลขที่ 2002/250 สุรสคพ หลานสาม', phone: 'VSHOP COMPUTER CO.,LTD' },
        { code: 'EQ-ASS-WST-002', name: 'เจริญ สมเด็น จงยุทใ (ประเทศไทย) จำกัด', address: 'อาคารสำรัตรกธานาคี ชั้น6 อาทิตปะคอบ อา ทิต440,442 >' },
        { code: 'EQ-CAL-A&P-001', name: 'เอ แอนด์ พี ทันรื้อ 1351', address: 'เลขที่ 174 ถนนม เอกชัย แขวงสองหายพระ' },
        { code: 'EQ-FOK-APM-001', name: 'เอ พี.ซัม. มาร์เคติ้ง เอครีจิ้ม เจาอมีค', address: '552 ซอมสุจิงกรุ 57 ถนนเอริงกรุ แขวงส' },
        { code: 'EQ-GAD-WRW-001', name: 'วรงษ์ เข็มเรือ', address: '24 ซ.เรียงเหนือส 1/1 ถนม เจาพาวาเวร เงค' },
        { code: 'EQ-OEQ-ACT-002', name: 'แอคทีฟ ไมทีค จำกัด', address: '69/138 ถนนตำหทท 56 ระงบวอว ทรีพา' },
    ];

// ====================================================================================
// COLUMN CONFIGURATION
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
            title="ค้นหาผู้ขาย - Find Vendor"
            subtitle={isLoading ? 'กำลังโหลด...' : 'ค้นหารหัส หรือ ชื่อผู้ขาย...'}
            searchLabel="ค้นหา"
            searchPlaceholder="ค้นหารหัส หรือ ชื่อผู้ขาย..."
            accentColor="blue"
            data={vendors}
            columns={vendorColumns}
            filterFn={(v, term) =>
                v.code.toLowerCase().includes(term) ||
                v.name.toLowerCase().includes(term) ||
                (v.phone?.toLowerCase().includes(term) || false)
            }
            getKey={(v) => v.code}
            emptyText={isLoading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบผู้ขายที่ค้นหา'}
        />
    );
};
