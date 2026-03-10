import type { GRNListItem } from '@/modules/procurement/types';


const _mockGRNs: GRNListItem[] = [
  { grn_id: 1, grn_no: 'GRN-202601-0001', po_id: 1, po_no: 'PO-202601-0001', received_date: '2026-01-30', warehouse_id: 1, warehouse_name: 'Main WH', received_by: 2, received_by_name: 'Staff', status: 'POSTED', item_count: 2 },
  { grn_id: 2, grn_no: 'GRN-202603-0002', po_id: 2, po_no: 'PO-202602-0002', received_date: '2026-03-13', warehouse_id: 1, warehouse_name: 'Main WH', received_by: 2, received_by_name: 'Staff', status: 'POSTED', item_count: 1 },
];

export const MOCK_GRNS: GRNListItem[] = _mockGRNs;
