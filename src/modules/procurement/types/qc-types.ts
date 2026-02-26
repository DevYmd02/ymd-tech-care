/**
 * @file qc-types.ts
 * @description Type definitions for Quotation Comparison (QC) module
 * @tables qc_header
 */

// ====================================================================================
// QUOTATION COMPARISON (QC) - ตาราง qc_header
// ====================================================================================

/** QC Status - สถานะใบเปรียบเทียบราคา */
export type QCStatus = 'DRAFT' | 'WAITING_FOR_PO' | 'PO_CREATED';

/** Quotation Comparison Header - ใบเปรียบเทียบราคา */
export interface QCHeader {
    qc_id: string;                      // UUID
    qc_no: string;                      // QC-2024-xxxx
    pr_id: string;                      // FK -> pr_header
    pr_no?: string;                     // Display
    created_at: string;                 // Date
    status: QCStatus;
    
    // Aggregated Data (For List View)
    vendor_count: number;
    lowest_bidder_vendor_id?: string; // Add this field
    lowest_bidder_name?: string;
    lowest_bid_amount?: number;
    
    remark?: string;
}

/** QC List Item - Display in Table */
export type QCListItem = QCHeader;


// ====================================================================================
// SERVICE TYPES - REQUEST/RESPONSE
// ====================================================================================

export interface QCListParams {
  qc_no?: string;
  pr_no?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface QCListResponse {
  data: QCListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface QCCreateData {
  pr_no?: string;
  rfq_no?: string;
  qc_date: string;
  vendor_lines: Array<{
    vendor_code: string;
    vendor_name: string;
    vq_no: string;
    total_amount: number;
    payment_term_days: number;
    lead_time_days: number;
    valid_until: string;
  }>;
  remark?: string;
}