/**
 * @file pr-types.ts
 * @description Types สำหรับ Purchase Requisition Module - ตาม Database Schema
 * @usage import { PRHeader, PRLine, PRStatus, ApprovalTask } from '@/modules/procurement/types/pr-types';
 */

// ====================================================================================
// PR STATUS - ตาม pr_header.status
// ====================================================================================

export type PRStatus = 
  | 'DRAFT'                 // ร่าง
  | 'PENDING'               // รออนุมัติ
  | 'APPROVED'              // อนุมัติแล้ว
  | 'CANCELLED';            // ยกเลิก

// ====================================================================================
// PR HEADER - ตาม pr_header table
// ====================================================================================

export interface PRHeader {
  pr_id: string;                    // UUID - Primary Key
  pr_no: string;                    // VARCHAR(50) - เลขที่เอกสาร PR-202601-0001
  branch_id: string;                // UUID FK → org_branch
  requester_user_id: string;        // UUID FK → users
  requester_name: string;           // VARCHAR(200)
  request_date: string;             // DATE - วันที่ขอซื้อ
  required_date: string;            // DATE - วันที่ต้องการใช้
  cost_center_id: string;           // UUID FK → cost_center
  project_id?: string;              // UUID FK → project (Optional)
  purpose: string;                  // TEXT - วัตถุประสงค์
  status: PRStatus;
  currency_code: string;            // VARCHAR(3) - THB, USD
  total_amount: number;             // DECIMAL(18,2)
  attachment_count: number;         // INTEGER
  created_at: string;               // TIMESTAMP
  updated_at: string;               // TIMESTAMP
  created_by_user_id: string;       // UUID FK
  updated_by_user_id: string;       // UUID FK
  
  // New Fields (Info Bar & Remarks & Vendor)
  delivery_date?: string;           // DATE - วันที่กำหนดส่ง
  credit_days?: number;             // INTEGER
  vendor_quote_no?: string;         // VARCHAR(100)
  shipping_method?: string;         // VARCHAR(100)
  remarks?: string;                 // TEXT
  preferred_vendor_id?: string;     // UUID FK → vendor
  vendor_name?: string;             // VARCHAR(200)

  // Relations (populated by API)
  lines?: PRLine[];
  approval_tasks?: ApprovalTask[];
}

// ====================================================================================
// PR LINE - ตาม pr_line table
// ====================================================================================

export interface PRLine {
  pr_line_id: string;               // UUID - Primary Key
  pr_id: string;                    // UUID FK → pr_header
  line_no: number;                  // INTEGER - ลำดับ (1, 2, 3...)
  item_id: string;                  // UUID FK → item
  item_code: string;                // VARCHAR(50)
  item_name: string;                // VARCHAR(500)
  item_description?: string;        // TEXT
  quantity: number;                 // DECIMAL(18,4)
  uom: string;                      // VARCHAR(50) - หน่วยนับ
  est_unit_price: number;           // DECIMAL(18,2) - ราคาต่อหน่วยโดยประมาณ
  est_amount: number;               // DECIMAL(18,2) - มูลค่ารวมโดยประมาณ
  needed_date: string;              // DATE - วันที่ต้องการสินค้า
  preferred_vendor_id?: string;     // UUID FK → vendor (Optional)
  remark?: string;                  // TEXT - หมายเหตุ
}

// ====================================================================================
// APPROVAL TASK - สำหรับ Approval Workflow
// ====================================================================================

export type ApprovalTaskStatus = 
  | 'PENDING'     // รอดำเนินการ
  | 'APPROVED'    // อนุมัติ
  | 'REJECTED'    // ปฏิเสธ
  | 'CANCELLED';  // ยกเลิก

export interface ApprovalTask {
  task_id: string;                  // UUID
  document_type: 'PR' | 'RFQ' | 'PO';
  document_id: string;              // UUID → pr_id
  document_no: string;              // เลขที่เอกสาร
  approver_user_id: string;         // UUID → users
  approver_name: string;
  approver_position: string;
  status: ApprovalTaskStatus;
  created_at: string;
  approved_at?: string;
  remark?: string;
}

// ====================================================================================
// COST CENTER & PROJECT - Re-export from master-data-types.ts
// ====================================================================================

export type { CostCenter, Project, ProjectStatus } from '@/modules/master-data/types/master-data-types';

// ====================================================================================
// PR FORM DATA - สำหรับ Form สร้าง/แก้ไข PR
// ====================================================================================

/** ข้อมูลสำหรับ Form สร้าง PR ใหม่ */
export interface PRFormData {
  // Header fields
  pr_no: string;                    // Auto-generated
  request_date: string;             // วันที่ขอซื้อ
  required_date: string;            // วันที่ต้องการใช้
  requester_name?: string;           // ชื่อผู้ขอ
  cost_center_id: string;           // ศูนย์ต้นทุน
  project_id?: string;              // โครงการ (optional)
  purpose: string;                  // วัตถุประสงค์
  currency_code: string;            // สกุลเงิน (THB, USD)
  
  // Vendor Info
  preferred_vendor_id?: string;     // ผู้ขายที่แนะนำ
  vendor_name?: string;             // ชื่อผู้ขาย (สำหรับแสดงผล)

  // New Fields (Info Bar & Remarks)
  delivery_date?: string;
  credit_days?: number;
  vendor_quote_no?: string;
  shipping_method?: string;
  remarks?: string;
  
  // Line items
  lines: PRLineFormData[];
  
  // Summary
  total_amount: number;
}

/** ข้อมูลรายการสินค้าใน Form */
export interface PRLineFormData {
  item_id: string;
  item_code: string;
  item_name: string;
  item_description?: string;
  quantity: number;
  uom: string;
  uom_id?: string | number;
  est_unit_price: number;
  est_amount: number;
  needed_date: string;
  preferred_vendor_id?: string;
  remark?: string;
}

// ====================================================================================
// LEGACY TYPES - สำหรับ Backward Compatibility (จะลบภายหลัง)
// ====================================================================================

/** @deprecated ใช้ PRLine แทน */
export interface PRItem {
  item_code: string;
  item_name: string;
  warehouse: string;
  location: string;
  unit: string;
  qty: number | null;
  price: number | null;
  discount: number | null;
}

/** @deprecated ใช้ PRHeader แทน */
export interface PRListItem {
  id: number;
  doc_no: string;
  date: string;
  requester: string;
  department: string;
  status: 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ยกเลิก';
  totalAmount: number;
}

/** @deprecated ใช้ PRHeader แทน */
export interface PRDetail {
  id: number;
  doc_no: string;
  doc_date: string;
  vendor_code: string;
  vendor_name: string;
  items: PRItem[];
  totalAmount: number;
  status: string;
}

/** @deprecated จะปรับปรุงให้ตรงกับ PRHeader */
export interface PRFormValues {
  doc_no: string;
  doc_date: string;
  vendor_code: string;
  vendor_name: string;
  contact_name: string;
  due_days: number;
  is_hold: boolean;
  remarks: string;
  vat_rate: number;
  discount_amount: number;
  items: PRItem[];

  // PRInfoBar fields
  delivery_date: string;
  credit_days: number;
  vendor_quote_no: string;
  shipping_method: string;
  requester_name: string;
}

// ====================================================================================
// CREATE PR PAYLOAD (BATCH PATTERN)
// ====================================================================================

export interface CreatePRLineItem {
    item_id?: string;
    item_code: string;
    item_name: string;
    qty: number;
    uom: string;
    uom_id?: string | number; // Added
    price: number;
    needed_date?: string;
    remark?: string;
}

export interface CreatePRPayload {
    pr_date: string;
    remark?: string; // Backend 'remark'
    department_id?: string; // Maps to cost_center_id
    project_id?: string;
    requester_name?: string;
    requester_user_id?: number; // Backend 'requester_user_id'
    branch_id?: number;         // Backend 'branch_id'
    warehouse_id?: number;      // Backend 'warehouse_id'
    
    required_date?: string;
    items: CreatePRLineItem[];
    
    // Additional fields supported by UI
    delivery_date?: string;
    credit_days?: number;
    payment_term_days?: number; // Backend 'payment_term_days'
    vendor_quote_no?: string;
    shipping_method?: string;
    preferred_vendor_id?: string;
    vendor_name?: string;
}

// ====================================================================================
// SERVICE TYPES - REQUEST/RESPONSE
// ====================================================================================

export interface PRListParams {
  pr_no?: string;
  status?: PRStatus | 'ALL';
  cost_center_id?: string;
  project_id?: string;
  requester_name?: string;
  department?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface PRListResponse {
  items: PRHeader[];
  total: number;
  page: number;
  limit: number;
}

export interface SubmitPRRequest {
  pr_id: string;
}

export interface ApprovalRequest {
  pr_id: string;
  action: 'APPROVE' | 'REJECT';
  remark?: string;
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  approval_task?: ApprovalTask;
}

export interface ConvertPRRequest {
  pr_id: string;
  convert_to: 'RFQ' | 'PO';
  line_ids?: string[];
}
