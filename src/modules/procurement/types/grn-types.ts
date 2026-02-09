/**
 * @file grn-types.ts
 * @description Types for Goods Receipt Note (GRN) Module
 */

// ====================================================================================
// ENUMS
// ====================================================================================

/** สถานะใบรับสินค้า */
export type GRNStatus = 
    | 'DRAFT'       // ร่าง
    | 'POSTED'      // บันทึกแล้ว
    | 'REVERSED'    // ย้อนกลับแล้ว
    | 'RETURNED';   // มีการคืน

// ====================================================================================
// MODELS
// ====================================================================================

export interface GRNHeader {
    grn_id: string;               // uuid
    grn_no: string;               // varchar(30)
    po_id: string;                // uuid
    po_no: string;                // display
    
    received_date: string;        // date
    warehouse_id: string;         // uuid
    warehouse_name: string;       // display
    
    received_by: string;          // uuid
    received_by_name: string;     // display
    
    status: GRNStatus;
    remark?: string;
    
    // Aggregates
    item_count?: number;
    total_amount?: number;        // implied from schema context, useful for display
}

export interface GRNLine {
    grn_line_id: string;
    grn_id: string;
    item_code: string;
    item_name: string;
    
    ordered_qty: number;
    receiving_qty: number;
    accepted_qty: number;
    rejected_qty: number;
    
    uom: string;
    
    batch_no?: string;
    serial_no?: string;
    expiry_date?: string;
}

// ====================================================================================
// API TYPES
// ====================================================================================

export type GRNListItem = GRNHeader;

export interface GRNListParams {
    grn_no?: string;
    po_no?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
    // status filter might be needed
    status?: GRNStatus | 'ALL';
    sort?: string;
}

export interface GRNListResponse {
    data: GRNListItem[];
    total: number;
    page: number;
    limit: number;
}

export interface GRNSummaryCounts {
    DRAFT: number;
    POSTED: number;
    REVERSED: number;
    RETURNED: number;
}

export interface GRNLineItemInput {
    po_line_id?: string; // Added for linking
    item_id?: string;    // Added for linking
    item_code: string;
    item_name: string; // Captured for history
    qty_ordered?: number; // PO quantity for reference
    receiving_qty: number;
    accepted_qty: number;
    rejected_qty: number;
    uom_name: string; // Captured
    qc_status?: string; // QC status: PASS, FAIL, PENDING
    // We might need unit_price/total for value tracking if GRN tracks value
    unit_price?: number; 
    line_total?: number;
    remark?: string;
}

// ====================================================================================
// CREATE GRN PAYLOAD (BATCH PATTERN)
// ====================================================================================

export interface CreateGRNLineItem {
    po_line_id: string; // Critical: Link to specific PO line
    item_id: string;
    receiving_qty: number;
    accepted_qty: number;
    rejected_qty: number;
    remark?: string;
}

export interface CreateGRNPayload {
    po_id: string; // Link to Parent PO
    delivery_note_no?: string;
    received_date: string;
    warehouse_id: string;
    items: CreateGRNLineItem[]; // The Batch Array
    remark?: string;
}
