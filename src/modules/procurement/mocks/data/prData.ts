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
// HELPER: Financial Calculation
// =============================================================================
const calculateLineFinancials = (qty: number, price: number, discountRaw: string = '') => {
    const grossAmount = qty * price;
    let discountAmount = 0;
    
    if (discountRaw) {
        if (discountRaw.endsWith('%')) {
            const percent = parseFloat(discountRaw.replace('%', ''));
            if (!isNaN(percent)) {
                discountAmount = grossAmount * (percent / 100);
            }
        } else {
            discountAmount = parseFloat(discountRaw) || 0;
        }
    }
    
    // Cap discount at gross amount to prevent negative total
    discountAmount = Math.min(discountAmount, grossAmount);
    
    return {
        grossAmount,
        discountAmount,
        netAmount: grossAmount - discountAmount
    };
};

// =============================================================================
// HELPER: Generate Lines
// =============================================================================
const createMockLine = (
    idSuffix: string, 
    lineNo: number,
    itemId: string, 
    code: string, 
    name: string, 
    qty: number, 
    uom: string, 
    uomId: string,
    price: number, 
    date: string,
    discountRaw: string = '',
    location: string = ''
): PRLine => {
    const { netAmount } = calculateLineFinancials(qty, price, discountRaw);
    
    return {
        pr_line_id: `l-${idSuffix}`,
        pr_id: 'x', // Will be overwritten by getLinesForPR
        line_no: lineNo,
        item_id: itemId,
        item_code: code,
        item_name: name,
        qty: qty,
        uom: uom,
        uom_id: uomId,
        est_unit_price: price,
        est_amount: netAmount,
        needed_date: date,
        location: location,
        line_discount_raw: discountRaw,
        warehouse_id: '1' // Default warehouse
    };
};

const getLinesForPR = (prId: string, baseLines: PRLine[]): PRLine[] => {
    return baseLines.map(line => ({ ...line, pr_id: prId }));
};

// Base Line Templates
const _prLinesIT: PRLine[] = [
    createMockLine('001', 1, '1', 'IT-NB-001', 'MacBook Pro M3 14"', 2, 'เครื่อง', '1', 59900, '2026-03-01', '5%', 'Zone A-01'),
    createMockLine('002', 2, '2', 'IT-MO-27', 'Dell UltraSharp 27"', 2, 'เครื่อง', '1', 12500, '2026-03-01', '500', 'Zone A-02'),
];

const _prLinesOffice: PRLine[] = [
    createMockLine('003', 1, '3', 'OF-PAP-A4', 'Double A Paper A4 80gsm', 50, 'รีม', '2', 115, '2026-02-20', '', 'Zone B-05'),
    createMockLine('004', 2, '4', 'OF-PEN-BL', 'ปากกาลูกลื่น Pentel สีน้ำเงิน', 100, 'ด้าม', '3', 25, '2026-02-20', '10%', 'Zone B-06'),
];

const _prLinesService: PRLine[] = [
    createMockLine('005', 1, '5', 'SV-CLEAN', 'บริการทำความสะอาดสำนักงาน รายปี', 1, 'งาน', '4', 120000, '2026-04-01', '', ''),
];

const _prLinesFactory: PRLine[] = [
    createMockLine('006', 1, '6', 'MT-LUB-01', 'Industrial Lubricant Oil 200L', 10, 'ถัง', '5', 8500, '2026-03-15', '5%', 'WH-01-A'),
    createMockLine('007', 2, '7', 'MT-GLOVE', 'Safety Gloves (Heat Resistant)', 200, 'คู่', '6', 150, '2026-03-15', '1000', 'WH-01-B'),
];

// =============================================================================
// HELPER: Header Calculation
// =============================================================================
const calculatePRTotal = (lines: PRLine[], vatRate: number = 7) => {
    const subTotal = lines.reduce((sum, line) => sum + line.est_amount, 0);
    const taxAmount = subTotal * (vatRate / 100);
    return subTotal + taxAmount;
};

// =============================================================================
// 1. PURCHASE REQUISITION (PR)
// =============================================================================

const _mockPRs: PRHeader[] = [
  {
    pr_id: 'pr-015', pr_no: 'PR-202603-0015', branch_id: '1', requester_user_id: '1', requester_name: 'สมชาย ใจดี',
    pr_date: '2026-02-15', need_by_date: '2026-02-10', cost_center_id: 'CC001', purpose: 'ซื้อวัสดุสิ้นเปลืองโรงงานและสำนักงานประจำเดือนมีนาคม (Overdue)',
    status: 'COMPLETED', pr_base_currency_code: 'THB', 
    total_amount: calculatePRTotal(_prLinesOffice), pr_tax_rate: 7, pr_tax_code_id: 'VAT-IN-7',
    attachment_count: 0,
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
    status: 'APPROVED', pr_base_currency_code: 'THB', 
    total_amount: calculatePRTotal(_prLinesOffice), pr_tax_rate: 7, pr_tax_code_id: 'VAT-IN-7',
    attachment_count: 0,
    created_at: '2026-03-10T10:00:00Z', updated_at: '2026-03-11T11:00:00Z', created_by_user_id: '2', updated_by_user_id: '3',
    lines: getLinesForPR('pr-012', _prLinesOffice)
  },
  {
    pr_id: 'pr-011', pr_no: 'PR-202603-0011', branch_id: '1', requester_user_id: '1', requester_name: 'สมชาย ใจดี',
    pr_date: '2026-03-05', need_by_date: '2026-03-20', cost_center_id: 'CC001', purpose: 'วัสดุสิ้นเปลืองโรงงาน (สำหรับ RFQ ส่งแล้ว)',
    status: 'APPROVED', pr_base_currency_code: 'THB', 
    total_amount: calculatePRTotal(_prLinesFactory), pr_tax_rate: 7, pr_tax_code_id: 'VAT-IN-7',
    attachment_count: 0,
    created_at: '2026-03-05T09:00:00Z', updated_at: '2026-03-06T10:00:00Z', created_by_user_id: '1', updated_by_user_id: '2',
    lines: getLinesForPR('pr-011', _prLinesFactory)
  },
  {
    pr_id: 'pr-010', pr_no: 'PR-202602-0010', branch_id: '1', requester_user_id: '1', requester_name: 'สมชาย ใจดี',
    pr_date: '2026-02-28', need_by_date: '2026-03-15', cost_center_id: 'CC001', purpose: 'อุปกรณ์ IT สำหรับพนักงานใหม่ (Q2)',
    status: 'DRAFT', pr_base_currency_code: 'THB', 
    total_amount: calculatePRTotal(_prLinesIT), pr_tax_rate: 7, pr_tax_code_id: 'VAT-IN-7',
    attachment_count: 0,
    created_at: '2026-02-28T09:00:00Z', updated_at: '2026-02-28T09:00:00Z', created_by_user_id: '1', updated_by_user_id: '1',
    lines: getLinesForPR('pr-010', _prLinesIT)
  },
  {
    pr_id: 'pr-009', pr_no: 'PR-202602-0009', branch_id: '2', requester_user_id: '2', requester_name: 'วิชัย มากมี',
    pr_date: '2026-02-23', need_by_date: '2026-03-10', cost_center_id: 'CC003', purpose: 'จ้างเหมาทำความสะอาดใหญ่ประจำปี',
    status: 'PENDING', pr_base_currency_code: 'THB', 
    total_amount: calculatePRTotal(_prLinesService), pr_tax_rate: 7, pr_tax_code_id: 'VAT-IN-7',
    attachment_count: 1,
    created_at: '2026-02-23T10:00:00Z', updated_at: '2026-02-23T10:00:00Z', created_by_user_id: '2', updated_by_user_id: '2',
    lines: getLinesForPR('pr-009', _prLinesService)
  },
  {
    pr_id: 'pr-008', pr_no: 'PR-202602-0008', branch_id: '1', requester_user_id: '3', requester_name: 'นภา สวยงาม',
    pr_date: '2026-02-18', need_by_date: '2026-03-05', cost_center_id: 'CC002', purpose: 'วัสดุสิ้นเปลืองโรงงาน (Emergency)',
    status: 'PENDING', pr_base_currency_code: 'THB', 
    total_amount: calculatePRTotal(_prLinesFactory), pr_tax_rate: 7, pr_tax_code_id: 'VAT-IN-7',
    attachment_count: 0,
    created_at: '2026-02-18T14:30:00Z', updated_at: '2026-02-18T14:30:00Z', created_by_user_id: '3', updated_by_user_id: '3',
    lines: getLinesForPR('pr-008', _prLinesFactory)
  },
  {
    pr_id: 'pr-007', pr_no: 'PR-202602-0007', branch_id: '1', requester_user_id: '1', requester_name: 'สมชาย ใจดี',
    pr_date: '2026-02-13', need_by_date: '2026-02-28', cost_center_id: 'CC001', purpose: 'เครื่องเขียนสำนักงานล็อตใหญ่',
    status: 'APPROVED', pr_base_currency_code: 'THB', 
    total_amount: calculatePRTotal(_prLinesOffice), pr_tax_rate: 7, pr_tax_code_id: 'VAT-IN-7',
    attachment_count: 0,
    created_at: '2026-02-13T09:00:00Z', updated_at: '2026-02-14T11:00:00Z', created_by_user_id: '1', updated_by_user_id: '2',
    lines: getLinesForPR('pr-007', _prLinesOffice)
  },
  {
    pr_id: 'pr-006', pr_no: 'PR-202602-0006', branch_id: '2', requester_user_id: '2', requester_name: 'วิชัย มากมี',
    pr_date: '2026-02-08', need_by_date: '2026-02-20', cost_center_id: 'CC003', purpose: 'Laptop สำหรับทีม Sales',
    status: 'APPROVED', pr_base_currency_code: 'THB', 
    total_amount: calculatePRTotal(_prLinesIT), pr_tax_rate: 7, pr_tax_code_id: 'VAT-IN-7',
    attachment_count: 2,
    created_at: '2026-02-08T13:00:00Z', updated_at: '2026-02-09T09:00:00Z', created_by_user_id: '2', updated_by_user_id: '3',
    lines: getLinesForPR('pr-006', _prLinesIT)
  },
  {
    pr_id: 'pr-005', pr_no: 'PR-202602-0005', branch_id: '1', requester_user_id: '3', requester_name: 'นภา สวยงาม',
    pr_date: '2026-02-03', need_by_date: '2026-02-15', cost_center_id: 'CC002', purpose: 'น้ำมันหล่อลื่นเครื่องจักร',
    status: 'APPROVED', pr_base_currency_code: 'THB', 
    total_amount: calculatePRTotal(_prLinesFactory), pr_tax_rate: 7, pr_tax_code_id: 'VAT-IN-7',
    attachment_count: 0,
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
    status: 'APPROVED', pr_base_currency_code: 'THB', 
    total_amount: calculatePRTotal(_prLinesIT), pr_tax_rate: 7, pr_tax_code_id: 'VAT-IN-7',
    attachment_count: 0,
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
    status: 'APPROVED', pr_base_currency_code: 'THB', 
    total_amount: calculatePRTotal(_prLinesOffice), pr_tax_rate: 7, pr_tax_code_id: 'VAT-IN-7',
    attachment_count: 0,
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
