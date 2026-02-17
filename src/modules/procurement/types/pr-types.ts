/**
 * @file pr-types.ts
 * @description Types สำหรับ Purchase Requisition Module - ตาม Database Schema
 * @usage import { PRHeader, PRLine, PRStatus, ApprovalTask } from '@/modules/procurement/types/pr-types';
 */

// ====================================================================================
// CORE REFERENCE TYPES
// ====================================================================================
export type MasterDataId = string | number;

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
  pr_id: string;                    // UUID - Primary Key
  pr_no: string;                    // VARCHAR(50) - เลขที่เอกสาร PR-202601-0001
  branch_id: MasterDataId;            // FK → org_branch
  requester_user_id: MasterDataId;    // FK → users
  requester_name: string;           // VARCHAR(200)
  pr_date: string;                  // DATE - วันที่ขอซื้อ
  need_by_date: string;             // DATE - วันที่ต้องการใช้
  cost_center_id: MasterDataId;       // FK → cost_center
  project_id?: MasterDataId | null;   // FK → project (Optional)
  purpose: string;                  // TEXT - วัตถุประสงค์
  status: PRStatus;
  pr_base_currency_code: string;    // VARCHAR(3) - THB
  pr_quote_currency_code?: string;  // VARCHAR(3) - USD
  pr_exchange_rate?: number;        // Postman: pr_exchange_rate
  pr_exchange_rate_date?: string;   // Postman: pr_exchange_rate_date
  pr_discount_raw?: string;         // Postman: pr_discount_raw
  total_amount: number;             // DECIMAL(18,2)
  attachment_count: number;         // INTEGER
  created_at: string;               // TIMESTAMP
  updated_at: string;               // TIMESTAMP
  cancelflag?: 'Y' | 'N';           // CHAR(1) - Void/Cancel Flag
  created_by_user_id: string | number;       // FK
  updated_by_user_id: string | number;       // FK
  
  // New Fields (Info Bar & Remark & Vendor)
  delivery_date?: string;           // DATE - วันที่กำหนดส่ง
  credit_days?: number;             // INTEGER
  payment_term_days?: number;       // INTEGER (Postman uses this)
  vendor_quote_no?: string;         // VARCHAR(100)
  shipping_method?: string;         // VARCHAR(100)
  remark?: string;                  // TEXT (Singular per Postman)
  preferred_vendor_id?: MasterDataId; // FK → vendor
  vendor_name?: string;             // VARCHAR(200)
  pr_tax_code_id?: string | number;          // INTEGER (Postman: pr_tax_code_id)
  pr_tax_rate?: number;             // Added for Snapshotting Tax Rate
  warehouse_id?: string | number;            // Added for fetching

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
  item_id: string | number;                  // FK → item
  item_code: string;                // VARCHAR(50)
  item_name: string;                // VARCHAR(500)
  description?: string;             // TEXT (Postman uses 'description' inside lines)
  qty: number;                      // DECIMAL(18,4) (Postman: qty)
  uom: string;                      // VARCHAR(50) - หน่วยนับ
  uom_id: string | number;                   // INTEGER
  warehouse_id?: string | number;            // Postman: warehouse_id
  location?: string;                // Postman: location
  est_unit_price: number;           // DECIMAL(18,2) - ราคาต่อหน่วยโดยประมาณ
  est_amount: number;               // DECIMAL(18,2) - มูลค่ารวมโดยประมาณ
  needed_date: string;              // DATE - วันที่ต้องการสินค้า
  preferred_vendor_id?: MasterDataId; // FK → vendor (Optional)
  remark?: string;                  // TEXT - หมายเหตุ
  line_discount_raw?: string;       // Postman: line_discount_raw
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
  approver_user_id: number;         // Adjusted to number if users use numeric IDs
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
  // Metadata for UI
  preparer_name: string;            // ชื่อผู้จัดทำ (Fixed)

  // Header fields
  pr_no: string;                    // Auto-generated
  pr_date: string;                  // วันที่ขอซื้อ (Postman: pr_date)
  need_by_date: string;             // วันที่ต้องการใช้ (Postman: need_by_date)
   requester_name: string;           // ชื่อผู้ขอ (Editable per user request)
   cost_center_id: MasterDataId;              // ศูนย์ต้นทุน
   project_id?: MasterDataId | null;          // โครงการ (Optional)
   requester_user_id: MasterDataId;           // ID ผู้ขอซื้อ
   purpose: string;                  // วัตถุประสงค์ (UI legacy, maps to payload)
   pr_base_currency_code: string;    // Postman: pr_base_currency_code
   pr_quote_currency_code?: string;   // Postman: pr_quote_currency_code
   is_multicurrency: boolean;        // UI Only
   pr_exchange_rate: number;         // Postman: pr_exchange_rate
   pr_exchange_rate_date?: string;   // Postman: pr_exchange_rate_date
   
   // Vendor Info
   preferred_vendor_id?: MasterDataId;       // ผู้ขายที่แนะนำ
   vendor_name?: string;             // ชื่อผู้ขาย (สำหรับแสดงผล)
 
   // New Fields (Info Bar & Remark)
   delivery_date?: string;
   credit_days?: number;
   payment_term_days?: number;
   vendor_quote_no?: string;
   shipping_method: string;
   remark?: string;                  // Singular
   pr_discount_raw?: string;         // Postman: pr_discount_raw
   pr_tax_code_id?: MasterDataId;             // ภาษี
   pr_tax_rate?: number;             // Added for Snapshotting Tax Rate
   branch_id?: MasterDataId;                  // สาขา
   warehouse_id?: MasterDataId;               // คลัง
  
  // Line items
  lines: PRLineFormData[];
  
  is_on_hold: boolean | string;     // พักเรื่อง ('Y' | 'N')
  cancelflag?: 'Y' | 'N';           // ยกเลิกเอกสาร ('Y' | 'N')
  status?: PRStatus;                // สถานะเอกสาร
  total_amount: number;
}

 /** ข้อมูลรายการสินค้าใน Form */
 export interface PRLineFormData {
   item_id: MasterDataId;
   item_code: string;
   item_name: string;
   description?: string;
   qty?: number;
   uom?: string;
   uom_id?: MasterDataId;
   est_unit_price?: number;
   est_amount?: number;
   needed_date?: string;
   preferred_vendor_id?: MasterDataId;
   remark?: string;
   discount?: number;
   line_discount_raw?: string;
   warehouse_id?: MasterDataId;
   location?: string;
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
    item_id: string | number;       // Postman: item_id
    item_code: string;
    item_name?: string;             // UI helper
    description: string;            // Postman: description
    qty: number;                    // Postman: qty
    uom: string;
    uom_id: string | number;        // Postman: uom_id
    est_unit_price: number;         // Postman: est_unit_price
    needed_date?: string;
    remark?: string;
    line_discount_raw?: string;     // Postman: line_discount_raw
    warehouse_id: string | number;  // Postman: warehouse_id
    location?: string;
    required_receipt_type?: string; // Postman: required_receipt_type
}

export interface CreatePRPayload {
    pr_date: string;                // Postman: pr_date
    remark?: string;                // Postman: remark
    cost_center_id: string | number; // Maps to Backend cost_center_id
    project_id?: string | number | null;
    requester_name: string;         // Postman: requester_name
    requester_user_id: string | number; // Postman: requester_user_id
    branch_id: string | number;     // Postman: branch_id
    warehouse_id: string | number;  // Postman: warehouse_id
    
    need_by_date: string;           // Postman: need_by_date
    items: CreatePRLineItem[];
    
    // Additional fields supported by UI
    delivery_date?: string;         // Postman: delivery_date
    credit_days?: number;           // Postman: credit_days
    payment_term_days?: number;     // Postman: payment_term_days
    vendor_quote_no?: string;       // Postman: vendor_quote_no
    shipping_method?: string;       // Postman: shipping_method
    preferred_vendor_id?: string | number;   // Postman: preferred_vendor_id
    vendor_name?: string;
    pr_tax_code_id: string | number;         // Postman: pr_tax_code_id
    pr_exchange_rate_date: string;  // Postman: pr_exchange_rate_date
    pr_base_currency_code: string;  // Postman: pr_base_currency_code
    pr_quote_currency_code: string; // Postman: pr_quote_currency_code
    pr_exchange_rate: number;       // Postman: pr_exchange_rate
    pr_discount_raw: string;        // Postman: pr_discount_raw
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
  q?: string;
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

export interface VendorSelection {
  vendor_id: MasterDataId;
  vendor_code: string;
  vendor_name: string;
  tax_id?: string;
  payment_term_days?: number;
}
