import type { RFQHeader, RFQLine, RFQVendor } from '@/modules/procurement/types/rfq-types';
import { sanitizeId } from '@/core/api/mockUtils';

const _mockRFQs: RFQHeader[] = [
  {
    rfq_id: 'rfq-008', rfq_no: 'RFQ-202602-0008', pr_id: 'pr-007', branch_id: '1',
    rfq_date: '2026-02-15', quote_due_date: '2026-02-20', status: 'DRAFT',
    created_by_user_id: 'pur01', created_at: '2026-02-15T09:00:00Z', updated_at: '2026-02-15T09:00:00Z',
    pr_no: 'PR-202602-0007', branch_name: 'สำนักงานใหญ่', created_by_name: 'นายจัดซื้อ หนึ่ง'
  },
  {
    rfq_id: 'rfq-007', rfq_no: 'RFQ-202602-0007', pr_id: 'pr-006', branch_id: '2',
    rfq_date: '2026-02-10', quote_due_date: '2026-02-15', status: 'SENT',
    created_by_user_id: 'pur02', created_at: '2026-02-10T10:00:00Z', updated_at: '2026-02-10T10:00:00Z',
    pr_no: 'PR-202602-0006', branch_name: 'สาขาเชียงใหม่', created_by_name: 'นางสาวจัดซื้อ สอง'
  },
  {
    rfq_id: 'rfq-202603-001', rfq_no: 'RFQ-202603-001', pr_id: 'pr-202603-0015', branch_id: '1',
    rfq_date: new Date().toISOString().split('T')[0], quote_due_date: null, status: 'DRAFT',
    created_by_user_id: 'pur01', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    pr_no: 'PR-202603-0015', ref_pr_no: 'PR-202603-0015', branch_name: 'สำนักงานใหญ่', created_by_name: 'System Admin',
    vendor_count: 0
  }
];

export const MOCK_RFQS: RFQHeader[] = _mockRFQs.map(rfq => ({
    ...rfq,
    rfq_id: sanitizeId(rfq.rfq_id),
    pr_id: sanitizeId(rfq.pr_id ?? ''),
    branch_id: sanitizeId(rfq.branch_id ?? ''),
}));

export const MOCK_RFQ_LINES: RFQLine[] = [];
export const MOCK_RFQ_VENDORS: RFQVendor[] = [];
