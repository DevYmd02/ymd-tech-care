import type MockAdapter from 'axios-mock-adapter';
import type { AxiosRequestConfig } from 'axios';
import { MOCK_QCS } from '@/modules/procurement/mocks/data/qcData';
import { MOCK_VQS } from '@/modules/procurement/mocks/data/vqData';
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
    }));

    const result = applyMockFilters(sanitizedData, params, {
        searchableFields: ['qc_no', 'pr_no', 'lowest_bidder_name'], 
        // dateField: 'created_at' // QC might typically not be date-filtered or use created_at if available
    });

    return [200, result];
  });

  // 1.5 GET QCs Ready for PO
  mock.onGet('/qc/ready-for-po').reply(() => {
    // We only want QCs that are COMPLETED (Winner chosen)
    let readyQCs = MOCK_QCS.filter(qc => qc.status === 'COMPLETED');
    
    // In our mock, if MOCK_POS contains a PO with this qc_id, it is already converted
    import('@/modules/procurement/mocks/data/poData').then(({ MOCK_POS }) => {
      const activePoQcIds = new Set(MOCK_POS.map(po => po.qc_id).filter(id => id));
      readyQCs = readyQCs.filter(qc => !activePoQcIds.has(qc.qc_id));
    });

    const sanitizedData = readyQCs.map(qc => ({
        ...qc,
        qc_id: sanitizeId(qc.qc_id),
        pr_id: sanitizeId(qc.pr_id),
    }));

    return [200, { data: sanitizedData, total: sanitizedData.length }];
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
            action_by: 1, action_date: '2026-02-25T10:00:00Z'
        };
        return [200, sanitized];
    }
    return [404, { message: 'QC Not Found' }];
  });

  // 3. POST QC Comparison (Status Transition: DRAFT -> COMPLETED)
  mock.onPost(/\/qc\/compare\/.+/).reply((config: AxiosRequestConfig) => {
    const id = sanitizeId(config.url?.split('/').pop());
    const found = MOCK_QCS.find(q => sanitizeId(q.qc_id) === id);
    
    if (found) {
        found.status = 'COMPLETED';
        return [200, { success: true }];
    }
    return [404, { message: 'QC Not Found' }];
  });

  // 3.5 POST QC Submit Winner (QC-only mutation: assigns winner + caches display info)
  mock.onPost(/\/qc\/submit-winner\/.+/).reply((config: AxiosRequestConfig) => {
    const id = sanitizeId(config.url?.split('/').pop());
    const found = MOCK_QCS.find(q => sanitizeId(q.qc_id) === id);
    const body = config.data ? JSON.parse(config.data as string) : {};

    if(!body.winning_vq_id) return [400, { message: 'Missing winning_vq_id in payload'}];
    if(!found) return [404, { message: 'QC Not Found' }];

    // --- QC-Only Mutations ---
    found.status = 'COMPLETED';
    found.winning_vq_id = sanitizeId(body.winning_vq_id);

    // Read-only lookup: cache winner display info on the QC document for list-page speed
    const targetVQ = MOCK_VQS.find(vq => sanitizeId(vq.quotation_id) === found.winning_vq_id);
    if (targetVQ) {
        found.lowest_price = targetVQ.total_amount || 0;
        found.lowest_bidder_name = targetVQ.vendor_name || '';
        found.winning_vendor_id = targetVQ.vendor_id; // Added for the Smart Intercept Hydration
    }

    return [200, { success: true, qc_id: found.qc_id }];
  });

  // 4. POST Create QC
  mock.onPost('/qc').reply((config: AxiosRequestConfig) => {
    const body = config.data ? JSON.parse(config.data) : {};

    if (!body.rfq_no && !body.pr_no) {
      return [400, { message: 'rfq_no or pr_no is required to create a QC', success: false }];
    }

    const now = new Date();
    const prefix = `QC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const maxSeq = MOCK_QCS
      .filter(q => q.qc_no?.startsWith(prefix))
      .reduce((max, q) => {
        const seq = parseInt(q.qc_no?.split('-').pop() || '0', 10);
        return seq > max ? seq : max;
      }, 0);

    const newQC = {
      qc_id:              Date.now(),
      qc_no:              `${prefix}-${String(maxSeq + 1).padStart(4, '0')}`,
      pr_id:              sanitizeId(body.pr_id || ''),
      action_by: 2, action_date: '2026-02-26T14:30:00Z',
      pr_no:              body.pr_no || '',
      rfq_no:             body.rfq_no || '',
      created_at:         now.toISOString().split('T')[0],
      status:             'DRAFT' as const,
      vendor_count:       (body.vendor_lines ?? []).length,
      lowest_bidder_name: '',
      lowest_price:       0,
      remark:             body.remark || '',
    };

    MOCK_QCS.unshift(newQC);
    return [201, { qc_id: newQC.qc_id }];
  });

  // 5. POST Cancel QC (DRAFT → CANCELLED)
  mock.onPost(/\/qc\/.+\/cancel/).reply((config: AxiosRequestConfig) => {
    const id = sanitizeId(config.url?.split('/')[2]);
    const found = MOCK_QCS.find(q => sanitizeId(q.qc_id) === id);
    if (!found) return [404, { message: 'QC Not Found' }];
    if (found.status === 'COMPLETED') {
      return [422, { message: 'Cannot cancel a COMPLETED QC' }];
    }
    found.status = 'CANCELLED';
    return [200, { success: true, message: `QC ${found.qc_no} ยกเลิกเรียบร้อย` }];
  });
};
