/**
 * @file rfqMocks.ts
 * @description Mock data สำหรับ RFQ Module
 */

import type { RFQHeader } from '../types/rfq-types';

// ====================================================================================
// MOCK RFQ DATA
// ====================================================================================

export const MOCK_RFQS: RFQHeader[] = [
  {
    rfq_id: 'rfq-001',
    rfq_no: 'RFQ-202601-0001',
    pr_id: 'pr-001',
    pr_no: 'PR-202601-0001',
    branch_id: 'branch-001',
    branch_name: 'สำนักงานใหญ่',
    rfq_date: '2569-01-10',
    quote_due_date: '2569-01-20',
    terms_and_conditions: 'ชำระเงินภายใน 30 วัน',
    status: 'IN_PROGRESS',
    created_by_user_id: 'user-001',
    created_by_name: 'นายสมชาย ใจดี',
    created_at: '2569-01-10T09:00:00Z',
    updated_at: '2569-01-10T09:00:00Z',
    vendor_count: 3,
    vendor_responded: 2,
  },
  {
    rfq_id: 'rfq-002',
    rfq_no: 'RFQ-202601-0002',
    pr_id: 'pr-002',
    pr_no: 'PR-202601-0002',
    branch_id: 'branch-001',
    branch_name: 'สำนักงานใหญ่',
    rfq_date: '2569-01-12',
    quote_due_date: '2569-01-22',
    status: 'SENT',
    created_by_user_id: 'user-001',
    created_by_name: 'นายสมชาย ใจดี',
    created_at: '2569-01-12T10:00:00Z',
    updated_at: '2569-01-12T10:00:00Z',
    vendor_count: 2,
    vendor_responded: 0,
  },
];

// ====================================================================================
// MOCK RFQ SUMMARY STATS
// ====================================================================================

export const getRFQStats = (rfqs: RFQHeader[]) => ({
  total: rfqs.length,
  sent: rfqs.filter(r => r.status === 'SENT').length,
  inProgress: rfqs.filter(r => r.status === 'IN_PROGRESS').length,
  closed: rfqs.filter(r => r.status === 'CLOSED').length,
});
