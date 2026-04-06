import api, { USE_MOCK } from '@/core/api/api';
import type { TableFilters } from '@/shared/hooks/useTableFilters';
import type { MasterDataListResponse, MasterDataResponse } from '@/shared/types/common-master.types';
import type { CustomerGroup } from '@customer/customer-group/types/customer-group.types';
import { logger } from '@/shared/utils/logger';
import { MOCK_CUSTOMER_GROUPS } from '@customer/customer-master/mocks/data/customerData';

export const CustomerGroupService = {
  /** Get Customer Group List */
  getList: async (params?: Partial<TableFilters<string>>): Promise<MasterDataListResponse<CustomerGroup>> => {
    if (USE_MOCK) {
      return {
        data: MOCK_CUSTOMER_GROUPS as unknown as CustomerGroup[],
        total: MOCK_CUSTOMER_GROUPS.length,
        page: 1,
        limit: 100
      };
    }
    try {
      const response = await api.get<unknown>('/customer-group', { params });
      // Normalize response from REAL API (Raw Array) to MasterDataListResponse
      if (Array.isArray(response)) {
        return {
          data: response,
          total: response.length,
          page: 1,
          limit: response.length
        };
      }
      return response as MasterDataListResponse<CustomerGroup>;
    } catch (error) {
      logger.error('[CustomerGroupService] getList error:', error);
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  },

  /** Get Customer Group by ID */
  getById: async (id: string | number): Promise<CustomerGroup | null> => {
    if (USE_MOCK) {
      const mockItem = MOCK_CUSTOMER_GROUPS.find(c => c.customer_group_id === id);
      return (mockItem as unknown as CustomerGroup) || null;
    }
    try {
      return await api.get<CustomerGroup>(`/customer-group/${id}`);
    } catch (error) {
      logger.error('[CustomerGroupService] getById error:', error);
      return null;
    }
  },

  /** Create New Customer Group */
  create: async (payload: Partial<CustomerGroup>): Promise<MasterDataResponse<CustomerGroup>> => {
    if (USE_MOCK) {
       const newItem = { ...payload, customer_group_id: Date.now() } as CustomerGroup;
       return { success: true, data: newItem };
    }
    const data = await api.post<CustomerGroup>('/customer-group', payload);
    return { success: true, data };
  },

  /** Update Customer Group */
  update: async (id: string | number, payload: Partial<CustomerGroup>): Promise<MasterDataResponse<CustomerGroup>> => {
    if (USE_MOCK) {
       return { success: true, data: { ...payload, customer_group_id: id } as CustomerGroup };
    }
    const data = await api.patch<CustomerGroup>(`/customer-group/${id}`, payload);
    return { success: true, data };
  },

  /** Delete Customer Group */
  delete: async (id: string | number): Promise<MasterDataResponse<null>> => {
    if (USE_MOCK) {
      return { success: true };
    }
    await api.delete(`/customer-group/${id}`);
    return { success: true };
  }
};
