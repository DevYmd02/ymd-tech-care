/**
 * @file qc-types.ts
 * @description Type definitions for Quotation Comparison (QC) module
 * @tables qc_header
 */

// ====================================================================================
// QUOTATION COMPARISON (QC) - ตาราง qc_header
// ====================================================================================

/** QC Status - สถานะใบเปรียบเทียบราคา */
export type QCStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

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
    lowest_bidder_name?: string;
    lowest_bid_amount?: number;
    
    remark?: string;
}

/** QC List Item - Display in Table */
export type QCListItem = QCHeader;
