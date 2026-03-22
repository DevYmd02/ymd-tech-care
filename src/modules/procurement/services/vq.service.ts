import api from '@/core/api/api';
import { USE_MOCK } from '@/core/api/api';
import type { VQListParams, VQListResponse, VQCreateData, VQListItem, VQPendingQueueResponse } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import type { SuccessResponse } from '@/shared/types/api-response.types';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

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
  getList: async (params?: VQListParams): Promise<VQListResponse> => {
    logger.info('[VQService] Fetching VQ List', params);
    const apiParams = { ...params };
    if (apiParams.status === 'RECORDED') {
        delete apiParams.status;
    }
    console.log("[VQ_GET_LIST_PARAMS]:", apiParams);
    const response = await api.get<VQListResponse>(ENDPOINTS.list, { params: apiParams });



    // 🎯 HYBRID FALLBACK: Apply Client-Side Filtering when using Real API
    if (!USE_MOCK && params) {
      const allItems = extractArrayFromResponse<VQListItem>(response);
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

      let filteredItems = allItems;
      if (params?.status && params.status !== 'ALL') {
          filteredItems = allItems.filter(item => 
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

  getVQsByRfqId: async (rfqId: number): Promise<VQListResponse> => {
    logger.info(`[VQService] Fetching VQs for RFQ ID: ${rfqId}`);
    const response = await api.get<VQListResponse | VQListItem[]>(ENDPOINTS.list, { params: { rfq_id: rfqId } });
    
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

  getWaitingForRFQ: async (params?: VQListParams): Promise<VQPendingQueueResponse> => {
    logger.info('[VQService] Fetching Waiting for RFQ list', params);
    type ApiResponse = VQPendingQueueResponse | { data: VQPendingQueueResponse };
    const response = await api.get<ApiResponse>(ENDPOINTS.waitingForRfq, { params });
    
    // Safely unwrap if the pagination payload is nested inside another data layer
    if (response && 'data' in response && response.data && !Array.isArray(response.data)) {
       return response.data;
    }
    return response as VQPendingQueueResponse;
  },

  getWaitingForVQ: async (params?: VQListParams): Promise<VQPendingQueueResponse> => {
    logger.info('[VQService] Fetching Waiting for VQ list', params);
    type ApiResponse = VQPendingQueueResponse | { data: VQPendingQueueResponse };
    const response = await api.get<ApiResponse>(ENDPOINTS.waitingForVq, { params });
    
    // Safely unwrap if the pagination payload is nested inside another data layer
    if (response && 'data' in response && response.data && !Array.isArray(response.data)) {
       return response.data;
    }
    return response as VQPendingQueueResponse;
  },

  getById: async (id: number): Promise<VQListItem> => {
    logger.info(`[VQService] Fetching VQ Detail ${id}`);
    return await api.get<VQListItem>(`${ENDPOINTS.list}/${id}`);
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

  getModalWaitingForRFQ: async (params?: any): Promise<any> => {
    logger.info('[VQService] Fetching Modal Waiting for RFQ', params);
    return await api.get<any>(ENDPOINTS.modalWaitingForRfq, { params });
  },

  getModalWaitingForRFQVendor: async (id: number): Promise<any> => {
    logger.info(`[VQService] Fetching Modal Waiting for RFQ Vendor ${id}`);
    return await api.get<any>(ENDPOINTS.modalWaitingForRfqVendor(id));
  }
};

export type { VQListParams, VQListResponse, VQCreateData };