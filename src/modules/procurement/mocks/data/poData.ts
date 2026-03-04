import type { POListItem } from '@/modules/procurement/schemas/po-schemas';
import { sanitizeId } from '@/core/api/mockUtils';

const _mockPOs: POListItem[] = [
    {
        po_id: 'po-001', po_no: 'PO-202602-0001', po_date: '2026-02-20',
        pr_id: 'pr-012', pr_no: 'PR-202602-0012',
        qc_id: 'qc-007', qc_no: 'QC-202602-0007',
        vendor_id: 'v005', vendor_name: 'Smart Tech Co., Ltd.',
        branch_id: '1', status: 'DRAFT',
        currency_code: 'THB', exchange_rate: 1, payment_term_days: 30,
        subtotal: 213675.5, tax_amount: 14957.29, total_amount: 228632.79,
        created_by: 'u1', item_count: 3,
        remarks: 'สั่งซื้อตาม QC-202602-0007 — Smart Tech ชนะการประมูล'
    },
    {
        po_id: 'po-002', po_no: 'PO-202602-0002', po_date: '2026-02-12',
        pr_id: 'pr-005', pr_no: 'PR-202602-0005',
        qc_id: 'qc-006', qc_no: 'QC-202602-0006',
        vendor_id: 'v007', vendor_name: 'Global Oil Co., Ltd.',
        branch_id: '1', status: 'PENDING_APPROVAL',
        currency_code: 'THB', exchange_rate: 1, payment_term_days: 45,
        subtotal: 75233.64, tax_amount: 5266.35, total_amount: 80499.99,
        created_by: 'u1', item_count: 5,
        remarks: 'สั่งซื้อน้ำมันอุตสาหกรรม — รออนุมัติจากผู้จัดการ'
    },
    {
        po_id: 'po-003', po_no: 'PO-202602-0003', po_date: '2026-02-10',
        pr_id: 'pr-008', pr_no: 'PR-202602-0008',
        qc_id: 'qc-008', qc_no: 'QC-202602-0008',
        vendor_id: 'v003', vendor_name: 'OfficeMate Corporation',
        branch_id: '1', status: 'APPROVED',
        currency_code: 'THB', exchange_rate: 1, payment_term_days: 30,
        subtotal: 8250, tax_amount: 577.5, total_amount: 8827.5,
        created_by: 'u2', item_count: 2,
        remarks: 'อุปกรณ์สำนักงาน — อนุมัติแล้ว รอออก PO'
    },
    {
        po_id: 'po-004', po_no: 'PO-202601-0004', po_date: '2026-01-28',
        pr_id: 'pr-003', pr_no: 'PR-202601-0003',
        qc_id: 'qc-005', qc_no: 'QC-202601-0005',
        vendor_id: 'v001', vendor_name: 'IT Supply Co., Ltd.',
        branch_id: '1', status: 'COMPLETED',
        currency_code: 'THB', exchange_rate: 1, payment_term_days: 30,
        subtotal: 46728.97, tax_amount: 3271.03, total_amount: 50000,
        created_by: 'u1', item_count: 4,
        remarks: 'อุปกรณ์ IT — รับของครบแล้ว ปิดงานเรียบร้อย'
    },
    {
        po_id: 'po-005', po_no: 'PO-202601-0005', po_date: '2026-01-15',
        pr_id: 'pr-002', pr_no: 'PR-202601-0002',
        qc_id: 'qc-004', qc_no: 'QC-202601-0004',
        vendor_id: 'v009', vendor_name: 'BuildMate Supplies',
        branch_id: '1', status: 'CANCELLED',
        currency_code: 'THB', exchange_rate: 1, payment_term_days: 30,
        subtotal: 120000, tax_amount: 8400, total_amount: 128400,
        created_by: 'u3', item_count: 6,
        remarks: 'ยกเลิกเนื่องจากผู้ขายไม่สามารถส่งของในกำหนดได้'
    },
];

export const MOCK_POS: POListItem[] = _mockPOs.map(po => ({
    ...po,
    po_id: sanitizeId(po.po_id),
    pr_id: sanitizeId(po.pr_id),
    qc_id: sanitizeId(po.qc_id),
    vendor_id: sanitizeId(po.vendor_id),
    branch_id: sanitizeId(po.branch_id),
}));
