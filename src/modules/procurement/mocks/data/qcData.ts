import type { QCListItem } from '@/modules/procurement/types/qc-types';
import { sanitizeId } from '@/core/api/mockUtils';

const _mockQCs: QCListItem[] = [
  { qc_id: 'qc-006', qc_no: 'QC-202602-0006', pr_id: 'pr-005', pr_no: 'PR-202602-0005', created_at: '2026-02-08', status: 'WAITING_FOR_PO', vendor_count: 2, lowest_bidder_vendor_id: 'v007', lowest_bidder_name: 'Global Oil Co.', lowest_bid_amount: 82000 },
  { qc_id: 'qc-005', qc_no: 'QC-202601-0005', pr_id: 'pr-003', pr_no: 'PR-202601-0003', created_at: '2026-01-31', status: 'PO_CREATED', vendor_count: 3, lowest_bidder_vendor_id: 'v001', lowest_bidder_name: 'IT Supply Co.', lowest_bid_amount: 50000 },
];

export const MOCK_QCS: QCListItem[] = _mockQCs.map(qc => ({
    ...qc,
    qc_id: sanitizeId(qc.qc_id),
    pr_id: sanitizeId(qc.pr_id),
    lowest_bidder_vendor_id: sanitizeId(qc.lowest_bidder_vendor_id),
}));
