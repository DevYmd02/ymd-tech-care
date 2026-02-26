import type { GRNListItem } from '@/modules/procurement/types';
import { sanitizeId } from '@/core/api/mockUtils';

const _mockGRNs: GRNListItem[] = [
  { grn_id: 'grn-001', grn_no: 'GRN-202601-0001', po_id: 'po-001', po_no: 'PO-202601-0001', received_date: '2026-01-30', warehouse_id: 'w1', warehouse_name: 'Main WH', received_by: 'u2', received_by_name: 'Staff', status: 'POSTED', item_count: 2 },
  { grn_id: 'grn-002', grn_no: 'GRN-202603-0002', po_id: 'po-002', po_no: 'PO-202602-0002', received_date: '2026-03-13', warehouse_id: 'w1', warehouse_name: 'Main WH', received_by: 'u2', received_by_name: 'Staff', status: 'POSTED', item_count: 1 },
];

export const MOCK_GRNS: GRNListItem[] = _mockGRNs.map(grn => ({
    ...grn,
    grn_id: sanitizeId(grn.grn_id),
    po_id: sanitizeId(grn.po_id),
    warehouse_id: sanitizeId(grn.warehouse_id),
    received_by: sanitizeId(grn.received_by),
}));
