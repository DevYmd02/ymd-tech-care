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
import type { CustomerMaster } from '../../types/customer-types';

/** Local Persistence Store */
let localCustomers = [...MOCK_CUSTOMERS];

export const setupCustomerHandlers = (mock: MockAdapter) => {
  // ===========================================================================
  // MAIN CUSTOMER ENDPOINTS
  // ===========================================================================

  // 1. GET Customer List
  mock.onGet('/customer-master').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    
    // Enhancement Layer: Map relational names for search
    const enhancedData = localCustomers.map(cust => ({
      ...cust,
      customer_id: sanitizeId(cust.customer_id),
      business_type_id: sanitizeId(cust.business_type_id),
      customer_type_id: sanitizeId(cust.customer_type_id),
      customer_group_id: sanitizeId(cust.customer_group_id),
      billing_group_id: sanitizeId(cust.billing_group_id),
      business_type_name: MOCK_BUSINESS_TYPES.find(b => b.business_type_id === cust.business_type_id)?.business_type_name || '',
      customer_type_name: MOCK_CUSTOMER_TYPES.find(t => t.customer_type_id === String(cust.customer_type_id))?.customer_type_name || '',
      customer_group_name: MOCK_CUSTOMER_GROUPS.find(g => g.customer_group_id === cust.customer_group_id)?.customer_group_name || '',
      billing_group_name: MOCK_BILLING_GROUPS.find(bg => bg.bill_group_id === cust.billing_group_id)?.bill_group_name || ''
    }));

    const result = applyMockFilters(enhancedData, params, {
      searchableFields: ['customer_code', 'customer_name_th', 'tax_id', 'business_type_name', 'customer_type_name'],
    });

    return [200, result];
  });

  // 2. GET Customer Detail
  mock.onGet(/\/customer-master\/\d+/).reply((config) => {
    const id = parseInt(config.url?.split('/').pop() || '0');
    const customer = localCustomers.find(c => c.customer_id === id);
    return customer ? [200, customer] : [404, { message: 'Customer not found' }];
  });

  // 3. POST Create Customer
  mock.onPost('/customer-master').reply((config) => {
    const payload = JSON.parse(config.data);
    const newId = Math.floor(Math.random() * 1000000);
    const newCustomer: CustomerMaster = {
      ...payload,
      customer_id: newId,
      id: newId,
      is_active: true,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localCustomers.unshift(newCustomer);
    return [201, newCustomer];
  });

  // 4. PATCH Update Customer
  mock.onPatch(/\/customer-master\/\d+/).reply((config) => {
    const id = parseInt(config.url?.split('/').pop() || '0');
    const payload = JSON.parse(config.data);
    const index = localCustomers.findIndex(c => c.customer_id === id);
    
    if (index !== -1) {
      localCustomers[index] = { 
        ...localCustomers[index], 
        ...payload, 
        updated_at: new Date().toISOString() 
      };
      return [200, localCustomers[index]];
    }
    return [404, { message: 'Customer not found' }];
  });

  // 5. DELETE Customer
  mock.onDelete(/\/customer-master\/\d+/).reply((config) => {
    const id = parseInt(config.url?.split('/').pop() || '0');
    localCustomers = localCustomers.filter(c => c.customer_id !== id);
    return [204];
  });

  // ===========================================================================
  // MASTER DATA LOOKUPS
  // ===========================================================================

  // Business Type List
  mock.onGet('/customer-master/business-type').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    const result = applyMockFilters(MOCK_BUSINESS_TYPES, params, {
      searchableFields: ['business_type_code', 'business_type_name'],
    });
    return [200, result];
  });

  // Customer Type List
  mock.onGet('/customer-master/type').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    const result = applyMockFilters(MOCK_CUSTOMER_TYPES, params, {
      searchableFields: ['customer_type_code', 'customer_type_name'],
    });
    return [200, result];
  });

  // Customer Group List
  mock.onGet('/customer-master/group').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    const result = applyMockFilters(MOCK_CUSTOMER_GROUPS, params, {
      searchableFields: ['customer_group_code', 'customer_group_name'],
    });
    return [200, result];
  });

  // Billing Group List
  mock.onGet('/customer-master/billing-group').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    const result = applyMockFilters(MOCK_BILLING_GROUPS, params, {
      searchableFields: ['bill_group_code', 'bill_group_name'],
    });
    return [200, result];
  });
};
