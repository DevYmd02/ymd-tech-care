/**
 * @file po-types.ts
 * @description Types for Purchase Order (PO) Module
 * @tables po_header, po_line
 */

// ====================================================================================
// ENUMS
// ====================================================================================

// Re-export POStatus from Zod schema (single source of truth)
export type { POStatus } from '@/modules/procurement/schemas/po-schemas';
import type { POStatus } from '@/modules/procurement/schemas/po-schemas';

// ====================================================================================
// DATABASE MODELS (Prisma Schema Reference)
// ====================================================================================

/**
 * PO Header - ใบสั่งซื้อ
 * Table: po_header
 */
export interface POHeader {
    po_id: number;                  // INTEGER @id
    po_no: string;                  // varchar(30)
    po_date: string;                // date
    pr_id: number;                  // INTEGER
    pr_no?: string;                 // Display Only (Joined)
    vendor_id: number;              // INTEGER
    vendor_name?: string;           // Display Only (Joined)
    branch_id: number;              // INTEGER
    branch_name?: string;           // Display Only
    ship_to_warehouse_id?: number;  // INTEGER (Nullable)
    
    status: POStatus;               // varchar(20)
    
    currency_code: string;          // varchar(3)
    exchange_rate: number;          // numeric(18,6)
    payment_term_days: number;      // int
    
    subtotal: number;               // numeric(18,2)
    tax_amount: number;             // numeric(18,2)
    total_amount: number;           // numeric(18,2)
    
    remarks?: string;               // text
    reject_reason?: string;         // text
    created_by: number;             // INTEGER
    created_by_name?: string;       // Display Only
    created_at?: string;            // timestamp (Implying from base fields if needed)
    updated_at?: string;            // timestamp
    transactions?: import('@/modules/procurement/schemas/po-schemas').POTransaction[]; // History log
    
    // QC Traceability (Source document)
    qc_id?: number;                 // INTEGER — FK -> qc_header
    qc_no?: string;                 // Display Only

    // Aggregates for List View
    item_count?: number;
}

/**
 * PO Line - รายการสินค้าในใบสั่งซื้อ
 * Table: po_line
 */
export interface POLine {
    po_line_id?: number;            // INTEGER @id
    po_id?: number;                 // INTEGER (FK)
    line_no: number;                // New field
    pr_line_id?: number | null;     // INTEGER (FK)
    item_id?: number;               // INTEGER (FK)
    item_code?: string;             // Display
    item_name?: string;             // Display
    
    status: string;                 // e.g., 'OPEN'
    description?: string;           // text
    
    qty: number;                    // Aligned with backend 'qty'
    qty_ordered?: number;           // Legacy UI field
    qty_received?: number;          // numeric(18,3)
    
    uom_id: number;                 // INTEGER
    uom_name?: string;              // Display
    
    unit_price: number;             // numeric(18,4)
    discount_expression: string;    // New field
    discount_amount?: number;       // numeric(18,2)
    tax_code_id?: number;           // INTEGER
    line_total?: number;            // numeric(18,2)
    
    required_receipt_type: 'FULL' | 'PARTIAL'; // varchar(20)
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
    sort?: string;
}

/** PO Response with Pagination */
export interface POListResponse {
    data: POListItem[];
    total: number;
    page: number;
    limit: number;
  totalPages: number;
}
export interface POLineItemInput {
    item_id: number; // or item_code if searching
    item_code?: string;
    item_name?: string;
    description?: string;
    qty_ordered: number;
    uom_id: string;
    unit_price: number;
    discount_amount?: number;
    tax_code?: string;
    line_total?: number;
    receipt_type: 'GOODS' | 'SERVICE';
}

// ====================================================================================
// CREATE PO PAYLOAD (BATCH PATTERN)
// ====================================================================================

export interface CreatePOLineItem {
    item_id?: number; // Optional — new lines may not have a DB UUID yet
    item_code?: string;
    item_name?: string;
    description?: string;
    qty_ordered: number;
    uom_id: number;
    unit_price: number;
    discount_amount?: number;
    tax_code_id?: number;
    line_total?: number;
    receipt_type: 'GOODS' | 'SERVICE';
}

export interface CreatePOPayload {
    rfq_id: number | null;
    vendor_id: number;
    branch_id: number;
    warehouse_id: number;
    base_currency_code: string;
    quote_currency_code: string;
    exchange_rate: number;
    exchange_rate_date: string;
    tax_code_id: number;
    discount_expression: string;
    status: string;
    created_at: string;
    created_by: number;
    winning_vq_id: number | null;
    po_lines: POLine[];

    // Legacy/Fallback for UI
    qc_id?:  number;
    qc_no?:  string;
    pr_id?:  number;
    pr_no?:  string;
    vendor_name?: string;
    order_date?:        string;
    delivery_date?:     string;
    payment_term_days?: number;
    currency_code?: string;
    total_amount?:  number;
    items?: CreatePOLineItem[]; 
    remarks?: string;
}

export interface POFormData {
    po_no?: string;
    rfq_id?: number;
    winning_vq_id?: number;
    qc_id?: number;
    qc_no?: string;
    pr_id?: number;
    pr_no?: string;
    po_date: string;
    vendor_id: number;
    vendor_name?: string;
    branch_id: number;
    ship_to_warehouse_id: number;
    tax_code_id: number;
    is_multicurrency: boolean;
    currency_code: string;
    base_currency_code: string;
    quote_currency_code: string;
    target_currency?: string;
    exchange_rate_date?: string;
    exchange_rate: number;
    payment_term_days: number;
    delivery_date?: string;
    remarks?: string;
    discount_expression: string;
    lines: POLine[];
}
