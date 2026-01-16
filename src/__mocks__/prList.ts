/**
 * @file prList.ts
 * @description Mock Data สำหรับรายการใบขอซื้อ (Purchase Requisition) - ตาม Database Schema
 * @usage import { MOCK_PR_LIST, MOCK_PR_HEADERS, MOCK_COST_CENTERS, MOCK_PROJECTS } from '@/mocks/prList';
 */

import type { 
  PRHeader, 
  PRLine, 
  ApprovalTask, 
  CostCenter, 
  Project 
} from '../types/pr-types';

// ====================================================================================
// MOCK COST CENTERS - ศูนย์ต้นทุน
// ====================================================================================

export const MOCK_COST_CENTERS: CostCenter[] = [
  {
    cost_center_id: 'cc-001',
    cost_center_code: 'CC-IT',
    cost_center_name: 'ฝ่ายเทคโนโลยีสารสนเทศ',
    description: 'ศูนย์ต้นทุนฝ่าย IT',
    budget_amount: 5000000,
    manager_name: 'สมชาย ใจดี',
    is_active: true,
  },
  {
    cost_center_id: 'cc-002',
    cost_center_code: 'CC-HR',
    cost_center_name: 'ฝ่ายทรัพยากรบุคคล',
    description: 'ศูนย์ต้นทุนฝ่าย HR',
    budget_amount: 2000000,
    manager_name: 'นิภา สายบุญเลิศ',
    is_active: true,
  },
  {
    cost_center_id: 'cc-003',
    cost_center_code: 'CC-PROD',
    cost_center_name: 'ฝ่ายผลิต',
    description: 'ศูนย์ต้นทุนฝ่ายผลิต',
    budget_amount: 10000000,
    manager_name: 'วิชัย มากการ',
    is_active: true,
  },
  {
    cost_center_id: 'cc-004',
    cost_center_code: 'CC-SALES',
    cost_center_name: 'ฝ่ายขาย',
    description: 'ศูนย์ต้นทุนฝ่ายขาย',
    budget_amount: 3000000,
    manager_name: 'สุดา ขายเก่ง',
    is_active: true,
  },
];

// ====================================================================================
// MOCK PROJECTS - โครงการ
// ====================================================================================

export const MOCK_PROJECTS: Project[] = [
  {
    project_id: 'prj-001',
    project_code: 'PRJ-2026-001',
    project_name: 'ปรับปรุงระบบ ERP',
    description: 'โครงการปรับปรุงระบบ ERP ให้ทันสมัย',
    cost_center_id: 'cc-001',
    budget_amount: 2000000,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    status: 'ACTIVE',
  },
  {
    project_id: 'prj-002',
    project_code: 'PRJ-2026-002',
    project_name: 'ขยายสายการผลิต',
    description: 'โครงการขยายสายการผลิตใหม่',
    cost_center_id: 'cc-003',
    budget_amount: 5000000,
    start_date: '2026-02-01',
    end_date: '2026-08-31',
    status: 'ACTIVE',
  },
];

// ====================================================================================
// MOCK PR LINES - รายการสินค้าใน PR
// ====================================================================================

const MOCK_PR_LINES: Record<string, PRLine[]> = {
  'pr-001': [
    {
      pr_line_id: 'line-001-1',
      pr_id: 'pr-001',
      line_no: 1,
      item_id: 'item-001',
      item_code: 'IT-NB-001',
      item_name: 'Notebook Dell Latitude 5540',
      item_description: 'Notebook สำหรับพนักงาน IT',
      quantity: 2,
      uom: 'เครื่อง',
      est_unit_price: 35000,
      est_amount: 70000,
      needed_date: '2026-01-20',
      remark: 'สำหรับพนักงานใหม่',
    },
    {
      pr_line_id: 'line-001-2',
      pr_id: 'pr-001',
      line_no: 2,
      item_id: 'item-002',
      item_code: 'IT-MS-001',
      item_name: 'Mouse Logitech MX Master 3',
      item_description: 'เมาส์ไร้สาย',
      quantity: 5,
      uom: 'ชิ้น',
      est_unit_price: 3500,
      est_amount: 17500,
      needed_date: '2026-01-20',
    },
  ],
  'pr-002': [
    {
      pr_line_id: 'line-002-1',
      pr_id: 'pr-002',
      line_no: 1,
      item_id: 'item-003',
      item_code: 'OFF-PAPER-001',
      item_name: 'กระดาษ A4 80 แกรม',
      quantity: 100,
      uom: 'รีม',
      est_unit_price: 120,
      est_amount: 12000,
      needed_date: '2026-01-25',
    },
  ],
};

// ====================================================================================
// MOCK APPROVAL TASKS - งานรออนุมัติ
// ====================================================================================

const MOCK_APPROVAL_TASKS: Record<string, ApprovalTask[]> = {
  'pr-001': [
    {
      task_id: 'task-001',
      document_type: 'PR',
      document_id: 'pr-001',
      document_no: 'PR-202601-0001',
      approver_user_id: 'user-mgr-001',
      approver_name: 'นายใหญ่ มากเงิน',
      approver_position: 'ผจก.ฝ่ายจัดซื้อ',
      status: 'PENDING',
      created_at: '2026-01-15T09:00:00Z',
    },
  ],
  'pr-002': [
    {
      task_id: 'task-002',
      document_type: 'PR',
      document_id: 'pr-002',
      document_no: 'PR-202601-0002',
      approver_user_id: 'user-mgr-001',
      approver_name: 'นายใหญ่ มากเงิน',
      approver_position: 'ผจก.ฝ่ายจัดซื้อ',
      status: 'APPROVED',
      created_at: '2026-01-16T09:00:00Z',
      approved_at: '2026-01-16T14:30:00Z',
      remark: 'อนุมัติตามงบประมาณ',
    },
  ],
};

// ====================================================================================
// MOCK PR HEADERS - ใบขอซื้อ (ตาม Database Schema)
// ====================================================================================

export const MOCK_PR_HEADERS: PRHeader[] = [
  {
    pr_id: 'pr-001',
    pr_no: 'PR-202601-0001',
    branch_id: 'branch-001',
    requester_user_id: 'user-001',
    requester_name: 'สมชาย ใจดี',
    request_date: '2026-01-15',
    required_date: '2026-01-20',
    cost_center_id: 'cc-001',
    project_id: 'prj-001',
    purpose: 'จัดซื้ออุปกรณ์ IT สำหรับพนักงานใหม่',
    status: 'IN_APPROVAL',
    currency_code: 'THB',
    total_amount: 87500,
    attachment_count: 0,
    created_at: '2026-01-15T09:00:00Z',
    updated_at: '2026-01-15T09:00:00Z',
    created_by_user_id: 'user-001',
    updated_by_user_id: 'user-001',
    lines: MOCK_PR_LINES['pr-001'],
    approval_tasks: MOCK_APPROVAL_TASKS['pr-001'],
  },
  {
    pr_id: 'pr-002',
    pr_no: 'PR-202601-0002',
    branch_id: 'branch-001',
    requester_user_id: 'user-002',
    requester_name: 'สมหญิง รักงาน',
    request_date: '2026-01-16',
    required_date: '2026-01-25',
    cost_center_id: 'cc-002',
    purpose: 'จัดซื้อวัสดุสำนักงาน',
    status: 'APPROVED',
    currency_code: 'THB',
    total_amount: 12000,
    attachment_count: 1,
    created_at: '2026-01-16T08:30:00Z',
    updated_at: '2026-01-16T14:30:00Z',
    created_by_user_id: 'user-002',
    updated_by_user_id: 'user-mgr-001',
    lines: MOCK_PR_LINES['pr-002'],
    approval_tasks: MOCK_APPROVAL_TASKS['pr-002'],
  },
  {
    pr_id: 'pr-003',
    pr_no: 'PR-202601-0003',
    branch_id: 'branch-001',
    requester_user_id: 'user-003',
    requester_name: 'วิชัย มากการ',
    request_date: '2026-01-17',
    required_date: '2026-01-30',
    cost_center_id: 'cc-003',
    project_id: 'prj-002',
    purpose: 'จัดซื้ออะไหล่เครื่องจักร',
    status: 'IN_APPROVAL',
    currency_code: 'THB',
    total_amount: 78500,
    attachment_count: 2,
    created_at: '2026-01-17T10:00:00Z',
    updated_at: '2026-01-17T10:00:00Z',
    created_by_user_id: 'user-003',
    updated_by_user_id: 'user-003',
  },
  {
    pr_id: 'pr-004',
    pr_no: 'PR-202601-0004',
    branch_id: 'branch-001',
    requester_user_id: 'user-004',
    requester_name: 'สมจิต สีดาวเรือง',
    request_date: '2026-01-18',
    required_date: '2026-02-01',
    cost_center_id: 'cc-002',
    purpose: 'จัดซื้อเครื่องพิมพ์',
    status: 'DRAFT',
    currency_code: 'THB',
    total_amount: 32000,
    attachment_count: 0,
    created_at: '2026-01-18T11:00:00Z',
    updated_at: '2026-01-18T11:00:00Z',
    created_by_user_id: 'user-004',
    updated_by_user_id: 'user-004',
  },
  {
    pr_id: 'pr-005',
    pr_no: 'PR-202601-0005',
    branch_id: 'branch-001',
    requester_user_id: 'user-005',
    requester_name: 'ประยุทธ ชยัน',
    request_date: '2026-01-19',
    required_date: '2026-02-05',
    cost_center_id: 'cc-003',
    purpose: 'จัดซื้อวัตถุดิบการผลิต',
    status: 'CONVERTED',
    currency_code: 'THB',
    total_amount: 250000,
    attachment_count: 3,
    created_at: '2026-01-19T08:00:00Z',
    updated_at: '2026-01-20T10:00:00Z',
    created_by_user_id: 'user-005',
    updated_by_user_id: 'user-mgr-002',
  },
  {
    pr_id: 'pr-006',
    pr_no: 'PR-202601-0006',
    branch_id: 'branch-001',
    requester_user_id: 'user-006',
    requester_name: 'นาง รักษ์ดี',
    request_date: '2026-01-20',
    required_date: '2026-02-10',
    cost_center_id: 'cc-004',
    purpose: 'จัดซื้อของพรีเมี่ยมสำหรับลูกค้า',
    status: 'SUBMITTED',
    currency_code: 'THB',
    total_amount: 15000,
    attachment_count: 0,
    created_at: '2026-01-20T09:30:00Z',
    updated_at: '2026-01-20T09:30:00Z',
    created_by_user_id: 'user-006',
    updated_by_user_id: 'user-006',
  },
  {
    pr_id: 'pr-007',
    pr_no: 'PR-202601-0007',
    branch_id: 'branch-001',
    requester_user_id: 'user-007',
    requester_name: 'วีระ สมบูรณ์',
    request_date: '2026-01-21',
    required_date: '2026-02-15',
    cost_center_id: 'cc-003',
    purpose: 'จัดซื้อเครื่องมือ QC',
    status: 'APPROVED',
    currency_code: 'THB',
    total_amount: 89000,
    attachment_count: 1,
    created_at: '2026-01-21T14:00:00Z',
    updated_at: '2026-01-21T16:45:00Z',
    created_by_user_id: 'user-007',
    updated_by_user_id: 'user-mgr-001',
  },
  {
    pr_id: 'pr-008',
    pr_no: 'PR-202601-0008',
    branch_id: 'branch-001',
    requester_user_id: 'user-008',
    requester_name: 'นิภา สายบุญเลิศ',
    request_date: '2026-01-22',
    required_date: '2026-02-20',
    cost_center_id: 'cc-002',
    purpose: 'จัดซื้ออุปกรณ์ฝึกอบรม',
    status: 'IN_APPROVAL',
    currency_code: 'THB',
    total_amount: 43500,
    attachment_count: 0,
    created_at: '2026-01-22T10:00:00Z',
    updated_at: '2026-01-22T10:00:00Z',
    created_by_user_id: 'user-008',
    updated_by_user_id: 'user-008',
  },
  {
    pr_id: 'pr-009',
    pr_no: 'PR-202601-0009',
    branch_id: 'branch-001',
    requester_user_id: 'user-009',
    requester_name: 'สมศักดิ์ แสงทอง',
    request_date: '2026-01-23',
    required_date: '2026-02-25',
    cost_center_id: 'cc-001',
    purpose: 'จัดซื้อซอฟต์แวร์',
    status: 'CANCELLED',
    currency_code: 'THB',
    total_amount: 28000,
    attachment_count: 0,
    created_at: '2026-01-23T09:00:00Z',
    updated_at: '2026-01-23T15:00:00Z',
    created_by_user_id: 'user-009',
    updated_by_user_id: 'user-009',
  },
];

// ====================================================================================
// LEGACY MOCK DATA - สำหรับ Backward Compatibility (จะลบภายหลัง)
// ====================================================================================

/** @deprecated ใช้ ApprovalTask แทน */
export interface ApproverInfo {
  name: string;
  position: string;
  approvedAt?: string;
  remark?: string;
}

/** @deprecated ใช้ PRHeader แทน */
export interface PRItem {
  id: number;
  doc_no: string;
  date: string;
  requester: string;
  requesterPosition: string;
  department: string;
  status: 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ยกเลิก';
  itemCount: number;
  totalAmount: number;
  pendingApprover?: ApproverInfo;
  approver?: ApproverInfo;
}

/** @deprecated ใช้ MOCK_PR_HEADERS แทน */
export const MOCK_PR_LIST: PRItem[] = [
  {
    id: 1,
    doc_no: 'PR2026-001',
    date: '2026-01-15',
    requester: 'สมชาย ใจดี',
    requesterPosition: 'พนักงาน',
    department: 'IT',
    status: 'รออนุมัติ',
    itemCount: 3,
    totalAmount: 45000,
    pendingApprover: { name: 'นายใหญ่ มากเงิน', position: 'ผจก.ฝ่ายจัดซื้อ' }
  },
  {
    id: 2,
    doc_no: 'PR2026-002',
    date: '2026-01-16',
    requester: 'สมหญิง รักงาน',
    requesterPosition: 'พนักงาน',
    department: 'จัดซื้อ',
    status: 'อนุมัติแล้ว',
    itemCount: 5,
    totalAmount: 125000,
    approver: { name: 'นายใหญ่ มากเงิน', position: 'ผจก.ฝ่ายจัดซื้อ', approvedAt: '2026-01-16 14:30' }
  },
  {
    id: 3,
    doc_no: 'PR2026-003',
    date: '2026-01-17',
    requester: 'วิชัย มากการ',
    requesterPosition: 'หัวหน้างาน',
    department: 'ผลิต',
    status: 'รออนุมัติ',
    itemCount: 4,
    totalAmount: 78500,
    pendingApprover: { name: 'สมศรี ใจกว้าง', position: 'ผจก.ฝ่ายผลิต' }
  },
  {
    id: 4,
    doc_no: 'PR2026-004',
    date: '2026-01-18',
    requester: 'สมจิต สีดาวเรือง',
    requesterPosition: 'พนักงาน',
    department: 'บัญชี',
    status: 'รออนุมัติ',
    itemCount: 2,
    totalAmount: 32000,
    pendingApprover: { name: 'นายใหญ่ มากเงิน', position: 'ผจก.ฝ่ายจัดซื้อ' }
  },
  {
    id: 5,
    doc_no: 'PR2026-005',
    date: '2026-01-19',
    requester: 'ประยุทธ ชยัน',
    requesterPosition: 'หัวหน้างาน',
    department: 'คลัง',
    status: 'อนุมัติแล้ว',
    itemCount: 8,
    totalAmount: 250000,
    approver: { name: 'กฤษณ์ บุญมาก', position: 'MD', approvedAt: '2026-01-19 09:15' }
  },
  {
    id: 6,
    doc_no: 'PR2026-006',
    date: '2026-01-20',
    requester: 'นาง รักษ์ดี',
    requesterPosition: 'พนักงาน',
    department: 'ฝ่ายขาย',
    status: 'รออนุมัติ',
    itemCount: 2,
    totalAmount: 15000,
    pendingApprover: { name: 'สุดา ขายเก่ง', position: 'ผจก.ฝ่ายขาย' }
  },
  {
    id: 7,
    doc_no: 'PR2026-007',
    date: '2026-01-21',
    requester: 'วีระ สมบูรณ์',
    requesterPosition: 'พนักงาน',
    department: 'QC',
    status: 'อนุมัติแล้ว',
    itemCount: 6,
    totalAmount: 89000,
    approver: { name: 'นายใหญ่ มากเงิน', position: 'ผจก.ฝ่ายจัดซื้อ', approvedAt: '2026-01-21 16:45' }
  },
  {
    id: 8,
    doc_no: 'PR2026-008',
    date: '2026-01-22',
    requester: 'นิภา สายบุญเลิศ',
    requesterPosition: 'หัวหน้างาน',
    department: 'HR',
    status: 'รออนุมัติ',
    itemCount: 3,
    totalAmount: 43500,
    pendingApprover: { name: 'นายใหญ่ มากเงิน', position: 'ผจก.ฝ่ายจัดซื้อ' }
  },
  {
    id: 9,
    doc_no: 'PR2026-009',
    date: '2026-01-23',
    requester: 'สมศักดิ์ แสงทอง',
    requesterPosition: 'พนักงาน',
    department: 'IT',
    status: 'ยกเลิก',
    itemCount: 2,
    totalAmount: 28000,
  },
];
