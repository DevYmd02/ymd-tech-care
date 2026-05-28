import api, { type CustomAxiosConfig, USE_MOCK } from '@/core/api/api';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import type { VendorListResponse } from '@/modules/master-data/vendor/types/vendor-types';
import type { ApprovalListResponse } from '@/modules/procurement/types/av-types';
import { sanitizePayload, cleanPayload } from '@/shared/utils/payload.utils';
import type {
  PRListParams,
  PRListResponse,
  ConvertPRRequest,
  PRHeader,
  PRHeaderExtended,
  CreatePRPayload,
  PRStatus,
  PRLine,
} from '@/modules/procurement/types';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse, prepareHybridParams } from '@/shared/utils/clientFilterUtils';
import { unwrapResponseData, extractLinesArray } from '@/shared/utils/apiUtils';
import { createVendorMap, hydratePRList, hydratePRHeader } from '../utils/pr-hydration';
import { logger } from '@/shared/utils';
import type { ApiResponse } from '@/shared/types/api.types';

export type PRUpdatePayload = Partial<CreatePRPayload> & { status?: PRStatus };
export type { PRListParams, PRListResponse, ConvertPRRequest };

const ENDPOINTS = {
  list: '/pr',
  detail: (id: number) => `/pr/${id}`,
  pending: (id: number) => `/pr/${id}/pending`, 
  approve: (id: number) => `/pr/${id}/approve`,
  cancel: (id: number) => `/pr/${id}/cancel`,
  reject: (id: number) => `/pr/${id}/reject`,
  convert: (id: number) => `/pr/${id}/convert`,
  attachments: (id: number) => `/pr/${id}/attachments`,
  attachment: (id: number, attachmentId: string) => `/pr/${id}/attachments/${attachmentId}`,
};

const KNOWN_DTO_FIELDS = [
  'pr_date', 'need_by_date', 'requester_user_id', 'branch_id',
  'project_id', 'cost_center_id', 'preferred_vendor_id',
  'pr_tax_code_id', 'remark', 'status',
  'pr_base_currency_code', 'pr_quote_currency_code',
  'pr_exchange_rate', 'pr_exchange_rate_date',
  'pr_discount_raw', 'payment_term_days', 'credit_days',
  'vendor_quote_no', 'shipping_method', 'lines',
  'requester_name', 'delivery_date',  
  'version'
];

const KNOWN_LINE_DTO_FIELDS = [
  'pr_line_id', 'id',
  'line', 'item_id', 'qty', 'est_unit_price', 'uom_id',
  'line_discount_raw', 'line_no', 'description', 'warehouse_id',
  'location', 'required_receipt_type'
];

let cachedVendors: VendorListResponse | null = null;
let lastVendorFetchTime = 0;
const VENDOR_CACHE_TTL = 5 * 60 * 1000; 

let cachedAVStatusMap: Map<number, { status: string; av_no?: string }> | null = null;
let lastAVStatusFetchTime = 0;
const AV_STATUS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes (Optimized for 100 concurrent users)

async function buildAVStatusMap(config?: CustomAxiosConfig): Promise<Map<number, { status: string; av_no?: string }>> {
  const now = Date.now();
  if (cachedAVStatusMap && (now - lastAVStatusFetchTime < AV_STATUS_CACHE_TTL)) {
    return cachedAVStatusMap as Map<number, { status: string; av_no?: string }>;
  }
  try {
    const avRes: ApprovalListResponse = await api.get<ApprovalListResponse>('/pr-approval', { ...config, params: { limit: 1000, page: 1 } });
    const tempMap = new Map<number, { status: string; id: number; no?: string }>();
    const records = avRes?.data || [];
    for (const rec of records) {
      const prId = Number(rec.pr_id);
      if (!isNaN(prId) && rec.status) {
        const existingId = tempMap.get(prId)?.id || 0;
        if (Number(rec.approval_id) >= existingId) {
          tempMap.set(prId, { 
            status: rec.status.toUpperCase(), 
            id: Number(rec.approval_id),
            no: rec.approval_no 
          });
        }
      }
    }
    const finalMap = new Map<number, { status: string; av_no?: string }>();
    tempMap.forEach((value, key) => finalMap.set(key, { status: value.status, av_no: value.no }));
    cachedAVStatusMap = finalMap;
    lastAVStatusFetchTime = now;
    return finalMap;
  } catch (err) {
    logger.warn('[PRService] Failed to fetch AV status map (non-critical):', err);
    return new Map();
  }
}

export function clearPRServiceAVCache() {
  cachedAVStatusMap = null;
  lastAVStatusFetchTime = 0;
}

function overlayAVStatus(items: PRHeader[], avStatusMap: Map<number, { status: string; av_no?: string }>): PRHeader[] {
  if (avStatusMap.size === 0) return items;
  return items.map(item => {
    const prId = Number(item.pr_id);
    const avData = !isNaN(prId) ? avStatusMap.get(prId) : undefined;
    if (avData) {
      const avStatus = avData.status;
      const avNo = avData.av_no;
      const newItem = { ...item };
      if (avNo) newItem.av_no = avNo;
      const currentStatus = (item.status || '').toUpperCase();
      if (avStatus && avStatus !== currentStatus) {
        if (currentStatus === 'PENDING') {
          newItem.status = avStatus as PRHeader['status'];
        }
      }
      return newItem;
    }
    return item;
  });
}

function deduplicatePRs(items: PRHeader[]): PRHeader[] {
    const seen = new Set<number>();
    return items.filter(item => {
        const id = Number(item.pr_id);
        if (isNaN(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}

export const PRService = {
  clearAVCache: clearPRServiceAVCache,
  getList: async (params?: PRListParams, config?: CustomAxiosConfig): Promise<PRListResponse> => {
    const SUPPORTED_FIELDS = ['branch_id', 'requester_user_id']; 
    const safeParams = params || {};
    const { apiParams, needsClientFilter } = prepareHybridParams(
        safeParams as Record<string, string | number | boolean | undefined | null>, 
        SUPPORTED_FIELDS
    );
    const response = await api.get<PRListResponse>(ENDPOINTS.list, { ...config, params: apiParams });
    const allItems = extractArrayFromResponse<PRHeader>(response);
    
    if (needsClientFilter || USE_MOCK) {
        const filterParams: Record<string, string | number | boolean | undefined | null> = { ...safeParams };
        let hydratedItems = [...allItems];
        const now = Date.now();
        // 🚀 Parallel fetch: Vendor + AV Status (M5 fix — was sequential)
        const [vendorsResult, avStatusResult] = await Promise.allSettled([
            (async () => {
                if (!cachedVendors || (now - lastVendorFetchTime > VENDOR_CACHE_TTL)) {
                    cachedVendors = await VendorService.getList(config);
                    lastVendorFetchTime = now;
                }
                return cachedVendors!;
            })(),
            (!USE_MOCK ? buildAVStatusMap(config) : Promise.resolve(new Map<number, { status: string; av_no?: string }>()))
        ]);
        if (vendorsResult.status === 'fulfilled') {
            const vendorMap = createVendorMap(vendorsResult.value.items || []);
            hydratedItems = hydratePRList(allItems, vendorMap);
        } else {
            logger.error('[PRService] Failed to hydrate vendors for filtering:', vendorsResult.reason);
        }
        if (!USE_MOCK && avStatusResult.status === 'fulfilled') {
            hydratedItems = overlayAVStatus(hydratedItems, avStatusResult.value);
        } else if (!USE_MOCK && avStatusResult.status === 'rejected') {
            logger.warn('[PRService] AV status hydration failed:', avStatusResult.reason);
        }
        const uniqueItems = deduplicatePRs(hydratedItems);
        return applyClientFilters<PRHeader>(uniqueItems, filterParams, {
            searchableFields: ['pr_no', 'requester_name', 'purpose'],
            dateField: 'need_by_date',
            backendTotal: response.total,
            exactMatchFields: ['status']
        });
    }

    if (!USE_MOCK) {
        let hydratedItems = deduplicatePRs(allItems);
        try {
            const now = Date.now();
            // 🚀 Parallel fetch: Vendor + AV Status (M5 fix — was sequential)
            const [vendorsRes, avStatusMap] = await Promise.all([
                (async () => {
                    if (!cachedVendors || (now - lastVendorFetchTime > VENDOR_CACHE_TTL)) {
                        cachedVendors = await VendorService.getList(config);
                        lastVendorFetchTime = now;
                    }
                    return cachedVendors!;
                })(),
                buildAVStatusMap(config)
            ]);
            const vendorMap = createVendorMap(vendorsRes.items || []);
            hydratedItems = hydratePRList(hydratedItems, vendorMap);
            hydratedItems = overlayAVStatus(hydratedItems, avStatusMap);
        } catch (err) {
             logger.debug('Hydration failed during fallback', err);
        }
        return { ...response, data: hydratedItems };
    }
    const uniqueItems = deduplicatePRs(allItems);
    return applyClientPagination<PRHeader>(uniqueItems, params?.page || 1, params?.limit || 20, response.total);
  },

  getDetail: async (id: number, config?: CustomAxiosConfig): Promise<PRHeaderExtended> => {
    const response = await api.get<unknown>(ENDPOINTS.detail(id), config);
    const data = unwrapResponseData<PRHeaderExtended>(response);
    const lines = extractLinesArray<PRLine>(response);

    let finalResult = hydratePRHeader({
        ...data,
        lines: lines.length > 0 ? lines : (data.lines || [])
    });

    if (!USE_MOCK) {
        try {
            const avStatusMap = await buildAVStatusMap(config);
            const hydrated = overlayAVStatus([finalResult as PRHeader], avStatusMap);
            finalResult = {
                ...finalResult,
                status: hydrated[0].status
            };
        } catch (err) {
            logger.warn('[PRService.getDetail] AV status hydration failed:', err);
        }
    }
    return finalResult;
  },

  create: async (data: CreatePRPayload, config?: CustomAxiosConfig): Promise<PRHeaderExtended> => {
    const sanitizedData = PRService.sanitizeData(data as unknown as Record<string, unknown>);
    const response = await api.post<ApiResponse<PRHeaderExtended>>(ENDPOINTS.list, sanitizedData, config);
    return unwrapResponseData(response);
  },

  update: async (id: number, data: PRUpdatePayload, config?: CustomAxiosConfig): Promise<PRHeaderExtended> => {
    const sanitizedData = PRService.sanitizeData(data as unknown as Record<string, unknown>);
    const response = await api.patch<ApiResponse<PRHeaderExtended>>(ENDPOINTS.detail(id), sanitizedData, config);
    return unwrapResponseData(response);
  },


  delete: async (id: number, config?: CustomAxiosConfig): Promise<boolean> => {
    await api.delete(ENDPOINTS.detail(id), config);
    return true;
  },

  cancel: async (id: number, config?: CustomAxiosConfig): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>(ENDPOINTS.cancel(id), {}, config);
    return response.data as ApiResponse<unknown>;
  },



  approvePR: async (id: number, config?: CustomAxiosConfig): Promise<boolean> => {
    await api.post(ENDPOINTS.approve(id), {}, config);
    return true;
  },

  rejectPR: async (id: number, reason?: string, config?: CustomAxiosConfig): Promise<boolean> => {
    await api.post(ENDPOINTS.reject(id), { reason: reason || 'Rejected' }, config);
    return true;
  },


  processDirectApproval: async (id: number, config?: CustomAxiosConfig): Promise<boolean> => {
    await api.post(ENDPOINTS.approve(id), { direct: true }, config);
    return true;
  },

  convert: async (id: number, payload: ConvertPRRequest, config?: CustomAxiosConfig): Promise<boolean> => {
    await api.post(ENDPOINTS.convert(id), payload, config);
    return true;
  },

  sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    if (Array.isArray(data.lines)) {
      data.lines = data.lines.map(line => sanitizePayload(line, KNOWN_LINE_DTO_FIELDS));
    }
    return cleanPayload(sanitizePayload(data, KNOWN_DTO_FIELDS)) as Record<string, unknown>;
  },
};
