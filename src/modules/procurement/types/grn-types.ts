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
    grn_id: number;               // INTEGER
    grn_no: string;               // varchar(30)
    po_id: number;                // INTEGER
    po_no: string;                // display
    
    received_date: string;        // date
    warehouse_id: number;         // INTEGER
    warehouse_name: string;       // display
    
    received_by: number;          // INTEGER (uuid in db, mapped to number for FE id)
    received_by_name: string;     // display
    
    status: GRNStatus;
    remark?: string;
    
    // Financial/Tax
    curr_id?: string;             // uuid
    curr_type_cpde?: string;      // varchar(30)
    curr_type_id?: string;        // uuid
    
    // Project/Department
    job_id?: string;              // uuid
    emp_dept_id?: string;         // uuid
    
    // Aggregates
    item_count?: number;
    total_amount?: number;        // implied from schema context, useful for display
}

export interface GRNLine {
    grn_line_id: number;
    grn_id: number;
    item_code: string;
    item_name: string;
    
    ordered_qty: number;
    qty_received: number;         // Match DB name
    accepted_qty: number;
    rejected_qty: number;
    
    uom_id: string;               // Match DB name (uuid)
    uom_name: string;             // display
    
    lot_id?: string;              // Match DB name (uuid)
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
  totalPages: number;
}

export interface GRNSummaryCounts {
    DRAFT: number;
    POSTED: number;
    REVERSED: number;
    RETURNED: number;
}

export interface GRNLineItemInput {
    po_line_id?: number; // Added for linking
    item_id?: number;    // Added for linking
    item_code: string;
    item_name: string; // Captured for history
    qty_ordered?: number; // PO quantity for reference
    qty_received: number; // Match DB name
    accepted_qty: number;
    rejected_qty: number;
    uom_id?: string; // uuid
    uom_name: string; // Captured
    qc_status?: string; // QC status: PASS, HOLD, FAIL
    lot_id?: string; // Match DB name (uuid)
    // We might need unit_price/total for value tracking if GRN tracks value
    unit_price?: number; 
    line_total?: number;
    remark?: string;
}

// ====================================================================================
// CREATE GRN PAYLOAD (BATCH PATTERN)
// ====================================================================================

export interface CreateGRNLineItem {
    po_line_id: number; // Critical: Link to specific PO line
    item_id: number;
    qty_received: number; // Match DB name
    accepted_qty: number;
    rejected_qty: number;
    uom_id: string; // uuid
    lot_id?: string; // uuid
    qc_status?: string;
    remark?: string;
}

export interface CreateGRNPayload {
    po_id: number; // Link to Parent PO
    delivery_note_no?: string;
    received_date: string;
    warehouse_id: number;
    received_by: number;
    status: string;
    
    // Financial/Tax
    curr_id?: string;
    curr_type_id?: string;
    curr_type_cpde?: string;
    
    // Project/Department
    job_id?: string;
    emp_dept_id?: string;
    
    items: CreateGRNLineItem[]; // The Batch Array
    remark?: string;
}
