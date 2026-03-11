import type { QCListItem } from '@/modules/procurement/schemas/qc-schemas';

const _mockQCs: QCListItem[] = [
  { qc_id: 7, qc_no: 'QC-202602-0007', pr_id: 12, pr_no: 'PR-202602-0012', rfq_no: 'RFQ-202602-0007', created_at: '2026-02-14', status: 'DRAFT', vendor_count: 3, lowest_bidder_name: 'Smart Tech', lowest_price: 235000 },
  { qc_id: 6, qc_no: 'QC-202602-0006', pr_id: 5, pr_no: 'PR-202602-0005', rfq_no: 'RFQ-202602-0006', created_at: '2026-02-08', status: 'COMPLETED', vendor_count: 2, lowest_bidder_name: 'Global Oil Co.', lowest_price: 82000 },
  { qc_id: 5, qc_no: 'QC-202601-0005', pr_id: 3, pr_no: 'PR-202601-0003', rfq_no: 'RFQ-202601-0005', created_at: '2026-01-31', status: 'CANCELLED', vendor_count: 3, lowest_bidder_name: 'IT Supply Co.', lowest_price: 50000 },
];

export const MOCK_QCS: QCListItem[] = _mockQCs;
