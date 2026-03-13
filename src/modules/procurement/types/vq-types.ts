/**
 * @file vq-types.ts
 * @description Type definitions for Vendor Quotation (VQ) module
 * @tables quotation_header, quotation_line
 */

// ====================================================================================
// ENUMS
// ====================================================================================

/** Quotation Status - สถานะใบเสนอราคาจากผู้ขาย (Linear Flow: lifecycle ends at RECORDED) */
export type QuotationStatus = 
    | 'PENDING'   // รอผู้ขายตอบกลับ (No VQ ID)
    | 'DRAFT'     // แบบร่าง (No VQ ID — internal draft)
    | 'RECORDED'  // บันทึกแล้ว (Procurement keyed in data — VQ ID Generated)
    | 'DECLINED'  // ผู้ขายปฏิเสธ
    | 'EXPIRED'   // หมดอายุ
    | 'CANCELLED'; // ยกเลิก

// ====================================================================================
// QUOTATION HEADER - ตาราง quotation_header
// ====================================================================================

/** Quotation Header - ใบเสนอราคาจากผู้ขาย (Aligned with backend payload) */
export interface QuotationHeader {
    vq_header_id: number;               // INTEGER/pk (backend: vq_header_id)
    vq_no: string;                      // VARCHAR(50) (backend: vq_no)
    quotation_no?: string;              // Legacy/Fallback
    quotation_date: string;             // DATE - วันที่เสนอราคา
    quotation_expiry_date?: string;     // DATE (backend: quotation_expiry_date)
    
    vendor_id: number | null;           // Relation ID
    rfq_id: number | null;              // Relation ID
    pr_id: number | null;               // Relation ID
    rfq_vendor_id?: number | null;      // Relation ID

    // Nested Objects (Anticipating JOINs)
    vendor?: { vendor_id: number; vendor_name: string; vendor_code?: string; vendor_name_th?: string; name_th?: string };
    rfq?: { rfq_id: number; rfq_no: string };
    pr?: { pr_id: number; pr_no: string };
    
    payment_term_days: number | null;   // int
    lead_time_days: number | null;      // int
    
    base_currency_code: string;         // VARCHAR(3) e.g. THB
    quote_currency_code?: string;       // VARCHAR(3) e.g. USD
    exchange_rate?: string | number;    // NUMERIC
    exchange_rate_date?: string;        // DATE
    
    base_total_amount: string | number; // DECIMAL (Backend sends string)
    quote_total_amount?: string | number; // DECIMAL
    base_tax_amount?: string | number;
    base_discount_amount?: string | number;
    
    status: QuotationStatus;            // VARCHAR(50)
    is_awarded?: boolean;
    tax_code_id?: number;
    tax_rate?: string | number;
    
    remarks?: string;
    created_at?: string;
    updated_at?: string;
    created_by?: number;
    updated_by?: number | null;

    // UI Layout Helpers / Legacy Fallbacks (Backward Compatibility)
    // @deprecated Use vq_header_id
    quotation_id?: number;
    // @deprecated Use base_total_amount
    total_amount?: number | string;
    // @deprecated Use base_currency_code
    currency?: string;
    // @deprecated Use quotation_expiry_date
    valid_until?: string;
    // @deprecated Use base_currency_code !== 'THB'
    isMulticurrency?: boolean;
    // @deprecated Use quote_currency_code
    target_currency?: string;
    // @deprecated Use remarks
    remark?: string;

    // Additional Form Fields
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    discount_expression?: string;
    qc_id?: number;

    // UI Layout Helpers / Legacy Fallbacks
    vendor_name?: string;
    vendor_code?: string;
    rfq_no?: string;                    
    pr_no?: string;                     
    vq_lines?: QuotationLine[];  
    /** Fallback for internal mapping or legacy endpoints */
    lines?: QuotationLine[];          
}

// ====================================================================================
// QUOTATION LINE - ตาราง quotation_line
// ====================================================================================

/** Quotation Line - รายการสินค้าในใบเสนอราคา */
export interface QuotationLine {
    quotation_line_id?: number;         // INTEGER
    quotation_id?: number;              // INTEGER
    pr_line_id?: number;                // INTEGER
    rfq_line_id?: number;               // INTEGER (Reference to specific RFQ line)
    item_id?: number;                   // INTEGER
    item_code: string;                  // Required
    item_name: string;                  // Required
    qty: number;                        // Required
    uom_id?: number;                    // INTEGER
    uom_name?: string;                  // Display
    unit_price?: number;                // NUMERIC(18,4)
    discount_expression?: string;
    discount_amount?: number;           // NUMERIC(18,2)
    tax_code?: string;                  // VARCHAR(20)
    tax_code_id?: number;               // INTEGER
    net_amount: number;                 // Required
    no_quote?: boolean;
    reference_price?: number;           // Reference budget from RFQ/PR
    remark?: string;
    warehouse?: string;
    location?: string;
    uom?: string;                       // Utility field for RFQ-to-VQ mapping
    status?: string;                    // Utility field for mixed mapping
    line_no?: number;                   // INTEGER (Backend mandatory)
    // Nested Objects (Hydration)
    item?: {
      item_id: number;
      item_code: string;
      item_name: string;
      description?: string;
    };
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
  status?: QuotationStatus | 'ALL';
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
  totalPages: number;
}

export type VQCreateData = Partial<VQListItem> & { vq_lines?: Partial<QuotationLine>[] };

// ====================================================================================
// PENDING QUEUES (Waiting for RFQ / Waiting for VQ)
// ====================================================================================

/** 
 * Item representing a vendor waiting for an RFQ or a VQ response. 
 * Data is pre-joined from the backend (no micro-components needed).
 */
export interface VQPendingQueueItem {
    rfq_vendor_id: number;
    pr_id: number;
    pr_no: string;
    rfq_id: number;
    rfq_no: string;
    vendor_id: number;
    vendor_code: string;
    vendor_name: string;
    status: string;
    created_at: string;
    vq_no?: string;                     // Added for filtering logic
    vq_header_id?: number;              // Added for navigation/linkage
}

export interface VQPendingQueueResponse {
    data: VQPendingQueueItem[];
    page: number;
    pageSize: number;
    total: number;
}
