import api, { USE_MOCK } from '@/core/api/api';
import type { TableFilters } from '@/shared/hooks/useTableFilters';
import type { MasterDataListResponse, MasterDataResponse } from '@/shared/types/common-master.types';
import type { CustomerType } from '../types/customer-type.types';
import { logger } from '@/shared/utils/logger';
import { MOCK_CUSTOMER_TYPES } from '@customer/mocks/data/customerData';

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
      return await api.get<MasterDataListResponse<CustomerType>>('/customer-type', { params });
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
    return await api.post<MasterDataResponse<CustomerType>>('/customer-type', payload);
  },

  /** Update Customer Type */
  update: async (id: string, payload: Partial<CustomerType>): Promise<MasterDataResponse<CustomerType>> => {
    if (USE_MOCK) {
      return { success: true, data: { ...payload, customer_type_id: id } as CustomerType };
    }
    return await api.put<MasterDataResponse<CustomerType>>(`/customer-type/${id}`, payload);
  },

  /** Delete Customer Type */
  delete: async (id: string): Promise<MasterDataResponse<null>> => {
    if (USE_MOCK) {
      return { success: true };
    }
    return await api.delete<MasterDataResponse<null>>(`/customer-type/${id}`);
  }
};
