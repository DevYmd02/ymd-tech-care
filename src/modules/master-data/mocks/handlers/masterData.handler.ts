import type MockAdapter from 'axios-mock-adapter';
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
import { applyMockFilters } from '@/core/api/mockUtils';
import type { FilterValue } from '@/core/api/mockUtils';
import type { 
  EmployeeGroupListItem, 
  EmployeeListItem 
} from '@/modules/master-data/types/master-data-types';

export const setupMasterDataHandlers = (mock: MockAdapter) => {
  // --- BRANCHES ---
  mock.onGet('/org-branches').reply((config) => [200, applyMockFilters(mockBranches, (config.params || {}) as Record<string, FilterValue>)]);
  mock.onGet('/org-branches/dropdown').reply(200, mockBranchDropdown);
  mock.onGet(/\/org-branches\/.+/).reply((config) => {
    const id = Number(config.url?.split('/').pop());
    const found = mockBranches.find(b => b.id === id);
    return found ? [200, found] : [404, { message: 'Branch Not Found' }];
  });

  // --- DEPARTMENTS ---
  mock.onGet('/org-departments').reply((config) => [200, applyMockFilters(mockDepartments, (config.params || {}) as Record<string, FilterValue>)]);

  // --- SECTIONS ---
  mock.onGet('/org-sections').reply((config) => [200, applyMockFilters(mockSections, (config.params || {}) as Record<string, FilterValue>)]);

  // --- JOBS ---
  mock.onGet('/org-jobs').reply((config) => [200, applyMockFilters(mockJobs, (config.params || {}) as Record<string, FilterValue>)]);

  // --- POSITIONS ---
  mock.onGet('/org-positions').reply((config) => [200, applyMockFilters(mockPositions, (config.params || {}) as Record<string, FilterValue>)]);

  // --- EMPLOYEE GROUPS ---
  mock.onGet('/employee-group').reply((config) => [200, applyMockFilters(mockEmployeeGroups, (config.params || {}) as Record<string, FilterValue>)]);
  mock.onGet(/\/employee-group\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockEmployeeGroups.find((g: EmployeeGroupListItem) => g.employee_group_id === id);
    return found ? [200, found] : [404, { message: 'Group Not Found' }];
  });

  mock.onPost('/employee-group').reply((config) => {
    const data = JSON.parse(config.data);
    
    // Duplicate Check
    const isDuplicate = mockEmployeeGroups.some(
      (g) => g.employee_group_code.toLowerCase() === data.employee_group_code?.toLowerCase()
    );

    if (isDuplicate) {
      return [400, { success: false, message: `รหัสกลุ่มพนักงาน "${data.employee_group_code}" มีอยู่ในระบบแล้ว` }];
    }

    const newGroup = {
      ...data,
      employee_group_id: Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockEmployeeGroups.push(newGroup);
    return [201, { success: true, data: newGroup }];
  });

  mock.onPatch(/\/employee-group\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const data = JSON.parse(config.data);
    const index = mockEmployeeGroups.findIndex(g => g.employee_group_id === id);
    
    if (index !== -1) {
      // Duplicate Check (excluding current record)
      if (data.employee_group_code) {
        const isDuplicate = mockEmployeeGroups.some(
          (g) => g.employee_group_id !== id && g.employee_group_code.toLowerCase() === data.employee_group_code.toLowerCase()
        );

        if (isDuplicate) {
          return [400, { success: false, message: `รหัสกลุ่มพนักงาน "${data.employee_group_code}" มีอยู่ในระบบแล้ว` }];
        }
      }

      Object.assign(mockEmployeeGroups[index], { ...data, updated_at: new Date().toISOString() });
      return [200, { success: true, data: mockEmployeeGroups[index] }];
    }
    return [404, { message: 'Not Found' }];
  });

  mock.onDelete(/\/employee-group\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const index = mockEmployeeGroups.findIndex(g => g.employee_group_id === id);
    if (index !== -1) {
      mockEmployeeGroups.splice(index, 1);
      return [200, { success: true }];
    }
    return [404, { message: 'Not Found' }];
  });


  // --- EMPLOYEES ---
  mock.onGet('/org-employees').reply((config) => [200, applyMockFilters(mockEmployees, (config.params || {}) as Record<string, FilterValue>)]);
  mock.onGet(/\/org-employees\/.+/).reply((config) => {
    const id = Number(config.url?.split('/').pop());
    const found = mockEmployees.find((e: EmployeeListItem) => e.id === id);
    return found ? [200, found] : [404, { message: 'Employee Not Found' }];
  });

  // --- SALES AREA (/employee-sale-area) ---
  mock.onGet('/employee-sale-area').reply((config) => [200, applyMockFilters(mockSalesZones, (config.params || {}) as Record<string, FilterValue>)]);
  mock.onGet(/\/employee-sale-area\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockSalesZones.find(z => z.sale_area_id === id);
    return found ? [200, found] : [404, { message: 'Sale Area Not Found' }];
  });

  mock.onPost('/employee-sale-area').reply((config) => {
    const data = JSON.parse(config.data);
    const newItem = {
      ...data,
      sale_area_id: Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockSalesZones.push(newItem);
    return [201, { success: true, data: newItem }];
  });

  mock.onPut(/\/employee-sale-area\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const data = JSON.parse(config.data);
    const index = mockSalesZones.findIndex(z => z.sale_area_id === id);
    if (index !== -1) {
      Object.assign(mockSalesZones[index], { ...data, updated_at: new Date().toISOString() });
      return [200, { success: true, data: mockSalesZones[index] }];
    }
    return [404, { message: 'Not Found' }];
  });

  mock.onDelete(/\/employee-sale-area\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const index = mockSalesZones.findIndex(z => z.sale_area_id === id);
    if (index !== -1) {
      mockSalesZones.splice(index, 1);
      return [200, { success: true }];
    }
    return [404, { message: 'Not Found' }];
  });

  // --- SALES CHANNEL (/employee-sale-channel) ---
  mock.onGet('/employee-sale-channel').reply((config) => [200, applyMockFilters(mockSalesChannels, (config.params || {}) as Record<string, FilterValue>)]);
  mock.onGet(/\/employee-sale-channel\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockSalesChannels.find(c => c.channel_id === id);
    return found ? [200, found] : [404, { message: 'Sale Channel Not Found' }];
  });

  mock.onPost('/employee-sale-channel').reply((config) => {
    const data = JSON.parse(config.data);
    const newItem = {
      ...data,
      channel_id: Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockSalesChannels.push(newItem);
    return [201, { success: true, data: newItem }];
  });

  mock.onPut(/\/employee-sale-channel\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const data = JSON.parse(config.data);
    const index = mockSalesChannels.findIndex(c => c.channel_id === id);
    if (index !== -1) {
      Object.assign(mockSalesChannels[index], { ...data, updated_at: new Date().toISOString() });
      return [200, { success: true, data: mockSalesChannels[index] }];
    }
    return [404, { message: 'Not Found' }];
  });

  mock.onDelete(/\/employee-sale-channel\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const index = mockSalesChannels.findIndex(c => c.channel_id === id);
    if (index !== -1) {
      mockSalesChannels.splice(index, 1);
      return [200, { success: true }];
    }
    return [404, { message: 'Not Found' }];
  });

  // --- SALES LEGACY (/master/sales-*) ---
  mock.onGet('/master/sales-zones').reply((config) => [200, applyMockFilters(mockSalesZones, (config.params || {}) as Record<string, FilterValue>)]);
  mock.onGet('/master/sales-channels').reply((config) => [200, applyMockFilters(mockSalesChannels, (config.params || {}) as Record<string, FilterValue>)]);
  mock.onGet('/master/sales-targets').reply((config) => {
      const result = applyMockFilters(mockSalesTargets, (config.params || {}) as Record<string, FilterValue>);
      const items = Array.isArray(result) ? result : (result as { items: unknown[] }).items || [];
      return [200, {
          items,
          total: items.length,
          page: 1,
          limit: 10
      }];
  });

  // --- CURRENCY ---
  const mockCurrencies = [
    { currency_id: '1', currency_code: 'THB', currency_name: 'บาทไทย', currency_nameeng: 'Thai Baht', symbol: '฿', exchange_rate: 1, is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_id: '2', currency_code: 'USD', currency_name: 'ดอลลาร์สหรัฐ', currency_nameeng: 'US Dollar', symbol: '$', exchange_rate: 35.5, is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_id: '3', currency_code: 'EUR', currency_name: 'ยูโร', currency_nameeng: 'Euro', symbol: '€', exchange_rate: 38.2, is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_id: '4', currency_code: 'JPY', currency_name: 'เยนญี่ปุ่น', currency_nameeng: 'Japanese Yen', symbol: '¥', exchange_rate: 0.24, is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  ];

  mock.onGet('/master-data/currency').reply((config) => {
    const result = applyMockFilters(mockCurrencies, (config.params || {}) as Record<string, FilterValue>);
    if (result && typeof result === 'object' && 'items' in result) {
      return [200, result];
    }
    return [200, { items: result, total: (result as unknown[]).length, page: 1, limit: 100 }];
  });

  mock.onGet(/\/master-data\/currency\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const found = mockCurrencies.find(c => c.currency_id === id);
    return found ? [200, found] : [404, { message: 'Currency Not Found' }];
  });

  mock.onPost('/master-data/currency').reply((config) => {
    const data = JSON.parse(config.data);
    const newCurrency = {
      ...data,
      currency_id: String(mockCurrencies.length + 1),
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString()
    };
    mockCurrencies.push(newCurrency);
    return [201, { success: true, item: newCurrency }];
  });

  mock.onPut(/\/master-data\/currency\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const data = JSON.parse(config.data);
    const index = mockCurrencies.findIndex(c => c.currency_id === id);
    if (index !== -1) {
      Object.assign(mockCurrencies[index], { ...data, updated_at: new Date().toISOString() });
      return [200, { success: true, item: mockCurrencies[index] }];
    }
    return [404, { message: 'Not Found' }];
  });

  mock.onDelete(/\/master-data\/currency\/.+/).reply((config) => {
    const id = config.url?.split('/').pop();
    const index = mockCurrencies.findIndex(c => c.currency_id === id);
    if (index !== -1) {
      mockCurrencies.splice(index, 1);
      return [200, { success: true }];
    }
    return [404, { message: 'Not Found' }];
  });

  const mockExchangeRateTypes = [
    { currency_type_id: '1', code: 'SPOT', name_th: 'อัตราแลกเปลี่ยนทันที', name_en: 'Spot Exchange Rate', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  ];

  mock.onGet('/master-data/exchange-rate-type').reply((config) => 
    [200, applyMockFilters(mockExchangeRateTypes, (config.params || {}) as Record<string, FilterValue>)]
  );

  // --- EXCHANGE RATES ---
  const mockExchangeRates = [
    { exchange_id: '1', currency_id: '1', currency_type_id: '1', buy_rate: 1, sale_rate: 1, rate_date: '2026-02-17', exchange_round: 2, allow_adjust: 1, is_active: true },
    { exchange_id: '2', currency_id: '2', currency_type_id: '1', buy_rate: 35.5, sale_rate: 35.8, rate_date: '2026-02-17', exchange_round: 2, allow_adjust: 1, is_active: true },
  ];

  mock.onGet('/master-data/exchange-rate').reply((config) => {
    try {
      const joinedRates = mockExchangeRates.map(rate => {
        const currency = mockCurrencies.find(c => c.currency_id === rate.currency_id);
        const type = mockExchangeRateTypes.find(t => t.currency_type_id === rate.currency_type_id);
        return {
          ...rate,
          currency_code: currency?.currency_code || 'N/A',
          type_name: type?.name_en || 'N/A'
        };
      });
      return [200, applyMockFilters(joinedRates, (config.params || {}) as Record<string, FilterValue>)];
    } catch (error) {
      console.error('[Mock] Error in GET /master-data/exchange-rates:', error);
      return [500, { message: 'Internal Server Error in Mock Handler' }];
    }
  });

  mock.onGet(/\/master-data\/exchange-rate\/latest/).reply((config) => {
      const params = config.params || {};
      const currencyId = params.currency_id;
      
      let rate = 1;
      if (currencyId === 'USD') rate = 35.5;
      else if (currencyId === 'EUR') rate = 38.2;
      else if (currencyId === 'JPY') rate = 0.24;
      else if (currencyId === 'CNY') rate = 4.9;
      else if (currencyId === 'THB') rate = 1;
      
      return [200, {
          rate,
          currency_id: currencyId,
          date: params.rate_date || new Date().toISOString().split('T')[0],
          source: 'System Rate'
      }];
  });
};
