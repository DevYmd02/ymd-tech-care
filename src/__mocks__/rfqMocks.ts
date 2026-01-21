export interface MockRFQItem {
    rfq_id: string;
    rfq_no: string;
    description: string;
    created_date: string;
    valid_until: string;
    status: 'DRAFT' | 'SENT' | 'CLOSED';
    vendor_count: number;
    vendor_responded: number;
    pr_id: string; // Link to PR
}

export const RFQ_MOCKS: MockRFQItem[] = [
    {
        rfq_id: '1',
        rfq_no: 'RFQ2024-001',
        description: 'RFQ สำหรับ PR2024-001',
        created_date: '2024-01-15',
        valid_until: '2024-01-25',
        status: 'DRAFT',
        vendor_count: 3,
        vendor_responded: 0,
        pr_id: '1'
    },
    {
        rfq_id: '2',
        rfq_no: 'RFQ2024-002',
        description: 'RFQ สำหรับ PR2024-002',
        created_date: '2024-01-16',
        valid_until: '2024-01-26',
        status: 'SENT',
        vendor_count: 5,
        vendor_responded: 2,
        pr_id: '2'
    },
    {
        rfq_id: '3',
        rfq_no: 'RFQ2024-003',
        description: 'RFQ สั่งซื้อวัสดุสิ้นเปลือง',
        created_date: '2024-01-17',
        valid_until: '2024-01-27',
        status: 'SENT',
        vendor_count: 4,
        vendor_responded: 0,
        pr_id: '3'
    },
    {
        rfq_id: '4',
        rfq_no: 'RFQ2024-004',
        description: 'RFQ อุปกรณ์ IT',
        created_date: '2024-01-18',
        valid_until: '2024-01-28',
        status: 'CLOSED',
        vendor_count: 2,
        vendor_responded: 2,
        pr_id: '4'
    },
     {
        rfq_id: '5',
        rfq_no: 'RFQ2024-005',
        description: 'RFQ เพิ่มเติม',
        created_date: '2024-01-19',
        valid_until: '2024-01-29',
        status: 'DRAFT',
        vendor_count: 6,
        vendor_responded: 0,
        pr_id: '5'
    },
    {
        rfq_id: '6',
        rfq_no: 'RFQ2024-006',
        description: 'RFQ เครื่องเขียน',
        created_date: '2024-01-20',
        valid_until: '2024-01-30',
        status: 'SENT',
        vendor_count: 3,
        vendor_responded: 1,
        pr_id: '1' // Cyclic for demo or just 1
    }
];
