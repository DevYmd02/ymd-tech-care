import api from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import { USE_MOCK } from '@/core/api/api';
import type { QCListParams, QCListResponse, CreateQCPayload, SubmitQCWinnerData, IReadyForPOPR } from '@/modules/procurement/schemas/qc-schemas';
import type { QCListItem } from '@/modules/procurement/schemas/qc-schemas';
import type { RFQHeader } from '@/modules/procurement/types';
import { logger } from '@/shared/utils';

import type { SuccessResponse } from '@/shared/types/api.types';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

const ENDPOINTS = {
  list:    '/qc/qc-all',
  create:  '/qc/create',
  detail:  (id: number) => `/qc/${id}`,
  compare: (id: number) => `/qc/compare/${id}`,
  cancel:  (id: number) => `/qc/cancel/${id}`,
};

/**
 * 🧹 Helper to clean params before API call
 * Removes undefined, null, and empty strings
 * Uses 'object' to accommodate interfaces like QCListParams without index signatures
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

export const QCService = {
  getList: async (params?: QCListParams, config?: AxiosRequestConfig): Promise<QCListResponse> => {
    logger.info('[QCService] Fetching QC List', params);
    
    // 🧹 Clean Parameters to prevent "undefined" in URL
    const cleanedParams = cleanParams(params || {});
    const response = await api.get<QCListResponse>(ENDPOINTS.list, { ...config, params: cleanedParams });

    // ⚡ PHASE 2: Server-Side Pagination & Filtering (Real API)
    if (!USE_MOCK) {
      return response;
    }

    // 🎯 HYBRID FALLBACK: Apply Client-Side Filtering when using Mock Data
    if (params) {
      const allItems = extractArrayFromResponse<QCListItem>(response);
      const filterParams: Record<string, string | number | boolean | undefined | null> = {};
      if (params.qc_no) filterParams.qc_no = params.qc_no;
      if (params.pr_no) filterParams.pr_no = params.pr_no;
      if (params.rfq_no) filterParams.rfq_no = params.rfq_no;
      if (params.status) filterParams.status = params.status;
      if (params.date_from) filterParams.date_from = params.date_from;
      if (params.date_to) filterParams.date_to = params.date_to;
      if (params.page) filterParams.page = params.page;
      if (params.limit) filterParams.limit = params.limit;
      if (params.sort) filterParams.sort = params.sort;

      return applyClientFilters<QCListItem>(allItems, filterParams, {
        searchableFields: ['qc_no', 'pr_no', 'lowest_bidder_name'],
        dateField: 'created_at',
        backendTotal: response.total,
      });
    }

    // 🎯 HYBRID PAGINATION: Always apply client-side slicing even for mock responses
    const allItems = extractArrayFromResponse<QCListItem>(response);
    const page = 1;
    const limit = 20;
    return applyClientPagination<QCListItem>(allItems, page, limit, response.total);
  },

  getById: async (id: number, config?: AxiosRequestConfig): Promise<QCListItem> => {
    logger.info(`[QCService] Fetching QC Detail: ${id}`);
    return await api.get<QCListItem>(ENDPOINTS.detail(id), config);
  },

  getReadyForPO: async (config?: AxiosRequestConfig): Promise<IReadyForPOPR[]> => {
    logger.info('[QCService] Fetching PRs waiting for QC (Ready for PO)');
    return await api.get<IReadyForPOPR[]>('/po/pr/waiting-for-qc', config);
  },

  getWaitingForQC: async (): Promise<RFQHeader[]> => {
    logger.info('[QCService] Fetching RFQs waiting for QC (Limit: 1000)');
    const response = await api.get<{ data: RFQHeader[] }>('/qc/rfq/waiting-for-qc', { 
      params: { limit: 1000 } 
    });

    const items = extractArrayFromResponse<RFQHeader>(response);
    logger.debug(`[QCService] Found ${items.length} items waiting for QC`);
    return items;
  },

  getVQsWaitingForQC: async (rfqId: number): Promise<any[]> => {
    logger.info(`[QCService] Fetching VQs for RFQ ID waiting for QC: ${rfqId}`);
    const response = await api.get<any>(`/qc/vendor/${rfqId}/waiting-for-qc`);
    logger.debug("[QCService] getVQsWaitingForQC response received");
    return extractArrayFromResponse<any>(response);
  },






  create: async (data: CreateQCPayload): Promise<{ qc_id: number }> => {
    logger.info('[QCService] Creating QC with 5-field payload', data);
    return await api.post<{ qc_id: number }>(ENDPOINTS.create, data);
  },

  compare: async (id: number): Promise<{ success: boolean }> => {
    logger.info(`[QCService] Triggering Price Comparison for ${id}`);
    return await api.post<{ success: boolean }>(ENDPOINTS.compare(id), {});
  },

  submitWinner: async (id: number, data: SubmitQCWinnerData): Promise<{ qc_id: number }> => {
    logger.info(`[QCService] Submitting Winner for QC: ${id}`, data);
    return await api.post<{ qc_id: number }>(`/qc/submit-winner/${id}`, data);
  },

  cancel: async (id: number): Promise<SuccessResponse> => {
    logger.info(`[QCService] Cancelling QC: ${id}`);
    return await api.get<SuccessResponse>(ENDPOINTS.cancel(id), {});
  },

  /**
   * 🏆 ADVANCED DISCOVERY (Triple Scan Logic)
   * Centralized logic to find PRs that are truly ready for PO by merging:
   * 1. Direct "Ready for PO" API (Primary)
   * 2. Draft QCs (Discovery)
   * 3. Approved PRs (Authority)
   */
  getAdvancedReadyPRs: async (config?: AxiosRequestConfig): Promise<IReadyForPOPR[]> => {
    const PRService = (await import('./pr.service')).PRService;
    logger.info('🚀 [QCService] Executing Advanced Triple-Scan Discovery');
    
    try {
        // 📡 Parallel Fetch (Authority + Discovery)
        const [items1, items2Res, items3Res] = await Promise.all([
            api.get<IReadyForPOPR[]>('/po/pr/waiting-for-qc', config), // Ready for PO
            api.get<QCListResponse>('/qc/qc-all', { ...config, params: { status: 'DRAFT', limit: 100 } }), // Draft QCs
            PRService.getList({ status: 'APPROVED', limit: 100 }, config) // Approved PRs
        ]);

        const items2 = extractArrayFromResponse<QCListItem>(items2Res);
        const items3 = extractArrayFromResponse<any>(items3Res);
        
        const mergedMap = new Map<string, IReadyForPOPR>();

        // 1. Map Primary Items (The "Golden" list)
        items1.forEach(item => {
            const key = item.pr_no || `ID_${item.pr_id}`;
            if (key) mergedMap.set(key, { ...item });
        });

        // 2. Overlay Draft QCs (Enrichment)
        items2.forEach(qc => {
            const key = qc.pr_no;
            if (key && mergedMap.has(key)) {
                const existing = mergedMap.get(key)!;
                const winnerVqId = Number(qc.winning_vq_id || qc.vq_header_id || 0);
                const winnerVendorId = Number(qc.winning_vendor_id || (qc as any).vendor_id || 0);
                
                // 🎯 DATA ENRICHMENT: If the PR record lacks vendor/amount (which is common in waiting list),
                // overlay it with the "Awarded" data from the discovered QC.
                if (qc.vendor_name && (!existing.preferred_vendor || !existing.preferred_vendor.vendor_name)) {
                    existing.preferred_vendor = {
                        vendor_id: winnerVendorId,
                        vendor_name: qc.vendor_name
                    };
                }
                
                if (qc.vq_total_amount && Number(qc.vq_total_amount) > 0) {
                    existing.pr_base_total_amount = Number(qc.vq_total_amount);
                }

                const hasThisQC = existing.qcHeaders?.some(h => String(h.qc_no) === String(qc.qc_no));
                if (!hasThisQC) {
                    if (!existing.qcHeaders) existing.qcHeaders = [];
                    existing.qcHeaders.push({
                        qc_id: Number(qc.qc_id || (qc as any).id || 0),
                        qc_no: qc.qc_no || 'QC-UNKNOWN',
                        pr_id: existing.pr_id,
                        winning_vq_id: winnerVqId,
                        winning_vendor_id: winnerVendorId,
                        status: qc.status,
                        raw_status: qc.status,
                        created_at: qc.created_at || ''
                    });
                }
            }
        });

        // 3. Authority Overlay (Approved PRs)
        items3.forEach(pr => {
            const key = pr.pr_no || `ID_${pr.pr_id}`;
            if (key && !mergedMap.has(key)) {
                const qcs = (pr.qcHeaders as IReadyForPOPR['qcHeaders']) || [];
                const readyPrKeys = new Set(items1.map(i => i.pr_no || `ID_${i.pr_id}`));
                
                const isApproved = pr.status === 'APPROVED';
                const isDiscoveryStatus = pr.status === 'PARTIAL' || pr.status === 'DRAFT';
                
                if (isApproved && !readyPrKeys.has(key)) return;
                if (!isApproved && !isDiscoveryStatus) return;

                mergedMap.set(key, {
                    pr_id: Number(pr.pr_id),
                    pr_no: pr.pr_no,
                    base_currency_code: pr.pr_base_currency_code || 'THB',
                    pr_base_total_amount: Number(pr.pr_base_total_amount || pr.total_amount || 0),
                    requester_name: pr.requester_name || '-',
                    preferred_vendor: pr.preferred_vendor_id ? {
                        vendor_id: Number(pr.preferred_vendor_id),
                        vendor_name: pr.vendor_name || 'ไม่ระบุชื่อผู้ขาย'
                    } : null,
                    qcHeaders: qcs as any
                });
            }
        });

        const mergedResult = Array.from(mergedMap.values()).filter(pr => {
            const key = pr.pr_no || `ID_${pr.pr_id}`;
            const isReadyByAPI = items1.some(i => (i.pr_no || `ID_${i.pr_id}`) === key);
            if (isReadyByAPI) return true;
            return pr.qcHeaders?.some(h => (h.raw_status || h.status) === 'DRAFT');
        });

        logger.info(`✅ [QCService] Triple-Scan Success: Found ${mergedResult.length} Advanced Ready PRs`);
        return mergedResult;
    } catch (err) {
        logger.error('[QCService] Triple-Scan Critical Failure, falling back to basic API', err);
        return await api.get<IReadyForPOPR[]>('/po/pr/waiting-for-qc', config);
    }
  }
};

export type { QCListParams, QCListResponse, CreateQCPayload as QCCreateData };

