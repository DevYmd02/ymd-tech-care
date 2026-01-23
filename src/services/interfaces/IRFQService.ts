/**
 * @file IRFQService.ts
 * @description Interface for RFQ Service - defines standard methods for both Mock and Real implementations
 */

import type { RFQHeader, RFQListResponse, RFQCreateData, RFQFilterCriteria } from '../../types/rfq-types';

/**
 * IRFQService Interface
 * Defines the contract for RFQ service implementations (Mock & Real API)
 */
export interface IRFQService {
  /**
   * Get list of RFQs with optional filtering/pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Promise with RFQ list response
   */
  getList(params?: RFQFilterCriteria): Promise<RFQListResponse>;

  /**
   * Get RFQ by ID
   * @param id - RFQ ID
   * @returns Promise with RFQ header or null if not found
   */
  getById(id: string): Promise<RFQHeader | null>;

  /**
   * Create new RFQ
   * @param data - RFQ creation data
   * @returns Promise with success status and created RFQ data
   */
  create(data: RFQCreateData): Promise<{ success: boolean; data?: RFQHeader; message?: string }>;

  /**
   * Update existing RFQ
   * @param id - RFQ ID
   * @param data - Partial RFQ data to update
   * @returns Promise with success status
   */
  update(id: string, data: Partial<RFQCreateData>): Promise<{ success: boolean; message?: string }>;

  /**
   * Delete RFQ
   * @param id - RFQ ID
   * @returns Promise with boolean indicating success
   */
  delete(id: string): Promise<boolean>;

  /**
   * Send RFQ to vendors
   * @param rfqId - RFQ ID
   * @param vendorIds - Array of vendor IDs to send RFQ to
   * @returns Promise with success status
   */
  sendToVendors(rfqId: string, vendorIds: string[]): Promise<{ success: boolean; message?: string }>;
}
