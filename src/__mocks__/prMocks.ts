export interface MockPRItem {
    pr_id: string;
    pr_no: string;
    request_date: string;
    requester_name: string;
    department: string;
    status: string;
    item_count: number;
    total_amount: number;
    cost_center_id: string;
}

export const PR_MOCKS: MockPRItem[] = [
    {
        pr_id: '1',
        pr_no: 'PR2024-001',
        request_date: '2024-01-15',
        requester_name: 'สมชาย ใจดี',
        department: 'IT',
        status: 'IN_APPROVAL',
        item_count: 3,
        total_amount: 45000.00,
        cost_center_id: 'cc-001'
    },
    {
        pr_id: '2',
        pr_no: 'PR2024-002',
        request_date: '2024-01-16',
        requester_name: 'สมหญิง รักงาน',
        department: 'จัดซื้อ',
        status: 'APPROVED',
        item_count: 5,
        total_amount: 125000.00,
        cost_center_id: 'cc-002'
    },
    {
        pr_id: '3',
        pr_no: 'PR2024-003',
        request_date: '2024-01-17',
        requester_name: 'วิชัย มากการ',
        department: 'คลังสินค้า',
        status: 'IN_APPROVAL',
        item_count: 4,
        total_amount: 78500.00,
        cost_center_id: 'cc-003'
    },
    {
        pr_id: '4',
        pr_no: 'PR2024-004',
        request_date: '2024-01-18',
        requester_name: 'สมจิต ดีความสุข',
        department: 'บัญชี',
        status: 'IN_APPROVAL',
        item_count: 2,
        total_amount: 32000.00,
        cost_center_id: 'cc-004'
    },
    {
        pr_id: '5',
        pr_no: 'PR2024-005',
        request_date: '2024-01-19',
        requester_name: 'ประยุทธ ขยัน',
        department: 'คลัง',
        status: 'APPROVED',
        item_count: 8,
        total_amount: 250000.00,
        cost_center_id: 'cc-005'
    }
];
