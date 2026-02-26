import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { MOCK_VQS } from '../data/vqData';
import { MOCK_RFQS, MOCK_RFQ_VENDORS } from '../data/rfqData';
import { applyMockFilters, sanitizeId } from '@/core/api/mockUtils';

export const setupVQHandlers = (mock: MockAdapter) => {
  // 1. GET VQ List
  mock.onGet('/vq').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    
    // Custom mapping for filter keys that don't match mock fields
    if (params.ref_rfq_no) {
      params.rfq_no = params.ref_rfq_no;
      delete params.ref_rfq_no;
    }
    if (params.ref_pr_no) {
      params.pr_no = params.ref_pr_no;
      delete params.ref_pr_no;
    }

    // Sanitizer Layer for List (Sanitize BEFORE filtering)
    const sanitizedData = MOCK_VQS.map(qt => ({
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

  // 2. GET VQ Detail
  mock.onGet(/\/vq\/(?!.*\/send).+/).reply((config: AxiosRequestConfig) => {
    const id = sanitizeId(config.url?.split('/').pop());
    const found = MOCK_VQS.find(q => sanitizeId(q.quotation_id) === id);
    
    if (found) {
        const sanitized = {
            ...found,
            quotation_id: sanitizeId(found.quotation_id),
            qc_id: sanitizeId(found.qc_id),
            vendor_id: sanitizeId(found.vendor_id),
        };
        return [200, sanitized];
    }
    return [404, { message: 'Vendor Quotation Not Found' }];
  });

  // 3. POST Create VQ (Integrates with RFQ State Machine)
  mock.onPost('/vq').reply((config: AxiosRequestConfig) => {
    const body = config.data ? JSON.parse(config.data) : {};
    
    const newVQ = {
      ...body,
      quotation_id: `vq-${Date.now()}`,
      quotation_no: body.quotation_no || `VQ-2026-${String(MOCK_VQS.length + 1).padStart(4, '0')}`,
      status: body.status || 'DRAFT',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    MOCK_VQS.unshift(newVQ);

    // --- STATE MACHINE TRIGGER: IF VQ IS LINKED TO RFQ ---
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

    return [201, { success: true, data: newVQ }];
  });
};