/**
 * @file procurementMocks.ts
 * @description Consolidated Mock Data for Procurement Flow: PR → RFQ → QT → QC → PO → GRN
 * 
 * @linkage
 * - RFQ references PR_ID (from MOCK_PRS)
 * - QT references RFQ_ID (from MOCK_RFQS)
 * - QC references RFQ_ID (from MOCK_RFQS)
 * - PO references QC_ID/PR_ID
 * - GRN references PO_ID
 * 
 * @note This is the Single Source of Truth for all procurement mock data.
 * @note Sorting: All lists default to Descending Order (Newest First).
 * @note Time Logic: PR < RFQ < QT < QC < PO < GRN
 */

import type { PRHeader, PRLine } from '@/modules/procurement/types/pr-types';
import type { RFQHeader, RFQLine, RFQVendor } from '@/modules/procurement/types/rfq-types';
import type { QTListItem } from '@/modules/procurement/types/qt-types';
import type { QCListItem } from '@/modules/procurement/types/qc-types';
import type { POListItem } from '@/modules/procurement/types/po-types';
import type { GRNListItem } from '@/modules/procurement/types/grn-types';

const IS_DEV = import.meta.env.DEV;

// =============================================================================
// HELPER: Generate Lines
// =============================================================================
const getLinesForPR = (prId: string, baseLines: PRLine[]) => {
    return baseLines.map(line => ({ ...line, pr_id: prId }));
};

// Base Line Templates
const _prLinesIT: PRLine[] = [
  { pr_line_id: 'l-001', pr_id: 'x', line_no: 1, item_id: 'i-001', item_code: 'IT-NB-001', item_name: 'MacBook Pro M3 14"', quantity: 2, uom: 'เครื่อง', est_unit_price: 59900, est_amount: 119800, needed_date: '2026-03-01' },
  { pr_line_id: 'l-002', pr_id: 'x', line_no: 2, item_id: 'i-002', item_code: 'IT-MO-27', item_name: 'Dell UltraSharp 27"', quantity: 2, uom: 'เครื่อง', est_unit_price: 12500, est_amount: 25000, needed_date: '2026-03-01' },
];

const _prLinesOffice: PRLine[] = [
  { pr_line_id: 'l-003', pr_id: 'x', line_no: 1, item_id: 'i-003', item_code: 'OF-PAP-A4', item_name: 'Double A Paper A4 80gsm', quantity: 50, uom: 'รีม', est_unit_price: 115, est_amount: 5750, needed_date: '2026-02-20' },
  { pr_line_id: 'l-004', pr_id: 'x', line_no: 2, item_id: 'i-004', item_code: 'OF-PEN-BL', item_name: 'ปากกาลูกลื่น Pentel สีน้ำเงิน', quantity: 100, uom: 'ด้าม', est_unit_price: 25, est_amount: 2500, needed_date: '2026-02-20' },
];

const _prLinesService: PRLine[] = [
  { pr_line_id: 'l-005', pr_id: 'x', line_no: 1, item_id: 'i-005', item_code: 'SV-CLEAN', item_name: 'บริการทำความสะอาดสำนักงาน รายปี', quantity: 1, uom: 'งาน', est_unit_price: 120000, est_amount: 120000, needed_date: '2026-04-01' },
];

const _prLinesFactory: PRLine[] = [
  { pr_line_id: 'l-006', pr_id: 'x', line_no: 1, item_id: 'i-006', item_code: 'MT-LUB-01', item_name: 'Industrial Lubricant Oil 200L', quantity: 10, uom: 'ถัง', est_unit_price: 8500, est_amount: 85000, needed_date: '2026-03-15' },
  { pr_line_id: 'l-007', pr_id: 'x', line_no: 2, item_id: 'i-007', item_code: 'MT-GLOVE', item_name: 'Safety Gloves (Heat Resistant)', quantity: 200, uom: 'คู่', est_unit_price: 150, est_amount: 30000, needed_date: '2026-03-15' },
];

// =============================================================================
// 1. PURCHASE REQUISITION (PR) - 10 Items
// =============================================================================

const _mockPRs: PRHeader[] = [
  {
    pr_id: 'pr-015', pr_no: 'PR-202603-0015', branch_id: 'BR001', requester_user_id: 'u001', requester_name: 'สมชาย ใจดี',
    request_date: '2026-03-18', required_date: '2026-03-28', cost_center_id: 'CC001', purpose: 'เครื่องเขียนสำนักงาน (สร้าง RFQ แล้ว)',
    status: 'COMPLETED', currency_code: 'THB', total_amount: 8250, attachment_count: 0,
    created_at: '2026-03-18T09:00:00Z', updated_at: '2026-03-20T11:00:00Z', created_by_user_id: 'u001', updated_by_user_id: 'mgr01',
    lines: getLinesForPR('pr-015', _prLinesOffice)
  },
  {
    pr_id: 'pr-014', pr_no: 'PR-202603-0014', branch_id: 'BR002', requester_user_id: 'u002', requester_name: 'วิชัย มากมี',
    request_date: '2026-03-16', required_date: '2026-03-26', cost_center_id: 'CC003', purpose: 'โต๊ะทำงานผู้บริหาร (ไม่ผ่านอนุมัติ)',
    status: 'REJECTED', currency_code: 'THB', total_amount: 45000, attachment_count: 1,
    created_at: '2026-03-16T10:00:00Z', updated_at: '2026-03-17T14:00:00Z', created_by_user_id: 'u002', updated_by_user_id: 'mgr02',
    lines: []
  },
  {
    pr_id: 'pr-013', pr_no: 'PR-202603-0013', branch_id: 'BR001', requester_user_id: 'u004', requester_name: 'กานดา มารยาท',
    request_date: '2026-03-15', required_date: '2026-03-25', cost_center_id: 'CC004', purpose: 'จัดเลี้ยงรับรองลูกค้า (สำหรับ RFQ ยกเลิก)',
    status: 'APPROVED', currency_code: 'THB', total_amount: 5000, attachment_count: 0,
    created_at: '2026-03-15T09:00:00Z', updated_at: '2026-03-16T10:00:00Z', created_by_user_id: 'u004', updated_by_user_id: 'mgr01',
    lines: []
  },
  {
    pr_id: 'pr-012', pr_no: 'PR-202603-0012', branch_id: 'BR002', requester_user_id: 'u002', requester_name: 'วิชัย มากมี',
    request_date: '2026-03-10', required_date: '2026-03-24', cost_center_id: 'CC003', purpose: 'อุปกรณ์สำนักงานเพิ่มเติม (สำหรับ RFQ ปิดแล้ว)',
    status: 'APPROVED', currency_code: 'THB', total_amount: 15000, attachment_count: 0,
    created_at: '2026-03-10T10:00:00Z', updated_at: '2026-03-11T11:00:00Z', created_by_user_id: 'u002', updated_by_user_id: 'mgr02',
    lines: getLinesForPR('pr-012', _prLinesOffice)
  },
  {
    pr_id: 'pr-011', pr_no: 'PR-202603-0011', branch_id: 'BR001', requester_user_id: 'u001', requester_name: 'สมชาย ใจดี',
    request_date: '2026-03-05', required_date: '2026-03-20', cost_center_id: 'CC001', purpose: 'วัสดุสิ้นเปลืองโรงงาน (สำหรับ RFQ ส่งแล้ว)',
    status: 'APPROVED', currency_code: 'THB', total_amount: 25000, attachment_count: 0,
    created_at: '2026-03-05T09:00:00Z', updated_at: '2026-03-06T10:00:00Z', created_by_user_id: 'u001', updated_by_user_id: 'mgr01',
    lines: getLinesForPR('pr-011', _prLinesFactory)
  },
  {
    pr_id: 'pr-010', pr_no: 'PR-202602-0010', branch_id: 'BR001', requester_user_id: 'u001', requester_name: 'สมชาย ใจดี',
    request_date: '2026-02-28', required_date: '2026-03-15', cost_center_id: 'CC001', purpose: 'อุปกรณ์ IT สำหรับพนักงานใหม่ (Q2)',
    status: 'DRAFT', currency_code: 'THB', total_amount: 144800, attachment_count: 0,
    created_at: '2026-02-28T09:00:00Z', updated_at: '2026-02-28T09:00:00Z', created_by_user_id: 'u001', updated_by_user_id: 'u001',
    lines: getLinesForPR('pr-010', _prLinesIT)
  },
  {
    pr_id: 'pr-009', pr_no: 'PR-202602-0009', branch_id: 'BR002', requester_user_id: 'u002', requester_name: 'วิชัย มากมี',
    request_date: '2026-02-23', required_date: '2026-03-10', cost_center_id: 'CC003', purpose: 'จ้างเหมาทำความสะอาดใหญ่ประจำปี',
    status: 'PENDING', currency_code: 'THB', total_amount: 120000, attachment_count: 1,
    created_at: '2026-02-23T10:00:00Z', updated_at: '2026-02-23T10:00:00Z', created_by_user_id: 'u002', updated_by_user_id: 'u002',
    lines: getLinesForPR('pr-009', _prLinesService)
  },
  {
    pr_id: 'pr-008', pr_no: 'PR-202602-0008', branch_id: 'BR001', requester_user_id: 'u003', requester_name: 'นภา สวยงาม',
    request_date: '2026-02-18', required_date: '2026-03-05', cost_center_id: 'CC002', purpose: 'วัสดุสิ้นเปลืองโรงงาน (Emergency)',
    status: 'PENDING', currency_code: 'THB', total_amount: 115000, attachment_count: 0,
    created_at: '2026-02-18T14:30:00Z', updated_at: '2026-02-18T14:30:00Z', created_by_user_id: 'u003', updated_by_user_id: 'u003',
    lines: getLinesForPR('pr-008', _prLinesFactory)
  },
  {
    pr_id: 'pr-007', pr_no: 'PR-202602-0007', branch_id: 'BR001', requester_user_id: 'u001', requester_name: 'สมชาย ใจดี',
    request_date: '2026-02-13', required_date: '2026-02-28', cost_center_id: 'CC001', purpose: 'เครื่องเขียนสำนักงานล็อตใหญ่',
    status: 'APPROVED', currency_code: 'THB', total_amount: 8250, attachment_count: 0,
    created_at: '2026-02-13T09:00:00Z', updated_at: '2026-02-14T11:00:00Z', created_by_user_id: 'u001', updated_by_user_id: 'mgr01',
    lines: getLinesForPR('pr-007', _prLinesOffice)
  },
  {
    pr_id: 'pr-006', pr_no: 'PR-202602-0006', branch_id: 'BR002', requester_user_id: 'u002', requester_name: 'วิชัย มากมี',
    request_date: '2026-02-08', required_date: '2026-02-20', cost_center_id: 'CC003', purpose: 'Laptop สำหรับทีม Sales',
    status: 'APPROVED', currency_code: 'THB', total_amount: 239600, attachment_count: 2,
    created_at: '2026-02-08T13:00:00Z', updated_at: '2026-02-09T09:00:00Z', created_by_user_id: 'u002', updated_by_user_id: 'mgr02',
    lines: getLinesForPR('pr-006', _prLinesIT)
  },
  {
    pr_id: 'pr-005', pr_no: 'PR-202602-0005', branch_id: 'BR001', requester_user_id: 'u003', requester_name: 'นภา สวยงาม',
    request_date: '2026-02-03', required_date: '2026-02-15', cost_center_id: 'CC002', purpose: 'น้ำมันหล่อลื่นเครื่องจักร',
    status: 'APPROVED', currency_code: 'THB', total_amount: 85000, attachment_count: 0,
    created_at: '2026-02-03T10:00:00Z', updated_at: '2026-02-04T15:00:00Z', created_by_user_id: 'u003', updated_by_user_id: 'mgr01',
    lines: getLinesForPR('pr-005', _prLinesFactory)
  },
  {
    pr_id: 'pr-004', pr_no: 'PR-202601-0004', branch_id: 'BR001', requester_user_id: 'u004', requester_name: 'กานดา มารยาท',
    request_date: '2026-01-29', required_date: '2026-02-10', cost_center_id: 'CC004', purpose: 'จัดเลี้ยงรับรองลูกค้า (ยกเลิก)',
    status: 'CANCELLED', currency_code: 'THB', total_amount: 5000, attachment_count: 0,
    created_at: '2026-01-29T11:00:00Z', updated_at: '2026-01-30T09:00:00Z', created_by_user_id: 'u004', updated_by_user_id: 'u004',
    lines: []
  },
  {
    pr_id: 'pr-003', pr_no: 'PR-202601-0003', branch_id: 'BR001', requester_user_id: 'u001', requester_name: 'สมชาย ใจดี',
    request_date: '2026-01-24', required_date: '2026-02-05', cost_center_id: 'CC001', purpose: 'จอ Monitor เพิ่มเติม',
    status: 'APPROVED', currency_code: 'THB', total_amount: 50000, attachment_count: 0,
    created_at: '2026-01-24T09:30:00Z', updated_at: '2026-01-25T10:00:00Z', created_by_user_id: 'u001', updated_by_user_id: 'mgr01',
    lines: getLinesForPR('pr-003', _prLinesIT)
  },
  {
    pr_id: 'pr-002', pr_no: 'PR-202601-0002', branch_id: 'BR002', requester_user_id: 'u002', requester_name: 'วิชัย มากมี',
    request_date: '2026-01-19', required_date: '2026-02-05', cost_center_id: 'CC003', purpose: 'โต๊ะทำงานผู้บริหาร (ไม่อนุมัติ)',
    status: 'CANCELLED', currency_code: 'THB', total_amount: 45000, attachment_count: 1, 
    created_at: '2026-01-19T14:00:00Z', updated_at: '2026-01-20T16:00:00Z', created_by_user_id: 'u002', updated_by_user_id: 'mgr02',
    lines: []
  },
  {
    pr_id: 'pr-001', pr_no: 'PR-202601-0001', branch_id: 'BR001', requester_user_id: 'u001', requester_name: 'สมชาย ใจดี',
    request_date: '2026-01-15', required_date: '2026-02-01', cost_center_id: 'CC001', purpose: 'เครื่องเขียนล็อตแรกของปี',
    status: 'APPROVED', currency_code: 'THB', total_amount: 8250, attachment_count: 0,
    created_at: '2026-01-15T09:00:00Z', updated_at: '2026-01-16T10:00:00Z', created_by_user_id: 'u001', updated_by_user_id: 'mgr01',
    lines: getLinesForPR('pr-001', _prLinesOffice)
  },
];

export const MOCK_PRS: PRHeader[] = IS_DEV ? _mockPRs : [];
export const MOCK_PR_LINES: PRLine[] = IS_DEV ? [..._prLinesIT, ..._prLinesOffice, ..._prLinesService, ..._prLinesFactory] : [];

// =============================================================================
// 2. REQUEST FOR QUOTATION (RFQ) - 8 Items
// =============================================================================

const _mockRFQs: RFQHeader[] = [
  {
    rfq_id: 'rfq-008', rfq_no: 'RFQ-202602-0008', pr_id: 'pr-007', branch_id: 'BR001',
    rfq_date: '2026-02-15', quote_due_date: '2026-02-20', status: 'DRAFT',
    created_by_user_id: 'pur01', created_at: '2026-02-15T09:00:00Z', updated_at: '2026-02-15T09:00:00Z',
    pr_no: 'PR-202602-0007', branch_name: 'สำนักงานใหญ่', created_by_name: 'นายจัดซื้อ หนึ่ง',
    vendor_count: 0, vendor_responded: 0
  },
  {
    rfq_id: 'rfq-007', rfq_no: 'RFQ-202602-0007', pr_id: 'pr-006', branch_id: 'BR002',
    rfq_date: '2026-02-10', quote_due_date: '2026-02-15', status: 'SENT',
    created_by_user_id: 'pur02', created_at: '2026-02-10T10:00:00Z', updated_at: '2026-02-10T10:00:00Z',
    pr_no: 'PR-202602-0006', branch_name: 'สาขาเชียงใหม่', created_by_name: 'นางสาวจัดซื้อ สอง',
    vendor_count: 3, vendor_responded: 1
  },
  {
    rfq_id: 'rfq-006', rfq_no: 'RFQ-202602-0006', pr_id: 'pr-005', branch_id: 'BR001',
    rfq_date: '2026-02-05', quote_due_date: '2026-02-10', status: 'IN_PROGRESS',
    created_by_user_id: 'pur01', created_at: '2026-02-05T11:00:00Z', updated_at: '2026-02-06T09:00:00Z',
    pr_no: 'PR-202602-0005', branch_name: 'สำนักงานใหญ่', created_by_name: 'นายจัดซื้อ หนึ่ง',
    vendor_count: 2, vendor_responded: 2
  },
  {
    rfq_id: 'rfq-005', rfq_no: 'RFQ-202601-0005', pr_id: 'pr-003', branch_id: 'BR001',
    rfq_date: '2026-01-26', quote_due_date: '2026-02-01', status: 'CLOSED', // Complete
    created_by_user_id: 'pur01', created_at: '2026-01-26T13:00:00Z', updated_at: '2026-02-03T10:00:00Z',
    pr_no: 'PR-202601-0003', branch_name: 'สำนักงานใหญ่', created_by_name: 'นายจัดซื้อ หนึ่ง',
    vendor_count: 3, vendor_responded: 3
  },
  {
    rfq_id: 'rfq-004', rfq_no: 'RFQ-202603-0004', pr_id: 'pr-013', branch_id: 'BR001', 
    rfq_date: '2026-03-17', quote_due_date: '2026-03-22', status: 'CANCELLED',
    created_by_user_id: 'pur01', created_at: '2026-03-17T09:00:00Z', updated_at: '2026-03-18T14:00:00Z',
    pr_no: 'PR-202603-0013', branch_name: 'สำนักงานใหญ่', created_by_name: 'นายจัดซื้อ หนึ่ง',
    vendor_count: 0, vendor_responded: 0
  },
  {
    rfq_id: 'rfq-003', rfq_no: 'RFQ-202603-0003', pr_id: 'pr-012', branch_id: 'BR002', 
    rfq_date: '2026-03-12', quote_due_date: '2026-03-18', status: 'CLOSED',
    created_by_user_id: 'pur02', created_at: '2026-03-12T15:00:00Z', updated_at: '2026-03-19T09:00:00Z',
    pr_no: 'PR-202603-0012', branch_name: 'สาขาเชียงใหม่', created_by_name: 'นางสาวจัดซื้อ สอง',
    vendor_count: 2, vendor_responded: 2
  },
  {
    rfq_id: 'rfq-002', rfq_no: 'RFQ-202603-0002', pr_id: 'pr-011', branch_id: 'BR001', 
    rfq_date: '2026-03-07', quote_due_date: '2026-03-12', status: 'SENT',
    created_by_user_id: 'pur01', created_at: '2026-03-07T10:00:00Z', updated_at: '2026-03-07T10:00:00Z',
    pr_no: 'PR-202603-0011', branch_name: 'สำนักงานใหญ่', created_by_name: 'นายจัดซื้อ หนึ่ง',
    vendor_count: 4, vendor_responded: 1
  },
  {
    rfq_id: 'rfq-001', rfq_no: 'RFQ-202601-0001', pr_id: 'pr-001', branch_id: 'BR001',
    rfq_date: '2026-01-17', quote_due_date: '2026-01-22', status: 'CLOSED', // Complete Flow
    created_by_user_id: 'pur01', created_at: '2026-01-17T09:00:00Z', updated_at: '2026-01-24T10:00:00Z',
    pr_no: 'PR-202601-0001', branch_name: 'สำนักงานใหญ่', created_by_name: 'นายจัดซื้อ หนึ่ง',
    vendor_count: 3, vendor_responded: 3
  },
];

export const MOCK_RFQS: RFQHeader[] = IS_DEV ? _mockRFQs : [];
export const MOCK_RFQ_LINES: RFQLine[] = [];
export const MOCK_RFQ_VENDORS: RFQVendor[] = [];

// =============================================================================
// 3. QUOTATION (QT) - 10 Items
// =============================================================================

const _mockQTs: QTListItem[] = [
  // Responses for RFQ-007 (Laptop - Feb 10)
  { quotation_id: 'qt-010', quotation_no: 'QT-V001-010', qc_id: '', rfq_no: 'RFQ-202602-0007', vendor_id: 'v001', vendor_code: 'V001', vendor_name: 'IT Supply Co.', quotation_date: '2026-02-11', valid_until: '2026-03-11', payment_term_days: 30, lead_time_days: 7, total_amount: 240000, currency_code: 'THB', exchange_rate: 1, status: 'SUBMITTED' },
  { quotation_id: 'qt-009', quotation_no: 'QT-V005-009', qc_id: '', rfq_no: 'RFQ-202602-0007', vendor_id: 'v005', vendor_code: 'V005', vendor_name: 'Smart Tech', quotation_date: '2026-02-12', valid_until: '2026-03-12', payment_term_days: 30, lead_time_days: 5, total_amount: 235000, currency_code: 'THB', exchange_rate: 1, status: 'DRAFT' },

  // Responses for RFQ-006 (Factory Oil - Feb 05)
  { quotation_id: 'qt-008', quotation_no: 'QT-V006-008', qc_id: 'qc-006', rfq_no: 'RFQ-202602-0006', vendor_id: 'v006', vendor_code: 'V006', vendor_name: 'Industrial Part Ltd.', quotation_date: '2026-02-06', valid_until: '2026-03-06', payment_term_days: 60, lead_time_days: 3, total_amount: 85000, currency_code: 'THB', exchange_rate: 1, status: 'SUBMITTED' },
  { quotation_id: 'qt-007', quotation_no: 'QT-V007-007', qc_id: 'qc-006', rfq_no: 'RFQ-202602-0006', vendor_id: 'v007', vendor_code: 'V007', vendor_name: 'Global Oil Co.', quotation_date: '2026-02-07', valid_until: '2026-03-07', payment_term_days: 45, lead_time_days: 7, total_amount: 82000, currency_code: 'THB', exchange_rate: 1, status: 'SUBMITTED' },

  // Responses for RFQ-005 (Monitor - Jan 26)
  { quotation_id: 'qt-006', quotation_no: 'QT-V001-006', qc_id: 'qc-005', rfq_no: 'RFQ-202601-0005', vendor_id: 'v001', vendor_code: 'V001', vendor_name: 'IT Supply Co.', quotation_date: '2026-01-27', valid_until: '2026-02-27', payment_term_days: 30, lead_time_days: 7, total_amount: 50000, currency_code: 'THB', exchange_rate: 1, status: 'SELECTED' }, // Winner
  { quotation_id: 'qt-005', quotation_no: 'QT-V005-005', qc_id: 'qc-005', rfq_no: 'RFQ-202601-0005', vendor_id: 'v005', vendor_code: 'V005', vendor_name: 'Smart Tech', quotation_date: '2026-01-28', valid_until: '2026-02-28', payment_term_days: 30, lead_time_days: 10, total_amount: 52000, currency_code: 'THB', exchange_rate: 1, status: 'REJECTED' },
  { quotation_id: 'qt-004', quotation_no: 'QT-V002-004', qc_id: 'qc-005', rfq_no: 'RFQ-202601-0005', vendor_id: 'v002', vendor_code: 'V002', vendor_name: 'OfficeMate', quotation_date: '2026-01-29', valid_until: '2026-03-01', payment_term_days: 30, lead_time_days: 2, total_amount: 55000, currency_code: 'THB', exchange_rate: 1, status: 'REJECTED' },

  // Responses for RFQ-001 (Stationery - Jan 17)
  { quotation_id: 'qt-003', quotation_no: 'QT-V002-003', qc_id: 'qc-001', rfq_no: 'RFQ-202601-0001', vendor_id: 'v002', vendor_code: 'V002', vendor_name: 'OfficeMate', quotation_date: '2026-01-18', valid_until: '2026-02-18', payment_term_days: 30, lead_time_days: 1, total_amount: 8250, currency_code: 'THB', exchange_rate: 1, status: 'SELECTED' }, // Winner
  { quotation_id: 'qt-002', quotation_no: 'QT-V003-002', qc_id: 'qc-001', rfq_no: 'RFQ-202601-0001', vendor_id: 'v003', vendor_code: 'V003', vendor_name: 'B2S', quotation_date: '2026-01-19', valid_until: '2026-02-19', payment_term_days: 30, lead_time_days: 3, total_amount: 8500, currency_code: 'THB', exchange_rate: 1, status: 'REJECTED' },
  { quotation_id: 'qt-001', quotation_no: 'QT-V004-001', qc_id: 'qc-001', rfq_no: 'RFQ-202601-0001', vendor_id: 'v004', vendor_code: 'V004', vendor_name: 'Local Store', quotation_date: '2026-01-20', valid_until: '2026-02-20', payment_term_days: 0, lead_time_days: 0, total_amount: 9000, currency_code: 'THB', exchange_rate: 1, status: 'REJECTED' },
];

export const MOCK_QTS: QTListItem[] = IS_DEV ? _mockQTs : [];

// =============================================================================
// 4. QUOTATION COMPARISON (QC) - 6 Items
// =============================================================================

const _mockQCs: QCListItem[] = [
  { qc_id: 'qc-006', qc_no: 'QC-202602-0006', pr_id: 'pr-005', pr_no: 'PR-202602-0005', created_at: '2026-02-08', status: 'WAITING_FOR_PO', vendor_count: 2, lowest_bidder_vendor_id: 'v007', lowest_bidder_name: 'Global Oil Co.', lowest_bid_amount: 82000 },
  { qc_id: 'qc-005', qc_no: 'QC-202601-0005', pr_id: 'pr-003', pr_no: 'PR-202601-0003', created_at: '2026-01-31', status: 'PO_CREATED', vendor_count: 3, lowest_bidder_vendor_id: 'v001', lowest_bidder_name: 'IT Supply Co.', lowest_bid_amount: 50000 },
  { qc_id: 'qc-004', qc_no: 'QC-202603-0004', pr_id: 'pr-x', pr_no: 'PR-202603-xxxx', created_at: '2026-03-20', status: 'PO_CREATED', vendor_count: 1, lowest_bidder_vendor_id: 'v00x', lowest_bidder_name: 'Test Vendor', lowest_bid_amount: 10000 },
  { qc_id: 'qc-003', qc_no: 'QC-202603-0003', pr_id: 'pr-y', pr_no: 'PR-202603-yyyy', created_at: '2026-03-15', status: 'WAITING_FOR_PO', vendor_count: 2, lowest_bidder_vendor_id: 'v00y', lowest_bidder_name: 'Test Vendor Y', lowest_bid_amount: 5500 },
  { qc_id: 'qc-002', qc_no: 'QC-202603-0002', pr_id: 'pr-z', pr_no: 'PR-202603-zzzz', created_at: '2026-03-05', status: 'PO_CREATED', vendor_count: 3, lowest_bidder_vendor_id: 'v00z', lowest_bidder_name: 'Test Vendor Z', lowest_bid_amount: 12000 },
  { qc_id: 'qc-001', qc_no: 'QC-202601-0001', pr_id: 'pr-001', pr_no: 'PR-202601-0001', created_at: '2026-01-21', status: 'PO_CREATED', vendor_count: 3, lowest_bidder_vendor_id: 'v002', lowest_bidder_name: 'OfficeMate', lowest_bid_amount: 8250 },
];

export const MOCK_QCS: QCListItem[] = IS_DEV ? _mockQCs : [];

// =============================================================================
// 5. PURCHASE ORDER (PO) - 8 Items
// =============================================================================

const _mockPOs: POListItem[] = [
  { po_id: 'po-008', po_no: 'PO-202603-0008', po_date: '2026-03-25', pr_id: 'pr-x', vendor_id: 'v001', vendor_name: 'IT Supply Co.', branch_id: 'br1', status: 'DRAFT', currency_code: 'THB', exchange_rate: 1, payment_term_days: 30, subtotal: 5000, tax_amount: 350, total_amount: 5350, created_by: 'u1', item_count: 1 },
  { po_id: 'po-007', po_no: 'PO-202603-0007', po_date: '2026-03-20', pr_id: 'pr-y', vendor_id: 'v002', vendor_name: 'OfficeMate', branch_id: 'br1', status: 'APPROVED', currency_code: 'THB', exchange_rate: 1, payment_term_days: 30, subtotal: 10000, tax_amount: 700, total_amount: 10700, created_by: 'u1', item_count: 5 },
  { po_id: 'po-006', po_no: 'PO-202602-0006', po_date: '2026-02-05', pr_id: 'pr-003', vendor_id: 'v001', vendor_name: 'IT Supply Co.', branch_id: 'br1', status: 'ISSUED', currency_code: 'THB', exchange_rate: 1, payment_term_days: 30, subtotal: 50000, tax_amount: 3500, total_amount: 53500, created_by: 'u1', item_count: 2 }, // Linked to GRN Draft
  { po_id: 'po-005', po_no: 'PO-202603-0005', po_date: '2026-03-10', pr_id: 'pr-z', vendor_id: 'v006', vendor_name: 'Industrial Part', branch_id: 'br1', status: 'ISSUED', currency_code: 'THB', exchange_rate: 1, payment_term_days: 60, subtotal: 85000, tax_amount: 5950, total_amount: 90950, created_by: 'u1', item_count: 2 },
  { po_id: 'po-004', po_no: 'PO-202603-0004', po_date: '2026-03-01', pr_id: 'pr-a', vendor_id: 'v004', vendor_name: 'Local Store', branch_id: 'br1', status: 'CANCELLED', currency_code: 'THB', exchange_rate: 1, payment_term_days: 0, subtotal: 3000, tax_amount: 210, total_amount: 3210, created_by: 'u1', item_count: 1 },
  { po_id: 'po-003', po_no: 'PO-202602-0003', po_date: '2026-02-15', pr_id: 'pr-b', vendor_id: 'v003', vendor_name: 'B2S', branch_id: 'br1', status: 'CLOSED', currency_code: 'THB', exchange_rate: 1, payment_term_days: 30, subtotal: 2500, tax_amount: 175, total_amount: 2675, created_by: 'u1', item_count: 3 },
  { po_id: 'po-002', po_no: 'PO-202602-0002', po_date: '2026-02-10', pr_id: 'pr-c', vendor_id: 'v002', vendor_name: 'OfficeMate', branch_id: 'br1', status: 'CLOSED', currency_code: 'THB', exchange_rate: 1, payment_term_days: 30, subtotal: 4500, tax_amount: 315, total_amount: 4815, created_by: 'u1', item_count: 5 },
  { po_id: 'po-001', po_no: 'PO-202601-0001', po_date: '2026-01-25', pr_id: 'pr-001', vendor_id: 'v002', vendor_name: 'OfficeMate', branch_id: 'br1', status: 'CLOSED', currency_code: 'THB', exchange_rate: 1, payment_term_days: 30, subtotal: 8250, tax_amount: 577.5, total_amount: 8827.5, created_by: 'u1', item_count: 2 }, // Full Flow
];

export const MOCK_POS: POListItem[] = IS_DEV ? _mockPOs : [];

// =============================================================================
// 6. GOODS RECEIPT NOTE (GRN) - 8 Items
// =============================================================================

const _mockGRNs: GRNListItem[] = [
  { grn_id: 'grn-008', grn_no: 'GRN-202602-0008', po_id: 'po-006', po_no: 'PO-202602-0006', received_date: '2026-02-10', warehouse_id: 'w1', warehouse_name: 'Main WH', received_by: 'u2', received_by_name: 'Staff', status: 'DRAFT', item_count: 2 },
  { grn_id: 'grn-007', grn_no: 'GRN-202603-0007', po_id: 'po-005', po_no: 'PO-202603-0005', received_date: '2026-03-15', warehouse_id: 'w2', warehouse_name: 'Factory WH', received_by: 'u2', received_by_name: 'Staff', status: 'POSTED', item_count: 2 },
  { grn_id: 'grn-006', grn_no: 'GRN-202602-0006', po_id: 'po-003', po_no: 'PO-202602-0003', received_date: '2026-02-20', warehouse_id: 'w1', warehouse_name: 'Main WH', received_by: 'u2', received_by_name: 'Staff', status: 'POSTED', item_count: 3 },
  { grn_id: 'grn-005', grn_no: 'GRN-202602-0005', po_id: 'po-002', po_no: 'PO-202602-0002', received_date: '2026-02-15', warehouse_id: 'w1', warehouse_name: 'Main WH', received_by: 'u2', received_by_name: 'Staff', status: 'RETURNED', item_count: 5 }, // Damaged
  { grn_id: 'grn-004', grn_no: 'GRN-202603-0004', po_id: 'po-x', po_no: 'PO-202603-xxxx', received_date: '2026-03-28', warehouse_id: 'w1', warehouse_name: 'Main WH', received_by: 'u2', received_by_name: 'Staff', status: 'REVERSED', item_count: 1 },
  { grn_id: 'grn-003', grn_no: 'GRN-202603-0003', po_id: 'po-y', po_no: 'PO-202603-yyyy', received_date: '2026-03-23', warehouse_id: 'w1', warehouse_name: 'Main WH', received_by: 'u2', received_by_name: 'Staff', status: 'POSTED', item_count: 1 },
  { grn_id: 'grn-002', grn_no: 'GRN-202603-0002', po_id: 'po-z', po_no: 'PO-202603-zzzz', received_date: '2026-03-13', warehouse_id: 'w1', warehouse_name: 'Main WH', received_by: 'u2', requester_name: 'Staff', status: 'POSTED', item_count: 1 } as unknown as GRNListItem, // Fix type mismatch if needed, sticking to pattern
  { grn_id: 'grn-001', grn_no: 'GRN-202601-0001', po_id: 'po-001', po_no: 'PO-202601-0001', received_date: '2026-01-30', warehouse_id: 'w1', warehouse_name: 'Main WH', received_by: 'u2', received_by_name: 'Staff', status: 'POSTED', item_count: 2 }, // Full Flow
];

export const MOCK_GRNS: GRNListItem[] = IS_DEV ? _mockGRNs : [];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const getApprovedPRs = (): PRHeader[] => MOCK_PRS.filter(pr => pr.status === 'APPROVED');
export const getRFQByPRId = (prId: string): RFQHeader | undefined => MOCK_RFQS.find(rfq => rfq.pr_id === prId);
export const getRFQLinesByRFQId = (rfqId: string): RFQLine[] => MOCK_RFQ_LINES.filter(line => line.rfq_id === rfqId);
export const getVendorsByRFQId = (rfqId: string): RFQVendor[] => MOCK_RFQ_VENDORS.filter(v => v.rfq_id === rfqId);
export const getQTsByRFQNo = (rfqNo: string): QTListItem[] => MOCK_QTS.filter(qt => qt.rfq_no === rfqNo);
export const getQCByPRId = (prId: string): QCListItem | undefined => MOCK_QCS.find(qc => qc.pr_id === prId);
