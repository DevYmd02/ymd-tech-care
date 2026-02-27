import type { RFQHeader, RFQVendor } from '@/modules/procurement/types';

/**
 * MOCK RFQ DATA — (RELATIONALLY SYNCED EDITION)
 *
 * ⚠️  CRITICAL: The vendor lists here MUST EXACTLY MATCH the vendors in vqData.ts.
 *     Each rfq_id → vendor_id pairing drives both:
 *       1. The Tracking Modal (VQVendorTrackingModal) — fetched from RFQService.getById()
 *       2. The VQ List Page — each VQ row references rfq_id + vendor_id
 *
 * RFQ → Vendor Map (Synchronized with vqData.ts):
 *   rfq-001 → V-002 (OfficeMate), V-003 (B2S/SCG), V-004 (Local Store/AIS)
 *   rfq-005 → V-001 (IT Supply Co./OfficeMate), V-005 (Smart Tech/Somchai), V-002 (OfficeMate)
 *   rfq-006 → V-006 (Industrial Part Ltd./PTT Global), V-007 (Global Oil Co./Kerry)
 *   rfq-007 → V-001 (IT Supply Co./OfficeMate), V-005 (Smart Tech/Somchai)
 *   rfq-008 → V-009 (Air Service Pro/Sa-ard)
 *   rfq-009 → V-008 (Hardware Hub/108 Shop)
 */

// ====================================================================================
// VENDOR DEFINITIONS (must match vendorMocks.ts IDs and names)
// ====================================================================================

const VENDOR_MAP = {
  'V-001': { id: 'V-001', code: 'V001', name: 'บริษัท ออฟฟิศเมท (ไทย) จำกัด',                         email: 'sales@officemateItsupplythail.co.th' },
  'V-002': { id: 'V-002', code: 'V002', name: 'บริษัท จิ๊บ คอมพิวเตอร์ กรุ๊ป จำกัด',                   email: 'sales@jibcomputergroupco.co.th' },
  'V-003': { id: 'V-003', code: 'V003', name: 'บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน)',                    email: 'sales@thesiamcementpublicco.co.th' },
  'V-004': { id: 'V-004', code: 'V004', name: 'บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด (มหาชน)',       email: 'sales@advancedinfoservicepublicco.co.th' },
  'V-005': { id: 'V-005', code: 'V005', name: 'หจก. สมชายการช่าง',                                      email: 'sales@somchaiconstruction.co.th' },
  'V-006': { id: 'V-006', code: 'V006', name: 'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน)',           email: 'sales@pttglobalchemicalpublicco.co.th' },
  'V-007': { id: 'V-007', code: 'V007', name: 'บริษัท เคอรี่ เอ็กซ์เพรส (ประเทศไทย) จำกัด (มหาชน)', email: 'sales@kerryexpresspublicco.co.th' },
  'V-008': { id: 'V-008', code: 'V008', name: 'บริษัท 108 ช็อป จำกัด',                                  email: 'sales@108shop.co.th' },
  'V-009': { id: 'V-009', code: 'V009', name: 'หจก. สะอาดบริการ',                                       email: 'sales@saardservice.co.th' },
  'V-010': { id: 'V-010', code: 'V010', name: 'บริษัท รักษาความปลอดภัย การ์ดฟอร์ซ จำกัด',             email: 'sales@guardforcesecurity.co.th' },
} as const;

// ====================================================================================
// VENDOR BUILDER HELPER
// ====================================================================================

function makeVendor(
  rfqId: string,
  seq: number,
  vendorKey: keyof typeof VENDOR_MAP,
  rfqDate: string,
  status: 'PENDING' | 'SENT' | 'RESPONDED' | 'DECLINED',
  responseDate: string | null = null
): RFQVendor & { vendor_name: string; vendor_code: string } {
  const v = VENDOR_MAP[vendorKey];
  return {
    rfq_vendor_id : `rv-${rfqId}-${seq}`,
    rfq_id        : rfqId,
    vendor_id     : v.id,
    vendor_code   : v.code,
    vendor_name   : v.name,
    sent_date     : status !== 'PENDING' ? rfqDate : null,
    sent_via      : 'EMAIL',
    email_sent_to : v.email,
    response_date : responseDate,
    vq_no         : undefined, // VQ No is managed by vqData.ts, not here
    status,
    remark        : null,
  } as RFQVendor & { vendor_name: string; vendor_code: string };
}

// ====================================================================================
// EXPLICIT RFQ RECORDS (Synchronized with vqData.ts)
// ====================================================================================

const EXPLICIT_RFQS: RFQHeader[] = [

  // ── rfq-001: วัสดุสำนักงาน (Stationery) ─────────────────────────────────────────
  // VQ List shows: OfficeMate (RECORDED), B2S (RECORDED), Local Store (RECORDED)
  {
    rfq_id: 'rfq-001', rfq_no: 'RFQ-202601-0001',
    pr_id: 'pr-001', pr_no: 'PR-202601-0003', ref_pr_no: 'PR-202601-0003',
    branch_id: '1', branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-01-17', quote_due_date: '2026-01-24',
    status: 'CLOSED',
    created_by_user_id: 'user-1', created_by_name: 'นายจัดซื้อ หนึ่ง',
    created_at: '2026-01-17T10:00:00Z', updated_at: '2026-01-20T10:00:00Z',
    purpose: 'จัดซื้อวัสดุสำนักงานประจำเดือน',
    vendor_count: 3,
    responded_vendors_count: 3,
    sent_vendors_count: 3,
    vendor_responded: 3,
    has_quotation: true,
    currency: 'THB', exchange_rate: 1,
    delivery_location: 'คลังสินค้าหลัก (Main Warehouse)',
    payment_terms: 'Credit 30 Days',
    remarks: 'ต้องการด่วน',
    vendor_name: 'บริษัท จิ๊บ คอมพิวเตอร์ กรุ๊ป จำกัด',
  },

  // ── rfq-005: Monitor / Display ──────────────────────────────────────────────────
  // VQ List shows: IT Supply Co./V-001 (RECORDED), Smart Tech/V-005 (RECORDED), OfficeMate/V-002 (RECORDED)
  {
    rfq_id: 'rfq-005', rfq_no: 'RFQ-202601-0005',
    pr_id: 'pr-005', pr_no: 'PR-202601-0008', ref_pr_no: 'PR-202601-0008',
    branch_id: '1', branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-01-26', quote_due_date: '2026-02-02',
    status: 'CLOSED',
    created_by_user_id: 'user-1', created_by_name: 'นายจัดซื้อ หนึ่ง',
    created_at: '2026-01-26T10:00:00Z', updated_at: '2026-01-29T10:00:00Z',
    purpose: 'จัดซื้อจอแสดงผล (Monitor / Display)',
    vendor_count: 3,
    responded_vendors_count: 3,
    sent_vendors_count: 3,
    vendor_responded: 3,
    has_quotation: true,
    currency: 'THB', exchange_rate: 1,
    delivery_location: 'คลังสินค้าหลัก (Main Warehouse)',
    payment_terms: 'Credit 30 Days',
    remarks: 'อุปกรณ์ IT ประจำปี',
    vendor_name: 'บริษัท ออฟฟิศเมท (ไทย) จำกัด',
  },

  // ── rfq-006: น้ำมันโรงงาน (Factory Oil) ────────────────────────────────────────
  // VQ List shows: Industrial Part Ltd./V-006 (RECORDED), Global Oil Co./V-007 (RECORDED)
  {
    rfq_id: 'rfq-006', rfq_no: 'RFQ-202602-0006',
    pr_id: 'pr-006', pr_no: 'PR-202602-0010', ref_pr_no: 'PR-202602-0010',
    branch_id: '1', branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-05', quote_due_date: '2026-02-12',
    status: 'CLOSED',
    created_by_user_id: 'user-2', created_by_name: 'นางสาวจัดซื้อ สอง',
    created_at: '2026-02-05T09:00:00Z', updated_at: '2026-02-07T09:00:00Z',
    purpose: 'จัดซื้อน้ำมันหล่อลื่นสำหรับเครื่องจักรโรงงาน',
    vendor_count: 2,
    responded_vendors_count: 2,
    sent_vendors_count: 2,
    vendor_responded: 2,
    has_quotation: true,
    currency: 'THB', exchange_rate: 1,
    delivery_location: 'โรงงานฝ่ายผลิต',
    payment_terms: 'Credit 45 Days',
    remarks: 'น้ำมันเครื่องสังเคราะห์เกรด ISO',
    vendor_name: 'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน)',
  },

  // ── rfq-007: Laptop Computer  ───────────────────────────────────────────────────
  // VQ List shows: IT Supply Co./V-001 (RECORDED), Smart Tech/V-005 (RECEIVED — no VQ yet)
  {
    rfq_id: 'rfq-007', rfq_no: 'RFQ-202602-0007',
    pr_id: 'pr-007', pr_no: 'PR-202602-0012', ref_pr_no: 'PR-202602-0012',
    branch_id: '1', branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-10', quote_due_date: '2026-03-17',
    status: 'SENT',
    created_by_user_id: 'user-1', created_by_name: 'นายจัดซื้อ หนึ่ง',
    created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-12T09:00:00Z',
    purpose: 'จัดซื้อคอมพิวเตอร์แบบพกพา (Laptop) สำหรับทีมขาย',
    vendor_count: 2,
    responded_vendors_count: 0,
    sent_vendors_count: 2,
    vendor_responded: 0,
    has_quotation: false,
    currency: 'THB', exchange_rate: 1,
    delivery_location: 'ฝ่าย IT สำนักงานใหญ่',
    payment_terms: 'Credit 30 Days',
    remarks: 'กำหนดส่งก่อนสิ้นเดือน',
    vendor_name: 'บริษัท ออฟฟิศเมท (ไทย) จำกัด',
  },

  // ── rfq-008: บริการทำความสะอาด (Cleaning Service) ──────────────────────────────
  // VQ List shows: Air Service Pro/V-009 (EXPIRED)
  {
    rfq_id: 'rfq-008', rfq_no: 'RFQ-202602-0008',
    pr_id: 'pr-008', pr_no: 'PR-202602-0014', ref_pr_no: 'PR-202602-0014',
    branch_id: '1', branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-10', quote_due_date: '2026-03-10',
    status: 'SENT',
    created_by_user_id: 'user-1', created_by_name: 'นายจัดซื้อ หนึ่ง',
    created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-10T09:00:00Z',
    purpose: 'จ้างบริการทำความสะอาดสำนักงาน ประจำปี',
    vendor_count: 1,
    responded_vendors_count: 0,
    sent_vendors_count: 1,
    vendor_responded: 0,
    has_quotation: false,
    currency: 'THB', exchange_rate: 1,
    delivery_location: 'สำนักงานใหญ่ ทุกชั้น',
    payment_terms: 'Credit 30 Days',
    remarks: '',
    vendor_name: 'หจก. สะอาดบริการ',
  },

  // ── rfq-009: Hardware Hub (อุปกรณ์ฮาร์ดแวร์) ──────────────────────────────────
  // VQ List shows: Hardware Hub/V-008 (PENDING)
  {
    rfq_id: 'rfq-009', rfq_no: 'RFQ-202602-0009',
    pr_id: null, pr_no: null, ref_pr_no: null,
    branch_id: '1', branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-13', quote_due_date: '2026-03-13',
    status: 'SENT',
    created_by_user_id: 'user-2', created_by_name: 'นางสาวจัดซื้อ สอง',
    created_at: '2026-02-13T09:00:00Z', updated_at: '2026-02-13T09:00:00Z',
    purpose: 'จัดซื้ออุปกรณ์ฮาร์ดแวร์และอะไหล่เครื่องจักร',
    vendor_count: 1,
    responded_vendors_count: 0,
    sent_vendors_count: 1,
    vendor_responded: 0,
    has_quotation: false,
    currency: 'THB', exchange_rate: 1,
    delivery_location: 'คลังสินค้าหลัก (Main Warehouse)',
    payment_terms: 'Credit 30 Days',
    remarks: '',
    vendor_name: 'บริษัท 108 ช็อป จำกัด',
  },

  // ── rfq-010: DRAFT — คอมพิวเตอร์ตั้งโต๊ะ ──────────────────────────────────────
  {
    rfq_id: 'rfq-010', rfq_no: 'RFQ-202602-0010',
    pr_id: 'pr-010', pr_no: 'PR-202602-0020', ref_pr_no: 'PR-202602-0020',
    branch_id: '1', branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-25', quote_due_date: null,
    status: 'DRAFT',
    created_by_user_id: 'user-2', created_by_name: 'นางสาวจัดซื้อ สอง',
    created_at: '2026-02-25T09:00:00Z', updated_at: '2026-02-25T09:00:00Z',
    purpose: 'จัดซื้อคอมพิวเตอร์ตั้งโต๊ะ (Desktop PC) ฝ่ายบัญชี',
    vendor_count: 2,
    responded_vendors_count: 0,
    sent_vendors_count: 0,
    vendor_responded: 0,
    has_quotation: false,
    currency: 'THB', exchange_rate: 1,
    delivery_location: 'ฝ่ายบัญชี ชั้น 3',
    payment_terms: 'Credit 30 Days',
    remarks: 'ยังไม่ได้ส่ง รอผู้อนุมัติตรวจสอบรายการ',
    vendor_name: null,
  },

  // ── rfq-011: DRAFT — เก้าอี้สำนักงาน ────────────────────────────────────────────
  {
    rfq_id: 'rfq-011', rfq_no: 'RFQ-202602-0011',
    pr_id: null, pr_no: null, ref_pr_no: null,
    branch_id: '1', branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-26', quote_due_date: null,
    status: 'DRAFT',
    created_by_user_id: 'user-1', created_by_name: 'นายจัดซื้อ หนึ่ง',
    created_at: '2026-02-26T10:00:00Z', updated_at: '2026-02-26T10:00:00Z',
    purpose: 'จัดซื้อเก้าอี้สำนักงานและโต๊ะทำงาน (Ergonomic Series)',
    vendor_count: 0,
    responded_vendors_count: 0,
    sent_vendors_count: 0,
    vendor_responded: 0,
    has_quotation: false,
    currency: 'THB', exchange_rate: 1,
    delivery_location: 'สำนักงานใหญ่ ชั้น 5',
    payment_terms: 'Credit 30 Days',
    remarks: 'Draft — ยังไม่ได้เลือกผู้ขาย',
    vendor_name: null,
  },

  // ── rfq-012: DRAFT — บริการ Cloud Server ───────────────────────────────────────
  {
    rfq_id: 'rfq-012', rfq_no: 'RFQ-202602-0012',
    pr_id: 'pr-012', pr_no: 'PR-202602-0022', ref_pr_no: 'PR-202602-0022',
    branch_id: '1', branch_name: 'สำนักงานใหญ่',
    rfq_date: '2026-02-27', quote_due_date: null,
    status: 'DRAFT',
    created_by_user_id: 'user-1', created_by_name: 'นายจัดซื้อ หนึ่ง',
    created_at: '2026-02-27T08:00:00Z', updated_at: '2026-02-27T08:00:00Z',
    purpose: 'จ้างเหมาบริการ Cloud Server และ Storage ประจำปี 2569',
    vendor_count: 1,
    responded_vendors_count: 0,
    sent_vendors_count: 0,
    vendor_responded: 0,
    has_quotation: false,
    currency: 'THB', exchange_rate: 1,
    delivery_location: 'ศูนย์ข้อมูล Data Center',
    payment_terms: 'Credit 45 Days',
    remarks: 'รอหัวหน้าฝ่าย IT อนุมัติก่อนส่ง',
    vendor_name: null,
  },
];

export const MOCK_RFQS: RFQHeader[] = EXPLICIT_RFQS;
export const MOCK_RFQ_LINES = [];

// ====================================================================================
// EXPLICIT RFQ VENDOR RECORDS (Synchronized with vqData.ts)
// ====================================================================================

export const MOCK_RFQ_VENDORS: (RFQVendor & { vendor_name: string; vendor_code: string })[] = [

  // -- rfq-001 vendors: stationery (3 vendors, all responded) ---------------------
  makeVendor('rfq-001', 1, 'V-002', '2026-01-17', 'RESPONDED', '2026-01-18'), // OfficeMate -> vq-003
  makeVendor('rfq-001', 2, 'V-003', '2026-01-17', 'RESPONDED', '2026-01-19'), // B2S (SCG)  -> vq-002
  makeVendor('rfq-001', 3, 'V-004', '2026-01-17', 'RESPONDED', '2026-01-20'), // Local/AIS  -> vq-001

  // -- rfq-005 vendors: monitor/display (3 vendors, all responded) ---------------
  makeVendor('rfq-005', 1, 'V-001', '2026-01-26', 'RESPONDED', '2026-01-27'), // IT Supply  -> vq-006
  makeVendor('rfq-005', 2, 'V-005', '2026-01-26', 'RESPONDED', '2026-01-28'), // Smart Tech -> vq-005
  makeVendor('rfq-005', 3, 'V-002', '2026-01-26', 'RESPONDED', '2026-01-29'), // OfficeMate -> vq-004

  // -- rfq-006 vendors: factory oil (2 vendors, all responded) -------------------
  makeVendor('rfq-006', 1, 'V-006', '2026-02-05', 'RESPONDED', '2026-02-06'), // Industrial -> vq-008
  makeVendor('rfq-006', 2, 'V-007', '2026-02-05', 'RESPONDED', '2026-02-07'), // Global Oil -> vq-007

  // -- rfq-007 vendors: laptop (sent to 2, awaiting reply) ----------------------
  makeVendor('rfq-007', 1, 'V-001', '2026-02-10', 'SENT',      null),         // IT Supply  -> vq-010
  makeVendor('rfq-007', 2, 'V-005', '2026-02-10', 'SENT',      null),         // Smart Tech -> vq-009

  // -- rfq-008 vendors: cleaning service (sent, expired VQ) ---------------------
  makeVendor('rfq-008', 1, 'V-009', '2026-02-10', 'SENT',      null),         // Air Service -> vq-011

  // -- rfq-009 vendors: hardware hub (sent, pending reply) ----------------------
  makeVendor('rfq-009', 1, 'V-008', '2026-02-13', 'SENT',      null),         // Hardware Hub -> vq-012

  // -- rfq-010 vendors: DRAFT Desktop PC (2 vendors selected, not yet sent) -----
  makeVendor('rfq-010', 1, 'V-002', '2026-02-25', 'PENDING',   null),         // JIB Computer
  makeVendor('rfq-010', 2, 'V-004', '2026-02-25', 'PENDING',   null),         // AIS Advanced Info

  // rfq-011: DRAFT - vendor_count 0 (no vendors selected yet - correct)

  // -- rfq-012 vendors: DRAFT Cloud Server (1 vendor selected, not yet sent) ----
  makeVendor('rfq-012', 1, 'V-004', '2026-02-27', 'PENDING',   null),         // AIS Advanced Info
];

// Also export VENDOR_POOL for backward compat
import { MOCK_VENDORS } from '@/modules/master-data/vendor/mocks/vendorMocks';
export const VENDOR_POOL = MOCK_VENDORS.map(v => ({
  id: v.vendor_id,
  code: v.vendor_code,
  name: v.vendor_name,
  email: v.email || `sales@${v.vendor_name_en?.toLowerCase().replace(/\s+/g, '') || 'vendor'}.co.th`
}));
