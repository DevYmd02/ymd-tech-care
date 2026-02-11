/**
 * @file api-response.types.ts
 * @description Standardized API Response Interfaces for write operations
 */

export interface SuccessResponse {
  success: boolean;
  message?: string;
  id?: string | number;
}

export interface PaginatedListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
