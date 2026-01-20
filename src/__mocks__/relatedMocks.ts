/**
 * @file relatedMocks.ts
 * @description Mock data ที่เชื่อมโยงกัน: Vendor → PR → RFQ
 * 
 * Flow: Vendor สร้าง PR → PR Approved → สร้าง RFQ ส่งให้ Vendor
 * 
 * @note ข้อมูลน้อยเพื่อดูตัวอย่าง
 */

import type { VendorMaster } from '../types/vendor-types';
import type { PRHeader, PRLine } from '../types/pr-types';
import type { RFQHeader, RFQLine, RFQVendor } from '../types/rfq-types';

const IS_DEV = import.meta.env.DEV;

// =============================================================================
// 1. VENDORS (ผู้ขาย) - 3 ราย
// =============================================================================

const _vendors: VendorMaster[] = [
  {
    vendor_id: 'vendor-001',
    vendor_code: 'V001',
    vendor_name: 'บริษัท ไอทีซัพพลาย จำกัด',
    vendor_type: 'COMPANY',
    tax_id: '0105562012345',
    phone: '02-123-4567',
    email: 'sales@itsupply.co.th',
    status: 'ACTIVE',
    is_blocked: false,
    is_on_hold: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    vendor_id: 'vendor-002',
    vendor_code: 'V002',
    vendor_name: 'บริษัท ออฟฟิศเมท จำกัด',
    vendor_type: 'COMPANY',
    tax_id: '0105562012346',
    phone: '02-234-5678',
    email: 'sales@officemate.co.th',
    status: 'ACTIVE',
    is_blocked: false,
    is_on_hold: false,
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
  {
    vendor_id: 'vendor-003',
    vendor_code: 'V003',
    vendor_name: 'บริษัท เฟอร์นิเจอร์พลัส จำกัด',
    vendor_type: 'COMPANY',
    tax_id: '0105562012347',
    phone: '02-345-6789',
    email: 'sales@furnitureplus.co.th',
    status: 'ACTIVE',
    is_blocked: false,
    is_on_hold: false,
    created_at: '2026-01-03T00:00:00Z',
    updated_at: '2026-01-03T00:00:00Z',
  },
];

// =============================================================================
// 2. PR WITH LINES
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
];

const _prHeaders: PRHeader[] = [
  {
    pr_id: 'pr-001',
    pr_no: 'PR-202601-0001',
    branch_id: 'branch-001',
    requester_user_id: 'user-001',
    requester_name: 'สมชาย ใจดี',
    request_date: '2026-01-15',
    required_date: '2026-02-01',
    cost_center_id: 'cc-001',
    purpose: 'จัดซื้ออุปกรณ์ IT',
    status: 'APPROVED', // ✅ → สร้าง RFQ ได้
    currency_code: 'THB',
    total_amount: 175000,
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
    branch_id: 'branch-001',
    requester_user_id: 'user-002',
    requester_name: 'สมหญิง รักงาน',
    request_date: '2026-01-20',
    required_date: '2026-02-28',
    cost_center_id: 'cc-002',
    purpose: 'จัดซื้อวัสดุสำนักงาน',
    status: 'IN_APPROVAL', // ⏳ รออนุมัติ
    currency_code: 'THB',
    total_amount: 15000,
    attachment_count: 0,
    created_at: '2026-01-20T08:00:00Z',
    updated_at: '2026-01-20T08:00:00Z',
    created_by_user_id: 'user-002',
    updated_by_user_id: 'user-002',
  },
];

// =============================================================================
// 3. RFQ (จาก PR ที่ Approved)
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
    item_description: 'Notebook สำหรับพนักงาน',
    required_qty: 5,
    uom: 'เครื่อง',
    required_date: '2026-02-01',
    technical_spec: null,
  },
];

const _rfqVendors: RFQVendor[] = [
  {
    rfq_vendor_id: 'rfqv-001-1',
    rfq_id: 'rfq-001',
    vendor_id: 'vendor-001', // ← V001
    sent_date: '2026-01-20T10:00:00Z',
    sent_via: 'EMAIL',
    email_sent_to: 'sales@itsupply.co.th',
    response_date: '2026-01-22T10:00:00Z',
    status: 'RESPONDED',
    remark: null,
  },
  {
    rfq_vendor_id: 'rfqv-001-2',
    rfq_id: 'rfq-001',
    vendor_id: 'vendor-002', // ← V002
    sent_date: '2026-01-20T10:00:00Z',
    sent_via: 'EMAIL',
    email_sent_to: 'sales@officemate.co.th',
    response_date: null,
    status: 'SENT',
    remark: null,
  },
];

const _rfqHeaders: RFQHeader[] = [
  {
    rfq_id: 'rfq-001',
    rfq_no: 'RFQ-202601-0001',
    pr_id: 'pr-001', // ← จาก PR-001
    branch_id: 'branch-001',
    rfq_date: '2026-01-20',
    quote_due_date: '2026-01-27',
    terms_and_conditions: 'ชำระเงินภายใน 30 วัน',
    status: 'IN_PROGRESS',
    created_by_user_id: 'user-purchase-001',
    created_at: '2026-01-20T09:00:00Z',
    updated_at: '2026-01-22T10:00:00Z',
    pr_no: 'PR-202601-0001',
    branch_name: 'สำนักงานใหญ่',
    created_by_name: 'นายจัดซื้อ หนึ่ง',
    vendor_count: 2,
    vendor_responded: 1,
  },
];

// =============================================================================
// EXPORTS
// =============================================================================

export const RELATED_VENDORS: VendorMaster[] = IS_DEV ? _vendors : [];
export const RELATED_PRS: PRHeader[] = IS_DEV ? _prHeaders : [];
export const RELATED_RFQS: RFQHeader[] = IS_DEV ? _rfqHeaders : [];
export const RELATED_RFQ_LINES: RFQLine[] = IS_DEV ? _rfqLines : [];
export const RELATED_RFQ_VENDORS: RFQVendor[] = IS_DEV ? _rfqVendors : [];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** ดึง PRs ที่พร้อมสร้าง RFQ (status = APPROVED) */
export const getApprovedPRs = (): PRHeader[] => {
  return RELATED_PRS.filter(pr => pr.status === 'APPROVED');
};

/** ดึง RFQ จาก PR ID */
export const getRFQByPRId = (prId: string): RFQHeader | undefined => {
  return RELATED_RFQS.find(rfq => rfq.pr_id === prId);
};

/** ดึง Vendors จาก RFQ */
export const getVendorsByRFQId = (rfqId: string): RFQVendor[] => {
  return RELATED_RFQ_VENDORS.filter(v => v.rfq_id === rfqId);
};

/** ดึง Vendor detail */
export const getVendorById = (vendorId: string): VendorMaster | undefined => {
  return RELATED_VENDORS.find(v => v.vendor_id === vendorId);
};

/**
 * สรุป Relations:
 * 
 * V001 (ไอทีซัพพลาย) ─┐
 *                     ├─→ RFQ-001 ←── PR-001 [APPROVED]
 * V002 (ออฟฟิศเมท)  ─┘
 * 
 * V003 (เฟอร์นิเจอร์) → ยังไม่มี RFQ (PR-002 ยังไม่ approve)
 */
