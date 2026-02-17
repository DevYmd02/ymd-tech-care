import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { MOCK_RFQS } from '../data/rfqData';
import { applyMockFilters, sanitizeId } from '@/core/api/mockUtils';
import type { RFQHeader, RFQLine } from '@/modules/procurement/types/rfq-types';

export const setupRFQHandlers = (mock: MockAdapter) => {
  // 1. GET RFQ List
  mock.onGet('/rfq').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    // Sanitizer Layer for List (Sanitize BEFORE filtering)
    const sanitizedData = MOCK_RFQS.map(rfq => ({
        ...rfq,
        rfq_id: sanitizeId(rfq.rfq_id),
        pr_id: sanitizeId(rfq.pr_id ?? ''),
        branch_id: sanitizeId(rfq.branch_id ?? ''),
    }));

    const result = applyMockFilters(sanitizedData, params, {
        searchableFields: ['rfq_no'],
        dateField: 'rfq_date'
    });

    return [200, result];
  });

  // 2. GET RFQ Detail
  mock.onGet(/\/rfq\/.+/).reply((config: AxiosRequestConfig) => {
    const id = sanitizeId(config.url?.split('/').pop());
    const found = MOCK_RFQS.find(r => sanitizeId(r.rfq_id) === id);
    
    // Local interface to handle potential lines property
    interface RFQWithLines extends RFQHeader {
        lines?: RFQLine[];
    }

    if (found) {
        const rfqWithLines = found as RFQWithLines;
        
        const responseData = {
            ...found,
            rfq_id: sanitizeId(found.rfq_id),
            pr_id: sanitizeId(found.pr_id ?? ''),
            branch_id: sanitizeId(found.branch_id ?? ''),
            lines: (rfqWithLines.lines || []).map((line: RFQLine) => ({
                ...line,
                rfq_line_id: sanitizeId(line.rfq_line_id),
                rfq_id: sanitizeId(line.rfq_id),
                pr_line_id: sanitizeId(line.pr_line_id ?? ''),
                item_id: sanitizeId(line.item_id ?? ''),
            }))
        };
        return [200, responseData];
    }
    return [404, { message: 'RFQ Not Found' }];
  });
};

