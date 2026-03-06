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
    reject_reason?: string;         // text
    created_by: string;             // uuid
    created_by_name?: string;       // Display Only
    created_at?: string;            // timestamp (Implying from base fields if needed)
    updated_at?: string;            // timestamp
    transactions?: import('@/modules/procurement/schemas/po-schemas').POTransaction[]; // History log
    
    // QC Traceability (Source document)
    qc_id?: string;                 // uuid — FK -> qc_header
    qc_no?: string;                 // Display Only

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
    item_id: string; // or item_code if searching
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
    item_id?: string; // Optional — new lines may not have a DB UUID yet
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

export interface CreatePOPayload {
    // Source document linkage
    qc_id?:  string;
    qc_no?:  string;
    pr_id?:  string;
    pr_no?:  string;

    vendor_id:    string;
    vendor_name?: string;

    order_date:         string;
    delivery_date?:     string;
    payment_term_days?: number;

    currency_code?: string;
    exchange_rate?: number;
    total_amount?:  number;

    items: CreatePOLineItem[];

    remarks?: string;
}

export interface POFormData {
    vendor_id?: string;
    po_no?: string; // Should be added if not present
    po_date?: string;
    delivery_date?: string;
    payment_term_days?: number;
    remarks?: string;
    items?: POLineItemInput[]; 
    tax_rate?: number;
    is_vat_included?: boolean; // Add if missing from interface but present in form
    
    // Multicurrency
    isMulticurrency?: boolean;
    currency?: string;
    exchange_rate?: number;
}
