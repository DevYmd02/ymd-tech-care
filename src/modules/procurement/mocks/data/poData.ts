import type { POListItem } from '@/modules/procurement/types/po-types';
import { sanitizeId } from '@/core/api/mockUtils';

const _mockPOs: POListItem[] = [
  { po_id: 'po-001', po_no: 'PO-202601-0001', po_date: '2026-01-25', pr_id: 'pr-001', vendor_id: 'v002', vendor_name: 'OfficeMate', branch_id: '1', status: 'CLOSED', currency_code: 'THB', exchange_rate: 1, payment_term_days: 30, subtotal: 8250, tax_amount: 577.5, total_amount: 8827.5, created_by: 'u1', item_count: 2 },
  { po_id: 'po-002', po_no: 'PO-202602-0002', po_date: '2026-02-10', pr_id: 'pr-002', vendor_id: 'v002', vendor_name: 'OfficeMate', branch_id: '1', status: 'CLOSED', currency_code: 'THB', exchange_rate: 1, payment_term_days: 30, subtotal: 4500, tax_amount: 315, total_amount: 4815, created_by: 'u1', item_count: 5 },
];

export const MOCK_POS: POListItem[] = _mockPOs.map(po => ({
    ...po,
    po_id: sanitizeId(po.po_id),
    pr_id: sanitizeId(po.pr_id),
    vendor_id: sanitizeId(po.vendor_id),
    branch_id: sanitizeId(po.branch_id),
}));
