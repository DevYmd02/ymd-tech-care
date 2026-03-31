import api, { USE_MOCK } from '@/core/api/api';
import type { RFQHeader, RFQListResponse, RFQFilterCriteria, RFQDetailResponse, SendRFQToVendorPayload, PRHeader } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';
import { extractErrorMessage } from '@/core/api/api';
import { applyClientFilters, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

const ENDPOINTS = {
  list: '/rfq',
  detail: (id: number) => `/rfq/${id}`,
  create: '/rfq',
  addVendors: (id: number) => `/rfq/${id}/vendors`,
  sendToVendor: (rfqVendorId: number) => `/rfq/${rfqVendorId}/send-to-vendor`,
  approvedPRsWithoutRFQ: '/rfq/pr/without-rfq',
  prApprovalDetail: (prId: number) => `/rfq/pr-approved/${prId}/without-rfq`,
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
  rfq_line_id?: number;
  line_no: number;
  description: string;
  qty: number;
  uom_id: number;
  item_id?: number;
  pr_line_id?: number;
  approval_line_id?: number;
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
  requested_by_user_id?: number;     // 🎯 Employee ID (NUMBER, optional)
  requested_by?: string;             // 🎯 Employee Name (STRING, optional)
  status: string;
  quotation_due_date: string;
  branch_id: number;
  rfq_base_currency_code: string;
  rfq_quote_currency_code: string;
  rfq_exchange_rate: number;
  rfq_exchange_rate_date: string;
  remarks: string;
  // 🚫 vendor_ids: REMOVED — backend rejects this property entirely
  rfqVendors?: { vendor_id: number, status?: string }[]; // newly supported direct binding
  rfqLines: RFQLineDTO[];
  pr_id?: number;
  pr_approval_id?: number;
  // ❌ approved_pr_no - backend rejects
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
    
    // 🧹 Extract API Params — include all filters but keep pagination/sorting as core
    const apiParams: Record<string, string | number | boolean | undefined | null> = { ...cleanedParams };

    const needsClientFilter = !!(
        params?.rfq_no || 
        params?.pr_no || 
        params?.ref_pr_no || 
        params?.creator_name || 
        params?.status || 
        params?.date_start || 
        params?.date_end
    );

    // 🎯 HYBRID FALLBACK: Strip filters from API call if client filtering is active
    // Backend may not support these yet or may have inconsistent internal status (e.g. 'DRAFT' vs UI 'SENT')
    if (needsClientFilter && !USE_MOCK) {
        delete apiParams.rfq_no;
        delete apiParams.pr_no;
        delete apiParams.ref_pr_no;
        delete apiParams.creator_name;
        delete apiParams.status;
        delete apiParams.date_start;
        delete apiParams.date_end;
    }

    // ⚡ PHASE 2: Fetch data from backend
    const res = await api.get<RFQListResponse & { pageSize?: number }>(ENDPOINTS.list, { 
        params: apiParams 
    });

    // 🎯 Trusting Backend + Normalizing for UI (The Pipeline Fix)
    const items = extractArrayFromResponse<RFQHeader>(res);

    // 🎯 HYBRID FALLBACK: Apply Client-Side Filtering when using Real API or Mock
    const normalizedItems = items.map((item) => {
        const u = item.requested_by_user;
        const creatorName = u
            ? `${u.employee_firstname_th} ${u.employee_lastname_th}`.trim()
            : (item.created_by_name || item.creator_name || '-');

        // 🎯 Dynamic Status Matching (Mirroring Layout Logic)
        // 🔒 FIX: Prioritize 'sent_vendors_count' (REQUIRED field) over legacy 'vendor_sent'
        // '??' with 0 correctly picks 0 if present, but we should prioritize the most reliable fields first.
        const sentCount = item.sent_vendors_count ?? item.vendor_sent ?? 0;
        const total = item.vendor_total ?? item.vendor_count ?? 0;
        
        let currentStatus = item.status;
        if (!['CLOSED', 'CANCELLED'].includes(item.status) && total > 0 && sentCount > 0) {
              currentStatus = 'SENT';
        }

        return {
            ...item,
            creator_name: creatorName,
            status: currentStatus, // Overwrite with dynamic status
            ref_pr_no: item.ref_pr_no || item.pr_no || item.pr?.pr_no || null,
            pr_no: item.ref_pr_no || item.pr_no || item.pr?.pr_no || null,
        };
    });

    if (needsClientFilter || USE_MOCK) {
        const filterParams: Record<string, string | number | boolean | undefined | null> = {};
        if (params?.rfq_no) filterParams.rfq_no = params.rfq_no;
        if (params?.pr_no) filterParams.pr_no = params.pr_no;
        if (params?.ref_pr_no) filterParams.pr_no = params.ref_pr_no; // Map ref_pr_no to pr_no for filter
        if (params?.creator_name) filterParams.creator_name = params.creator_name;
        if (params?.status && params.status !== 'ALL') filterParams.status = params.status;
        if (params?.date_start) filterParams.date_start = params.date_start;
        if (params?.date_end) filterParams.date_end = params.date_end;
        if (params?.page) filterParams.page = params.page;
        if (params?.limit) filterParams.limit = params.limit;
        if (params?.sort) filterParams.sort = params.sort;

        return applyClientFilters<RFQHeader>(normalizedItems, filterParams, {
            searchableFields: ['rfq_no', 'pr_no', 'creator_name'],
            dateField: 'rfq_date',
            backendTotal: res.total,
        }) as unknown as RFQListResponse;
    }

    const total = typeof res?.total === 'number' ? res.total : items.length;
    const limit = res?.limit || res?.pageSize || Number(cleanedParams.limit) || 20;

    return {
        data: normalizedItems,
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
  },

  cancelVendor: async (rfqVendorId: number, remark: string): Promise<SuccessResponse> => {
    logger.info(`[RFQService] Cancelling vendor ${rfqVendorId} with remark: ${remark}`);
    return await api.patch<SuccessResponse>(`/rfq/${rfqVendorId}/cancel`, { remark });
  },

  getApprovedPRsWithoutRFQ: async (): Promise<{ data: PRHeader[] }> => {
    logger.info('[RFQService] Fetching Approved PRs without RFQ');
    const res = await api.get<{ data: PRHeader[] }>(ENDPOINTS.approvedPRsWithoutRFQ);
    return res;
  },

  getPRApprovalDetail: async (prId: number): Promise<any[]> => {
    logger.info(`[RFQService] Fetching PR Approval Detail for PR ID: ${prId}`);
    try {
      // 🎯 FIX: Postman shows backend returns 'approval_no', not 'approved_pr_no'
      // 🎯 FIX: Postman shows backend returns 'approval_no', not 'approved_pr_no'
      const res = await api.get<{ data: { approval_no?: string; approved_pr_no?: string; approval_id?: number | string; need_by_date?: string }[] }>(ENDPOINTS.prApprovalDetail(prId));
      
      const items = res.data || [];
      if (!Array.isArray(items)) {
        logger.warn(`[RFQService] Expected array for PR Approval Detail, got:`, typeof items);
        return [];
      }

      return items.filter((item: any) => Boolean(item.approval_no || item.approved_pr_no || item.approval_id));
    } catch (error) {
      logger.error(`[RFQService] Failed to fetch PR Approval Detail for ${prId}:`, error);
      return [];
    }
  }
};
