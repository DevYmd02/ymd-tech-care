/**
 * @file vq-types.ts
 * @description Type definitions for Vendor Quotation (VQ) module
 * @tables quotation_header, quotation_line
 */

// ====================================================================================
// ENUMS
// ====================================================================================

/** Quotation Status - สถานะใบเสนอราคาจากผู้ขาย */
export type QuotationStatus = 
    | 'PENDING'   // รอผู้ขายตอบกลับ (No VQ ID)
    | 'DRAFT'     // แบบร่าง (No VQ ID — internal draft)
    | 'RECEIVED'  // ได้รับแล้ว (Vendor replied, not keyed yet — No VQ ID)
    | 'RECORDED'  // บันทึกแล้ว (Procurement keyed in data — VQ ID Generated)
    | 'DECLINED'  // ผู้ขายปฏิเสธ
    | 'EXPIRED';  // หมดอายุ

// ====================================================================================
// QUOTATION HEADER - ตาราง quotation_header
// ====================================================================================

/** Quotation Header - ใบเสนอราคาจากผู้ขาย */
export interface QuotationHeader {
    quotation_id: string;               // UUID - Primary Key (vq_id)
    qc_id: string;                      // UUID - FK -> qc_header
    vendor_id: string;                  // UUID - FK -> vendor.vendor_id
    quotation_no: string;               // VARCHAR(50) - เลขที่ใบเสนอราคา
    quotation_date: string;             // DATE - วันที่เสนอราคา (quote_date)
    valid_until: string | null;         // DATE - ราคามีผลถึงวันที่
    payment_term_days: number | null;   // INTEGER
    lead_time_days: number | null;      // INTEGER - ระยะส่งของ (days)
    currency: string;                   // VARCHAR(3) - e.g. THB, USD
    isMulticurrency?: boolean;
    exchange_rate_date?: string;
    target_currency?: string;
    exchange_rate?: number;              // NUMERIC(18,6)
    total_amount: number;               // DECIMAL(18,2)
    status: QuotationStatus;            // VARCHAR(50)
    remarks?: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    discount_raw?: string;
    tax_code_id?: string;
    
    // UI Extended Fields
    vendor_name?: string;               // Display
    vendor_code?: string;               // Display
    rfq_id?: string;                    // UUID - FK -> rfq_header
    rfq_no?: string;                    // Display
    pr_no?: string;                     // Display - Reference PR
    lines?: QuotationLine[];            // Detail items
}

// ====================================================================================
// QUOTATION LINE - ตาราง quotation_line
// ====================================================================================

/** Quotation Line - รายการสินค้าในใบเสนอราคา */
export interface QuotationLine {
    quotation_line_id?: string;         // UUID (Primary Key)
    quotation_id?: string;              // UUID (Foreign Key)
    pr_line_id?: string;                // FK
    item_id?: string;                   // FK
    item_code: string;                  // Required
    item_name: string;                  // Required
    qty: number;                        // Required
    uom_id?: string;                    // UUID
    uom_name?: string;                  // Display
    unit_price?: number;                // NUMERIC(18,4)
    discount_amount?: number;           // NUMERIC(18,2)
    tax_code?: string;                  // VARCHAR(20)
    net_amount: number;                 // Required
    no_quote?: boolean;
    remark?: string;
    warehouse?: string;
    location?: string;
}

// ====================================================================================
// UI DISPLAY TYPES
// ====================================================================================

/** VQ List Item - สำหรับแสดงในตาราง */
export type VQListItem = QuotationHeader;

/** Alias for QuotationStatus (for backward compatibility) */
export type VQStatus = QuotationStatus;


// ====================================================================================
// SERVICE TYPES - REQUEST/RESPONSE
// ====================================================================================

export interface VQListParams {
  quotation_no?: string;
  vendor_name?: string;
  rfq_no?: string;
  pr_no?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface VQListResponse {
  data: VQListItem[];
  total: number;
  page: number;
  limit: number;
}

export type VQCreateData = Partial<VQListItem> & { lines?: Partial<QuotationLine>[] };
