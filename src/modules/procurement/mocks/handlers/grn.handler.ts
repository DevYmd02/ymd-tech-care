import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { MOCK_GRNS } from '../data/grnData';
import { applyMockFilters, sanitizeId } from '@/core/api/mockUtils';

export const setupGRNHandlers = (mock: MockAdapter) => {
  // 1. GET GRN List
  mock.onGet('/procurement/grn').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    const filtered = [...MOCK_GRNS];
    
    // Sanitizer Layer for List
    const sanitized = filtered.map(grn => ({
        ...grn,
        grn_id: sanitizeId(grn.grn_id),
        po_id: sanitizeId(grn.po_id),
        warehouse_id: sanitizeId(grn.warehouse_id),
        received_by: sanitizeId(grn.received_by),
    }));

    return [200, applyMockFilters(sanitized, params)];
  });

  // 2. GET GRN Detail
  mock.onGet(/\/procurement\/grn\/.+/).reply((config: AxiosRequestConfig) => {
    const urlParts = config.url?.split('/') || [];
    const id = sanitizeId(urlParts[urlParts.length - 1]);
    
    // Special case for summary-status
    if (id === 'summary-status') {
        const summary = MOCK_GRNS.reduce((acc: Record<string, number>, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, { DRAFT: 0, POSTED: 0, REVERSED: 0, RETURNED: 0 });
        return [200, summary];
    }

    const found = MOCK_GRNS.find(g => sanitizeId(g.grn_id) === id);
    if (found) {
        const sanitized = {
            ...found,
            grn_id: sanitizeId(found.grn_id),
            po_id: sanitizeId(found.po_id),
            warehouse_id: sanitizeId(found.warehouse_id),
            received_by: sanitizeId(found.received_by),
        };
        return [200, sanitized];
    }
    return [404, { message: 'GRN Not Found' }];
  });
};
