import api, { USE_MOCK } from '@/core/api/api';
import type { TableFilters } from '@/shared/hooks/useTableFilters';
import type { 
  CustomerMaster, 
  CustomerBusinessType, 
  CustomerType, 
  CustomerGroup, 
  CustomerBillingGroup,
  CustomerStatus
} from '@customer/types/customer-types';
import { 
  MOCK_CUSTOMERS, 
  MOCK_BUSINESS_TYPES, 
  MOCK_CUSTOMER_TYPES, 
  MOCK_CUSTOMER_GROUPS, 
  MOCK_BILLING_GROUPS 
} from '@customer/mocks/data/customerData';
import { logger } from '@/shared/utils/logger';
import type { MasterDataListResponse, MasterDataResponse } from '@/shared/types/common-master.types';

/** Local Store for Mock Persistence */
let localCustomers: CustomerMaster[] = [...MOCK_CUSTOMERS];

/**
 * CustomerService
 * Handle all Customer-related Master Data requests
 */
export const CustomerService = {
  /** Get Customer List (Main) */
  getList: async (params?: Partial<TableFilters<CustomerStatus>>): Promise<MasterDataListResponse<CustomerMaster>> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Customer List');
       return {
         data: localCustomers,
         total: localCustomers.length,
         page: 1,
         limit: 100
       };
    }
    try {
      return await api.get<MasterDataListResponse<CustomerMaster>>('/customer', { params });
    } catch (error) {
      logger.error('[CustomerService] getList error:', error);
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  },

  /** Get Business Types (Setup) */
  getBusinessTypes: async (params?: Partial<TableFilters<string>>): Promise<MasterDataListResponse<CustomerBusinessType>> => {
    if (USE_MOCK) {
       return { data: MOCK_BUSINESS_TYPES, total: MOCK_BUSINESS_TYPES.length, page: 1, limit: 100 };
    }
    return await api.get<MasterDataListResponse<CustomerBusinessType>>('/customer/business-type', { params });
  },

  /** Get Customer Types (Setup) */
  getCustomerTypes: async (params?: Partial<TableFilters<string>>): Promise<MasterDataListResponse<CustomerType>> => {
    if (USE_MOCK) {
       return { data: MOCK_CUSTOMER_TYPES, total: MOCK_CUSTOMER_TYPES.length, page: 1, limit: 100 };
    }
    return await api.get<MasterDataListResponse<CustomerType>>('/customer/type', { params });
  },

  /** Get Customer Groups (Setup) */
  getCustomerGroups: async (params?: Partial<TableFilters<string>>): Promise<MasterDataListResponse<CustomerGroup>> => {
    if (USE_MOCK) {
       return { data: MOCK_CUSTOMER_GROUPS, total: MOCK_CUSTOMER_GROUPS.length, page: 1, limit: 100 };
    }
    return await api.get<MasterDataListResponse<CustomerGroup>>('/customer/group', { params });
  },

  /** Get Billing Groups (Setup) */
  getBillingGroups: async (params?: Partial<TableFilters<string>>): Promise<MasterDataListResponse<CustomerBillingGroup>> => {
    if (USE_MOCK) {
       return { data: MOCK_BILLING_GROUPS, total: MOCK_BILLING_GROUPS.length, page: 1, limit: 100 };
    }
    return await api.get<MasterDataListResponse<CustomerBillingGroup>>('/customer/billing-group', { params });
  },

  /** Get Customer Detail */
  getById: async (id: string): Promise<CustomerMaster | null> => {
    if (USE_MOCK) {
      return localCustomers.find(c => c.customer_id === id) || null;
    }
    try {
      return await api.get<CustomerMaster>(`/customer/${id}`);
    } catch (error) {
      logger.error('[CustomerService] getById error:', error);
      return null;
    }
  },

  /** Create New Customer */
  create: async (payload: Partial<CustomerMaster>): Promise<MasterDataResponse<CustomerMaster>> => {
    if (USE_MOCK) {
      const newId = `CUS-${Date.now()}`;
      const newCustomer: CustomerMaster = {
        ...payload as CustomerMaster, // Mock assumption
        customer_id: newId,
        id: newId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localCustomers.unshift(newCustomer);
      return { success: true, data: newCustomer };
    }
    return await api.post<MasterDataResponse<CustomerMaster>>('/customer', payload);
  },

  /** Update Customer */
  update: async (id: string, payload: Partial<CustomerMaster>): Promise<MasterDataResponse<CustomerMaster>> => {
    if (USE_MOCK) {
      const index = localCustomers.findIndex(c => c.customer_id === id);
      if (index !== -1) {
        localCustomers[index] = { ...localCustomers[index], ...payload, updated_at: new Date().toISOString() };
        return { success: true, data: localCustomers[index] };
      }
      return { success: false, message: 'Not found' };
    }
    return await api.put<MasterDataResponse<CustomerMaster>>(`/customer/${id}`, payload);
  },

  /** Delete Customer */
  delete: async (id: string): Promise<MasterDataResponse<null>> => {
    if (USE_MOCK) {
      localCustomers = localCustomers.filter(c => c.customer_id !== id);
      return { success: true };
    }
    return await api.delete<MasterDataResponse<null>>(`/customer/${id}`);
  }
};
