import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { 
  MOCK_CUSTOMERS, 
  MOCK_BUSINESS_TYPES, 
  MOCK_CUSTOMER_TYPES, 
  MOCK_CUSTOMER_GROUPS, 
  MOCK_BILLING_GROUPS 
} from '../data/customerData';
import { applyMockFilters, sanitizeId } from '@/core/api/mockUtils';

export const setupCustomerHandlers = (mock: MockAdapter) => {
  // 1. GET Customer List
  mock.onGet('/customer').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    
    // Enhancement Layer: Map relational names for search if needed
    const enhancedData = MOCK_CUSTOMERS.map(cust => ({
      ...cust,
      customer_id: sanitizeId(cust.customer_id),
      business_type_id: sanitizeId(cust.business_type_id),
      customer_type_id: sanitizeId(cust.customer_type_id),
      customer_group_id: sanitizeId(cust.customer_group_id),
      billing_group_id: sanitizeId(cust.billing_group_id),
      business_type_name: MOCK_BUSINESS_TYPES.find(b => b.business_type_id === cust.business_type_id)?.business_type_name_th || '',
      customer_type_name: MOCK_CUSTOMER_TYPES.find(t => t.customer_type_id === cust.customer_type_id)?.customer_type_name_th || '',
      customer_group_name: MOCK_CUSTOMER_GROUPS.find(g => g.customer_group_id === cust.customer_group_id)?.customer_group_name_th || '',
      billing_group_name: MOCK_BILLING_GROUPS.find(bg => bg.billing_group_id === cust.billing_group_id)?.billing_group_name_th || ''
    }));

    const result = applyMockFilters(enhancedData, params, {
      searchableFields: ['customer_code', 'customer_name_th', 'tax_id', 'business_type_name', 'customer_type_name'],
    });

    return [200, result];
  });

  // 2. GET Business Type List
  mock.onGet('/customer/business-type').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    const result = applyMockFilters(MOCK_BUSINESS_TYPES, params, {
      searchableFields: ['business_type_code', 'business_type_name_th', 'business_type_name_en'],
    });
    return [200, result];
  });

  // 3. GET Customer Type List
  mock.onGet('/customer/type').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    const result = applyMockFilters(MOCK_CUSTOMER_TYPES, params, {
      searchableFields: ['customer_type_code', 'customer_type_name_th', 'customer_type_name_en'],
    });
    return [200, result];
  });

  // 4. GET Customer Group List
  mock.onGet('/customer/group').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    const result = applyMockFilters(MOCK_CUSTOMER_GROUPS, params, {
      searchableFields: ['customer_group_code', 'customer_group_name_th', 'customer_group_name_en'],
    });
    return [200, result];
  });

  // 5. GET Billing Group List
  mock.onGet('/customer/billing-group').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    const result = applyMockFilters(MOCK_BILLING_GROUPS, params, {
      searchableFields: ['billing_group_code', 'billing_group_name_th', 'billing_group_name_en'],
    });
    return [200, result];
  });
};
