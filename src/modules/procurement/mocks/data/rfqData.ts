import type { RFQHeader, RFQStatus, RFQVendor, RFQVendorStatus } from '@/modules/procurement/types/rfq-types';

/**
 * Helper to generate a future date string
 */
const getFutureDate = (baseDate: string, days: number): string => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

/**
 * RFQ Mock Generator Factory
 */
const createMockRFQ = (
    index: number,
    status: RFQStatus,
    isLinked: boolean = true,
    vendorCount: number = 0
): RFQHeader => {
    const id = `rfq-${String(index).padStart(3, '0')}`;
    const rfqNo = `RFQ-2026${String(Math.floor(index / 10) + 2).padStart(2, '0')}-${String(index).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const createdDate = getFutureDate(today, -Math.floor(Math.random() * 30)); // Past 30 days
    
    const purposes = [
        'สั่งซื้อคอมพิวเตอร์และอุปกรณ์ต่อพ่วง',
        'จ้างเหมาซ่อมบำรุงระบบปรับอากาศ',
        'จัดซื้อวัสดุสำนักงานประจำเดือน',
        'จัดซื้อเฟอร์นิเจอร์สำนักงานใหม่',
        'จ้างทำความสะอาดอาคาร',
        'จัดซื้ออะไหล่เครื่องจักร',
        'จัดซื้อชุดยูนิฟอร์มพนักงาน',
    ];
    const purpose = purposes[index % purposes.length];

    // Vendor Logic
    let responseCount = 0;
    let sentCount = 0;
    let hasQuotation = false;
    
    if (status === 'SENT') {
        responseCount = vendorCount > 1 ? Math.floor(vendorCount / 2) : (vendorCount > 0 ? 1 : 0);
        // Dispatch Progress simulation: some are partially sent
        sentCount = index % 3 === 0 ? Math.max(1, Math.floor(vendorCount / 2)) : vendorCount;
    } else if (status === 'DRAFT' || status === 'CANCELLED') {
        responseCount = 0;
        sentCount = 0;
        hasQuotation = false;
    } else if (status === 'IN_PROGRESS' || status === 'CLOSED') {
        responseCount = vendorCount;
        sentCount = vendorCount; // Must have been sent to all if in progress/closed
        hasQuotation = true;
    }

    return {
        rfq_id: id,
        rfq_no: rfqNo,
        pr_id: isLinked ? `pr-${id}` : null, // Fake ID for linking
        branch_id: '1',
        rfq_date: createdDate,
        quote_due_date: status !== 'DRAFT' ? getFutureDate(createdDate, 7) : null,
        status: status,
        created_by_user_id: 'user-1',
        created_at: `${createdDate}T10:00:00Z`,
        updated_at: `${createdDate}T10:00:00Z`,
        
        // UI Display Fields
        pr_no: isLinked ? `PR-202603-${String(index * 5).padStart(4, '0')}` : null,
        ref_pr_no: isLinked ? `PR-202603-${String(index * 5).padStart(4, '0')}` : null,
        branch_name: 'สำนักงานใหญ่',
        created_by_name: ['นายจัดซื้อ หนึ่ง', 'นางสาวจัดซื้อ สอง', 'Manager A', 'System Admin'][index % 4],
        vendor_count: vendorCount,
        
        // New Required Fields
        purpose: purpose,
        responded_vendors_count: responseCount,
        sent_vendors_count: sentCount,
        has_quotation: hasQuotation,
        vendor_responded: responseCount, // Keep for compatibility if needed
        
        // Form Fields (Defaults)
        currency: 'THB',
        exchange_rate: 1,
        delivery_location: 'คลังสินค้าหลัก (Main Warehouse)',
        payment_terms: 'Credit 30 Days',
        remarks: isLinked ? 'Generated from PR' : 'Urgent Purchase (Direct RFQ)'
    };
};

// ====================================================================================
// GENERATE MOCK DATA (12 Records)
// ====================================================================================

const _mockRFQs: RFQHeader[] = [
    // 1-2: DRAFT (0 vendors — tests Zero-Vendor Trap)
    createMockRFQ(1, 'DRAFT', false, 0),   // Direct (No PR)
    createMockRFQ(2, 'DRAFT', true, 0),    // Linked
    // 3: DRAFT with vendors (tests Happy Path — checkbox list)
    createMockRFQ(3, 'DRAFT', true, 2),

    // 4-6: SENT (Waiting for Vendors)
    createMockRFQ(4, 'SENT', true, 3),     // 3 Vendors selected
    createMockRFQ(5, 'SENT', false, 2),    // Direct, 2 Vendors
    createMockRFQ(6, 'SENT', true, 5),

    // 7-9: SENT (Some more sent RFQs)
    createMockRFQ(7, 'SENT', true, 3),
    createMockRFQ(8, 'SENT', true, 4),
    createMockRFQ(9, 'SENT', false, 2),

    // NEW: TEST CASE FOR "LIMBO STATE" (has_quotation = false)
    {
        rfq_id: 'rfq-limbo-test',
        rfq_no: 'RFQ-202602-TEST',
        pr_id: 'pr-limbo-test',
        branch_id: '1',
        rfq_date: new Date().toISOString().split('T')[0],
        quote_due_date: getFutureDate(new Date().toISOString().split('T')[0], 7),
        status: 'SENT',
        created_by_user_id: 'user-1',
        created_at: `${new Date().toISOString().split('T')[0]}T10:00:00Z`,
        updated_at: `${new Date().toISOString().split('T')[0]}T10:00:00Z`,
        pr_no: 'PR-202602-TEST-PR',
        ref_pr_no: 'PR-202602-TEST-PR',
        branch_name: 'สำนักงานใหญ่',
        created_by_name: 'System Admin',
        vendor_count: 3,
        purpose: 'ทดสอบแสดงผล Limbo State (Vendors 1/3, No QT)',
        responded_vendors_count: 0,
        sent_vendors_count: 1, // Partial dispatch
        vendor_responded: 0,
        has_quotation: false,
        currency: 'THB',
        exchange_rate: 1,
        delivery_location: 'Head Office',
        payment_terms: 'Cash',
        remarks: 'Test Limbo State'
    },

    // 10-11: CANCELLED
    createMockRFQ(10, 'CANCELLED', true, 3),
    createMockRFQ(11, 'CANCELLED', true, 2),

    // 12: CANCELLED
    createMockRFQ(12, 'CANCELLED', true, 0),
];

export const MOCK_RFQS: RFQHeader[] = _mockRFQs;

// Exports for lines (empty for now)
export const MOCK_RFQ_LINES = [];

// ====================================================================================
// MOCK VENDOR DATA — Synced with Master Data
// ====================================================================================
import { MOCK_VENDORS } from '@/modules/master-data/vendor/mocks/vendorMocks';

export const VENDOR_POOL = MOCK_VENDORS.map(v => ({
    id: v.vendor_id,
    code: v.vendor_code,
    name: v.vendor_name,
    email: v.email || (v.addresses?.[0]?.email) || `sales@${v.vendor_name_en?.toLowerCase().replace(/\s+/g, '') || 'vendor'}.co.th`
}));

function generateVendorsForRFQ(rfq: RFQHeader): RFQVendor[] {
    const count = rfq.vendor_count || 0;
    if (count === 0) return [];

    const responded = rfq.responded_vendors_count || 0;

    return Array.from({ length: count }, (_, i) => {
        const vendor = VENDOR_POOL[i % VENDOR_POOL.length];
        let status: RFQVendorStatus = 'PENDING';

        if (rfq.status === 'DRAFT') {
            status = 'PENDING';
        } else if (rfq.status === 'SENT') {
            status = 'SENT';
        } else if (rfq.status === 'IN_PROGRESS' || rfq.status === 'CLOSED') {
            if (i < responded) {
                // Guarantee the 2nd responding vendor is 'DECLINED' if possible, otherwise mostly 'RESPONDED'
                status = (i === 1 || Math.random() > 0.8) ? 'DECLINED' : 'RESPONDED';
            } else {
                status = 'SENT'; // waiting
            }
        }

        return {
            rfq_vendor_id: `rv-${rfq.rfq_id}-${i + 1}`,
            rfq_id: rfq.rfq_id,
            vendor_id: vendor.id,
            sent_date: rfq.status !== 'DRAFT' ? rfq.rfq_date : null,
            sent_via: 'EMAIL',
            email_sent_to: vendor.email,
            response_date: status === 'RESPONDED' ? getFutureDate(rfq.rfq_date, i + 2) : null,
            qt_no: status === 'RESPONDED' ? `QT-2026-${String(Math.floor(Math.random() * 9000) + 1000)}` : undefined,
            status,
            remark: null,
            // UI display fields (not in RFQVendor type, but useful for mock)
            vendor_name: vendor.name,
            vendor_code: vendor.code,
        } as RFQVendor & { vendor_name: string; vendor_code: string; qt_no?: string };
    });
}

export const MOCK_RFQ_VENDORS = _mockRFQs.flatMap(generateVendorsForRFQ);
