import type { VQListItem } from '@/modules/procurement/types';
import { sanitizeId } from '@/core/api/mockUtils';

/**
 * MOCK VQ DATA — (STATE MACHINE EDITION)
 * 
 * Strict VQ Lifecycle Rules:
 *   PENDING  = No VQ ID (รอผู้ขายตอบกลับ - awaiting vendor reply)
 *   RECEIVED = No VQ ID (ได้รับแล้ว - vendor replied, not keyed in yet)
 *   RECORDED = VQ ID Generated (บันทึกแล้ว - procurement keyed in data)
 *   DECLINED = No VQ ID
 *   EXPIRED  = No VQ ID
 */
const _vqs: VQListItem[] = [
  // ── RECORDED: Procurement has keyed in data → VQ ID exists ──────────────

  // Responses for RFQ-007 (Laptop - Feb 10)
  { quotation_id: 'vq-010', quotation_no: 'VQ-V001-010', qc_id: '', rfq_no: 'RFQ-202602-0007', rfq_id: 'rfq-007', pr_no: 'PR-202602-0012', vendor_id: 'v001', vendor_code: 'V001', vendor_name: 'IT Supply Co.', quotation_date: '2026-02-11', valid_until: '2026-03-11', payment_term_days: 30, lead_time_days: 7, total_amount: 240000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED' },

  // Responses for RFQ-006 (Factory Oil - Feb 05)
  { quotation_id: 'vq-008', quotation_no: 'VQ-V006-008', qc_id: 'qc-006', rfq_no: 'RFQ-202602-0006', rfq_id: 'rfq-006', pr_no: 'PR-202602-0010', vendor_id: 'v006', vendor_code: 'V006', vendor_name: 'Industrial Part Ltd.', quotation_date: '2026-02-06', valid_until: '2026-03-06', payment_term_days: 60, lead_time_days: 3, total_amount: 85000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED' },
  { quotation_id: 'vq-007', quotation_no: 'VQ-V007-007', qc_id: 'qc-006', rfq_no: 'RFQ-202602-0006', rfq_id: 'rfq-006', pr_no: 'PR-202602-0010', vendor_id: 'v007', vendor_code: 'V007', vendor_name: 'Global Oil Co.', quotation_date: '2026-02-07', valid_until: '2026-03-07', payment_term_days: 45, lead_time_days: 7, total_amount: 82000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED' },

  // Responses for RFQ-005 (Monitor - Jan 26)
  { quotation_id: 'vq-006', quotation_no: 'VQ-V001-006', qc_id: 'qc-005', rfq_no: 'RFQ-202601-0005', rfq_id: 'rfq-005', pr_no: 'PR-202601-0008', vendor_id: 'v001', vendor_code: 'V001', vendor_name: 'IT Supply Co.', quotation_date: '2026-01-27', valid_until: '2026-02-27', payment_term_days: 30, lead_time_days: 7, total_amount: 50000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED' },
  { quotation_id: 'vq-005', quotation_no: 'VQ-V005-005', qc_id: 'qc-005', rfq_no: 'RFQ-202601-0005', rfq_id: 'rfq-005', pr_no: 'PR-202601-0008', vendor_id: 'v005', vendor_code: 'V005', vendor_name: 'Smart Tech', quotation_date: '2026-01-28', valid_until: '2026-02-28', payment_term_days: 30, lead_time_days: 10, total_amount: 52000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED' },
  { quotation_id: 'vq-004', quotation_no: 'VQ-V002-004', qc_id: 'qc-005', rfq_no: 'RFQ-202601-0005', rfq_id: 'rfq-005', pr_no: 'PR-202601-0008', vendor_id: 'v002', vendor_code: 'V002', vendor_name: 'OfficeMate', quotation_date: '2026-01-29', valid_until: '2026-03-01', payment_term_days: 30, lead_time_days: 2, total_amount: 55000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED' },

  // Responses for RFQ-001 (Stationery - Jan 17)
  { quotation_id: 'vq-003', quotation_no: 'VQ-V002-003', qc_id: 'qc-001', rfq_no: 'RFQ-202601-0001', rfq_id: 'rfq-001', vendor_id: 'v002', vendor_code: 'V002', vendor_name: 'OfficeMate', quotation_date: '2026-01-18', valid_until: '2026-02-18', payment_term_days: 30, lead_time_days: 1, total_amount: 8250, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED' },
  { quotation_id: 'vq-002', quotation_no: 'VQ-V003-002', qc_id: 'qc-001', rfq_no: 'RFQ-202601-0001', rfq_id: 'rfq-001', vendor_id: 'v003', vendor_code: 'V003', vendor_name: 'B2S', quotation_date: '2026-01-19', valid_until: '2026-02-19', payment_term_days: 30, lead_time_days: 3, total_amount: 8500, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED' },
  { quotation_id: 'vq-001', quotation_no: 'VQ-V004-001', qc_id: 'qc-001', rfq_no: 'RFQ-202601-0001', rfq_id: 'rfq-001', vendor_id: 'v004', vendor_code: 'V004', vendor_name: 'Local Store', quotation_date: '2026-01-20', valid_until: '2026-02-20', payment_term_days: 0, lead_time_days: 0, total_amount: 9000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED' },

  // ── RECEIVED: Vendor replied, awaiting procurement to key in ────────────
  // (No quotation_no — stays empty until RECORDED)

  { quotation_id: 'vq-009', quotation_no: '', qc_id: '', rfq_no: 'RFQ-202602-0007', rfq_id: 'rfq-007', pr_no: 'PR-202602-0012', vendor_id: 'v005', vendor_code: 'V005', vendor_name: 'Smart Tech', quotation_date: '2026-02-12', valid_until: '2026-03-12', payment_term_days: 30, lead_time_days: 5, total_amount: 235000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECEIVED' },

  // ── PENDING: Awaiting vendor reply — No VQ ID ───────────────────────────
  { quotation_id: 'vq-012', quotation_no: '', qc_id: '', rfq_no: 'RFQ-202602-0009', rfq_id: 'rfq-009', vendor_id: 'v008', vendor_code: 'V008', vendor_name: 'Hardware Hub', quotation_date: '2026-02-13', valid_until: '2026-03-13', payment_term_days: 30, lead_time_days: 14, total_amount: 0, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'PENDING' },

  // ── DECLINED: Vendor refused — No VQ ID ─────────────────────────────────
  { quotation_id: 'vq-013', quotation_no: '', qc_id: '', rfq_no: 'RFQ-202602-0005', rfq_id: 'rfq-005', vendor_id: 'v010', vendor_code: 'V010', vendor_name: 'Fast Logistics', quotation_date: '2026-02-14', valid_until: '2026-03-14', payment_term_days: 30, lead_time_days: 2, total_amount: 0, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'DECLINED' },

  // ── EXPIRED: Quote lapsed — No VQ ID ────────────────────────────────────
  { quotation_id: 'vq-011', quotation_no: '', qc_id: 'qc-009', rfq_no: 'RFQ-202602-0008', rfq_id: 'rfq-008', vendor_id: 'v009', vendor_code: 'V009', vendor_name: 'Air Service Pro', quotation_date: '2026-02-10', valid_until: '2026-03-10', payment_term_days: 30, lead_time_days: 5, total_amount: 42000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'EXPIRED' },
];

export const MOCK_VQS: VQListItem[] = _vqs.map(vq => ({
  ...vq,
  quotation_id: sanitizeId(vq.quotation_id),
  qc_id: sanitizeId(vq.qc_id),
  vendor_id: sanitizeId(vq.vendor_id),
}));
