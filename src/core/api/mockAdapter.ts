import MockAdapter from 'axios-mock-adapter';
import type { AxiosInstance } from 'axios';
import { 
  MOCK_PRS, 
  MOCK_RFQS, 
  MOCK_QTS, 
  MOCK_POS 
} from '@/modules/procurement/mocks/procurementMocks';
import { MOCK_VENDORS } from '@/modules/master-data/vendor/mocks/vendorMocks';
import { mockEmployees } from '@/modules/master-data/company/mocks/employeeMocks';
import { logger } from '@/shared/utils/logger';

/**
 * Setup Centralized Mocks
 */
export const setupMocks = (axiosInstance: AxiosInstance) => {
  const mock = new MockAdapter(axiosInstance, { delayResponse: 500 });

  // =========================================================================
  // AUTH MOCKS
  // =========================================================================

  mock.onPost('/auth/login').reply(200, {
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwidXNlcm5hbWUiOiJqb2huLmRvZTEiLCJpYXQiOjE3MzgzMjAwMDAsImV4cCI6MTczODQwNjQwMH0.mock_signature_for_dev",
    user: {
      id: 2,
      username: "john.doe1",
      employee_id: 2,
      employee: {
        employee_id: 2,
        branch_id: 1,
        employee_code: "EMP0003",
        employee_fullname: "นาย สมชาย ใจดี",
        position_id: 1,
        department_id: 1
      }
    }
  });

  // =========================================================================
  // PR MOCKS
  // =========================================================================
  
  mock.onGet('/pr').reply((config) => {
    const params = config.params || {};
    let filtered = [...MOCK_PRS];
    if (params.q) {
      const q = params.q.toLowerCase();
      filtered = filtered.filter(p => p.pr_no.toLowerCase().includes(q));
    }
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter(p => p.status === params.status);
    }
    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    return [200, {
      items: filtered.slice(startIndex, startIndex + limit),
      total: filtered.length,
      page,
      limit
    }];
  });

  mock.onGet(/\/pr\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = MOCK_PRS.find(p => p.pr_id === id);
    return found ? [200, found] : [404, { message: 'PR Not Found' }];
  });

  mock.onPost('/pr').reply((config) => {
    const data = JSON.parse(config.data);
    return [200, { ...data, pr_id: `mock-${Date.now()}`, pr_no: `PR-MOCK-${Date.now()}` }];
  });

  // =========================================================================
  // RFQ MOCKS
  // =========================================================================
  
  mock.onGet('/rfq').reply((config) => {
    const params = config.params || {};
    let filtered = [...MOCK_RFQS];
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter(r => r.status === params.status);
    }
    return [200, { data: filtered, total: filtered.length, page: 1, limit: 100 }];
  });

  mock.onGet(/\/rfq\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = MOCK_RFQS.find(r => r.rfq_id === id);
    return found ? [200, found] : [404, { message: 'RFQ Not Found' }];
  });

  // =========================================================================
  // QT MOCKS
  // =========================================================================
  
  mock.onGet('/qt').reply(200, { data: MOCK_QTS, total: MOCK_QTS.length, page: 1, limit: 100 });

  // =========================================================================
  // PO MOCKS
  // =========================================================================
  
  mock.onGet('/purchase-orders').reply((config) => {
    const params = config.params || {};
    let filtered = [...MOCK_POS];
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter(p => p.status === params.status);
    }
    return [200, { data: filtered, total: filtered.length, page: 1, limit: 100 }];
  });

  // =========================================================================
  // OTHER MOCKS
  // =========================================================================

  mock.onGet('/vendors').reply(200, { items: MOCK_VENDORS, total: MOCK_VENDORS.length });
  mock.onGet('/employees').reply(200, mockEmployees);

  logger.info('🎭 [Mock Adapter] Initialized with Centralized Routes');
};
