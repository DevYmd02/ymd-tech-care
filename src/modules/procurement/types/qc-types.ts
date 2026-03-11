/**
 * @file qc-types.ts
 * @description Type definitions for Quotation Comparison (QC) module
 * @tables qc_header
 */

// ====================================================================================
// QUOTATION COMPARISON (QC) - ตาราง qc_header
// ====================================================================================

// Re-export canonical types from Zod schema (single source of truth)
export type { QCStatus, QCListItem } from '@/modules/procurement/schemas/qc-schemas';
import type { QCStatus, QCListItem } from '@/modules/procurement/schemas/qc-schemas';

export const QC_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'แบบร่าง' },
  { value: 'COMPLETED', label: 'ยืนยันผลแล้ว' },
  { value: 'CANCELLED', label: 'ยกเลิก' },
] as const;

/** Quotation Comparison Header - ใบเปรียบเทียบราคา */
export interface QCHeader {
    qc_id: number;                      // INTEGER
    qc_no: string;                      // QC-2024-xxxx
    pr_id: number;                      // FK -> pr_header
    pr_no?: string;                     // Display
    rfq_no?: string;                    // Added for traceability
    created_at: string;                 // Date
    status: QCStatus;
    
    // Aggregated Data (For List View)
    vendor_count: number;
    lowest_bidder_name?: string;
    lowest_price?: number;              // Canonical field — matches qc-schemas.ts
    
    remark?: string;
}


// ====================================================================================
// SERVICE TYPES - REQUEST/RESPONSE
// ====================================================================================

export interface QCListParams {
  qc_no?: string;
  pr_no?: string;
  rfq_no?: string;
  vendor_name?: string;
  status?: QCStatus | 'ALL';
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
  totalPages: number;
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