import MockAdapter from 'axios-mock-adapter';
import type { AxiosInstance } from 'axios';
import { 
  MOCK_PRS, 
  MOCK_RFQS, 
  MOCK_QTS, 
  MOCK_POS 
} from '@/modules/procurement/mocks/procurementMocks';
import { MOCK_VENDORS } from '@/modules/master-data/vendor/mocks/vendorMocks';
import { 
  mockBranches, 
  mockBranchDropdown,
  mockDepartments,
  mockSections,
  mockJobs,
  mockEmployeeGroups,
  mockPositions,
  mockSalesZones,
  mockSalesChannels,
  mockSalesTargets,
  mockEmployees 
} from '@/modules/master-data/mocks/masterDataMocks';
import type { 
  EmployeeGroupListItem, 
  EmployeeListItem 
} from '@/modules/master-data/types/master-data-types';
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
  // COMPANY MASTER DATA MOCKS
  // =========================================================================

  // --- BRANCHES ---
  mock.onGet('/org-branches').reply(200, mockBranches);
  mock.onGet('/org-branches/dropdown').reply(200, mockBranchDropdown);
  mock.onGet(/\/org-branches\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockBranches.find(b => b.branch_id === id);
    return found ? [200, found] : [404, { message: 'Branch Not Found' }];
  });
  mock.onPost('/org-branches').reply(200, { success: true });
  mock.onPut(/\/org-branches\/.+/).reply(200, { success: true });
  mock.onDelete(/\/org-branches\/.+/).reply(200, true);

  // --- DEPARTMENTS ---
  mock.onGet('/org-departments').reply(200, mockDepartments);
  mock.onGet(/\/org-departments\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockDepartments.find(d => d.department_id === id);
    return found ? [200, found] : [404, { message: 'Department Not Found' }];
  });
  mock.onPost('/org-departments').reply(200, { success: true });
  mock.onPut(/\/org-departments\/.+/).reply(200, { success: true });
  mock.onDelete(/\/org-departments\/.+/).reply(200, true);

  // --- SECTIONS ---
  mock.onGet('/org-sections').reply(200, mockSections);
  mock.onGet(/\/org-sections\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockSections.find(s => s.section_id === id);
    return found ? [200, found] : [404, { message: 'Section Not Found' }];
  });
  mock.onPost('/org-sections').reply(200, { success: true });
  mock.onPut(/\/org-sections\/.+/).reply(200, { success: true });
  mock.onDelete(/\/org-sections\/.+/).reply(200, true);

  // --- JOBS ---
  mock.onGet('/org-jobs').reply(200, mockJobs);
  mock.onGet(/\/org-jobs\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockJobs.find(j => j.job_id === id);
    return found ? [200, found] : [404, { message: 'Job Not Found' }];
  });
  mock.onPost('/org-jobs').reply(200, { success: true });
  mock.onPut(/\/org-jobs\/.+/).reply(200, { success: true });
  mock.onDelete(/\/org-jobs\/.+/).reply(200, true);

  // --- POSITIONS ---
  mock.onGet('/org-positions').reply(200, mockPositions);
  mock.onGet(/\/org-positions\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockPositions.find(p => p.position_id === id);
    return found ? [200, found] : [404, { message: 'Position Not Found' }];
  });
  mock.onPost('/org-positions').reply(200, { success: true });
  mock.onPut(/\/org-positions\/.+/).reply(200, { success: true });
  mock.onDelete(/\/org-positions\/.+/).reply(200, true);

  // --- EMPLOYEE GROUPS ---
  mock.onGet('/org-employee-groups').reply(200, mockEmployeeGroups);
  mock.onGet(/\/org-employee-groups\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockEmployeeGroups.find((g: EmployeeGroupListItem) => g.group_id === id);
    return found ? [200, found] : [404, { message: 'Group Not Found' }];
  });
  mock.onPost('/org-employee-groups').reply(200, { success: true });
  mock.onPut(/\/org-employee-groups\/.+/).reply(200, { success: true });
  mock.onDelete(/\/org-employee-groups\/.+/).reply(200, true);

  // --- EMPLOYEES ---
  mock.onGet('/org-employees').reply(200, mockEmployees);
  mock.onGet(/\/org-employees\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockEmployees.find((e: EmployeeListItem) => e.employee_id === id);
    return found ? [200, found] : [404, { message: 'Employee Not Found' }];
  });
  mock.onPost('/org-employees').reply(200, { success: true });
  mock.onPut(/\/org-employees\/.+/).reply(200, { success: true });
  mock.onDelete(/\/org-employees\/.+/).reply(200, true);

  // --- SALES ---
  mock.onGet('/org-sales-zones').reply(200, mockSalesZones);
  mock.onGet('/org-sales-channels').reply(200, mockSalesChannels);
  mock.onGet('/org-sales-targets').reply(200, mockSalesTargets);

  // =========================================================================
  // OTHER MOCKS
  // =========================================================================

  mock.onGet('/vendors').reply(200, { items: MOCK_VENDORS, total: MOCK_VENDORS.length });
  mock.onGet('/employees').reply(200, mockEmployees);

  // --- CURRENCY ---
  mock.onGet('/master-data/currencies').reply(200, {
    items: [
        { currency_id: '1', currency_code: 'THB', name_th: 'บาทไทย', name_en: 'Thai Baht', symbol: '฿', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
        { currency_id: '2', currency_code: 'USD', name_th: 'ดอลลาร์สหรัฐ', name_en: 'US Dollar', symbol: '$', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    ],
    total: 2, page: 1, limit: 20
  });

  mock.onGet('/master-data/exchange-rate-types').reply(200, {
    items: [
        { currency_type_id: '1', code: 'SPOT', name_th: 'อัตราแลกเปลี่ยนทันที', name_en: 'Spot Exchange Rate', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    ],
    total: 1, page: 1, limit: 20
  });

  mock.onGet('/master-data/exchange-rates').reply(200, {
    items: [
        { 
            exchange_id: '1', currency_id: '1', currency_code: 'THB', currency_type_id: '1', type_name: 'อัตราขาย', 
            buy_rate: 1.0, sale_rate: 1.0, rate_date: new Date().toISOString(), remark: 'Mock', is_active: true 
        },
    ],
    total: 1, page: 1, limit: 20
  });

  logger.info('🎭 [Mock Adapter] Initialized with Centralized Routes');
};
