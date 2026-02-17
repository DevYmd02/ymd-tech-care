import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { MOCK_QCS } from '../data/qcData';
import { applyMockFilters, sanitizeId } from '@/core/api/mockUtils';

export const setupQCHandlers = (mock: MockAdapter) => {
  // 1. GET QC List
  mock.onGet('/qc').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    const filtered = [...MOCK_QCS];
    
    // Sanitizer Layer for List
    const sanitized = filtered.map(qc => ({
        ...qc,
        qc_id: sanitizeId(qc.qc_id),
        pr_id: sanitizeId(qc.pr_id),
        lowest_bidder_vendor_id: sanitizeId(qc.lowest_bidder_vendor_id),
    }));

    return [200, applyMockFilters(sanitized, params)];
  });

  // 2. GET QC Detail
  mock.onGet(/\/qc\/.+/).reply((config: AxiosRequestConfig) => {
    const id = sanitizeId(config.url?.split('/').pop());
    const found = MOCK_QCS.find(q => sanitizeId(q.qc_id) === id);
    
    if (found) {
        const sanitized = {
            ...found,
            qc_id: sanitizeId(found.qc_id),
            pr_id: sanitizeId(found.pr_id),
            lowest_bidder_vendor_id: sanitizeId(found.lowest_bidder_vendor_id),
        };
        return [200, sanitized];
    }
    return [404, { message: 'QC Not Found' }];
  });
};
