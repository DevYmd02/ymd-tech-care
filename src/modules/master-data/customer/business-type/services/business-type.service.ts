import api, { USE_MOCK } from '@/core/api/api';
import type { TableFilters } from '@/shared/hooks/useTableFilters';
import type { MasterDataListResponse, MasterDataResponse } from '@/shared/types/common-master.types';
import type { CustomerBusinessType } from '@customer/business-type/types/business-type.types';
import { logger } from '@/shared/utils/logger';

// Mock data integration for testing if needed
const MOCK_BUSINESS_TYPES: CustomerBusinessType[] = []; 

export const BusinessTypeService = {
  /** Get Business Type List */
  getList: async (params?: Partial<TableFilters<string>>): Promise<MasterDataListResponse<CustomerBusinessType>> => {
    if (USE_MOCK) {
      return {
        data: MOCK_BUSINESS_TYPES,
        total: MOCK_BUSINESS_TYPES.length,
        page: 1,
        limit: 100
      };
    }
    try {
      const response = await api.get<unknown>('/business-type', { params });
      // Normalize response from REAL API (Raw Array) to MasterDataListResponse
      if (Array.isArray(response)) {
        return {
          data: response,
          total: response.length,
          page: 1,
          limit: response.length
        };
      }
      return response as MasterDataListResponse<CustomerBusinessType>;
    } catch (error) {
      logger.error('[BusinessTypeService] getList error:', error);
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  },

  /** Get Business Type by ID */
  getById: async (id: string | number): Promise<CustomerBusinessType | null> => {
    if (USE_MOCK) {
      const mockItem = MOCK_BUSINESS_TYPES.find(c => c.business_type_id === id);
      return mockItem || null;
    }
    try {
      return await api.get<CustomerBusinessType>(`/business-type/${id}`);
    } catch (error) {
      logger.error('[BusinessTypeService] getById error:', error);
      return null;
    }
  },

  /** Create New Business Type */
  create: async (payload: Partial<CustomerBusinessType>): Promise<MasterDataResponse<CustomerBusinessType>> => {
    if (USE_MOCK) {
       const newItem = { ...payload, business_type_id: Date.now() } as CustomerBusinessType;
       return { success: true, data: newItem };
    }
    const data = await api.post<CustomerBusinessType>('/business-type', payload);
    return { success: true, data };
  },

  /** Update Business Type */
  update: async (id: string | number, payload: Partial<CustomerBusinessType>): Promise<MasterDataResponse<CustomerBusinessType>> => {
    if (USE_MOCK) {
       return { success: true, data: { ...payload, business_type_id: id } as CustomerBusinessType };
    }
    const data = await api.patch<CustomerBusinessType>(`/business-type/${id}`, payload);
    return { success: true, data };
  },

  /** Delete Business Type */
  delete: async (id: string | number): Promise<MasterDataResponse<null>> => {
    if (USE_MOCK) {
      return { success: true };
    }
    await api.delete(`/business-type/${id}`);
    return { success: true };
  }
};
