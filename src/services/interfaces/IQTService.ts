/**
 * @file IQTService.ts
 * @description Interface for QT Service - defines standard methods for both Mock and Real implementations
 */

import type { QTListItem, QuotationLine } from '../../types/qt-types';

export interface QTListResponse {
  data: QTListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface QTListParams {
  quotation_no?: string;
  vendor_name?: string;
  rfq_no?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export type QTCreateData = Partial<QTListItem> & { lines?: Partial<QuotationLine>[] };

export interface IQTService {
  getList(params?: QTListParams): Promise<QTListResponse>;
  create(data: QTCreateData): Promise<void>;
}
