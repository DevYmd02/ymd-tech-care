/**
 * @file IPOService.ts
 * @description Interface for Purchase Order (PO) Service
 */

import type { POListParams, POListResponse, POListItem, CreatePOPayload } from '../../types/po-types';

export interface IPOService {
  getList(params?: POListParams): Promise<POListResponse>;
  getById(id: string): Promise<POListItem | null>;
  create(data: CreatePOPayload): Promise<void>;
  // Add other methods here as needed, e.g., create, update, delete
}
