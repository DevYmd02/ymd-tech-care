import api from '@/core/api/api';
import { USE_MOCK } from '@/core/api/api';
import type { VQListParams, VQListResponse, VQCreateData, VQListItem, VQPendingQueueResponse, VQPendingQueueItem } from '@/modules/procurement/types';
import { logger } from '@/shared/utils';
import type { SuccessResponse } from '@/shared/types/api.types';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';
import { unwrapResponseData } from '@/shared/utils/apiUtils';

import type { AxiosRequestConfig } from 'axios';

const ENDPOINTS = {
  list: '/vq',
  create: '/vq',
  update: '/vq',
  detail: (id: number) => `/vq/${id}`,
  waitingForRfq: '/vq/rfq/waiting-for-rfq',
  waitingForVq: '/vq/rfq/waiting-for-rfq',
  modalWaitingForRfq: '/vq/rfq/waiting-for-rfq',
  modalWaitingForRfqVendor: (id: number) => `/vq/rfq/waiting-for-rfq-vendor/${id}`,
};

export const VQService = {
  getList: async (params?: VQListParams, config?: AxiosRequestConfig): Promise<VQListResponse> => {
    logger.info('[VQService] Fetching VQ List', params);
    
    // 🧹 Extract ONLY safe pagination/sorting for backend
    // Search params (vq_no, rfq_no, etc.) are handled client-side in the Hybrid Fallback below
    const apiParams: Record<string, string | number | boolean | undefined | null> = {};
    if (params?.page) apiParams.page = params.page;
    if (params?.limit) apiParams.limit = params.limit;
    if (params?.sort) apiParams.sort = params.sort;

    logger.debug("[VQService] getList backend params:", apiParams);
    const response = await api.get<VQListResponse>(ENDPOINTS.list, { ...config, params: apiParams });



    // 🎯 HYBRID FALLBACK: Apply Client-Side Filtering when using Real API
    if (!USE_MOCK && params) {
      const allItems = extractArrayFromResponse<VQListItem>(response);
      
      // 🎯 NORMALIZATION: Ensure searchable fields are at the root for applyClientFilters
      // Backend may return these nested in 'rfq', 'pr', or 'vendor' objects
      const normalizedItems = allItems.map(item => ({
        ...item,
        rfq_no: item.rfq_no || item.rfq?.rfq_no || '',
        pr_no: item.pr_no || item.pr?.pr_no || '',
        vendor_name: item.vendor_name || item.vendor?.vendor_name || ''
      }));

      const filterParams: Record<string, string | number | boolean | undefined | null> = {};
      
      if (params?.vq_no) filterParams.vq_no = params.vq_no;
      if (params?.vendor_name) filterParams.vendor_name = params.vendor_name;
      if (params?.rfq_no) filterParams.rfq_no = params.rfq_no;
      if (params?.pr_no) filterParams.pr_no = params.pr_no;
      if (params?.date_start) filterParams.date_start = params.date_start;
      if (params?.date_end) filterParams.date_end = params.date_end;
      if (params?.page) filterParams.page = params.page;
      if (params?.limit) filterParams.limit = params.limit;
      if (params?.sort) filterParams.sort = params.sort;

      let filteredItems = normalizedItems;
      if (params?.status && params.status !== 'ALL') {
          filteredItems = normalizedItems.filter(item => 
              params.status === 'RECORDED' 
                ? (item.status === 'RECORDED' || item.status === 'DRAFT')
                : item.status === params.status
          );
      }

      return applyClientFilters<VQListItem>(filteredItems, filterParams, {
        searchableFields: ['vq_no', 'vendor_name', 'rfq_no', 'pr_no'],
        dateField: 'quotation_date',
        backendTotal: response.total,
      });
    }

    // 🎯 HYBRID PAGINATION: Always apply client-side slicing even for mock responses
    const allItems = extractArrayFromResponse<VQListItem>(response);
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return applyClientPagination<VQListItem>(allItems, page, limit, response.total);
  },

  getVQsByRfqNo: async (rfqNo: string, config?: AxiosRequestConfig): Promise<VQListResponse> => {
    logger.info(`[VQService] Fetching VQs for RFQ No: ${rfqNo}`);
    const response = await api.get<VQListResponse | VQListItem[]>(ENDPOINTS.list, { ...config, params: { rfq_no: rfqNo } });
    
    // Safely extract array and wrap in VQListResponse (No pagination)
    const rawData = response;
    const arrayData = Array.isArray(rawData) ? rawData : (rawData?.data || []);
    
    return { 
      data: arrayData,
      total: arrayData.length,
      page: 1,
      limit: arrayData.length,
      totalPages: 1
    } as VQListResponse;
  },

  getWaitingForRFQ: async (params?: VQListParams, config?: AxiosRequestConfig): Promise<VQPendingQueueResponse> => {
    logger.info('[VQService] Fetching Waiting for RFQ list', params);
    type ApiResponse = VQPendingQueueResponse | { data: VQPendingQueueResponse };
    const response = await api.get<ApiResponse>(ENDPOINTS.waitingForRfq, { ...config, params });
    
    // Safely unwrap if the pagination payload is nested inside another data layer
    let result = response as VQPendingQueueResponse;
    if (response && 'data' in response && response.data && !Array.isArray(response.data)) {
       result = response.data as VQPendingQueueResponse;
    }

    // 🎯 HYBRID FALLBACK: Apply Client-Side Filtering
    if (!USE_MOCK && params) {
        const allItems = extractArrayFromResponse<VQPendingQueueItem>(result);
        const filterParams = { ...params } as Record<string, string | number | boolean | undefined | null>;
        return applyClientFilters<VQPendingQueueItem>(allItems, filterParams, {
            searchableFields: ['rfq_no', 'pr_no', 'vendor_name'],
            dateField: 'created_at',
            backendTotal: result.total
        }) as unknown as VQPendingQueueResponse;
    }

    return result;
  },

  getWaitingForVQ: async (params?: VQListParams, config?: AxiosRequestConfig): Promise<VQPendingQueueResponse> => {
    logger.info('[VQService] Fetching Waiting for VQ list', params);
    type ApiResponse = VQPendingQueueResponse | { data: VQPendingQueueResponse };
    const response = await api.get<ApiResponse>(ENDPOINTS.waitingForVq, { ...config, params });
    
    // Safely unwrap if the pagination payload is nested inside another data layer
    let result = response as VQPendingQueueResponse;
    if (response && 'data' in response && response.data && !Array.isArray(response.data)) {
       result = response.data as VQPendingQueueResponse;
    }

    // 🎯 HYBRID FALLBACK: Apply Client-Side Filtering
    if (!USE_MOCK && params) {
        const allItems = extractArrayFromResponse<VQPendingQueueItem>(result);
        const filterParams = { ...params } as Record<string, string | number | boolean | undefined | null>;
        return applyClientFilters<VQPendingQueueItem>(allItems, filterParams, {
            searchableFields: ['rfq_no', 'pr_no', 'vendor_name'],
            dateField: 'created_at',
            backendTotal: result.total
        }) as unknown as VQPendingQueueResponse;
    }

    return result;
  },

  getById: async (id: number, config?: AxiosRequestConfig): Promise<VQListItem> => {
    logger.info(`[VQService] Fetching VQ Detail ${id}`);
    const response = await api.get<unknown>(`${ENDPOINTS.list}/${id}`, config);
    return unwrapResponseData<VQListItem>(response);
  },

  create: async (data: VQCreateData): Promise<SuccessResponse> => {
    logger.info('[VQService] Creating VQ');
    return await api.post<SuccessResponse>(ENDPOINTS.create, data);
  },

  // TODO: Check if backend requires a specific endpoint like POST /api/qt/{id}/close-bidding instead of a generic PATCH update, as closing bids often triggers vendor notifications.
  update: async (id: number, data: VQCreateData): Promise<SuccessResponse> => {
    logger.info(`[VQService] Updating VQ ${id}`, data);
    return await api.patch<SuccessResponse>(`${ENDPOINTS.update}/${id}`, data as Partial<VQListItem>);
  },

  submit: async (id: number): Promise<SuccessResponse> => {
    logger.info(`[VQService] Submitting VQ ${id}`);
    return await api.post<SuccessResponse>(`${ENDPOINTS.list}/${id}/submit`, {});
  },

  cancel: async (id: number): Promise<SuccessResponse> => {
    logger.info(`[VQService] Cancelling VQ ${id}`);
    return await api.post<SuccessResponse>(`${ENDPOINTS.list}/${id}/cancel`, {});
  },

  getModalWaitingForRFQ: async (params?: VQListParams, config?: AxiosRequestConfig): Promise<VQPendingQueueResponse> => {
    logger.info('[VQService] Fetching Modal Waiting for RFQ', params);
    return await api.get<VQPendingQueueResponse>(ENDPOINTS.modalWaitingForRfq, { ...config, params });
  },

  getModalWaitingForRFQVendor: async (id: number, config?: AxiosRequestConfig): Promise<VQPendingQueueResponse> => {
    logger.info(`[VQService] Fetching Modal Waiting for RFQ Vendor ${id}`);
    return await api.get<VQPendingQueueResponse>(ENDPOINTS.modalWaitingForRfqVendor(id), config);
  }
};

export type { VQListParams, VQListResponse, VQCreateData };