/**
 * @file IQCService.ts
 * @description Interface for QC Service - defines standard methods for both Mock and Real implementations
 */

import type { QCListItem } from '../../types/qc-types';

export interface QCListParams {
  qc_no?: string;
  pr_no?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
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
    qt_no: string;
    total_amount: number;
    payment_term_days: number;
    lead_time_days: number;
    valid_until: string;
  }>;
  remark?: string;
}

export interface IQCService {
  getList(params?: QCListParams): Promise<QCListResponse>;
  create(data: QCCreateData): Promise<{ success: boolean; qc_id?: string; message?: string }>;
}
