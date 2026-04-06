import api, { USE_MOCK } from '@/core/api/api';
import type { TableFilters } from '@/shared/hooks/useTableFilters';
import type { MasterDataListResponse, MasterDataResponse } from '@/shared/types/common-master.types';
import type { CustomerType } from '@customer/customer-type/types/customer-type.types';
import { logger } from '@/shared/utils/logger';
import { MOCK_CUSTOMER_TYPES } from '@customer/customer-master/mocks/data/customerData';

export const CustomerTypeService = {
  /** Get Customer Type List */
  getList: async (params?: Partial<TableFilters<string>>): Promise<MasterDataListResponse<CustomerType>> => {
    if (USE_MOCK) {
      return {
        data: MOCK_CUSTOMER_TYPES as unknown as CustomerType[],
        total: MOCK_CUSTOMER_TYPES.length,
        page: 1,
        limit: 100
      };
    }
    try {
      const response = await api.get<unknown>('/customer-type', { params });
      // Normalize response from REAL API (Raw Array) to MasterDataListResponse
      if (Array.isArray(response)) {
        return {
          data: response,
          total: response.length,
          page: 1,
          limit: response.length
        };
      }
      return response as MasterDataListResponse<CustomerType>;
    } catch (error) {
      logger.error('[CustomerTypeService] getList error:', error);
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  },

  /** Get Customer Type by ID */
  getById: async (id: string): Promise<CustomerType | null> => {
    if (USE_MOCK) {
      const mockItem = MOCK_CUSTOMER_TYPES.find(c => c.customer_type_id === id);
      return (mockItem as unknown as CustomerType) || null;
    }
    try {
      return await api.get<CustomerType>(`/customer-type/${id}`);
    } catch (error) {
      logger.error('[CustomerTypeService] getById error:', error);
      return null;
    }
  },

  /** Create New Customer Type */
  create: async (payload: Partial<CustomerType>): Promise<MasterDataResponse<CustomerType>> => {
    if (USE_MOCK) {
      const newId = crypto.randomUUID();
      const newItem: CustomerType = {
        ...payload as CustomerType,
        customer_type_id: newId,
        is_active: payload.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { success: true, data: newItem };
    }
    const data = await api.post<CustomerType>('/customer-type', payload);
    return { success: true, data };
  },

  /** Update Customer Type */
  update: async (id: string, payload: Partial<CustomerType>): Promise<MasterDataResponse<CustomerType>> => {
    if (USE_MOCK) {
      return { success: true, data: { ...payload, customer_type_id: id } as CustomerType };
    }
    const data = await api.patch<CustomerType>(`/customer-type/${id}`, payload);
    return { success: true, data };
  },

  /** Delete Customer Type */
  delete: async (id: string): Promise<MasterDataResponse<null>> => {
    if (USE_MOCK) {
      return { success: true };
    }
    await api.delete(`/customer-type/${id}`);
    return { success: true };
  }
};
