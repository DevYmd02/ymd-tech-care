import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { MOCK_RFQS, MOCK_RFQ_VENDORS, VENDOR_POOL } from '../data/rfqData';
import { applyMockFilters, sanitizeId } from '@/core/api/mockUtils';
import type { RFQHeader, RFQLine } from '@/modules/procurement/types';

export const setupRFQHandlers = (mock: MockAdapter) => {
  // 1. GET RFQ List
  mock.onGet('/rfq').reply((config: AxiosRequestConfig) => {
    const params = config.params || {};
    
    // Custom mapping for filter keys that don't match mock fields
    if (params.creator_name) {
      params.created_by_name = params.creator_name;
      delete params.creator_name;
    }
    
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
    const foundIndex = MOCK_RFQS.findIndex(r => sanitizeId(r.rfq_id) === id);
    if (foundIndex !== -1) {
      const body = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};
      const vendorIds: string[] = body.vendor_ids || [];
      
      // FIX: State Synchronization.
      MOCK_RFQS[foundIndex].status = 'SENT';
      
      // Increment sent count (Logic change: X/Y is sent progress)
      const currentSentCount = MOCK_RFQS[foundIndex].sent_vendors_count || 0;
      MOCK_RFQS[foundIndex].sent_vendors_count = currentSentCount + vendorIds.length;
      
      MOCK_RFQS[foundIndex].updated_at = new Date().toISOString();

      // Update junction table for these vendors
      vendorIds.forEach(vId => {
          const vIndex = MOCK_RFQ_VENDORS.findIndex(v => v.rfq_id === id && v.vendor_id === vId);
          if (vIndex !== -1) {
              MOCK_RFQ_VENDORS[vIndex].status = 'SENT';
              MOCK_RFQ_VENDORS[vIndex].sent_date = new Date().toISOString();
          }
      });

      return [200, {
        success: true,
        message: `RFQ ${MOCK_RFQS[foundIndex].rfq_no} sent to ${vendorIds.length} vendor(s)`,
        data: { ...MOCK_RFQS[foundIndex] }
      }];
    }
    return [404, { message: 'RFQ Not Found' }];
  });

  // 4. POST Create RFQ (new)
  mock.onPost('/rfq').reply((config: AxiosRequestConfig) => {
    const body = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};
    const vendorIds: string[] = (body.vendor_ids as string[]) || [];
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
      sent_vendors_count: 0,
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
      const body = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};
      const targetRFQ = MOCK_RFQS[foundIndex];

      // Mutate in-memory: persist status and vendor_count changes
      if (body.status) {
        targetRFQ.status = body.status;
      }
      
      // SYNC VENDORS: If vendor_ids is provided, update the junction table
      if (body.vendor_ids && Array.isArray(body.vendor_ids)) {
        targetRFQ.vendor_count = body.vendor_ids.length;
        
        // 1. Remove existing vendors for this RFQ
        const otherVendors = MOCK_RFQ_VENDORS.filter(v => sanitizeId(v.rfq_id) !== id);
        
        // 2. Create new vendor entries with robust lookup
        const newVendorEntries = body.vendor_ids.map((vId: string, index: number) => {
          // Robust match: case-insensitive and dash-resilient
          const cleanId = vId.replace(/-/g, '').toLowerCase();
          const poolVendor = VENDOR_POOL.find(p => 
            p.id.replace(/-/g, '').toLowerCase() === cleanId || 
            p.code.replace(/-/g, '').toLowerCase() === cleanId
          );

          return {
            rfq_vendor_id: `rv-${id}-${index + 1}`,
            rfq_id: targetRFQ.rfq_id,
            vendor_id: poolVendor?.id || vId,
            sent_date: null,
            sent_via: 'EMAIL',
            email_sent_to: poolVendor?.email || null,
            response_date: null,
            status: 'PENDING',
            remark: null,
            vendor_name: poolVendor?.name || vId,
            vendor_code: poolVendor?.code || vId,
          };
        });

        // 3. Update the global mock array
        MOCK_RFQ_VENDORS.length = 0;
        MOCK_RFQ_VENDORS.push(...otherVendors, ...newVendorEntries);
      }

      targetRFQ.updated_at = new Date().toISOString();

      return [200, { success: true, message: `RFQ ${targetRFQ.rfq_no} updated`, data: { ...targetRFQ } }];
    }
    return [404, { message: 'RFQ Not Found' }];
  });

  // 6. POST Vendor Response (Auto-Transition Logic)
  mock.onPost(/\/rfq\/.+\/vendor-response/).reply((config: AxiosRequestConfig) => {
    const urlParts = config.url?.split('/') || [];
    const id = sanitizeId(urlParts[urlParts.length - 2]); // ID before '/vendor-response'
    
    const rfqIndex = MOCK_RFQS.findIndex(r => sanitizeId(r.rfq_id) === id);
    if (rfqIndex === -1) return [404, { message: 'RFQ Not Found' }];
    
    const body = config.data ? JSON.parse(config.data) : {};
    const vendorId = body.vendor_id;
    const responseStatus = body.response_status; // 'RESPONDED' | 'DECLINED'
    
    if (!vendorId || !responseStatus) {
        return [400, { message: 'Missing vendor_id or response_status' }];
    }

    // 1. Find and update the vendor in MOCK_RFQ_VENDORS
    const vendorIndex = MOCK_RFQ_VENDORS.findIndex(v => v.rfq_id === id && v.vendor_id === vendorId);
    if (vendorIndex !== -1) {
        MOCK_RFQ_VENDORS[vendorIndex].status = responseStatus;
        MOCK_RFQ_VENDORS[vendorIndex].response_date = new Date().toISOString();
    }

    // 2. Recalculate responded vendors count
    const relatedVendors = MOCK_RFQ_VENDORS.filter(v => v.rfq_id === id);
    const respondedCount = relatedVendors.filter(v => v.status === 'RESPONDED' || v.status === 'DECLINED').length;
    
    MOCK_RFQS[rfqIndex].responded_vendors_count = respondedCount;

    // 3. State Machine Trigger: SENT -> IN_PROGRESS
    if (MOCK_RFQS[rfqIndex].status === 'SENT' && respondedCount > 0) {
        MOCK_RFQS[rfqIndex].status = 'IN_PROGRESS';
    }
    
    MOCK_RFQS[rfqIndex].updated_at = new Date().toISOString();

    return [200, { 
        success: true, 
        message: `Vendor response recorded`, 
        data: { ...MOCK_RFQS[rfqIndex] } 
    }];
  });
  // 7. POST Vendor Decline (Explicit Decline Action)
  mock.onPost(/\/rfq\/.+\/vendor\/.+\/decline/).reply((config: AxiosRequestConfig) => {
    const urlParts = config.url?.split('/') || [];
    const vendorId = sanitizeId(urlParts.pop()); // Last is vendor
    const id = sanitizeId(urlParts[urlParts.length - 2]); // ID before /vendor
    
    const rfqIndex = MOCK_RFQS.findIndex(r => sanitizeId(r.rfq_id) === id);
    if (rfqIndex === -1) return [404, { message: 'RFQ Not Found' }];

    // 1. Find and update the vendor
    const vendorIndex = MOCK_RFQ_VENDORS.findIndex(v => v.rfq_id === id && v.vendor_id === vendorId);
    if (vendorIndex !== -1) {
        MOCK_RFQ_VENDORS[vendorIndex].status = 'DECLINED';
        MOCK_RFQ_VENDORS[vendorIndex].response_date = new Date().toISOString();
    }

    // 2. Recalculate responded vendors count
    const relatedVendors = MOCK_RFQ_VENDORS.filter(v => v.rfq_id === id);
    const respondedCount = relatedVendors.filter(v => v.status === 'RESPONDED' || v.status === 'DECLINED').length;
    MOCK_RFQS[rfqIndex].responded_vendors_count = respondedCount;

    // 3. State Machine Trigger: SENT -> IN_PROGRESS
    if (MOCK_RFQS[rfqIndex].status === 'SENT' && respondedCount > 0) {
        MOCK_RFQS[rfqIndex].status = 'IN_PROGRESS';
    }
    
    MOCK_RFQS[rfqIndex].updated_at = new Date().toISOString();

    return [200, { 
        success: true, 
        message: `Vendor declined`, 
        data: { ...MOCK_RFQS[rfqIndex] } 
    }];
  });
};
