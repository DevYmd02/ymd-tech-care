/**
 * @file pr-types.ts
 * @description Types สำหรับ Purchase Requisition Module - ตาม Database Schema
 * @usage import { PRHeader, PRLine, PRStatus, ApprovalTask } from '@/modules/procurement/types';
 */

// ====================================================================================
// PR STATUS - ตาม pr_header.status
// ====================================================================================


export type PRStatus = 
  | 'DRAFT'                 // ร่าง
  | 'PENDING'               // รออนุมัติ
  | 'APPROVED'              // อนุมัติแล้ว
  | 'REJECTED'              // ไม่อนุมัติ
  | 'CANCELLED'             // ยกเลิก
  | 'COMPLETED';            // เสร็จสมบูรณ์

// ====================================================================================
// PR HEADER - ตาม pr_header table
// ====================================================================================

export interface PRHeader {
  pr_id: number;                    // INTEGER @id
  pr_no: string;                    // VARCHAR(50) - เลขที่เอกสาร PR-202601-0001
  branch_id: number;            // INTEGER
  requester_user_id: number;    // INTEGER
  requester_name: string;           // VARCHAR(200)
  pr_date: string;                  // DATE - วันที่ขอซื้อ
  need_by_date: string;             // DATE - วันที่ต้องการใช้
  cost_center_id: number;       // INTEGER
  project_id?: number;          // INTEGER
  purpose: string;                  // TEXT - วัตถุประสงค์
  status: PRStatus;
  pr_base_currency_code: string;    // VARCHAR(3) - THB
  pr_quote_currency_code?: string;  // VARCHAR(3) - USD
  pr_exchange_rate?: number;        // Postman: pr_exchange_rate
  pr_exchange_rate_date?: string;   // Postman: pr_exchange_rate_date
  pr_discount_raw?: string;         // Postman: pr_discount_raw
  total_amount: number;             // DECIMAL(18,2)
  pr_base_total_amount?: string | number; // Field returned in PR List response
  attachment_count: number;         // INTEGER
  created_at: string;               // TIMESTAMP
  updated_at: string;               // TIMESTAMP
  cancelflag?: 'Y' | 'N';           // CHAR(1) - Void/Cancel Flag
  created_by_user_id: number;       // INTEGER
  updated_by_user_id: number;       // INTEGER
  
  // New Fields (Info Bar & Remark & Vendor)
  delivery_date?: string;           // DATE - วันที่กำหนดส่ง
  credit_days?: number;             // int
  payment_term_days?: number;       // int
  vendor_quote_no?: string;         // VARCHAR(100)
  shipping_method?: string;         // VARCHAR(100)
  remark?: string;                  // TEXT (Singular per Postman)
  preferred_vendor_id?: number; // INTEGER
  vendor_name?: string;             // VARCHAR(200)
  department_name?: string;         // Added for List Page display
  created_by_name?: string;         // Added for List Page display
  pr_tax_code_id?: number;          // INTEGER
  pr_tax_rate?: number;             // snapshot
  warehouse_id?: number;            // INTEGER

  // ── Data Hydration Fields (Fallback keys the backend may return) ──
  employee_name?: string;           // Possible JOIN from employee table
  department_id?: string | number;  // FK → department (for fallback display)
  dept_name?: string;               // Alternative key for department name
  user_id?: string | number;        // Alternative key for user FK
  suggested_vendor?: string;        // Alternative key for vendor name
  vendor_id?: string | number;      // FK → vendor (for fallback display)

  // Relations (populated by API)
  lines?: PRLine[];
  approval_tasks?: ApprovalTask[];
}

// ====================================================================================
// PR LINE - ตาม pr_line table
// ====================================================================================

export interface PRLine {
  pr_line_id: number;               // INTEGER
  pr_id: number;                    // INTEGER
  line_no: number;                  // int
  item_id: number;                  // INTEGER
  item_code: string;                // VARCHAR(50)
  item_name: string;                // VARCHAR(500)
  description?: string;             // TEXT (Postman uses 'description' inside lines)
  qty: number;                      // DECIMAL(18,4) (Postman: qty)
  uom: string;                      // VARCHAR(50) - หน่วยนับ
  uom_id: number;                   // INTEGER
  warehouse_id?: number;            // INTEGER
  location?: string;                // Postman: location
  est_unit_price: number;           // DECIMAL(18,2) - ราคาต่อหน่วยโดยประมาณ
  est_amount: number;               // DECIMAL(18,2) - มูลค่ารวมโดยประมาณ
  needed_date: string;              // DATE - วันที่ต้องการสินค้า
  preferred_vendor_id?: string; // uuid
  remark?: string;                  // TEXT - หมายเหตุ
  line_discount_raw?: string;       // Postman: line_discount_raw
  line_net_amount?: string | number; // Added: Backend returns this as the line total
  line_amount?: string | number;
  tax_amount?: string | number;
  tax_rate?: string | number;
  required_receipt_type?: string;
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
  task_id: number;                  // INTEGER
  document_type: 'PR' | 'RFQ' | 'PO';
  document_id: number;              // INTEGER
  document_no: string;              // doc no
  approver_user_id: number;         // INTEGER
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

// PRFormData and PRLineFormData are now inferred directly from Zod Schema in pr-schemas.ts
export type { PRFormData, PRLineFormData } from '../schemas/pr-schemas';

// ====================================================================================
// LEGACY TYPES - สำหรับ Backward Compatibility (จะลบภายหลัง)
// ====================================================================================

/** @deprecated ใช้ PRLine แทน */
export interface PRItem {
  item_code: string;
  item_name: string;
  warehouse: string;
  location: string;
  uom: string;
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

// ═══════════════════════════════════════════════════════════════════════════════
// LINE ITEM — Only fields the backend DTO accepts (Postman-aligned)
// ═══════════════════════════════════════════════════════════════════════════════
export interface CreatePRLineItem {
    item_id: number;                // INTEGER
    qty: number;                    // decimal
    est_unit_price: number;         // decimal
    uom_id: number;                 // INTEGER
    line_no?: number;               // INTEGER (optional)
    description?: string;           // TEXT (optional)
    location?: string;              // VARCHAR (optional)
    required_receipt_type?: string; // VARCHAR (optional)
    remark?: string;                // TEXT (optional)
    line_discount_raw?: string;     // Discount string (optional)
    warehouse_id?: number;          // INTEGER
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE PAYLOAD — Aligned with Postman golden response (production DB)
// The backend uses NestJS whitelist:true + forbidNonWhitelisted:true.
// ONLY fields accepted by the DTO are included here.
//
// FORBIDDEN (400 "should not exist"):
//   ✗ department_id  ✗ purpose  ✗ pr_sub_total  ✗ total_amount
//   ✗ isMulticurrency  ✗ preparer_name  ✗ is_on_hold  ✗ cancelflag
//   ✗ pr_discount_amount  ✗ pr_tax_amount  ✗ pr_tax_rate
// ═══════════════════════════════════════════════════════════════════════════════
export interface CreatePRPayload {
    pr_no?: string;                 // Document number (omit if backend auto-generates)
    pr_date: string;                // YYYY-MM-DD
    need_by_date: string;           // YYYY-MM-DD
    requester_user_id: number;      // INTEGER
    branch_id: number;              // INTEGER
    project_id?: number;            // INTEGER
    pr_tax_code_id?: number;        // INTEGER
    remark?: string;                // Free text (optional)
    status: PRStatus;                 // "PENDING" | "DRAFT" (Literal union)

    // ── Currency & Exchange Rate (Postman-aligned) ──
    pr_base_currency_code: string;  // VARCHAR(3) — e.g. "THB"
    pr_quote_currency_code: string; // VARCHAR(3) — e.g. "USD"
    pr_exchange_rate: number;       // Numeric exchange rate
    pr_exchange_rate_date: string;  // ISO 8601 date string (YYYY-MM-DD)

    // ── Terms (Postman-aligned) ──
    pr_discount_raw: string;        // Discount string e.g. "10%" or "500"
    payment_term_days: number;      // Integer, min 0
    credit_days: number;            // Integer — credit days (Postman: credit_days)
    vendor_quote_no: string;        // VARCHAR
    shipping_method: string;        // VARCHAR
    delivery_date?: string;         // YYYY-MM-DD (Postman: delivery_date)
    requester_name?: string;        // VARCHAR(200) (Explicitly packaged for backend)

    lines: CreatePRLineItem[];      // Line items array
}

// ====================================================================================
// SERVICE TYPES - REQUEST/RESPONSE
// ====================================================================================

export interface PRListParams {
  pr_no?: string;
  status?: PRStatus | 'ALL';
  cost_center_id?: number;
  project_id?: number;
  requester_name?: string;
  department?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
}

export interface PRListResponse {
  data: PRHeader[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubmitPRRequest {
  pr_id: number;
}

export interface ApprovalRequest {
  pr_id: number;
  action: 'APPROVE' | 'REJECT';
  remark?: string;
}

export interface ApprovalResponse {
  success: boolean;
  message: string;
  approval_task?: ApprovalTask;
}

export interface ConvertPRRequest {
  pr_id: number;
  convert_to: 'RFQ' | 'PO';
  line_ids?: number[];
}

export interface VendorSelection {
  vendor_id: number;
  vendor_code: string;
  vendor_name: string;
  tax_id?: string;
  payment_term_days?: number;
}
