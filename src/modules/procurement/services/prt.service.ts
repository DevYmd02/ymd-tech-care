
import api from '@/core/api/api';
import { USE_MOCK } from '@/core/api/api';
import type { PurchaseReturn, PRTListParams, PRTListResponse, PrtItem } from '@/modules/procurement/types';
import { logger } from '@/shared/utils/logger';
import { applyClientFilters, applyClientPagination, extractArrayFromResponse } from '@/shared/utils/clientFilterUtils';

const ENDPOINTS = {
  list: '/prt',
  detail: (id: number) => `/prt/${id}`,
  create: '/prt',
  update: (id: number) => `/prt/${id}`,
  delete: (id: number) => `/prt/${id}`,
  items: '/prt-items', // Endpoint for dropdown items
};

export const PrtService = {
  getList: async (params: PRTListParams): Promise<PRTListResponse> => {
    try {
      const response = await api.get<PRTListResponse>(ENDPOINTS.list, { params });

      // 🎯 HYBRID FALLBACK: Apply Client-Side Filtering when using Real API
      if (!USE_MOCK && params) {
        const allItems = extractArrayFromResponse<PurchaseReturn>(response);
        const filterParams: Record<string, string | number | boolean | undefined | null> = {};
        if (params.prt_no) filterParams.prt_no = params.prt_no;
        if (params.vendor_name) filterParams.vendor_name = params.vendor_name;
        if (params.ref_grn_no) filterParams.ref_grn_no = params.ref_grn_no;
        if (params.status && params.status !== 'ALL') filterParams.status = params.status;
        if (params.date_from) filterParams.date_from = params.date_from;
        if (params.date_to) filterParams.date_to = params.date_to;
        if (params.page) filterParams.page = params.page;
        if (params.limit) filterParams.limit = params.limit;
        if (params.sort) filterParams.sort = params.sort;

        return applyClientFilters<PurchaseReturn>(allItems, filterParams, {
          searchableFields: ['prt_no', 'vendor_name'],
          dateField: 'prt_date',
        });
      }

      // 🎯 HYBRID PAGINATION: Always apply client-side slicing even for mock responses
      const allItems = extractArrayFromResponse<PurchaseReturn>(response);
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      return applyClientPagination<PurchaseReturn>(allItems, page, limit);
    } catch (error) {
      logger.error('[PrtService] getList error:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<PurchaseReturn | null> => {
      try {
          return await api.get<PurchaseReturn>(ENDPOINTS.detail(id));
      } catch (error) {
          logger.error('[PrtService] getById error:', error);
          return null;
      }
  },

  create: async (data: Partial<PurchaseReturn>): Promise<PurchaseReturn> => {
      return await api.post<PurchaseReturn>(ENDPOINTS.create, data);
  },

  update: async (id: number, data: Partial<PurchaseReturn>): Promise<PurchaseReturn> => {
      return await api.put<PurchaseReturn>(ENDPOINTS.update(id), data);
  },

  delete: async (id: number): Promise<void> => {
      await api.delete(ENDPOINTS.delete(id));
  },

  getItems: async (): Promise<PrtItem[]> => {
      try {
          return await api.get<PrtItem[]>(ENDPOINTS.items);
      } catch (error) {
          logger.error('[PrtService] getItems error:', error);
          return [];
      }
  },
  
  getExchangeRate: async (currencyCode: string, rateDate: string): Promise<number> => {
      try {
          const response = await api.get<{ rate: number }>('/master-data/exchange-rates/latest', { 
              params: { currency_code: currencyCode, rate_date: rateDate } 
          });
          return response.rate;
      } catch (error) {
          logger.error('[PrtService] getExchangeRate error:', error);
          return 1; // Fallback to 1 if error
      }
  }
};
