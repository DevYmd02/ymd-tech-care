/**
 * @file po-types.ts
 * @description Types for Purchase Order (PO) Module
 * @tables po_header, po_line
 */

// ====================================================================================
// ENUMS
// ====================================================================================

/** สถานะใบสั่งซื้อ (ตามรูป Dropdown + Schema) */
export type POStatus = 
    | 'DRAFT'       // แบบร่าง
    | 'APPROVED'    // อนุมัติแล้ว
    | 'ISSUED'      // ออกแล้ว (ส่งให้ Vendor / ออก PO)
    | 'CANCELLED'   // ยกเลิก
    | 'CLOSED';     // ปิดงาน (Optional: for internal use if needed, though dropdown showed only 4)

// ====================================================================================
// DATABASE MODELS (Prisma Schema Reference)
// ====================================================================================

/**
 * PO Header - ใบสั่งซื้อ
 * Table: po_header
 */
export interface POHeader {
    po_id: string;                  // uuid @id
    po_no: string;                  // varchar(30)
    po_date: string;                // date
    pr_id: string;                  // uuid
    pr_no?: string;                 // Display Only (Joined)
    vendor_id: string;              // uuid
    vendor_name?: string;           // Display Only (Joined)
    branch_id: string;              // uuid
    branch_name?: string;           // Display Only
    ship_to_warehouse_id?: string;  // uuid (Nullable)
    
    status: POStatus;               // varchar(20)
    
    currency_code: string;          // varchar(3)
    exchange_rate: number;          // numeric(18,6)
    payment_term_days: number;      // int
    
    subtotal: number;               // numeric(18,2)
    tax_amount: number;             // numeric(18,2)
    total_amount: number;           // numeric(18,2)
    
    remarks?: string;               // text
    created_by: string;             // uuid
    created_by_name?: string;       // Display Only
    created_at?: string;            // timestamp (Implying from base fields if needed)
    updated_at?: string;            // timestamp
    
    // Aggregates for List View
    item_count?: number;
}

/**
 * PO Line - รายการสินค้าในใบสั่งซื้อ
 * Table: po_line
 */
export interface POLine {
    po_line_id: string;             // uuid @id
    po_id: string;                  // uuid (FK)
    pr_line_id?: string;            // uuid (FK) - มาจาก PR Line ใด
    item_id?: string;               // uuid (FK)
    item_code?: string;             // Display
    item_name?: string;             // Display
    
    description?: string;           // text
    
    qty_ordered: number;            // numeric(18,3)
    qty_received: number;           // numeric(18,3)
    
    uom_id: string;                 // uuid
    uom_name?: string;              // Display
    
    unit_price: number;             // numeric(18,4)
    discount_amount: number;        // numeric(18,2)
    tax_code?: string;              // varchar(20)
    line_total: number;             // numeric(18,2)
    
    required_receipt_type: 'GOODS' | 'SERVICE'; // varchar(20)
}

// ====================================================================================
// API / UI TYPES
// ====================================================================================

/** PO List Item (Subset for Table Display) */
export type POListItem = POHeader;

/** PO Listing Parameters */
export interface POListParams {
    po_no?: string;
    pr_no?: string;
    vendor_name?: string;
    status?: POStatus | 'ALL';
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
}

/** PO Response with Pagination */
export interface POListResponse {
    data: POListItem[];
    total: number;
    page: number;
    limit: number;
}
export interface POLineItemInput {
    item_id: string; // or item_code if searching
    item_code: string;
    item_name: string;
    qty: number;
    unit_price: number;
    discount?: number;
    uom_name?: string;
    description?: string;
    // Auto-calculated fields for display/db
    line_total?: number;
}

// ====================================================================================
// CREATE PO PAYLOAD (BATCH PATTERN)
// ====================================================================================

export interface CreatePOLineItem {
    item_id: string; // or item_code
    qty: number;
    unit_price: number;
    discount?: number;
}

export interface CreatePOPayload {
    vendor_id: string;
    ref_pr_id?: string; // Link back to PR
    ref_qc_id?: string; // Link back to QC
    order_date: string; // or Date
    delivery_date?: string;
    payment_term?: string;
    items: CreatePOLineItem[]; // The Batch Array
    
    // Additional fields for UI compatibility if needed
    remarks?: string;
    subtotal?: number;
    tax_amount?: number;
    total_amount?: number;
}

export interface POFormData {
    vendor_id?: string;
    po_date?: string;
    delivery_date?: string;
    payment_term_days?: number;
    remarks?: string;
    items?: POLineItemInput[]; 
    tax_rate?: number;
}
