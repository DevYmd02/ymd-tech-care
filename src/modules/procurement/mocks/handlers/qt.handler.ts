import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { MOCK_QTS } from '../data/qtData';
import { applyMockFilters, sanitizeId } from '@/core/api/mockUtils';

export const setupQTHandlers = (mock: MockAdapter) => {
  // 1. GET QT List
  mock.onGet('/qt').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    const filtered = [...MOCK_QTS];
    
    // Sanitizer Layer for List
    const sanitized = filtered.map(qt => ({
        ...qt,
        quotation_id: sanitizeId(qt.quotation_id),
        qc_id: sanitizeId(qt.qc_id),
        vendor_id: sanitizeId(qt.vendor_id),
    }));

    return [200, applyMockFilters(sanitized, params)];
  });

  // 2. GET QT Detail
  mock.onGet(/\/qt\/.+/).reply((config: AxiosRequestConfig) => {
    const id = sanitizeId(config.url?.split('/').pop());
    const found = MOCK_QTS.find(q => sanitizeId(q.quotation_id) === id);
    
    if (found) {
        const sanitized = {
            ...found,
            quotation_id: sanitizeId(found.quotation_id),
            qc_id: sanitizeId(found.qc_id),
            vendor_id: sanitizeId(found.vendor_id),
        };
        return [200, sanitized];
    }
    return [404, { message: 'Quotation Not Found' }];
  });
};
