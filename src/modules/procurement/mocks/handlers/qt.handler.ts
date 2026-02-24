import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { MOCK_QTS } from '../data/qtData';
import { MOCK_RFQS, MOCK_RFQ_VENDORS } from '../data/rfqData';
import { applyMockFilters, sanitizeId } from '@/core/api/mockUtils';

export const setupQTHandlers = (mock: MockAdapter) => {
  // 1. GET QT List
  mock.onGet('/qt').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    // Sanitizer Layer for List (Sanitize BEFORE filtering)
    const sanitizedData = MOCK_QTS.map(qt => ({
        ...qt,
        quotation_id: sanitizeId(qt.quotation_id),
        qc_id: sanitizeId(qt.qc_id),
        vendor_id: sanitizeId(qt.vendor_id),
    }));

    const result = applyMockFilters(sanitizedData, params, {
        searchableFields: ['quotation_no', 'vendor_name', 'rfq_no', 'pr_no'],
        dateField: 'quotation_date'
    });

    return [200, result];
  });

  // 2. GET QT Detail
  mock.onGet(/\/qt\/(?!.*\/send).+/).reply((config: AxiosRequestConfig) => {
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

  // 3. POST Create QT (Integrates with RFQ State Machine)
  mock.onPost('/qt').reply((config: AxiosRequestConfig) => {
    const body = config.data ? JSON.parse(config.data) : {};
    
    const newQT = {
      ...body,
      quotation_id: `qt-${Date.now()}`,
      quotation_no: body.quotation_no || `QT-2026-${String(MOCK_QTS.length + 1).padStart(4, '0')}`,
      status: body.status || 'DRAFT',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    MOCK_QTS.unshift(newQT);

    // --- STATE MACHINE TRIGGER: IF QT IS LINKED TO RFQ ---
    if (body.rfq_id && body.vendor_id) {
        const rfqIndex = MOCK_RFQS.findIndex(r => r.rfq_id === body.rfq_id);
        if (rfqIndex !== -1) {
            // Update the specific vendor's status to REPLIED
            const vendorIndex = MOCK_RFQ_VENDORS.findIndex(v => v.rfq_id === body.rfq_id && v.vendor_id === body.vendor_id);
            if (vendorIndex !== -1) {
                MOCK_RFQ_VENDORS[vendorIndex].status = 'RESPONDED';
                MOCK_RFQ_VENDORS[vendorIndex].response_date = new Date().toISOString();
            }

            // Recalculate response count
            const relatedVendors = MOCK_RFQ_VENDORS.filter(v => v.rfq_id === body.rfq_id);
            const respondedCount = relatedVendors.filter(v => v.status === 'RESPONDED' || v.status === 'DECLINED').length;
            MOCK_RFQS[rfqIndex].responded_vendors_count = respondedCount;

            // Trigger State Transition
            if (MOCK_RFQS[rfqIndex].status === 'SENT' && respondedCount > 0) {
                MOCK_RFQS[rfqIndex].status = 'IN_PROGRESS';
            }
            MOCK_RFQS[rfqIndex].updated_at = new Date().toISOString();
        }
    }

    return [201, { success: true, data: newQT }];
  });
};
