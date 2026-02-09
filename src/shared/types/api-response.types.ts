/**
 * @file api-response.types.ts
 * @description Standardized API Response Interfaces for write operations
 */

export interface SuccessResponse {
  success: boolean;
  message?: string;
  id?: string | number;
}
