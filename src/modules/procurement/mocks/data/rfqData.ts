import type { RFQHeader, RFQStatus } from '@/modules/procurement/types/rfq-types';

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
    // 1-3: DRAFT (Mixed Linked/Direct)
    createMockRFQ(1, 'DRAFT', false, 0),   // Direct (No PR)
    createMockRFQ(2, 'DRAFT', true, 0),    // Linked
    createMockRFQ(3, 'DRAFT', true, 0),

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

// Exports for lines and vendors (empty for now or could be generated too)
export const MOCK_RFQ_LINES = [];
export const MOCK_RFQ_VENDORS = [];
