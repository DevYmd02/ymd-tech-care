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

export interface IQCService {
  getList(params?: QCListParams): Promise<QCListResponse>;
}
