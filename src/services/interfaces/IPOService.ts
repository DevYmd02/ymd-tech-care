/**
 * @file IPOService.ts
 * @description Interface for Purchase Order (PO) Service
 */

import type { POListParams, POListResponse } from '../../types/po-types';

export interface IPOService {
  getList(params?: POListParams): Promise<POListResponse>;
  // Add other methods here as needed, e.g., getById, create, update, delete
}
