import api from '@/core/api/api';
import type { RFQHeader, RFQListResponse, RFQFilterCriteria, RFQDetailResponse, SendRFQToVendorPayload } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';
import { extractErrorMessage } from '@/core/api/api';
import { extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

const ENDPOINTS = {
  list: '/rfq',
  detail: (id: number) => `/rfq/${id}`,
  create: '/rfq',
  addVendors: (id: number) => `/rfq/${id}/vendors`,
  sendToVendor: (rfqVendorId: number) => `/rfq/${rfqVendorId}/send-to-vendor`,
};

// ═══════════════════════════════════════════════════════════════════════════════
// Backend DTO Interfaces — Only fields the NestJS backend accepts
// NestJS uses whitelist:true + forbidNonWhitelisted:true
//
// 🔒 FORENSIC FIX v3 (2026-03-06): THE DOUBLE REQUESTER STRIKE
//   Backend DTO requires BOTH fields simultaneously:
//     - requested_by_user_id: number (employee ID)
//     - requested_by: string (employee name)
//   When we sent only one, the backend threw 400 demanding the other.
//
// RULES:
//   1. vendor_ids MUST NOT EXIST in the creation payload
//   2. requested_by_user_id MUST BE A NUMBER (employee ID)
//   3. requested_by MUST BE A STRING (employee name) — NOT empty
//   4. Vendors are associated via a SEPARATE endpoint (Two-Step Transaction)
// ═══════════════════════════════════════════════════════════════════════════════

/** Line item DTO accepted by the backend
 *  STRICT: Only fields the NestJS CreateRfqLineDto allows.
 *  Forbidden (will cause 400): item_code, item_name, uom, est_unit_price
 */
export interface RFQLineDTO {
  line_no: number;
  description: string;
  qty: number;
  uom_id: number;
  item_id?: number;
  pr_line_id?: number;
  required_receipt_type?: string;
  target_delivery_date?: string;
  note_to_vendor?: string;
}

/** Create RFQ DTO accepted by the backend
 *  STRICT: Matches NestJS backend with whitelist:true + forbidNonWhitelisted:true
 *
 *  🚫 FORBIDDEN (will cause 400):
 *    vendor_ids, rfqVendorIds, isMulticurrency,
 *    rfq_no, pr_no, pr_tax_code_id, pr_tax_rate, vendors,
 *    purpose, project_id (confirmed via backend error 2026-03-10)
 *
 *  🎯 THE DOUBLE REQUESTER STRIKE — Backend requires BOTH simultaneously:
 *    ✅ requested_by_user_id: number (employee ID, NOT empty)
 *    ✅ requested_by: string (employee name, NOT empty)
 *  ✅ vendor_ids: REMOVED — use addVendorsToRFQ() after creation
 */
export interface RFQCreateDTO {
  rfq_date: string;
  requested_by_user_id: number;      // 🎯 Employee ID (NUMBER, non-empty)
  requested_by: string;              // 🎯 Employee Name (STRING, non-empty)
  status: string;
  quotation_due_date: string;
  branch_id: number;
  rfq_base_currency_code: string;
  rfq_quote_currency_code: string;
  rfq_exchange_rate: number;
  rfq_exchange_rate_date: string;
  remarks: string;
  // 🚫 vendor_ids: REMOVED — backend rejects this property entirely
  rfqVendors?: { vendor_id: number }[]; // newly supported direct binding
  rfqLines: RFQLineDTO[];
  pr_id?: number;
  // ❌ project_id — backend rejects
  // ❌ purpose    — backend rejects
  receive_location?: string;
  payment_term_hint?: string;
  incoterm?: string;
  cost_center_id?: number;
}

/**
 * 🧹 Helper to clean params before API call
 * Removes undefined, null, and empty strings
 */
export const cleanParams = (params: object = {}): Record<string, string | number | boolean> => {
  const entries = Object.entries(params);
  const filtered = entries.filter(([, value]) => value !== undefined && value !== null && value !== '');
  
  const cleaned = Object.fromEntries(filtered) as Record<string, string | number | boolean>;

  // Ensure defaults for pagination
  if (!cleaned.page) cleaned.page = 1;
  if (!cleaned.limit) cleaned.limit = 20;

  return cleaned;
};

export const RFQService = {
  getList: async (params?: RFQFilterCriteria): Promise<RFQListResponse> => {
    logger.info('[RFQService] Fetching RFQ List', params);

    // 🧹 Clean Parameters to prevent "undefined" in URL
    const cleanedParams = cleanParams(params || {});
    const res = await api.get<RFQListResponse & { pageSize?: number }>(ENDPOINTS.list, { params: cleanedParams });

    // 🎯 Trusting Backend + Normalizing for UI (The Pipeline Fix)
    // The backend returns { data: [...], total: 8, page: 1, pageSize: 20 }
    const items = extractArrayFromResponse<RFQHeader>(res);
    const total = typeof res?.total === 'number' ? res.total : items.length;
    const limit = res?.limit || res?.pageSize || Number(cleanedParams.limit) || 20;

    return {
      data: items,
      total: total,
      page: res?.page || Number(cleanedParams.page) || 1,
      limit: limit,
      totalPages: res?.totalPages || Math.ceil(total / limit) || 1
    };
  },

  getById: async (id: number): Promise<RFQDetailResponse> => {
    logger.info(`[RFQService] Fetching RFQ Detail: ${id}`);
    return await api.get<RFQDetailResponse>(ENDPOINTS.detail(id));
  },

  create: async (payload: RFQCreateDTO): Promise<RFQHeader> => {
    logger.info('[RFQService] Creating RFQ');
    logger.debug('🔧 [RFQService] WIRE-READY JSON:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await api.post<RFQHeader>(ENDPOINTS.create, payload);
      logger.info('✅ [RFQService] RFQ Created Successfully!', response);
      return response;
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      logger.error('💥 [RFQService] Backend Rejected RFQ Creation:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  update: async (id: number, payload: Partial<RFQCreateDTO>): Promise<SuccessResponse> => {
    logger.info(`[RFQService] Updating RFQ: ${id}`);
    try {
      return await api.patch<SuccessResponse>(ENDPOINTS.detail(id), payload);
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      logger.error('💥 [RFQService] Backend Rejected RFQ Update:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  delete: async (id: number): Promise<SuccessResponse> => {
    logger.info(`[RFQService] Deleting RFQ: ${id}`);
    return await api.delete<SuccessResponse>(ENDPOINTS.detail(id));
  },

  /**
   * Step 2 of Two-Step Transaction: Associate vendors to an existing RFQ.
   * Called AFTER create() returns the new RFQ ID.
   *
   * ⚠️ NOTE: If the backend does not yet have a dedicated vendor-mapping endpoint,
   *    this will fail with 404. In that case, the backend team needs to provide
   *    a POST /rfq/:id/vendors endpoint that accepts { vendor_ids: number[] }.
   *    Vendors can still be associated later via sendToVendors().
   */
  addVendorsToRFQ: async (rfqId: number, vendorIds: number[]): Promise<SuccessResponse> => {
    logger.info(`[RFQService] Step 2: Adding vendors to RFQ ${rfqId}`, { vendorIds });
    try {
      return await api.post<SuccessResponse>(ENDPOINTS.addVendors(rfqId), { vendor_ids: vendorIds });
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      logger.warn('⚠️ [RFQService] Vendor association failed (endpoint may not exist yet):', errorMessage);
      // Non-fatal: RFQ header was already created successfully
      throw new Error(errorMessage);
    }
  },

  sendToVendor: async (rfqVendorId: number, payload: SendRFQToVendorPayload): Promise<SuccessResponse> => {
    logger.info(`[RFQService] Sending RFQ via vendor row ${rfqVendorId} using PATCH ${ENDPOINTS.sendToVendor(rfqVendorId)}`, payload);
    return await api.patch<SuccessResponse>(ENDPOINTS.sendToVendor(rfqVendorId), payload);
  }
};
