import type { RFQHeader, RFQVendor, RFQLine, RFQVendorStatus } from '@/modules/procurement/types';

/**
 * MOCK RFQ DATA — (RELATIONALLY SYNCED EDITION)
 */

// ====================================================================================
// VENDOR DEFINITIONS (must match vendorMocks.ts IDs and names)
// ====================================================================================

const VENDOR_MAP: Record<number, { id: number; code: string; name: string; email: string }> = {
  1: { id: 1, code: 'V001', name: 'บริษัท ออฟฟิศเมท (ไทย) จำกัด',                         email: 'sales@officemateItsupplythail.co.th' },
  2: { id: 2, code: 'V002', name: 'บริษัท จิ๊บ คอมพิวเตอร์ กรุ๊ป จำกัด',                   email: 'sales@jibcomputergroupco.co.th' },
  3: { id: 3, code: 'V003', name: 'บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน)',                    email: 'sales@thesiamcementpublicco.co.th' },
  4: { id: 4, code: 'V004', name: 'บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด (มหาชน)',       email: 'sales@advancedinfoservicepublicco.co.th' },
  5: { id: 5, code: 'V005', name: 'หจก. สมชายการช่าง',                                      email: 'sales@somchaiconstruction.co.th' },
  6: { id: 6, code: 'V006', name: 'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน)',           email: 'sales@pttglobalchemicalpublicco.co.th' },
  7: { id: 7, code: 'V007', name: 'บริษัท เคอรี่ เอ็กซ์เพรส (ประเทศไทย) จำกัด (มหาชน)', email: 'sales@kerryexpresspublicco.co.th' },
  8: { id: 8, code: 'V008', name: 'บริษัท 108 ช็อป จำกัด',                                  email: 'sales@108shop.co.th' },
  9: { id: 9, code: 'V009', name: 'หจก. สะอาดบริการ',                                       email: 'sales@saardservice.co.th' },
  10: { id: 10, code: 'V010', name: 'บริษัท รักษาความปลอดภัย การ์ดฟอร์ซ จำกัด',             email: 'sales@guardforcesecurity.co.th' },
};

// ====================================================================================
// VENDOR BUILDER HELPER
// ====================================================================================

function makeVendor(
  rfqId: number,
  seq: number,
  vendorId: number,
  rfqDate: string,
  status: RFQVendorStatus,
  responseDate: string | null = null
): RFQVendor & { vendor_name: string; vendor_code: string } {
  const v = VENDOR_MAP[vendorId];
  return {
    rfq_vendor_id : rfqId * 100 + seq,
    rfq_id        : rfqId,
    vendor_id     : v.id,
    vendor_code   : v.code,
    vendor_name   : v.name,
    sent_date     : status !== 'PENDING' ? rfqDate : null,
    sent_via      : 'EMAIL',
    email_sent_to : v.email,
    response_date : responseDate,
    status,
    remark        : null,
  };
}

// ====================================================================================
// EXPLICIT RFQ RECORDS (Synchronized with vqData.ts)
// ====================================================================================

const EXPLICIT_RFQS: RFQHeader[] = [

  // ── 1: วัสดุสำนักงาน (Stationery) ─────────────────────────────────────────
  {
    rfq_id: 1, rfq_no: 'RFQ-202601-0001',
    pr_id: 1, pr_no: 'PR-202601-0003', ref_pr_no: 'PR-202601-0003',
    branch_id: 1, branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-01-17', quotation_due_date: '2026-01-24',
    status: 'CLOSED',
    created_by_user_id: 1, created_by_name: 'นายจัดซื้อ หนึ่ง',
    created_at: '2026-01-17T10:00:00Z', updated_at: '2026-01-20T10:00:00Z',
    purpose: 'จัดซื้อวัสดุสำนักงานประจำเดือน',
    vendor_count: 3,
    responded_vendors_count: 3,
    sent_vendors_count: 3,
    vendor_responded: 3,
    has_quotation: true,
    rfq_base_currency_code: 'THB', rfq_exchange_rate: 1,
    receive_location: 'คลังสินค้าหลัก (Main Warehouse)',
    payment_term_hint: 'Credit 30 Days',
    remarks: 'ต้องการด่วน',
    vendor_name: 'บริษัท จิ๊บ คอมพิวเตอร์ กรุ๊ป จำกัด',
  },

  // ── 5: Monitor / Display ──────────────────────────────────────────────────
  {
    rfq_id: 5, rfq_no: 'RFQ-202601-0005',
    pr_id: 5, pr_no: 'PR-202601-0008', ref_pr_no: 'PR-202601-0008',
    branch_id: 1, branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-01-26', quotation_due_date: '2026-02-02',
    status: 'CLOSED',
    created_by_user_id: 1, created_by_name: 'นายจัดซื้อ หนึ่ง',
    created_at: '2026-01-26T10:00:00Z', updated_at: '2026-01-29T10:00:00Z',
    purpose: 'จัดซื้อจอแสดงผล (Monitor / Display)',
    vendor_count: 3,
    responded_vendors_count: 3,
    sent_vendors_count: 3,
    vendor_responded: 3,
    has_quotation: true,
    rfq_base_currency_code: 'THB', rfq_exchange_rate: 1,
    receive_location: 'คลังสินค้าหลัก (Main Warehouse)',
    payment_term_hint: 'Credit 30 Days',
    remarks: 'อุปกรณ์ IT ประจำปี',
    vendor_name: 'บริษัท ออฟฟิศเมท (ไทย) จำกัด',
  },

  // ── 6: น้ำมันโรงงาน (Factory Oil) ────────────────────────────────────────
  {
    rfq_id: 6, rfq_no: 'RFQ-202602-0006',
    pr_id: 6, pr_no: 'PR-202602-0010', ref_pr_no: 'PR-202602-0010',
    branch_id: 1, branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-05', quotation_due_date: '2026-02-12',
    status: 'CLOSED',
    created_by_user_id: 2, created_by_name: 'นางสาวจัดซื้อ สอง',
    created_at: '2026-02-05T09:00:00Z', updated_at: '2026-02-07T09:00:00Z',
    purpose: 'จัดซื้อน้ำมันหล่อลื่นสำหรับเครื่องจักรโรงงาน',
    vendor_count: 3,
    responded_vendors_count: 3,
    sent_vendors_count: 3,
    vendor_responded: 3,
    has_quotation: true,
    rfq_base_currency_code: 'THB', rfq_exchange_rate: 1,
    receive_location: 'โรงงานฝ่ายผลิต',
    payment_term_hint: 'Credit 45 Days',
    remarks: 'น้ำมันเครื่องสังเคราะห์เกรด ISO',
    vendor_name: 'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน)',
  },

  // ── 7: Laptop Computer  ───────────────────────────────────────────────────
  {
    rfq_id: 7, rfq_no: 'RFQ-202602-0007',
    pr_id: 7, pr_no: 'PR-202602-0012', ref_pr_no: 'PR-202602-0012',
    branch_id: 1, branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-10', quotation_due_date: '2026-03-17',
    status: 'SENT',
    created_by_user_id: 1, created_by_name: 'นายจัดซื้อ หนึ่ง',
    created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-12T09:00:00Z',
    purpose: 'จัดซื้อคอมพิวเตอร์แบบพกพา (Laptop) สำหรับทีมขาย',
    vendor_count: 2,
    responded_vendors_count: 0,
    sent_vendors_count: 2,
    vendor_responded: 0,
    has_quotation: false,
    rfq_base_currency_code: 'THB', rfq_exchange_rate: 1,
    receive_location: 'ฝ่าย IT สำนักงานใหญ่',
    payment_term_hint: 'Credit 30 Days',
    remarks: 'กำหนดส่งก่อนสิ้นเดือน',
    vendor_name: 'บริษัท ออฟฟิศเมท (ไทย) จำกัด',
  },

  // ── 8: บริการทำความสะอาด (Cleaning Service) ──────────────────────────────
  {
    rfq_id: 8, rfq_no: 'RFQ-202602-0008',
    pr_id: 8, pr_no: 'PR-202602-0014', ref_pr_no: 'PR-202602-0014',
    branch_id: 1, branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-10', quotation_due_date: '2026-03-10',
    status: 'SENT',
    created_by_user_id: 1, created_by_name: 'นายจัดซื้อ หนึ่ง',
    created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-10T09:00:00Z',
    purpose: 'จ้างบริการทำความสะอาดสำนักงาน ประจำปี',
    vendor_count: 1,
    responded_vendors_count: 0,
    sent_vendors_count: 1,
    vendor_responded: 0,
    has_quotation: false,
    rfq_base_currency_code: 'THB', rfq_exchange_rate: 1,
    receive_location: 'สำนักงานใหญ่ ทุกชั้น',
    payment_term_hint: 'Credit 30 Days',
    remarks: '',
    vendor_name: 'หจก. สะอาดบริการ',
  },

  // ── 9: Hardware Hub (อุปกรณ์ฮาร์ดแวร์) ──────────────────────────────────
  {
    rfq_id: 9, rfq_no: 'RFQ-202602-0009',
    pr_id: null, pr_no: null, ref_pr_no: null,
    branch_id: 1, branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-13', quotation_due_date: '2026-03-13',
    status: 'SENT',
    created_by_user_id: 2, created_by_name: 'นางสาวจัดซื้อ สอง',
    created_at: '2026-02-13T09:00:00Z', updated_at: '2026-02-13T09:00:00Z',
    purpose: 'จัดซื้ออุปกรณ์ฮาร์ดแวร์และอะไหล่เครื่องจักร',
    vendor_count: 1,
    responded_vendors_count: 0,
    sent_vendors_count: 1,
    vendor_responded: 0,
    has_quotation: false,
    rfq_base_currency_code: 'THB', rfq_exchange_rate: 1,
    receive_location: 'คลังสินค้าหลัก (Main Warehouse)',
    payment_term_hint: 'Credit 30 Days',
    remarks: '',
    vendor_name: 'บริษัท 108 ช็อป จำกัด',
  },

  // ── 10: DRAFT — คอมพิวเตอร์ตั้งโต๊ะ ──────────────────────────────────────
  {
    rfq_id: 10, rfq_no: 'RFQ-202602-0010',
    pr_id: 10, pr_no: 'PR-202602-0020', ref_pr_no: 'PR-202602-0020',
    branch_id: 1, branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-25', quotation_due_date: null,
    status: 'DRAFT',
    created_by_user_id: 2, created_by_name: 'นางสาวจัดซื้อ สอง',
    created_at: '2026-02-25T09:00:00Z', updated_at: '2026-02-25T09:00:00Z',
    purpose: 'จัดซื้อคอมพิวเตอร์ตั้งโต๊ะ (Desktop PC) ฝ่ายบัญชี',
    vendor_count: 2,
    responded_vendors_count: 0,
    sent_vendors_count: 0,
    vendor_responded: 0,
    has_quotation: false,
    rfq_base_currency_code: 'THB', rfq_exchange_rate: 1,
    receive_location: 'ฝ่ายบัญชี ชั้น 3',
    payment_term_hint: 'Credit 30 Days',
    remarks: 'ยังไม่ได้ส่ง รอผู้อนุมัติตรวจสอบรายการ',
    vendor_name: null,
  },

  // ── 11: DRAFT — เก้าอี้สำนักงาน ────────────────────────────────────────────
  {
    rfq_id: 11, rfq_no: 'RFQ-202602-0011',
    pr_id: null, pr_no: null, ref_pr_no: null,
    branch_id: 1, branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-26', quotation_due_date: null,
    status: 'DRAFT',
    created_by_user_id: 1, created_by_name: 'นายจัดซื้อ หนึ่ง',
    created_at: '2026-02-26T10:00:00Z', updated_at: '2026-02-26T10:00:00Z',
    purpose: 'จัดซื้อเก้าอี้สำนักงานและโต๊ะทำงาน (Ergonomic Series)',
    vendor_count: 0,
    responded_vendors_count: 0,
    sent_vendors_count: 0,
    vendor_responded: 0,
    has_quotation: false,
    rfq_base_currency_code: 'THB', rfq_exchange_rate: 1,
    receive_location: 'สำนักงานใหญ่ ชั้น 5',
    payment_term_hint: 'Credit 30 Days',
    remarks: 'Draft — ยังไม่ได้เลือกผู้ขาย',
    vendor_name: null,
  },

  // ── 12: DRAFT — บริการ Cloud Server ───────────────────────────────────────
  {
    rfq_id: 12, rfq_no: 'RFQ-202602-0012',
    pr_id: 12, pr_no: 'PR-202602-0022', ref_pr_no: 'PR-202602-0022',
    branch_id: 1, branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-27', quotation_due_date: null,
    status: 'DRAFT',
    created_by_user_id: 1, created_by_name: 'นายจัดซื้อ หนึ่ง',
    created_at: '2026-02-27T08:00:00Z', updated_at: '2026-02-27T08:00:00Z',
    purpose: 'จ้างเหมาบริการ Cloud Server และ Storage ประจำปี 2569',
    vendor_count: 1,
    responded_vendors_count: 0,
    sent_vendors_count: 0,
    vendor_responded: 0,
    has_quotation: false,
    rfq_base_currency_code: 'THB', rfq_exchange_rate: 1,
    receive_location: 'ศูนย์ข้อมูล Data Center',
    payment_term_hint: 'Credit 45 Days',
    remarks: 'รอหัวหน้าฝ่าย IT อนุมัติก่อนส่ง',
    vendor_name: null,
  },
];

export const MOCK_RFQS: RFQHeader[] = EXPLICIT_RFQS;
export const MOCK_RFQ_LINES: RFQLine[] = [
  {
    rfq_line_id: 701,
    rfq_id: 7,
    line_no: 1,
    pr_line_id: 701,
    item_id: 1,
    item_code: 'COMP-001',
    item_name: 'Laptop Business Pro 14"',
    description: 'Core i7, 16GB RAM, 512GB SSD',
    qty: 10,
    uom: 'เครื่อง',
    uom_id: 1,
    target_delivery_date: '2026-03-31',
    technical_spec: 'Military standard, Win 11 Pro',
    est_unit_price: 25000,
    note_to_vendor: null
  },
  {
    rfq_line_id: 702,
    rfq_id: 7,
    line_no: 2,
    pr_line_id: 702,
    item_id: 2,
    item_code: 'COMP-002',
    item_name: 'Wireless Mouse',
    description: 'Ergonomic, Silent click',
    qty: 10,
    uom: 'ตัว',
    uom_id: 1,
    target_delivery_date: '2026-03-31',
    technical_spec: 'Bluetooth & 2.4GHz',
    est_unit_price: 1200,
    note_to_vendor: null
  },
  {
    rfq_line_id: 601,
    rfq_id: 6,
    line_no: 1,
    pr_line_id: 601,
    item_id: 101,
    item_code: 'OIL-IND-046',
    item_name: 'Industrial Oil 46 (200L)',
    description: 'High-performance hydraulic oil',
    qty: 10,
    uom: 'ถัง',
    uom_id: 1,
    target_delivery_date: '2026-02-28',
    technical_spec: 'ISO VG 46, Anti-wear',
    est_unit_price: 8000,
    note_to_vendor: null
  },
  {
    rfq_line_id: 602,
    rfq_id: 6,
    line_no: 2,
    pr_line_id: 602,
    item_id: 102,
    item_code: 'OIL-GRS-001',
    item_name: 'Machine Grease (15kg)',
    description: 'Heavy duty lithium grease',
    qty: 5,
    uom: 'ถัง',
    uom_id: 1,
    target_delivery_date: '2026-02-28',
    technical_spec: 'NLGI 2, High temp',
    est_unit_price: 3500,
    note_to_vendor: null
  }
];

// ====================================================================================
// EXPLICIT RFQ VENDOR RECORDS (Synchronized with vqData.ts)
// ====================================================================================

export const MOCK_RFQ_VENDORS: (RFQVendor & { vendor_name: string; vendor_code: string })[] = [
  makeVendor(1, 1, 2, '2026-01-17', 'RESPONDED', '2026-01-18'), // OfficeMate
  makeVendor(1, 2, 3, '2026-01-17', 'RESPONDED', '2026-01-19'), // B2S (SCG)
  makeVendor(1, 3, 4, '2026-01-17', 'RESPONDED', '2026-01-20'), // Local/AIS

  makeVendor(5, 1, 1, '2026-01-26', 'RESPONDED', '2026-01-27'), // IT Supply
  makeVendor(5, 2, 5, '2026-01-26', 'RESPONDED', '2026-01-28'), // Smart Tech
  makeVendor(5, 3, 2, '2026-01-26', 'RESPONDED', '2026-01-29'), // OfficeMate

  makeVendor(6, 1, 6, '2026-02-05', 'RESPONDED', '2026-02-06'), // Industrial
  makeVendor(6, 2, 7, '2026-02-05', 'RESPONDED', '2026-02-07'), // Global Oil
  makeVendor(6, 3, 5, '2026-02-05', 'RESPONDED', '2026-02-08'), // Smart Tech

  makeVendor(7, 1, 1, '2026-02-10', 'SENT',      null),         // IT Supply
  makeVendor(7, 2, 5, '2026-02-10', 'SENT',      null),         // Smart Tech

  makeVendor(8, 1, 9, '2026-02-10', 'SENT',      null),         // Air Service

  makeVendor(9, 1, 8, '2026-02-13', 'SENT',      null),         // Hardware Hub

  makeVendor(10, 1, 2, '2026-02-25', 'PENDING',   null),         // JIB Computer
  makeVendor(10, 2, 4, '2026-02-25', 'PENDING',   null),         // AIS Advanced Info

  makeVendor(12, 1, 4, '2026-02-27', 'PENDING',   null),         // AIS Advanced Info
];

// Also export VENDOR_POOL for backward compat
import { MOCK_VENDORS } from '@/modules/master-data/vendor/mocks/vendorMocks';
export const VENDOR_POOL = MOCK_VENDORS.map(v => ({
  id: v.vendor_id,
  code: v.vendor_code,
  name: v.vendor_name,
  email: v.email || `sales@vendor.co.th`
}));
