import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { MOCK_RFQS, MOCK_RFQ_VENDORS } from '../data/rfqData';
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

  // 2. GET RFQ Detail (embeds vendors from junction table)
  mock.onGet(/\/rfq\/(?!.*\/send).+/).reply((config: AxiosRequestConfig) => {
    const id = sanitizeId(config.url?.split('/').pop());
    const found = MOCK_RFQS.find(r => sanitizeId(r.rfq_id) === id);
    
    // Local interface to handle potential lines property
    interface RFQWithLines extends RFQHeader {
        lines?: RFQLine[];
    }

    if (found) {
        const rfqWithLines = found as RFQWithLines;
        
        // Embed vendors from mock junction table
        const vendors = MOCK_RFQ_VENDORS.filter(v => v.rfq_id === found.rfq_id);
        
        const responseData = {
            ...found,
            rfq_id: sanitizeId(found.rfq_id),
            pr_id: sanitizeId(found.pr_id ?? ''),
            branch_id: sanitizeId(found.branch_id ?? ''),
            vendors, // Embedded vendor data for Pre-flight modal
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

  // 3. POST Send RFQ to Vendors (/rfq/:id/send)
  mock.onPost(/\/rfq\/.+\/send/).reply((config: AxiosRequestConfig) => {
    const urlParts = config.url?.split('/') || [];
    const id = sanitizeId(urlParts[urlParts.length - 2]); // ID is before '/send'
    const found = MOCK_RFQS.find(r => sanitizeId(r.rfq_id) === id);
    if (found) {
      const body = config.data ? JSON.parse(config.data) : {};
      const vendorIds: string[] = body.vendor_ids || [];
      return [200, {
        success: true,
        message: `RFQ ${found.rfq_no} sent to ${vendorIds.length} vendor(s)`,
        data: { ...found, status: 'SENT' }
      }];
    }
    return [404, { message: 'RFQ Not Found' }];
  });

  // 4. POST Create RFQ (new)
  mock.onPost('/rfq').reply((config: AxiosRequestConfig) => {
    const body = config.data ? JSON.parse(config.data) : {};
    const vendorIds: string[] = body.vendor_ids || [];
    const newRFQ = {
      rfq_id: `rfq-${Date.now()}`,
      rfq_no: body.rfq_no || `RFQ-${new Date().getFullYear()}-${String(MOCK_RFQS.length + 1).padStart(4, '0')}`,
      rfq_date: body.rfq_date || new Date().toISOString().split('T')[0],
      pr_id: body.pr_id || null,
      pr_no: body.pr_no || null,
      branch_id: body.branch_id || null,
      branch_name: body.branch_name || '',
      status: 'DRAFT' as const,
      vendor_count: vendorIds.length,
      responded_vendors_count: 0,
      purpose: body.purpose || '',
      quote_due_date: body.quote_due_date || null,
      created_by_name: body.created_by_name || 'Admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies RFQHeader;
    MOCK_RFQS.unshift(newRFQ);
    return [201, { success: true, data: newRFQ }];
  });

  // 5. PUT RFQ Update (Edit DRAFT: sync vendor_count + status)
  mock.onPut(/\/rfq\/.+/).reply((config: AxiosRequestConfig) => {
    const id = sanitizeId(config.url?.split('/').pop());
    const foundIndex = MOCK_RFQS.findIndex(r => sanitizeId(r.rfq_id) === id);
    if (foundIndex !== -1) {
      const body = config.data ? JSON.parse(config.data) : {};

      // Mutate in-memory: persist status and vendor_count changes
      if (body.status) {
        MOCK_RFQS[foundIndex].status = body.status;
      }
      if (body.vendor_ids) {
        MOCK_RFQS[foundIndex].vendor_count = body.vendor_ids.length;
      }
      MOCK_RFQS[foundIndex].updated_at = new Date().toISOString();

      return [200, { success: true, message: `RFQ ${MOCK_RFQS[foundIndex].rfq_no} updated`, data: { ...MOCK_RFQS[foundIndex] } }];
    }
    return [404, { message: 'RFQ Not Found' }];
  });
};
