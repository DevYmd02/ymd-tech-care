
import api from '@/core/api/api';
import type { PurchaseReturn, PRTListParams, PRTListResponse, PrtItem } from '../types/prt/prt-types';
import { logger } from '@/shared/utils/logger';

const ENDPOINTS = {
  list: '/prt',
  detail: (id: string) => `/prt/${id}`,
  create: '/prt',
  update: (id: string) => `/prt/${id}`,
  delete: (id: string) => `/prt/${id}`,
  items: '/prt-items', // Endpoint for dropdown items
};

export const PrtService = {
  getList: async (params: PRTListParams): Promise<PRTListResponse> => {
    try {
      return await api.get<PRTListResponse>(ENDPOINTS.list, { params });
    } catch (error) {
      logger.error('[PrtService] getList error:', error);
      throw error;
    }
  },

  getById: async (id: string): Promise<PurchaseReturn | null> => {
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

  update: async (id: string, data: Partial<PurchaseReturn>): Promise<PurchaseReturn> => {
      return await api.put<PurchaseReturn>(ENDPOINTS.update(id), data);
  },

  delete: async (id: string): Promise<void> => {
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
  
  getExchangeRate: async (currencyId: string, rateDate: string): Promise<number> => {
      try {
          const response = await api.get<{ rate: number }>('/master-data/exchange-rates/latest', { 
              params: { currency_id: currencyId, rate_date: rateDate } 
          });
          return response.rate;
      } catch (error) {
          logger.error('[PrtService] getExchangeRate error:', error);
          return 1; // Fallback to 1 if error
      }
  }
};
