import type { VQListItem } from '@/modules/procurement/types';

/**
 * MOCK VQ DATA — (STATE MACHINE EDITION)
 * 
 * Strict VQ Lifecycle Rules:
 *   PENDING  = No VQ ID (รอผู้ขายตอบกลับ - awaiting vendor reply)
 *   RECORDED = VQ ID Generated (บันทึกแล้ว - procurement keyed in data)
 *   DECLINED = No VQ ID
 *   EXPIRED  = No VQ ID
 */
const _vqs: VQListItem[] = [
  // ── RECORDED: Procurement has keyed in data → VQ ID exists ──────────────

  // Responses for RFQ-007 (Laptop - Feb 10)
  { 
    quotation_id: 10, quotation_no: 'VQ-V001-010', qc_id: 0, rfq_no: 'RFQ-202602-0007', rfq_id: 7, pr_no: 'PR-202602-0012', 
    vendor_id: 1, vendor_code: 'V001', vendor_name: 'IT Supply Co.', quotation_date: '2026-02-11', valid_until: '2026-03-11', 
    payment_term_days: 30, lead_time_days: 7, total_amount: 240000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED',
    lines: [
      { item_code: 'IT-LPT-001', item_name: 'Laptop Business Pro 14"', qty: 8, uom_name: 'เครื่อง', unit_price: 30000, net_amount: 240000 }
    ]
  },

  // Responses for RFQ-006 (Factory Oil - Feb 05)
  { 
    quotation_id: 8, quotation_no: 'VQ-V006-008', qc_id: 6, rfq_no: 'RFQ-202602-0006', rfq_id: 6, pr_no: 'PR-202602-0010', 
    vendor_id: 6, vendor_code: 'V006', vendor_name: 'Industrial Part Ltd.', quotation_date: '2026-02-06', valid_until: '2026-03-06', 
    payment_term_days: 60, lead_time_days: 3, total_amount: 85000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED',
    lines: [
      { item_code: 'OIL-IND-046', item_name: 'Industrial Oil 46 (200L)', qty: 10, uom_name: 'ถัง', unit_price: 8500, net_amount: 85000, no_quote: false },
      { item_code: 'OIL-GRS-001', item_name: 'Machine Grease (15kg)', qty: 5, uom_name: 'ถัง', unit_price: 3400, net_amount: 17000, no_quote: false }
    ]
  },
  { 
    quotation_id: 7, quotation_no: 'VQ-V007-007', qc_id: 6, rfq_no: 'RFQ-202602-0006', rfq_id: 6, pr_no: 'PR-202602-0010', 
    vendor_id: 7, vendor_code: 'V007', vendor_name: 'Global Oil Co.', quotation_date: '2026-02-07', valid_until: '2026-03-07', 
    payment_term_days: 45, lead_time_days: 7, total_amount: 82000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED',
    lines: [
      { item_code: 'OIL-IND-046', item_name: 'Industrial Oil 46 (200L)', qty: 10, uom_name: 'ถัง', unit_price: 8200, net_amount: 82000, no_quote: false },
      { item_code: 'OIL-GRS-001', item_name: 'Machine Grease (15kg)', qty: 5, uom_name: 'ถัง', unit_price: 3600, net_amount: 18000, no_quote: false }
    ]
  },
  // Vendor C for RFQ-006 (Incomplete/No Quote)
  { 
    quotation_id: 14, quotation_no: 'VQ-V005-014', qc_id: 0, rfq_no: 'RFQ-202602-0006', rfq_id: 6, pr_no: 'PR-202602-0010', 
    vendor_id: 5, vendor_code: 'V005', vendor_name: 'Smart Tech (Vendor C)', quotation_date: '2026-02-08', valid_until: '2026-03-08', 
    payment_term_days: 30, lead_time_days: 5, total_amount: 80000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED',
    lines: [
      { item_code: 'OIL-IND-046', item_name: 'Industrial Oil 46 (200L)', qty: 10, uom_name: 'ถัง', unit_price: 8000, net_amount: 80000, no_quote: false },
      { item_code: 'OIL-GRS-001', item_name: 'Machine Grease (15kg)', qty: 5, uom_name: 'ถัง', unit_price: 0, net_amount: 0, no_quote: true }
    ]
  },

  // Responses for RFQ-005 (Monitor - Jan 26)
  { 
    quotation_id: 6, quotation_no: 'VQ-V001-006', qc_id: 5, rfq_no: 'RFQ-202601-0005', rfq_id: 5, pr_no: 'PR-202601-0008', 
    vendor_id: 1, vendor_code: 'V001', vendor_name: 'IT Supply Co.', quotation_date: '2026-01-27', valid_until: '2026-02-27', 
    payment_term_days: 30, lead_time_days: 7, total_amount: 50000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED',
    lines: [
      { item_code: 'IT-MON-027', item_name: 'Monitor 27" 4K', qty: 5, uom_name: 'เครื่อง', unit_price: 10000, net_amount: 50000 }
    ]
  },
  { 
    quotation_id: 5, quotation_no: 'VQ-V005-005', qc_id: 5, rfq_no: 'RFQ-202601-0005', rfq_id: 5, pr_no: 'PR-202601-0008', 
    vendor_id: 5, vendor_code: 'V005', vendor_name: 'Smart Tech', quotation_date: '2026-01-28', valid_until: '2026-02-28', 
    payment_term_days: 30, lead_time_days: 10, total_amount: 52000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED',
    lines: [
      { item_code: 'IT-MON-027', item_name: 'Monitor 27" 4K', qty: 5, uom_name: 'เครื่อง', unit_price: 10400, net_amount: 52000 }
    ]
  },
  { 
    quotation_id: 4, quotation_no: 'VQ-V002-004', qc_id: 5, rfq_no: 'RFQ-202601-0005', rfq_id: 5, pr_no: 'PR-202601-0008', 
    vendor_id: 2, vendor_code: 'V002', vendor_name: 'OfficeMate', quotation_date: '2026-01-29', valid_until: '2026-03-01', 
    payment_term_days: 30, lead_time_days: 2, total_amount: 55000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED',
    lines: [
      { item_code: 'IT-MON-027', item_name: 'Monitor 27" 4K', qty: 5, uom_name: 'เครื่อง', unit_price: 11000, net_amount: 55000 }
    ]
  },

  // Responses for RFQ-001 (Stationery - Jan 17)
  { 
    quotation_id: 3, quotation_no: 'VQ-V002-003', qc_id: 1, rfq_no: 'RFQ-202601-0001', rfq_id: 1, 
    vendor_id: 2, vendor_code: 'V002', vendor_name: 'OfficeMate', quotation_date: '2026-01-18', valid_until: '2026-02-18', 
    payment_term_days: 30, lead_time_days: 1, total_amount: 8250, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED',
    lines: [
      { item_code: 'OFF-PAP-A4', item_name: 'Paper A4 80gsm', qty: 50, uom_name: 'Ream', unit_price: 115, net_amount: 5750 },
      { item_code: 'OFF-PEN-001', item_name: 'Blue Pen (Box of 12)', qty: 10, uom_name: 'Box', unit_price: 250, net_amount: 2500 }
    ]
  },
  { 
    quotation_id: 2, quotation_no: 'VQ-V003-002', qc_id: 1, rfq_no: 'RFQ-202601-0001', rfq_id: 1, 
    vendor_id: 3, vendor_code: 'V003', vendor_name: 'B2S', quotation_date: '2026-01-19', valid_until: '2026-02-19', 
    payment_term_days: 30, lead_time_days: 3, total_amount: 6000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED',
    lines: [
      { item_code: 'OFF-PAP-A4', item_name: 'Paper A4 80gsm', qty: 50, uom_name: 'Ream', unit_price: 120, net_amount: 6000, no_quote: false },
      { item_code: 'OFF-PEN-001', item_name: 'Blue Pen (Box of 12)', qty: 10, uom_name: 'Box', unit_price: 0, net_amount: 0, no_quote: true }
    ]
  },
  { 
    quotation_id: 1, quotation_no: 'VQ-V004-001', qc_id: 1, rfq_no: 'RFQ-202601-0001', rfq_id: 1, 
    vendor_id: 4, vendor_code: 'V004', vendor_name: 'Local Store', quotation_date: '2026-02-20', valid_until: '2026-02-20', 
    payment_term_days: 0, lead_time_days: 0, total_amount: 9000, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'RECORDED',
    lines: [
      { item_code: 'OFF-PAP-A4', item_name: 'Paper A4 80gsm', qty: 50, uom_name: 'Ream', unit_price: 130, net_amount: 6500 },
      { item_code: 'OFF-PEN-001', item_name: 'Blue Pen (Box of 12)', qty: 10, uom_name: 'Box', unit_price: 250, net_amount: 2500 }
    ]
  },

  // ── No RECEIVED state anymore — Pending or Recorded only ──────────────────
  { quotation_id: 9, quotation_no: '', qc_id: 0, rfq_no: 'RFQ-202602-0007', rfq_id: 7, pr_no: 'PR-202602-0012', vendor_id: 5, vendor_code: 'V005', vendor_name: 'Smart Tech', quotation_date: '2026-02-12', valid_until: '2026-03-12', payment_term_days: 30, lead_time_days: 5, total_amount: 0, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'PENDING' },

  // ── PENDING: Awaiting vendor reply — No VQ ID ───────────────────────────
  { quotation_id: 12, quotation_no: '', qc_id: 0, rfq_no: 'RFQ-202602-0009', rfq_id: 9, vendor_id: 8, vendor_code: 'V008', vendor_name: 'Hardware Hub', quotation_date: '2026-02-13', valid_until: '2026-03-13', payment_term_days: 30, lead_time_days: 14, total_amount: 0, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'PENDING' },

  // ── DECLINED: Vendor refused — No VQ ID ─────────────────────────────────
  // ── PENDING: Awaiting vendor reply — No VQ ID ───────────────────────────
  { quotation_id: 13, quotation_no: '', qc_id: 0, rfq_no: 'RFQ-202602-0005', rfq_id: 5, vendor_id: 10, vendor_code: 'V010', vendor_name: 'Fast Logistics', quotation_date: '2026-02-14', valid_until: '2026-03-14', payment_term_days: 30, lead_time_days: 2, total_amount: 0, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'CANCELLED' },

  // ── EXPIRED: Quote lapsed — No VQ ID ────────────────────────────────────
  { quotation_id: 11, quotation_no: '', qc_id: 9, rfq_no: 'RFQ-202602-0008', rfq_id: 8, vendor_id: 9, vendor_code: 'V009', vendor_name: 'Air Service Pro', quotation_date: '2026-02-10', valid_until: '2026-03-10', payment_term_days: 30, lead_time_days: 5, total_amount: 0, currency: 'THB', isMulticurrency: false, exchange_rate: 1, status: 'EXPIRED' },
];

export const MOCK_VQS: VQListItem[] = _vqs;
