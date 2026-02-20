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
    if (status === 'IN_PROGRESS' || status === 'CLOSED') {
        responseCount = Math.floor(Math.random() * vendorCount) + 1; // At least 1 response
        if (responseCount > vendorCount) responseCount = vendorCount;
    } else if (status === 'DRAFT' || status === 'SENT') {
        responseCount = 0;
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

    // 7-9: IN_PROGRESS (Some responses received)
    createMockRFQ(7, 'IN_PROGRESS', true, 3), // Responses > 0
    createMockRFQ(8, 'IN_PROGRESS', true, 4),
    createMockRFQ(9, 'IN_PROGRESS', false, 2),

    // 10-11: CLOSED (Awarded)
    createMockRFQ(10, 'CLOSED', true, 3),
    createMockRFQ(11, 'CLOSED', true, 2),

    // 12: CANCELLED
    createMockRFQ(12, 'CANCELLED', true, 0),
];

export const MOCK_RFQS: RFQHeader[] = _mockRFQs;

// Exports for lines (empty for now)
export const MOCK_RFQ_LINES = [];

// ====================================================================================
// MOCK VENDOR DATA — Generated per RFQ based on vendor_count
// ====================================================================================

const VENDOR_POOL = [
    { id: 'v001', code: 'V001', name: 'IT Supply Co.', email: 'sales@itsupply.co.th' },
    { id: 'v002', code: 'V002', name: 'OfficeMate', email: 'procurement@officemate.co.th' },
    { id: 'v003', code: 'V003', name: 'B2S', email: 'b2b@b2s.co.th' },
    { id: 'v004', code: 'V004', name: 'Local Store', email: 'info@localstore.co.th' },
    { id: 'v005', code: 'V005', name: 'Smart Tech', email: 'contact@smarttech.co.th' },
    { id: 'v006', code: 'V006', name: 'Industrial Part Ltd.', email: 'sales@industrialpart.co.th' },
    { id: 'v007', code: 'V007', name: 'Global Oil Co.', email: 'info@globaloil.co.th' },
];

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
            status = i < responded ? 'RESPONDED' : 'SENT';
        }

        return {
            rfq_vendor_id: `rv-${rfq.rfq_id}-${i + 1}`,
            rfq_id: rfq.rfq_id,
            vendor_id: vendor.id,
            sent_date: rfq.status !== 'DRAFT' ? rfq.rfq_date : null,
            sent_via: 'EMAIL',
            email_sent_to: vendor.email,
            response_date: status === 'RESPONDED' ? getFutureDate(rfq.rfq_date, i + 2) : null,
            status,
            remark: null,
            // UI display fields (not in RFQVendor type, but useful for mock)
            vendor_name: vendor.name,
            vendor_code: vendor.code,
        } as RFQVendor & { vendor_name: string; vendor_code: string };
    });
}

export const MOCK_RFQ_VENDORS = _mockRFQs.flatMap(generateVendorsForRFQ);
