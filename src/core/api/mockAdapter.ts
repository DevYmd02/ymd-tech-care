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
import type { CreatePRPayload, CreatePRLineItem } from '@/modules/procurement/types/pr-types';
import { logger } from '@/shared/utils/logger';

/**
 * Generic helper to apply sorting and pagination to mock data arrays
 */
const applyMockFilters = <T>(data: T[], params: Record<string, string | number | boolean | undefined>) => {
  const processed = [...data];
  
  // 1. Sorting
  if (typeof params.sort === 'string') {
    const [key, direction] = params.sort.split(':');
    processed.sort((a, b) => {
      const valA = a[key as keyof T];
      const valB = b[key as keyof T];
      
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      
      let comparison = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        comparison = valA === valB ? 0 : (valA ? 1 : -1);
      } else {
        // Fallback for mixed or other types
        comparison = String(valA).localeCompare(String(valB));
      }
      
      return direction === 'desc' ? -comparison : comparison;
    });
  }
  
  // 2. Pagination
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const total = processed.length;
  const startIndex = (page - 1) * limit;
  const items = processed.slice(startIndex, startIndex + limit);
  
  return { items, data: items, total, page, limit };
};

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
    
    // 1. Search by PR No (q)
    if (params.q) {
      const q = String(params.q).toLowerCase();
      filtered = filtered.filter(p => p.pr_no.toLowerCase().includes(q));
    }

    // 2. Search by Requester (created_by)
    if (params.created_by) {
      const q = String(params.created_by).toLowerCase();
      filtered = filtered.filter(p => p.requester_name.toLowerCase().includes(q));
    }

    // 3. Search by Department
    if (params.department) {
      const q = String(params.department).toLowerCase();
      // Simple mock filter: check if cost_center_id contains the query (or map to name if feasible)
      filtered = filtered.filter(p => p.cost_center_id.toLowerCase().includes(q));
    }

    // 4. Status Filter
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter(p => p.status === params.status);
    }

    // 5. Date Range Filter
    if (params.date_from) {
      const fromDate = new Date(params.date_from as string);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(p => {
        const prDate = new Date(p.request_date);
        return prDate >= fromDate;
      });
    }

    if (params.date_to) {
      const toDate = new Date(params.date_to as string);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(p => {
        const prDate = new Date(p.request_date);
        return prDate <= toDate;
      });
    }
    
    return [200, applyMockFilters(filtered, params)];
  });

  mock.onGet(/\/pr\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = MOCK_PRS.find(p => p.pr_id === id);
    return found ? [200, found] : [404, { message: 'PR Not Found' }];
  });

  // Helper: Generate next PR Number (PR-YYYYMM-XXXX)
  const generateNextPRNumber = (items: typeof MOCK_PRS) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `PR-${year}${month}`;
    
    // Find max sequence for current month
    const maxSeq = items
      .filter(p => p.pr_no && p.pr_no.startsWith(prefix))
      .reduce((max, p) => {
        const parts = p.pr_no.split('-');
        const seq = parseInt(parts[2] || '0', 10);
        return seq > max ? seq : max;
      }, 0);

    const nextNum = `${prefix}-${String(maxSeq + 1).padStart(4, '0')}`;
    logger.info(`[MockAdapter] Generated PR No: ${nextNum} | MaxSeq: ${maxSeq} | Items Checked: ${items.length}`);
    return nextNum;
  };

  mock.onPost('/pr').reply((config) => {
    const data = JSON.parse(config.data) as CreatePRPayload;
    
    // Generate IDs
    const newPrId = `pr-${Date.now()}`;
    // Defer official number generation
    const newPrNo = `DRAFT-TEMP-${Date.now()}`;

    const newPR = {
      ...data,
      pr_id: newPrId,
      pr_no: newPrNo,
      status: 'DRAFT' as const, // Enforce DRAFT
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lines: (data.items || []).map((item: CreatePRLineItem, index: number) => ({
        ...item,
        pr_line_id: `l-${Date.now()}-${index}`,
        line_no: index + 1,
        // Ensure required fields for PRLine are present or defaulted
        item_id: item.item_id || `temp-item-${index}`, 
        quantity: item.qty,
        est_unit_price: item.price,
        est_amount: item.qty * item.price,
        needed_date: item.needed_date || new Date().toISOString().split('T')[0]
      }))
    };
    
    // Persist to Mock Data
    // @ts-expect-error - Partial match for mock data vs full PRHeader
    MOCK_PRS.unshift(newPR);
    
    return [200, newPR];
  });

  // DELETE handler - Only allowed for DRAFT status
  mock.onDelete(/\/pr\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const pr = MOCK_PRS.find(p => p.pr_id === id);
    
    if (!pr) {
      return [404, { message: 'PR Not Found' }];
    }

    if (pr.status !== 'DRAFT') {
      return [400, { success: false, message: 'ไม่อนุญาตให้ลบเอกสารที่ไม่ได้อยู่ในสถานะแบบร่าง (ONLY DRAFT documents can be deleted)' }];
    }
    
    const index = MOCK_PRS.indexOf(pr);
    MOCK_PRS.splice(index, 1); // Remove from array
    return [200, { success: true }];
  });

  mock.onPost(/\/pr\/.+\/submit/).reply((config) => {
    const id = config.url?.split('/')[2]; // /pr/{id}/submit
    const pr = MOCK_PRS.find(p => p.pr_id === id);
    if (pr) {
      // Generate official number if it's still a temporary one
      if (pr.pr_no.startsWith('DRAFT-TEMP')) {
          pr.pr_no = generateNextPRNumber(MOCK_PRS);
      }
      pr.status = 'PENDING';
      return [200, { success: true, message: 'ส่งอนุมัติสำเร็จ', pr_no: pr.pr_no }];
    }
    return [404, { success: false, message: 'ไม่พบเอกสาร' }];
  });

  mock.onPost(/\/pr\/.+\/approve/).reply((config) => {
    const id = config.url?.split('/')[2];
    const pr = MOCK_PRS.find(p => p.pr_id === id);
    if (pr) {
      pr.status = 'APPROVED';
      return [200, { success: true, message: 'อนุมัติสำเร็จ' }];
    }
    return [404, { success: false, message: 'ไม่พบเอกสาร' }];
  });

  mock.onPost(/\/pr\/.+\/reject/).reply((config) => {
    const id = config.url?.split('/')[2];
    const pr = MOCK_PRS.find(p => p.pr_id === id);
    if (pr) {
      pr.status = 'REJECTED';
      return [200, { success: true, message: 'ไม่อนุมัติสำเร็จ' }];
    }
    return [404, { success: false, message: 'ไม่พบเอกสาร' }];
  });

  mock.onPost(/\/pr\/.+\/cancel/).reply((config) => {
    const id = config.url?.split('/')[2]; // /pr/{id}/cancel
    const pr = MOCK_PRS.find(p => p.pr_id === id);
    if (pr) {
      pr.status = 'CANCELLED';
      pr.cancelflag = 'Y';
      return [200, { success: true, message: 'ยกเลิกสำเร็จ' }];
    }
    return [404, { success: false, message: 'ไม่พบเอกสาร' }];
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
    return [200, applyMockFilters(filtered, params)];
  });

  mock.onGet(/\/rfq\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = MOCK_RFQS.find(r => r.rfq_id === id);
    return found ? [200, found] : [404, { message: 'RFQ Not Found' }];
  });

  // =========================================================================
  // QT MOCKS
  // =========================================================================
  
  mock.onGet('/qt').reply((config) => {
    return [200, applyMockFilters(MOCK_QTS, config.params || {})];
  });

  // =========================================================================
  // PO MOCKS
  // =========================================================================
  
  mock.onGet('/purchase-orders').reply((config) => {
    const params = config.params || {};
    let filtered = [...MOCK_POS];
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter(p => p.status === params.status);
    }
    return [200, applyMockFilters(filtered, params)];
  });

  // =========================================================================
  // COMPANY MASTER DATA MOCKS
  // =========================================================================

  // --- BRANCHES ---
  mock.onGet('/org-branches').reply((config) => [200, applyMockFilters(mockBranches, config.params || {})]);
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
  mock.onGet('/org-departments').reply((config) => [200, applyMockFilters(mockDepartments, config.params || {})]);
  mock.onGet(/\/org-departments\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockDepartments.find(d => d.department_id === id);
    return found ? [200, found] : [404, { message: 'Department Not Found' }];
  });
  mock.onPost('/org-departments').reply(200, { success: true });
  mock.onPut(/\/org-departments\/.+/).reply(200, { success: true });
  mock.onDelete(/\/org-departments\/.+/).reply(200, true);

  // --- SECTIONS ---
  mock.onGet('/org-sections').reply((config) => [200, applyMockFilters(mockSections, config.params || {})]);
  mock.onGet(/\/org-sections\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockSections.find(s => s.section_id === id);
    return found ? [200, found] : [404, { message: 'Section Not Found' }];
  });
  mock.onPost('/org-sections').reply(200, { success: true });
  mock.onPut(/\/org-sections\/.+/).reply(200, { success: true });
  mock.onDelete(/\/org-sections\/.+/).reply(200, true);

  // --- JOBS ---
  mock.onGet('/org-jobs').reply((config) => [200, applyMockFilters(mockJobs, config.params || {})]);
  mock.onGet(/\/org-jobs\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockJobs.find(j => j.job_id === id);
    return found ? [200, found] : [404, { message: 'Job Not Found' }];
  });
  mock.onPost('/org-jobs').reply(200, { success: true });
  mock.onPut(/\/org-jobs\/.+/).reply(200, { success: true });
  mock.onDelete(/\/org-jobs\/.+/).reply(200, true);

  // --- POSITIONS ---
  mock.onGet('/org-positions').reply((config) => [200, applyMockFilters(mockPositions, config.params || {})]);
  mock.onGet(/\/org-positions\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockPositions.find(p => p.position_id === id);
    return found ? [200, found] : [404, { message: 'Position Not Found' }];
  });
  mock.onPost('/org-positions').reply(200, { success: true });
  mock.onPut(/\/org-positions\/.+/).reply(200, { success: true });
  mock.onDelete(/\/org-positions\/.+/).reply(200, true);

  // --- EMPLOYEE GROUPS ---
  mock.onGet('/org-employee-groups').reply((config) => [200, applyMockFilters(mockEmployeeGroups, config.params || {})]);
  mock.onGet(/\/org-employee-groups\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockEmployeeGroups.find((g: EmployeeGroupListItem) => g.group_id === id);
    return found ? [200, found] : [404, { message: 'Group Not Found' }];
  });
  mock.onPost('/org-employee-groups').reply(200, { success: true });
  mock.onPut(/\/org-employee-groups\/.+/).reply(200, { success: true });
  mock.onDelete(/\/org-employee-groups\/.+/).reply(200, true);

  // --- EMPLOYEES ---
  mock.onGet('/org-employees').reply((config) => [200, applyMockFilters(mockEmployees, config.params || {})]);
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

  mock.onGet('/vendors').reply((config) => [200, applyMockFilters(MOCK_VENDORS, config.params || {})]);
  mock.onGet('/employees').reply((config) => [200, applyMockFilters(mockEmployees, config.params || {})]);

  // --- CURRENCY ---
  const mockCurrencies = [
    { currency_id: '1', currency_code: 'THB', name_th: 'บาทไทย', name_en: 'Thai Baht', symbol: '฿', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_id: '2', currency_code: 'USD', name_th: 'ดอลลาร์สหรัฐ', name_en: 'US Dollar', symbol: '$', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  ];

  mock.onGet('/master-data/currencies').reply((config) => 
    [200, applyMockFilters(mockCurrencies, config.params || {})]
  );

  const mockExchangeRateTypes = [
    { currency_type_id: '1', code: 'SPOT', name_th: 'อัตราแลกเปลี่ยนทันที', name_en: 'Spot Exchange Rate', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  ];

  mock.onGet('/master-data/exchange-rate-types').reply((config) => 
    [200, applyMockFilters(mockExchangeRateTypes, config.params || {})]
  );

  const mockExchangeRates = [
    { 
        exchange_id: '1', currency_id: '1', currency_code: 'THB', currency_type_id: '1', type_name: 'อัตราขาย', 
        buy_rate: 1.0, sale_rate: 1.0, rate_date: new Date().toISOString(), remark: 'Mock', is_active: true 
    },
  ];

  mock.onGet('/master-data/exchange-rates').reply((config) => 
    [200, applyMockFilters(mockExchangeRates, config.params || {})]
  );

  logger.info('🎭 [Mock Adapter] Initialized with Centralized Routes');
};
