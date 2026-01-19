/**
 * @file rfq-types.ts
 * @description Types สำหรับ RFQ (Request for Quotation) Module - ตาม Database Schema
 * @usage import { RFQHeader, RFQLine, RFQStatus } from '@/types/rfq-types';
 */

// ====================================================================================
// RFQ STATUS - ตาม rfq_header.status
// ====================================================================================

export type RFQStatus = 
  | 'DRAFT'        // ร่าง
  | 'SENT'         // ส่งแล้ว
  | 'IN_PROGRESS'  // กำลังดำเนินการ (รอใบเสนอราคา)
  | 'CLOSED'       // ปิดแล้ว
  | 'CANCELLED';   // ยกเลิก

// ====================================================================================
// RFQ HEADER - ตาม rfq_header table
// ====================================================================================

export interface RFQHeader {
  rfq_id: string;                 // UUID - Primary Key
  rfq_no: string;                 // VARCHAR(50) - เลขที่ RFQ เช่น RFQ-202601-0001
  pr_id: string;                  // UUID FK → pr_header.pr_id
  pr_no?: string;                 // จาก JOIN - เลขที่ PR อ้างอิง
  branch_id: string;              // UUID FK → org_branch.branch_id
  branch_name?: string;           // จาก JOIN - ชื่อสาขา
  rfq_date: string;               // DATE - วันที่ออก RFQ
  quote_due_date: string;         // DATE - วันครบกำหนดส่งใบเสนอราคา
  terms_and_conditions?: string;  // TEXT - เงื่อนไขและข้อกำหนด
  status: RFQStatus;
  created_by_user_id: string;     // UUID FK → users.user_id
  created_by_name?: string;       // จาก JOIN - ชื่อผู้สร้าง
  created_at: string;             // TIMESTAMP
  updated_at: string;             // TIMESTAMP

  // Relations (populated by API)
  lines?: RFQLine[];
  vendors?: RFQVendor[];
  
  // Computed fields (for display)
  vendor_count?: number;          // จำนวนผู้ขายทั้งหมด
  vendor_responded?: number;      // จำนวนผู้ขายที่ตอบกลับ
}

// ====================================================================================
// RFQ LINE - ตาม rfq_line table (คัดลอกจาก pr_line)
// ====================================================================================

export interface RFQLine {
  rfq_line_id: string;            // UUID - Primary Key
  rfq_id: string;                 // UUID FK → rfq_header.rfq_id
  pr_line_id?: string;            // UUID FK → pr_line (ถ้ามี)
  line_no: number;                // INTEGER - ลำดับรายการ
  item_id: string;                // UUID FK → item
  item_code: string;              // VARCHAR(50)
  item_name: string;              // VARCHAR(500)
  item_description?: string;      // TEXT
  quantity: number;               // DECIMAL(18,4)
  uom: string;                    // VARCHAR(50) - หน่วยนับ
  remark?: string;                // TEXT - หมายเหตุ
}

// ====================================================================================
// RFQ VENDOR - ตาม rfq_vendor table
// ====================================================================================

export type RFQVendorStatus = 
  | 'PENDING'     // รอส่ง
  | 'SENT'        // ส่งแล้ว
  | 'RESPONDED'   // ตอบกลับแล้ว
  | 'NO_RESPONSE' // ไม่ตอบกลับ
  | 'DECLINED';   // ปฏิเสธ

export interface RFQVendor {
  rfq_vendor_id: string;          // UUID - Primary Key
  rfq_id: string;                 // UUID FK → rfq_header.rfq_id
  vendor_id: string;              // UUID FK → vendor_master.vendor_id
  vendor_code?: string;           // จาก JOIN
  vendor_name?: string;           // จาก JOIN
  sent_date?: string;             // TIMESTAMP - วันที่ส่ง
  response_date?: string;         // TIMESTAMP - วันที่ตอบกลับ
  status: RFQVendorStatus;
  quotation_id?: string;          // UUID FK → quotation_header (ถ้าตอบกลับ)
}

// ====================================================================================
// RFQ FORM DATA - สำหรับ Form สร้าง/แก้ไข RFQ
// ====================================================================================

export interface RFQFormData {
  pr_id: string;                  // PR ที่เลือก (required)
  quote_due_date: string;         // วันครบกำหนดส่งใบเสนอราคา
  terms_and_conditions?: string;  // เงื่อนไข
  vendor_ids: string[];           // รายการ vendor ที่เลือก
}

// ====================================================================================
// API RESPONSE TYPES
// ====================================================================================

export interface RFQListResponse {
  data: RFQHeader[];
  total: number;
  page: number;
  limit: number;
}

export interface RFQDetailResponse {
  data: RFQHeader;
}
