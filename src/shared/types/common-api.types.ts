/**
 * @file common-api.types.ts
 * @description Standardized API Response Interfaces
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}
