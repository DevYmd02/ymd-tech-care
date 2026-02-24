/**
 * @file qt-types.ts
 * @description Type definitions for Quotation (QT) module
 * @tables quotation_header, quotation_line
 */

// ====================================================================================
// ENUMS
// ====================================================================================

/** Quotation Status - สถานะใบเสนอราคาจากผู้ขาย */
export type QuotationStatus = 
    | 'DRAFT' 
    | 'SUBMITTED' // legacy eq for received
    | 'RECEIVED'  // target
    | 'IN_PROGRESS' 
    | 'CLOSED' 
    | 'SELECTED'  // legacy eq for compared
    | 'COMPARED'  // target
    | 'REJECTED';

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
    currency_code: string;              // VARCHAR(3) - e.g. THB, USD
    exchange_rate: number;              // NUMERIC(18,6)
    total_amount: number;               // DECIMAL(18,2)
    status: QuotationStatus;            // VARCHAR(50)
    
    // UI Extended Fields
    vendor_name?: string;               // Display
    vendor_code?: string;               // Display
    rfq_no?: string;                    // Display
    pr_no?: string;                     // Display - Reference PR
}

// ====================================================================================
// QUOTATION LINE - ตาราง quotation_line
// ====================================================================================

/** Quotation Line - รายการสินค้าในใบเสนอราคา */
export interface QuotationLine {
    quotation_line_id: string;          // UUID (vq_line_id)
    quotation_id: string;               // FK (vq_id)
    pr_line_id?: string;                // FK
    item_id?: string;                   // FK
    item_code?: string;                 // Display
    item_name?: string;                 // Display
    qty: number;                        // NUMERIC(18,3)
    uom_id: string;                     // UUID
    uom_name?: string;                  // Display
    unit_price: number;                 // NUMERIC(18,4)
    discount_amount: number;            // NUMERIC(18,2)
    tax_code?: string;                  // VARCHAR(20)
    net_amount: number;                 // NUMERIC(18,2)
}

// ====================================================================================
// UI DISPLAY TYPES
// ====================================================================================

/** QT List Item - สำหรับแสดงในตาราง */
export type QTListItem = QuotationHeader;

/** Alias for QuotationStatus (for backward compatibility) */
export type QTStatus = QuotationStatus;


// ====================================================================================
// SERVICE TYPES - REQUEST/RESPONSE
// ====================================================================================

export interface QTListParams {
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

export interface QTListResponse {
  data: QTListItem[];
  total: number;
  page: number;
  limit: number;
}

export type QTCreateData = Partial<QTListItem> & { lines?: Partial<QuotationLine>[] };
