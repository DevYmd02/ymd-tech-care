/**
 * @file api.types.ts
 * @description Standardized API Response Interfaces for the entire project.
 * This file consolidates types from multiple fragmented files to ensure consistency.
 */

// 1. Standard Success Response (for Create/Update/Delete)
export interface SuccessResponse {
  success: boolean;
  message?: string;
  id?: string | number;
}

// 2. Generic API Response (for Single Objects)
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}


// 3. Standard List Response (using 'items')
// Commonly used in Procurement modules
export interface ListResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

// 4. Paginated Response (Alias for ListResponse, compatible with legacy code)
export interface PaginatedListResponse<T> extends ListResponse<T> {
  page: number;
  limit: number;
}

// 5. Data-wrapped List Response (using 'data')
// Commonly used in Master Data modules
export interface DataListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// 6. Generic List Params (for Queries)
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string | 'ALL';
  [key: string]: unknown;
}
