import api from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import type { TableFilters } from '@/shared/hooks/useTableFilters';
import type { 
  CustomerMaster, 
  CustomerBusinessType, 
  CustomerGroup, 
  CustomerBillingGroup,
  CustomerStatus
} from '@customer/customer-master/types/customer-types';
import type { MasterDataListResponse, MasterDataResponse } from '@/shared/types/common-master.types';

export const CustomerService = {
  /** Get Customer List (Main) */
  getList: async (params?: Partial<TableFilters<CustomerStatus>>, config?: AxiosRequestConfig): Promise<MasterDataListResponse<CustomerMaster>> => {
    const response = await api.get<unknown>('/customer-master', { ...config, params });
    
    // Handle array or object response from API
    if (Array.isArray(response)) {
      return {
        data: response,
        total: response.length,
        page: 1,
        limit: response.length
      };
    }
    return response as MasterDataListResponse<CustomerMaster>;
  },

  /** Get Business Types (Setup) */
  getBusinessTypes: async (params?: Partial<TableFilters<string>>, config?: AxiosRequestConfig): Promise<MasterDataListResponse<CustomerBusinessType>> => {
    const response = await api.get<unknown>('/customer-master/business-type', { ...config, params });
    if (Array.isArray(response)) {
      return { data: response, total: response.length, page: 1, limit: response.length };
    }
    return response as MasterDataListResponse<CustomerBusinessType>;
  },

  /** Get Customer Groups (Setup) */
  getCustomerGroups: async (params?: Partial<TableFilters<string>>, config?: AxiosRequestConfig): Promise<MasterDataListResponse<CustomerGroup>> => {
    const response = await api.get<unknown>('/customer-master/group', { ...config, params });
    if (Array.isArray(response)) {
      return { data: response, total: response.length, page: 1, limit: response.length };
    }
    return response as MasterDataListResponse<CustomerGroup>;
  },

  /** Get Billing Groups (Setup) */
  getBillingGroups: async (params?: Partial<TableFilters<string>>, config?: AxiosRequestConfig): Promise<MasterDataListResponse<CustomerBillingGroup>> => {
    const response = await api.get<unknown>('/customer-master/billing-group', { ...config, params });
    if (Array.isArray(response)) {
      return { data: response, total: response.length, page: 1, limit: response.length };
    }
    return response as MasterDataListResponse<CustomerBillingGroup>;
  },

  /** Get Customer Detail */
  getById: async (id: number, config?: AxiosRequestConfig): Promise<CustomerMaster | null> => {
    return await api.get<CustomerMaster>(`/customer-master/${id}`, config);
  },

  /** Create New Customer */
  create: async (payload: Partial<CustomerMaster>): Promise<MasterDataResponse<CustomerMaster>> => {
    const response = await api.post<CustomerMaster>('/customer-master', payload);
    return { success: true, data: response };
  },

  /** Update Customer */
  update: async (id: number, payload: Partial<CustomerMaster>): Promise<MasterDataResponse<CustomerMaster>> => {
    const response = await api.patch<CustomerMaster>(`/customer-master/${id}`, payload);
    return { success: true, data: response };
  },

  /** Delete Customer */
  delete: async (id: number): Promise<MasterDataResponse<null>> => {
    await api.delete(`/customer-master/${id}`);
    return { success: true };
  }
};

