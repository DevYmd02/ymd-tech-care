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
  mock.onGet('/org-employee-groups').reply((config) => [200, applyMockFilters(mockEmployeeGroups, (config.params || {}) as Record<string, FilterValue>)]);
  mock.onGet(/\/org-employee-groups\/.+/).reply((config) => {
    const id = Number(config.url?.split('/').pop());
    const found = mockEmployeeGroups.find((g: EmployeeGroupListItem) => g.id === id);
    return found ? [200, found] : [404, { message: 'Group Not Found' }];
  });

  // --- EMPLOYEES ---
  mock.onGet('/org-employees').reply((config) => [200, applyMockFilters(mockEmployees, (config.params || {}) as Record<string, FilterValue>)]);
  mock.onGet(/\/org-employees\/.+/).reply((config) => {
    const id = Number(config.url?.split('/').pop());
    const found = mockEmployees.find((e: EmployeeListItem) => e.id === id);
    return found ? [200, found] : [404, { message: 'Employee Not Found' }];
  });

  // --- SALES ---
  mock.onGet('/org-sales-zones').reply(200, mockSalesZones);
  mock.onGet('/org-sales-channels').reply(200, mockSalesChannels);
  mock.onGet('/org-sales-targets').reply(200, mockSalesTargets);

  // --- CURRENCY ---
  const mockCurrencies = [
    { currency_id: '1', currency_code: 'THB', name_th: 'บาทไทย', name_en: 'Thai Baht', symbol: '฿', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_id: '2', currency_code: 'USD', name_th: 'ดอลลาร์สหรัฐ', name_en: 'US Dollar', symbol: '$', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_id: '3', currency_code: 'EUR', name_th: 'ยูโร', name_en: 'Euro', symbol: '€', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { currency_id: '4', currency_code: 'JPY', name_th: 'เยนญี่ปุ่น', name_en: 'Japanese Yen', symbol: '¥', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
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
