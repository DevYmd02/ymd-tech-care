/**
 * @file procurementMocks.ts
 * @description Consolidated Mock Data for Procurement Flow: PR → RFQ → QT → QC
 * 
 * @linkage
 * - RFQ references PR_ID (from MOCK_PRS)
 * - RFQ references VENDOR_ID[] (from vendorMocks.ts)
 * - QT references RFQ_ID (from MOCK_RFQS) and VENDOR_ID (from vendorMocks.ts)
 * - QC references RFQ_ID (from MOCK_RFQS) and QT_IDs[] (from MOCK_QTS)
 * 
 * @note This is the Single Source of Truth for all procurement mock data.
 */

import type { PRHeader, PRLine } from '../types/pr-types';
import type { RFQHeader, RFQLine, RFQVendor } from '../types/rfq-types';
import type { QTListItem } from '../types/qt-types';
import type { QCListItem } from '../types/qc-types';
import { MOCK_VENDORS } from './vendorMocks';

const IS_DEV = import.meta.env.DEV;

// =============================================================================
// 1. PURCHASE REQUISITION (PR)
// =============================================================================

const _prLines001: PRLine[] = [
  {
    pr_line_id: 'prline-001-1',
    pr_id: 'pr-001',
    line_no: 1,
    item_id: 'item-001',
    item_code: 'IT-NB-001',
    item_name: 'Notebook Dell Latitude 5540',
    quantity: 5,
    uom: 'เครื่อง',
    est_unit_price: 35000,
    est_amount: 175000,
    needed_date: '2026-02-01',
  },
  {
    pr_line_id: 'prline-001-2',
    pr_id: 'pr-001',
    line_no: 2,
    item_id: 'item-002',
    item_code: 'IT-MO-001',
    item_name: 'Monitor 24" LED',
    quantity: 5,
    uom: 'เครื่อง',
    est_unit_price: 4500,
    est_amount: 22500,
    needed_date: '2026-02-01',
  },
];

const _prLines002: PRLine[] = [
  {
    pr_line_id: 'prline-002-1',
    pr_id: 'pr-002',
    line_no: 1,
    item_id: 'item-003',
    item_code: 'OF-PP-001',
    item_name: 'กระดาษ A4 80 แกรม',
    quantity: 50,
    uom: 'รีม',
    est_unit_price: 120,
    est_amount: 6000,
    needed_date: '2026-02-15',
  },
  {
    pr_line_id: 'prline-002-2',
    pr_id: 'pr-002',
    line_no: 2,
    item_id: 'item-004',
    item_code: 'OF-PEN-001',
    item_name: 'ปากกาลูกลื่น',
    quantity: 100,
    uom: 'ด้าม',
    est_unit_price: 15,
    est_amount: 1500,
    needed_date: '2026-02-15',
  },
];

const _mockPRs: PRHeader[] = [
  {
    pr_id: 'pr-001',
    pr_no: 'PR-202601-0001',
    branch_id: 'BR001',
    requester_user_id: 'user-001',
    requester_name: 'สมชาย ใจดี',
    request_date: '2026-01-15',
    required_date: '2026-02-01',
    cost_center_id: 'cc-001',
    purpose: 'จัดซื้ออุปกรณ์ IT สำหรับพนักงานใหม่',
    status: 'APPROVED', // ✅ Ready for RFQ
    currency_code: 'THB',
    total_amount: 197500,
    attachment_count: 0,
    created_at: '2026-01-15T09:00:00Z',
    updated_at: '2026-01-16T14:00:00Z',
    created_by_user_id: 'user-001',
    updated_by_user_id: 'user-mgr-001',
    lines: _prLines001,
  },
  {
    pr_id: 'pr-002',
    pr_no: 'PR-202601-0002',
    branch_id: 'BR001',
    requester_user_id: 'user-002',
    requester_name: 'สมหญิง รักงาน',
    request_date: '2026-01-20',
    required_date: '2026-02-15',
    cost_center_id: 'cc-002',
    purpose: 'จัดซื้อวัสดุสำนักงานประจำเดือน',
    status: 'APPROVED', // ✅ Ready for RFQ
    currency_code: 'THB',
    total_amount: 7500,
    attachment_count: 0,
    created_at: '2026-01-20T08:00:00Z',
    updated_at: '2026-01-21T10:00:00Z',
    created_by_user_id: 'user-002',
    updated_by_user_id: 'user-mgr-001',
    lines: _prLines002,
  },
  {
    pr_id: 'pr-003',
    pr_no: 'PR-202601-0003',
    branch_id: 'BR002',
    requester_user_id: 'user-003',
    requester_name: 'วิชัย มากมี',
    request_date: '2026-01-22',
    required_date: '2026-03-01',
    cost_center_id: 'cc-003',
    purpose: 'จัดซื้อเฟอร์นิเจอร์สำนักงาน',
    status: 'IN_APPROVAL', // ⏳ Pending Approval
    currency_code: 'THB',
    total_amount: 85000,
    attachment_count: 1,
    created_at: '2026-01-22T11:00:00Z',
    updated_at: '2026-01-22T11:00:00Z',
    created_by_user_id: 'user-003',
    updated_by_user_id: 'user-003',
  },
  {
    pr_id: 'pr-004',
    pr_no: 'PR-202601-0004',
    branch_id: 'BR001',
    requester_user_id: 'user-001',
    requester_name: 'สมชาย ใจดี',
    request_date: '2026-01-18',
    required_date: '2026-02-10',
    cost_center_id: 'cc-001',
    purpose: 'จัดซื้ออุปกรณ์ IT เพิ่มเติม',
    status: 'DRAFT', // 📝 Draft
    currency_code: 'THB',
    total_amount: 45000,
    attachment_count: 0,
    created_at: '2026-01-18T14:00:00Z',
    updated_at: '2026-01-18T14:00:00Z',
    created_by_user_id: 'user-001',
    updated_by_user_id: 'user-001',
  },
];

// =============================================================================
// 2. REQUEST FOR QUOTATION (RFQ)
// =============================================================================

const _rfqLines: RFQLine[] = [
  {
    rfq_line_id: 'rfqline-001-1',
    rfq_id: 'rfq-001',
    line_no: 1,
    pr_line_id: 'prline-001-1',
    item_id: 'item-001',
    item_code: 'IT-NB-001',
    item_name: 'Notebook Dell Latitude 5540',
    item_description: 'Notebook สำหรับพนักงาน Intel Core i5',
    required_qty: 5,
    uom: 'เครื่อง',
    required_date: '2026-02-01',
    technical_spec: 'CPU: Core i5, RAM: 16GB, SSD: 512GB',
  },
  {
    rfq_line_id: 'rfqline-001-2',
    rfq_id: 'rfq-001',
    line_no: 2,
    pr_line_id: 'prline-001-2',
    item_id: 'item-002',
    item_code: 'IT-MO-001',
    item_name: 'Monitor 24" LED',
    item_description: 'จอมอนิเตอร์ LED Full HD',
    required_qty: 5,
    uom: 'เครื่อง',
    required_date: '2026-02-01',
    technical_spec: 'Size: 24", Resolution: 1920x1080',
  },
];

// RFQ → Vendor linkage (referencing vendorMocks.ts)
const _rfqVendors: RFQVendor[] = [
  {
    rfq_vendor_id: 'rfqv-001-1',
    rfq_id: 'rfq-001',
    vendor_id: MOCK_VENDORS[0]?.vendor_id || 'vendor-001', // V001 - ไอทีซัพพลาย
    sent_date: '2026-01-20T10:00:00Z',
    sent_via: 'EMAIL',
    email_sent_to: MOCK_VENDORS[0]?.email || 'sales@itsupply.co.th',
    response_date: '2026-01-22T10:00:00Z',
    status: 'RESPONDED',
    remark: null,
  },
  {
    rfq_vendor_id: 'rfqv-001-2',
    rfq_id: 'rfq-001',
    vendor_id: MOCK_VENDORS[1]?.vendor_id || 'vendor-002', // V002 - ออฟฟิศเมท
    sent_date: '2026-01-20T10:00:00Z',
    sent_via: 'EMAIL',
    email_sent_to: MOCK_VENDORS[1]?.email || 'sales@officemate.co.th',
    response_date: '2026-01-23T14:00:00Z',
    status: 'RESPONDED',
    remark: null,
  },
  {
    rfq_vendor_id: 'rfqv-001-3',
    rfq_id: 'rfq-001',
    vendor_id: MOCK_VENDORS[4]?.vendor_id || 'vendor-005', // V005 - สมาร์ทเทค
    sent_date: '2026-01-20T10:00:00Z',
    sent_via: 'EMAIL',
    email_sent_to: MOCK_VENDORS[4]?.email || 'info@smarttech.co.th',
    response_date: null,
    status: 'SENT', // Not yet responded
    remark: null,
  },
];

const _mockRFQs: RFQHeader[] = [
  {
    rfq_id: 'rfq-001',
    rfq_no: 'RFQ-202601-0001',
    pr_id: 'pr-001',
    branch_id: 'BR001',
    rfq_date: '2026-01-20',
    quote_due_date: '2026-01-25',
    terms_and_conditions: 'ชำระเงินภายใน 30 วัน หลังส่งมอบสินค้า',
    status: 'DRAFT', // แบบร่าง - ส่ง RFQ
    created_by_user_id: 'user-purchase-001',
    created_at: '2026-01-20T09:00:00Z',
    updated_at: '2026-01-20T09:00:00Z',
    pr_no: 'PR-202601-0001',
    branch_name: 'สำนักงานใหญ่',
    created_by_name: 'นายจัดซื้อ หนึ่ง',
    vendor_count: 3,
    vendor_responded: 0,
  },
  {
    rfq_id: 'rfq-002',
    rfq_no: 'RFQ-202601-0002',
    pr_id: 'pr-002',
    branch_id: 'BR001',
    rfq_date: '2026-01-21',
    quote_due_date: '2026-01-26',
    terms_and_conditions: 'ชำระเงินภายใน 15 วัน',
    status: 'SENT', // ส่งแล้ว - บันทึกราคา
    created_by_user_id: 'user-purchase-001',
    created_at: '2026-01-21T10:00:00Z',
    updated_at: '2026-01-22T08:00:00Z',
    pr_no: 'PR-202601-0002',
    branch_name: 'สำนักงานใหญ่',
    created_by_name: 'นายจัดซื้อ หนึ่ง',
    vendor_count: 5,
    vendor_responded: 2,
  },
  {
    rfq_id: 'rfq-003',
    rfq_no: 'RFQ-202601-0003',
    pr_id: 'pr-001',
    branch_id: 'BR002',
    rfq_date: '2026-01-22',
    quote_due_date: '2026-01-27',
    terms_and_conditions: 'ชำระเงินภายใน 30 วัน',
    status: 'SENT', // ส่งแล้ว - บันทึกราคา
    created_by_user_id: 'user-purchase-002',
    created_at: '2026-01-22T11:00:00Z',
    updated_at: '2026-01-23T09:00:00Z',
    pr_no: 'PR-202601-0001',
    branch_name: 'สาขาเชียงใหม่',
    created_by_name: 'นางสาวจัดซื้อ สอง',
    vendor_count: 4,
    vendor_responded: 3,
  },
  {
    rfq_id: 'rfq-004',
    rfq_no: 'RFQ-202601-0004',
    pr_id: 'pr-002',
    branch_id: 'BR001',
    rfq_date: '2026-01-23',
    quote_due_date: '2026-01-28',
    terms_and_conditions: 'ชำระเงินภายใน 30 วัน',
    status: 'CLOSED', // ปิดแล้ว - ดูเฉย
    created_by_user_id: 'user-purchase-001',
    created_at: '2026-01-23T08:00:00Z',
    updated_at: '2026-01-25T16:00:00Z',
    pr_no: 'PR-202601-0002',
    branch_name: 'สำนักงานใหญ่',
    created_by_name: 'นายจัดซื้อ หนึ่ง',
    vendor_count: 2,
    vendor_responded: 2,
  },
  {
    rfq_id: 'rfq-005',
    rfq_no: 'RFQ-202601-0005',
    pr_id: 'pr-003',
    branch_id: 'BR001',
    rfq_date: '2026-01-24',
    quote_due_date: '2026-01-29',
    terms_and_conditions: 'ชำระเงินภายใน 45 วัน',
    status: 'DRAFT', // แบบร่าง - ส่ง RFQ
    created_by_user_id: 'user-purchase-002',
    created_at: '2026-01-24T09:00:00Z',
    updated_at: '2026-01-24T09:00:00Z',
    pr_no: 'PR-202601-0003',
    branch_name: 'สำนักงานใหญ่',
    created_by_name: 'นางสาวจัดซื้อ สอง',
    vendor_count: 6,
    vendor_responded: 0,
  },
  {
    rfq_id: 'rfq-006',
    rfq_no: 'RFQ-202601-0006',
    pr_id: 'pr-001',
    branch_id: 'BR002',
    rfq_date: '2026-01-25',
    quote_due_date: '2026-01-30',
    terms_and_conditions: 'ชำระเงินภายใน 15 วัน',
    status: 'SENT', // ส่งแล้ว - บันทึกราคา
    created_by_user_id: 'user-purchase-001',
    created_at: '2026-01-25T14:00:00Z',
    updated_at: '2026-01-26T10:00:00Z',
    pr_no: 'PR-202601-0001',
    branch_name: 'สาขาเชียงใหม่',
    created_by_name: 'นายจัดซื้อ หนึ่ง',
    vendor_count: 3,
    vendor_responded: 1,
  },
];

// =============================================================================
// 3. QUOTATION (QT) - Vendor Responses
// =============================================================================

const _mockQTs: QTListItem[] = [
  {
    quotation_id: 'qt-001',
    quotation_no: 'QT-V001-2026-001',
    qc_id: 'qc-001',
    rfq_no: 'RFQ-202601-0001',
    vendor_id: MOCK_VENDORS[0]?.vendor_id || 'vendor-001', // ← Links to SSOT
    vendor_code: MOCK_VENDORS[0]?.vendor_code || 'V001',
    vendor_name: MOCK_VENDORS[0]?.vendor_name || 'บริษัท ไอทีซัพพลาย จำกัด',
    quotation_date: '2026-01-22',
    valid_until: '2026-02-22',
    payment_term_days: 30,
    lead_time_days: 7,
    total_amount: 185000.00, // Lower price
    currency_code: 'THB',
    exchange_rate: 1.0,
    status: 'SUBMITTED',
  },
  {
    quotation_id: 'qt-002',
    quotation_no: 'QT-V002-2026-001',
    qc_id: 'qc-001',
    rfq_no: 'RFQ-202601-0001',
    vendor_id: MOCK_VENDORS[1]?.vendor_id || 'vendor-002', // ← Links to SSOT
    vendor_code: MOCK_VENDORS[1]?.vendor_code || 'V002',
    vendor_name: MOCK_VENDORS[1]?.vendor_name || 'บริษัท ออฟฟิศเมท จำกัด',
    quotation_date: '2026-01-23',
    valid_until: '2026-02-23',
    payment_term_days: 45,
    lead_time_days: 10,
    total_amount: 192000.00,
    currency_code: 'THB',
    exchange_rate: 1.0,
    status: 'SUBMITTED',
  },
  {
    quotation_id: 'qt-003',
    quotation_no: 'QT-V005-2026-001',
    qc_id: 'qc-001',
    rfq_no: 'RFQ-202601-0001',
    vendor_id: MOCK_VENDORS[4]?.vendor_id || 'vendor-005', // ← Links to SSOT
    vendor_code: MOCK_VENDORS[4]?.vendor_code || 'V005',
    vendor_name: MOCK_VENDORS[4]?.vendor_name || 'บริษัท สมาร์ทเทค โซลูชั่นส์ จำกัด',
    quotation_date: '2026-01-24',
    valid_until: '2026-02-24',
    payment_term_days: 60,
    lead_time_days: 5,
    total_amount: 178500.00, // Lowest price
    currency_code: 'THB',
    exchange_rate: 1.0,
    status: 'SELECTED', // Winner
  },
];

// =============================================================================
// 4. QUOTATION COMPARISON (QC)
// =============================================================================

const _mockQCs: QCListItem[] = [
  {
    qc_id: 'qc-001',
    qc_no: 'QC-202601-0001',
    pr_id: 'pr-001',
    pr_no: 'PR-202601-0001',
    created_at: '2026-01-24',
    status: 'WAITING_FOR_PO',
    vendor_count: 3,
    lowest_bidder_name: MOCK_VENDORS[4]?.vendor_name || 'บริษัท สมาร์ทเทค โซลูชั่นส์ จำกัด',
    lowest_bid_amount: 178500.00,
  },
  {
    qc_id: 'qc-002',
    qc_no: 'QC-202601-0002',
    pr_id: 'pr-002',
    pr_no: 'PR-202601-0002',
    created_at: '2026-01-25',
    status: 'WAITING_FOR_PO',
    vendor_count: 2,
    lowest_bidder_name: undefined,
    lowest_bid_amount: undefined,
  },
];

// =============================================================================
// EXPORTS (DEV mode only)
// =============================================================================

export const MOCK_PRS: PRHeader[] = IS_DEV ? _mockPRs : [];
export const MOCK_PR_LINES: PRLine[] = IS_DEV ? [..._prLines001, ..._prLines002] : [];

export const MOCK_RFQS: RFQHeader[] = IS_DEV ? _mockRFQs : [];
export const MOCK_RFQ_LINES: RFQLine[] = IS_DEV ? _rfqLines : [];
export const MOCK_RFQ_VENDORS: RFQVendor[] = IS_DEV ? _rfqVendors : [];

export const MOCK_QTS: QTListItem[] = IS_DEV ? _mockQTs : [];
export const MOCK_QCS: QCListItem[] = IS_DEV ? _mockQCs : [];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** ดึง PRs ที่พร้อมสร้าง RFQ (status = APPROVED) */
export const getApprovedPRs = (): PRHeader[] => {
  return MOCK_PRS.filter(pr => pr.status === 'APPROVED');
};

/** ดึง RFQ จาก PR ID */
export const getRFQByPRId = (prId: string): RFQHeader | undefined => {
  return MOCK_RFQS.find(rfq => rfq.pr_id === prId);
};

/** ดึง RFQ Lines จาก RFQ ID */
export const getRFQLinesByRFQId = (rfqId: string): RFQLine[] => {
  return MOCK_RFQ_LINES.filter(line => line.rfq_id === rfqId);
};

/** ดึง Vendors ที่ถูกเชิญใน RFQ */
export const getVendorsByRFQId = (rfqId: string): RFQVendor[] => {
  return MOCK_RFQ_VENDORS.filter(v => v.rfq_id === rfqId);
};

/** ดึง QTs จาก RFQ No */
export const getQTsByRFQNo = (rfqNo: string): QTListItem[] => {
  return MOCK_QTS.filter(qt => qt.rfq_no === rfqNo);
};

/** ดึง QC จาก PR ID */
export const getQCByPRId = (prId: string): QCListItem | undefined => {
  return MOCK_QCS.find(qc => qc.pr_id === prId);
};
