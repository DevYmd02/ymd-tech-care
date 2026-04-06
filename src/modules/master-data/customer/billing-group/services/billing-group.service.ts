import api, { USE_MOCK } from '@/core/api/api';
import type { TableFilters } from '@/shared/hooks/useTableFilters';
import type { MasterDataListResponse, MasterDataResponse } from '@/shared/types/common-master.types';
import type { CustomerBillingGroup } from '../types/billing-group.types';
import { logger } from '@/shared/utils/logger';

// Mock data integration for testing if needed
const MOCK_BILLING_GROUPS: CustomerBillingGroup[] = []; 

export const BillingGroupService = {
  /** Get Billing Group List */
  getList: async (params?: Partial<TableFilters<string>>): Promise<MasterDataListResponse<CustomerBillingGroup>> => {
    if (USE_MOCK) {
      return {
        data: MOCK_BILLING_GROUPS,
        total: MOCK_BILLING_GROUPS.length,
        page: 1,
        limit: 100
      };
    }
    try {
      const response = await api.get<unknown>('/bill-group', { params });
      // Normalize response from REAL API (Raw Array) to MasterDataListResponse
      if (Array.isArray(response)) {
        return {
          data: response,
          total: response.length,
          page: 1,
          limit: response.length
        };
      }
      return response as MasterDataListResponse<CustomerBillingGroup>;
    } catch (error) {
      logger.error('[BillingGroupService] getList error:', error);
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  },

  /** Get Billing Group by ID */
  getById: async (id: string | number): Promise<CustomerBillingGroup | null> => {
    if (USE_MOCK) {
      const mockItem = MOCK_BILLING_GROUPS.find(c => c.bill_group_id === id);
      return mockItem || null;
    }
    try {
      return await api.get<CustomerBillingGroup>(`/bill-group/${id}`);
    } catch (error) {
      logger.error('[BillingGroupService] getById error:', error);
      return null;
    }
  },

  /** Create New Billing Group */
  create: async (payload: Partial<CustomerBillingGroup>): Promise<MasterDataResponse<CustomerBillingGroup>> => {
    if (USE_MOCK) {
       const newItem = { ...payload, bill_group_id: Date.now() } as CustomerBillingGroup;
       return { success: true, data: newItem };
    }
    const data = await api.post<CustomerBillingGroup>('/bill-group', payload);
    return { success: true, data };
  },

  /** Update Billing Group */
  update: async (id: string | number, payload: Partial<CustomerBillingGroup>): Promise<MasterDataResponse<CustomerBillingGroup>> => {
    if (USE_MOCK) {
       return { success: true, data: { ...payload, bill_group_id: id } as CustomerBillingGroup };
    }
    const data = await api.patch<CustomerBillingGroup>(`/bill-group/${id}`, payload);
    return { success: true, data };
  },

  /** Delete Billing Group */
  delete: async (id: string | number): Promise<MasterDataResponse<null>> => {
    if (USE_MOCK) {
      return { success: true };
    }
    await api.delete(`/bill-group/${id}`);
    return { success: true };
  }
};
