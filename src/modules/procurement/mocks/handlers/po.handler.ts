import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { MOCK_POS } from '../data/poData';
import { applyMockFilters, sanitizeId } from '@/core/api/mockUtils';
import type { POListItem, POLine } from '@/modules/procurement/types/po-types';

export const setupPOHandlers = (mock: MockAdapter) => {
  // 1. GET PO List
  mock.onGet('/purchase-orders').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    // Sanitizer Layer for List (Sanitize BEFORE filtering)
    const sanitizedData = MOCK_POS.map(po => ({
        ...po,
        po_id: sanitizeId(po.po_id),
        pr_id: sanitizeId(po.pr_id),
        vendor_id: sanitizeId(po.vendor_id),
        branch_id: sanitizeId(po.branch_id),
    }));

    const result = applyMockFilters(sanitizedData, params, {
        searchableFields: ['po_no', 'vendor_name'],
        dateField: 'po_date'
    });

    return [200, result];
  });

  // 2. GET PO Detail
  mock.onGet(/\/purchase-orders\/.+/).reply((config: AxiosRequestConfig) => {
    const id = sanitizeId(config.url?.split('/').pop());
    const found = MOCK_POS.find(p => sanitizeId(p.po_id) === id);
    
    // Local interface to handle potential lines property
    interface POWithLines extends POListItem {
        lines?: POLine[];
    }

    if (found) {
        const poWithLines = found as POWithLines;
        const sanitized = {
            ...found,
            po_id: sanitizeId(found.po_id),
            pr_id: sanitizeId(found.pr_id),
            vendor_id: sanitizeId(found.vendor_id),
            branch_id: sanitizeId(found.branch_id),
            lines: (poWithLines.lines || []).map((line: POLine) => ({
                ...line,
                po_line_id: sanitizeId(line.po_line_id),
                po_id: sanitizeId(line.po_id),
                pr_line_id: sanitizeId(line.pr_line_id),
                item_id: sanitizeId(line.item_id),
            }))
        };
        return [200, sanitized];
    }
    return [404, { message: 'PO Not Found' }];
  });
};
