import type { PRHeader, PRLine } from '@/modules/procurement/types/pr-types';
import { sanitizeId } from '@/core/api/mockUtils';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// =============================================================================
// MOCK CONSTANTS (Sanitized to Strings)
// =============================================================================
export const DEPARTMENT_MOCK_MAP: Record<string, string> = {
    '1': 'Information Technology',
    '2': 'Human Resources',
    '3': 'Accounting',
    '4': 'Marketing',
    'CC001': 'แผนกไอที',
    'CC002': 'แผนกทรัพยากรบุคคล',
    'CC003': 'แผนกบัญชี',
    'CC004': 'แผนกการตลาด',
};

// =============================================================================
// HELPER: Generate Lines
// =============================================================================
const getLinesForPR = (prId: string, baseLines: PRLine[]): PRLine[] => {
    return baseLines.map(line => ({ ...line, pr_id: prId }));
};

// Base Line Templates (Already using strings)
const _prLinesIT: PRLine[] = [
  { pr_line_id: 'l-001', pr_id: 'x', line_no: 1, item_id: '1', item_code: 'IT-NB-001', item_name: 'MacBook Pro M3 14"', qty: 2, uom: 'เครื่อง', uom_id: '1', est_unit_price: 59900, est_amount: 119800, needed_date: '2026-03-01' },
  { pr_line_id: 'l-002', pr_id: 'x', line_no: 2, item_id: '2', item_code: 'IT-MO-27', item_name: 'Dell UltraSharp 27"', qty: 2, uom: 'เครื่อง', uom_id: '1', est_unit_price: 12500, est_amount: 25000, needed_date: '2026-03-01' },
];

const _prLinesOffice: PRLine[] = [
  { pr_line_id: 'l-003', pr_id: 'x', line_no: 1, item_id: '3', item_code: 'OF-PAP-A4', item_name: 'Double A Paper A4 80gsm', qty: 50, uom: 'รีม', uom_id: '2', est_unit_price: 115, est_amount: 5750, needed_date: '2026-02-20' },
  { pr_line_id: 'l-004', pr_id: 'x', line_no: 2, item_id: '4', item_code: 'OF-PEN-BL', item_name: 'ปากกาลูกลื่น Pentel สีน้ำเงิน', qty: 100, uom: 'ด้าม', uom_id: '3', est_unit_price: 25, est_amount: 2500, needed_date: '2026-02-20' },
];

const _prLinesService: PRLine[] = [
  { pr_line_id: 'l-005', pr_id: 'x', line_no: 1, item_id: '5', item_code: 'SV-CLEAN', item_name: 'บริการทำความสะอาดสำนักงาน รายปี', qty: 1, uom: 'งาน', uom_id: '4', est_unit_price: 120000, est_amount: 120000, needed_date: '2026-04-01' },
];

const _prLinesFactory: PRLine[] = [
  { pr_line_id: 'l-006', pr_id: 'x', line_no: 1, item_id: '6', item_code: 'MT-LUB-01', item_name: 'Industrial Lubricant Oil 200L', qty: 10, uom: 'ถัง', uom_id: '5', est_unit_price: 8500, est_amount: 85000, needed_date: '2026-03-15' },
  { pr_line_id: 'l-007', pr_id: 'x', line_no: 2, item_id: '7', item_code: 'MT-GLOVE', item_name: 'Safety Gloves (Heat Resistant)', qty: 200, uom: 'คู่', uom_id: '6', est_unit_price: 150, est_amount: 30000, needed_date: '2026-03-15' },
];

// =============================================================================
// 1. PURCHASE REQUISITION (PR)
// =============================================================================

const _mockPRs: PRHeader[] = [
  {
    pr_id: 'pr-015', pr_no: 'PR-202603-0015', branch_id: '1', requester_user_id: '1', requester_name: 'สมชาย ใจดี',
    pr_date: '2026-02-15', need_by_date: '2026-02-10', cost_center_id: 'CC001', purpose: 'ซื้อวัสดุสิ้นเปลืองโรงงานและสำนักงานประจำเดือนมีนาคม (Overdue)',
    status: 'COMPLETED', pr_base_currency_code: 'THB', total_amount: 8250, attachment_count: 0,
    created_at: '2026-02-15T09:00:00Z', updated_at: '2026-02-15T11:00:00Z', created_by_user_id: '1', updated_by_user_id: '2',
    lines: getLinesForPR('pr-015', _prLinesOffice)
  },
  {
    pr_id: 'pr-014', pr_no: 'PR-202603-0014', branch_id: '2', requester_user_id: '2', requester_name: 'วิชัย มากมี',
    pr_date: '2026-02-15', need_by_date: '2026-02-18', cost_center_id: 'CC003', purpose: 'จัดซื้ออะไหล่ฉุกเฉินสำหรับเครื่องจักรไลน์การผลิตหลัก (Urgent)',
    status: 'REJECTED', pr_base_currency_code: 'THB', total_amount: 45000, attachment_count: 1,
    created_at: '2026-02-15T10:00:00Z', updated_at: '2026-02-16T14:00:00Z', created_by_user_id: '2', updated_by_user_id: '3',
    lines: []
  },
  {
    pr_id: 'pr-013', pr_no: 'PR-202603-0013', branch_id: '1', requester_user_id: '4', requester_name: 'กานดา มารยาท',
    pr_date: '2026-02-14', need_by_date: '2026-03-01', cost_center_id: 'CC004', purpose: 'จ้างเหมาทำความสะอาดและฆ่าเชื้อในพื้นที่คลังสินค้าประจำไตรมาส (Normal)',
    status: 'APPROVED', pr_base_currency_code: 'THB', total_amount: 5000, attachment_count: 0,
    created_at: '2026-02-14T09:00:00Z', updated_at: '2026-02-15T10:00:00Z', created_by_user_id: '4', updated_by_user_id: '2',
    lines: []
  },
  {
    pr_id: 'pr-012', pr_no: 'PR-202603-0012', branch_id: '2', requester_user_id: '2', requester_name: 'วิชัย มากมี',
    pr_date: '2026-03-10', need_by_date: '2026-03-24', cost_center_id: 'CC003', purpose: 'อุปกรณ์สำนักงานเพิ่มเติม (สำหรับ RFQ ปิดแล้ว)',
    status: 'APPROVED', pr_base_currency_code: 'THB', total_amount: 15000, attachment_count: 0,
    created_at: '2026-03-10T10:00:00Z', updated_at: '2026-03-11T11:00:00Z', created_by_user_id: '2', updated_by_user_id: '3',
    lines: getLinesForPR('pr-012', _prLinesOffice)
  },
  {
    pr_id: 'pr-011', pr_no: 'PR-202603-0011', branch_id: '1', requester_user_id: '1', requester_name: 'สมชาย ใจดี',
    pr_date: '2026-03-05', need_by_date: '2026-03-20', cost_center_id: 'CC001', purpose: 'วัสดุสิ้นเปลืองโรงงาน (สำหรับ RFQ ส่งแล้ว)',
    status: 'APPROVED', pr_base_currency_code: 'THB', total_amount: 25000, attachment_count: 0,
    created_at: '2026-03-05T09:00:00Z', updated_at: '2026-03-06T10:00:00Z', created_by_user_id: '1', updated_by_user_id: '2',
    lines: getLinesForPR('pr-011', _prLinesFactory)
  },
  {
    pr_id: 'pr-010', pr_no: 'PR-202602-0010', branch_id: '1', requester_user_id: '1', requester_name: 'สมชาย ใจดี',
    pr_date: '2026-02-28', need_by_date: '2026-03-15', cost_center_id: 'CC001', purpose: 'อุปกรณ์ IT สำหรับพนักงานใหม่ (Q2)',
    status: 'DRAFT', pr_base_currency_code: 'THB', total_amount: 144800, attachment_count: 0,
    created_at: '2026-02-28T09:00:00Z', updated_at: '2026-02-28T09:00:00Z', created_by_user_id: '1', updated_by_user_id: '1',
    lines: getLinesForPR('pr-010', _prLinesIT)
  },
  {
    pr_id: 'pr-009', pr_no: 'PR-202602-0009', branch_id: '2', requester_user_id: '2', requester_name: 'วิชัย มากมี',
    pr_date: '2026-02-23', need_by_date: '2026-03-10', cost_center_id: 'CC003', purpose: 'จ้างเหมาทำความสะอาดใหญ่ประจำปี',
    status: 'PENDING', pr_base_currency_code: 'THB', total_amount: 120000, attachment_count: 1,
    created_at: '2026-02-23T10:00:00Z', updated_at: '2026-02-23T10:00:00Z', created_by_user_id: '2', updated_by_user_id: '2',
    lines: getLinesForPR('pr-009', _prLinesService)
  },
  {
    pr_id: 'pr-008', pr_no: 'PR-202602-0008', branch_id: '1', requester_user_id: '3', requester_name: 'นภา สวยงาม',
    pr_date: '2026-02-18', need_by_date: '2026-03-05', cost_center_id: 'CC002', purpose: 'วัสดุสิ้นเปลืองโรงงาน (Emergency)',
    status: 'PENDING', pr_base_currency_code: 'THB', total_amount: 115000, attachment_count: 0,
    created_at: '2026-02-18T14:30:00Z', updated_at: '2026-02-18T14:30:00Z', created_by_user_id: '3', updated_by_user_id: '3',
    lines: getLinesForPR('pr-008', _prLinesFactory)
  },
  {
    pr_id: 'pr-007', pr_no: 'PR-202602-0007', branch_id: '1', requester_user_id: '1', requester_name: 'สมชาย ใจดี',
    pr_date: '2026-02-13', need_by_date: '2026-02-28', cost_center_id: 'CC001', purpose: 'เครื่องเขียนสำนักงานล็อตใหญ่',
    status: 'APPROVED', pr_base_currency_code: 'THB', total_amount: 8250, attachment_count: 0,
    created_at: '2026-02-13T09:00:00Z', updated_at: '2026-02-14T11:00:00Z', created_by_user_id: '1', updated_by_user_id: '2',
    lines: getLinesForPR('pr-007', _prLinesOffice)
  },
  {
    pr_id: 'pr-006', pr_no: 'PR-202602-0006', branch_id: '2', requester_user_id: '2', requester_name: 'วิชัย มากมี',
    pr_date: '2026-02-08', need_by_date: '2026-02-20', cost_center_id: 'CC003', purpose: 'Laptop สำหรับทีม Sales',
    status: 'APPROVED', pr_base_currency_code: 'THB', total_amount: 239600, attachment_count: 2,
    created_at: '2026-02-08T13:00:00Z', updated_at: '2026-02-09T09:00:00Z', created_by_user_id: '2', updated_by_user_id: '3',
    lines: getLinesForPR('pr-006', _prLinesIT)
  },
  {
    pr_id: 'pr-005', pr_no: 'PR-202602-0005', branch_id: '1', requester_user_id: '3', requester_name: 'นภา สวยงาม',
    pr_date: '2026-02-03', need_by_date: '2026-02-15', cost_center_id: 'CC002', purpose: 'น้ำมันหล่อลื่นเครื่องจักร',
    status: 'APPROVED', pr_base_currency_code: 'THB', total_amount: 85000, attachment_count: 0,
    created_at: '2026-02-03T10:00:00Z', updated_at: '2026-02-04T15:00:00Z', created_by_user_id: '3', updated_by_user_id: '2',
    lines: getLinesForPR('pr-005', _prLinesFactory)
  },
  {
    pr_id: 'pr-004', pr_no: 'PR-202601-0004', branch_id: '1', requester_user_id: '4', requester_name: 'กานดา มารยาท',
    pr_date: '2026-01-29', need_by_date: '2026-02-10', cost_center_id: 'CC004', purpose: 'จัดเลี้ยงรับรองลูกค้า (ยกเลิก)',
    status: 'CANCELLED', pr_base_currency_code: 'THB', total_amount: 5000, attachment_count: 0,
    created_at: '2026-01-29T11:00:00Z', updated_at: '2026-01-30T09:00:00Z', created_by_user_id: '4', updated_by_user_id: '4',
    lines: []
  },
  {
    pr_id: 'pr-003', pr_no: 'PR-202601-0003', branch_id: '1', requester_user_id: '1', requester_name: 'สมชาย ใจดี',
    pr_date: '2026-01-24', need_by_date: '2026-02-05', cost_center_id: 'CC001', purpose: 'จอ Monitor เพิ่มเติม',
    status: 'APPROVED', pr_base_currency_code: 'THB', total_amount: 50000, attachment_count: 0,
    created_at: '2026-01-24T09:30:00Z', updated_at: '2026-01-25T10:00:00Z', created_by_user_id: '1', updated_by_user_id: '2',
    lines: getLinesForPR('pr-003', _prLinesIT)
  },
  {
    pr_id: 'pr-002', pr_no: 'PR-202601-0002', branch_id: '2', requester_user_id: '2', requester_name: 'วิชัย มากมี',
    pr_date: '2026-01-19', need_by_date: '2026-02-05', cost_center_id: 'CC003', purpose: 'โต๊ะทำงานผู้บริหาร (ไม่อนุมัติ)',
    status: 'CANCELLED', pr_base_currency_code: 'THB', total_amount: 45000, attachment_count: 1, 
    created_at: '2026-01-19T14:00:00Z', updated_at: '2026-01-20T16:00:00Z', created_by_user_id: '2', updated_by_user_id: '3',
    lines: []
  },
  {
    pr_id: 'pr-001', pr_no: 'PR-202601-0001', branch_id: '1', requester_user_id: '1', requester_name: 'สมชาย ใจดี',
    pr_date: '2026-01-15', need_by_date: '2026-02-01', cost_center_id: 'CC001', purpose: 'เครื่องเขียนล็อตแรกของปี',
    status: 'APPROVED', pr_base_currency_code: 'THB', total_amount: 8250, attachment_count: 0,
    created_at: '2026-01-15T09:30:00Z', updated_at: '2026-01-16T10:00:00Z', created_by_user_id: '1', updated_by_user_id: '2',
    lines: getLinesForPR('pr-001', _prLinesOffice)
  },
];

export const MOCK_PRS: PRHeader[] = IS_MOCK ? _mockPRs.map(pr => ({
    ...pr,
    pr_id: sanitizeId(pr.pr_id),
    branch_id: sanitizeId(pr.branch_id),
    requester_user_id: sanitizeId(pr.requester_user_id),
    cost_center_id: sanitizeId(pr.cost_center_id),
})) : [];

export const MOCK_PR_LINES: PRLine[] = IS_MOCK ? [..._prLinesIT, ..._prLinesOffice, ..._prLinesService, ..._prLinesFactory].map(line => ({
    ...line,
    pr_line_id: sanitizeId(line.pr_line_id),
    pr_id: sanitizeId(line.pr_id),
    item_id: sanitizeId(line.item_id),
    uom_id: sanitizeId(line.uom_id),
})) : [];
