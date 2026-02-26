import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { MOCK_QCS } from '../data/qcData';
import { applyMockFilters, sanitizeId } from '@/core/api/mockUtils';

export const setupQCHandlers = (mock: MockAdapter) => {
  // 1. GET QC List
  mock.onGet('/qc').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    // Sanitizer Layer for List (Sanitize BEFORE filtering)
    const sanitizedData = MOCK_QCS.map(qc => ({
        ...qc,
        qc_id: sanitizeId(qc.qc_id),
        pr_id: sanitizeId(qc.pr_id),
        lowest_bidder_vendor_id: sanitizeId(qc.lowest_bidder_vendor_id),
    }));

    const result = applyMockFilters(sanitizedData, params, {
        searchableFields: ['qc_no', 'pr_no', 'lowest_bidder_name'], 
        // dateField: 'created_at' // QC might typically not be date-filtered or use created_at if available
    });

    return [200, result];
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

  // 3. POST QC Comparison (Status Transition: DRAFT -> WAITING_FOR_PO)
  mock.onPost(/\/qc\/compare\/.+/).reply((config: AxiosRequestConfig) => {
    const id = sanitizeId(config.url?.split('/').pop());
    const found = MOCK_QCS.find(q => sanitizeId(q.qc_id) === id);
    
    if (found) {
        found.status = 'WAITING_FOR_PO';
        return [200, { success: true }];
    }
    return [404, { message: 'QC Not Found' }];
  });
};
