import type MockAdapter from 'axios-mock-adapter';
import { MOCK_PRT_DATA, MOCK_PRT_ITEMS } from '../data/prtData';
import type { PurchaseReturn, PrtLineItem } from '@/modules/procurement/types/prt/prt-types';
import { applyMockFilters, sanitizeId } from '@/core/api/mockUtils';

export const setupPRTHandlers = (mock: MockAdapter) => {
  // 1. GET PRT List
  mock.onGet('/prt').reply((config) => {
    const params = config.params || {};
    let filtered = [...MOCK_PRT_DATA];
    
    if (params.prt_no) {
       filtered = filtered.filter((p: PurchaseReturn) => p.prt_no.toLowerCase().includes(String(params.prt_no).toLowerCase()));
    }
    if (params.vendor_name) {
       filtered = filtered.filter((p: PurchaseReturn) => p.vendor_name.toLowerCase().includes(String(params.vendor_name).toLowerCase()));
    }
    if (params.status && params.status !== 'ALL') {
       filtered = filtered.filter((p: PurchaseReturn) => p.status === params.status);
    }

    // Sanitizer Layer for List
    const sanitized = filtered.map(prt => ({
        ...prt,
        prt_id: sanitizeId(prt.prt_id),
        vendor_id: sanitizeId(prt.vendor_id),
        ref_grn_id: sanitizeId(prt.ref_grn_id),
    }));

    return [200, applyMockFilters(sanitized, params)];
  });

  // 2. GET PRT Detail
  mock.onGet(/\/prt\/.+/).reply((config) => {
    const id = sanitizeId(config.url?.split('/').pop());
    const found = MOCK_PRT_DATA.find((p: PurchaseReturn) => sanitizeId(p.prt_id) === id);
    
    if (found) {
        const sanitized = {
            ...found,
            prt_id: sanitizeId(found.prt_id),
            vendor_id: sanitizeId(found.vendor_id),
            ref_grn_id: sanitizeId(found.ref_grn_id),
            items: (found.items || []).map(item => ({
                ...item,
                item_id: sanitizeId(item.item_id),
                // Add other nested IDs if they exist in types
            }))
        };
        return [200, sanitized];
    }
    return [404, { message: 'PRT Not Found' }];
  });

  // 3. POST Create PRT
  mock.onPost('/prt').reply((config) => {
      const data = JSON.parse(config.data) as Partial<PurchaseReturn>;
      const newPRT: PurchaseReturn = {
          ...MOCK_PRT_DATA[0], // fallback template
          ...data as PurchaseReturn, // simplified casting for mock
          prt_id: `prt-${Date.now()}`,
          prt_no: `PRT-MOCK-${Date.now()}`,
          status: 'DRAFT',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: (data.items || []).map((item: PrtLineItem) => ({
              ...item,
              item_id: sanitizeId(item.item_id),
          }))
      };
      MOCK_PRT_DATA.unshift(newPRT);
      return [200, newPRT];
  });

  // 4. GET PRT Items
  mock.onGet('/prt-items').reply(200, MOCK_PRT_ITEMS.map(item => ({
      ...item,
      id: sanitizeId(item.id),
  })));
};
