import type { POListItem } from '@/modules/procurement/schemas/po-schemas';

const _mockPOs: POListItem[] = [
    {
        po_id: 1, po_no: 'PO-202602-0001', po_date: '2026-02-20',
        pr_id: 12, pr_no: 'PR-202602-0012',
        qc_id: 7, qc_no: 'QC-202602-0007',
        vendor_id: 5, vendor_name: 'Smart Tech Co., Ltd.',
        branch_id: 1, status: 'DRAFT',
        currency_code: 'THB', exchange_rate: 1, payment_term_days: 30,
        subtotal: 213675.5, tax_amount: 14957.29, total_amount: 228632.79,
        created_by: 1, item_count: 3,
        remarks: 'สั่งซื้อตาม QC-202602-0007 — Smart Tech ชนะการประมูล'
    },
    {
        po_id: 2, po_no: 'PO-202602-0002', po_date: '2026-02-12',
        pr_id: 5, pr_no: 'PR-202602-0005',
        qc_id: 6, qc_no: 'QC-202602-0006',
        vendor_id: 7, vendor_name: 'Global Oil Co., Ltd.',
        branch_id: 1, status: 'PENDING_APPROVAL',
        currency_code: 'THB', exchange_rate: 1, payment_term_days: 45,
        subtotal: 75233.64, tax_amount: 5266.35, total_amount: 80499.99,
        created_by: 1, item_count: 5,
        remarks: 'สั่งซื้อน้ำมันอุตสาหกรรม — รออนุมัติจากผู้จัดการ'
    },
    {
        po_id: 3, po_no: 'PO-202602-0003', po_date: '2026-02-10',
        pr_id: 8, pr_no: 'PR-202602-0008',
        qc_id: 8, qc_no: 'QC-202602-0008',
        vendor_id: 3, vendor_name: 'OfficeMate Corporation',
        branch_id: 1, status: 'APPROVED',
        currency_code: 'THB', exchange_rate: 1, payment_term_days: 30,
        subtotal: 8250, tax_amount: 577.5, total_amount: 8827.5,
        created_by: 2, item_count: 2,
        remarks: 'อุปกรณ์สำนักงาน — อนุมัติแล้ว รอออก PO'
    },
    {
        po_id: 4, po_no: 'PO-202601-0004', po_date: '2026-01-28',
        pr_id: 3, pr_no: 'PR-202601-0003',
        qc_id: 5, qc_no: 'QC-202601-0005',
        vendor_id: 1, vendor_name: 'IT Supply Co., Ltd.',
        branch_id: 1, status: 'COMPLETED',
        currency_code: 'THB', exchange_rate: 1, payment_term_days: 30,
        subtotal: 46728.97, tax_amount: 3271.03, total_amount: 50000,
        created_by: 1, item_count: 4,
        remarks: 'อุปกรณ์ IT — รับของครบแล้ว ปิดงานเรียบร้อย'
    },
    {
        po_id: 5, po_no: 'PO-202601-0005', po_date: '2026-01-15',
        pr_id: 2, pr_no: 'PR-202601-0002',
        qc_id: 4, qc_no: 'QC-202601-0004',
        vendor_id: 9, vendor_name: 'BuildMate Supplies',
        branch_id: 1, status: 'CANCELLED',
        currency_code: 'THB', exchange_rate: 1, payment_term_days: 30,
        subtotal: 120000, tax_amount: 8400, total_amount: 128400,
        created_by: 3, item_count: 6,
        remarks: 'ยกเลิกเนื่องจากผู้ขายไม่สามารถส่งของในกำหนดได้'
    },
    {
        po_id: 6, po_no: 'PO-202602-0006', po_date: '2026-02-25',
        pr_id: 15, pr_no: 'PR-202602-0015',
        qc_id: 10, qc_no: 'QC-202602-0010',
        vendor_id: 4, vendor_name: 'Premium Hardware Co.',
        branch_id: 1, status: 'REJECTED',
        currency_code: 'THB', exchange_rate: 1, payment_term_days: 30,
        subtotal: 500000, tax_amount: 35000, total_amount: 535000,
        created_by: 1, item_count: 2,
        remarks: 'สั่งซื้อ Server ชุดใหม่',
        reject_reason: 'งบประมาณแผนก IT เกินกำหนด กรุณาปรับลดจำนวนสินค้า',
        transactions: [
            {
                id: 1, po_id: 6, from_status: 'DRAFT', to_status: 'PENDING_APPROVAL',
                action_by: 1, action_date: '2026-02-25T10:00:00Z'
            },
            {
                id: 2, po_id: 6, from_status: 'PENDING_APPROVAL', to_status: 'REJECTED',
                action_by: 2, action_date: '2026-02-26T14:30:00Z',
                remark: 'งบประมาณแผนก IT เกินกำหนด กรุณาปรับลดจำนวนสินค้า'
            }
        ]
    },
    {
        po_id: 7, po_no: 'PO-202603-0009', po_date: '2026-03-01',
        pr_id: 11, pr_no: 'PR-202603-0011',
        qc_id: 12, qc_no: 'QC-202603-0012',
        vendor_id: 2, vendor_name: 'Metro Systems Corp.',
        branch_id: 1, status: 'ISSUED',
        currency_code: 'THB', exchange_rate: 1, payment_term_days: 30,
        subtotal: 150000, tax_amount: 10500, total_amount: 160500,
        created_by: 2, item_count: 1,
        remarks: 'Software Licenses ประจำปี 2026',
        transactions: [
            {
                id: 3, po_id: 7, from_status: 'DRAFT', to_status: 'PENDING_APPROVAL',
                action_by: 1, action_date: '2026-03-01T09:00:00Z'
            },
            {
                id: 4, po_id: 7, from_status: 'PENDING_APPROVAL', to_status: 'APPROVED',
                action_by: 2, action_date: '2026-03-01T13:15:00Z'
            },
            {
                id: 5, po_id: 7, from_status: 'APPROVED', to_status: 'ISSUED',
                action_by: 1, action_date: '2026-03-01T15:30:00Z'
            }
        ]
    },
];

export const MOCK_POS: POListItem[] = _mockPOs;
