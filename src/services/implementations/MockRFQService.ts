/**
 * @file MockRFQService.ts
 * @description Mock implementation for RFQ Service
 */

import type { IRFQService } from '../interfaces/IRFQService';
import {
  MOCK_RFQS,
  MOCK_PRS
} from '../../__mocks__/procurementMocks';
import type { RFQHeader, RFQListResponse, RFQCreateData, RFQFilterCriteria } from '../../types/rfq-types';
import { logger } from '../../utils/logger';

export class MockRFQService implements IRFQService {
  private rfqs: RFQHeader[] = structuredClone(MOCK_RFQS);

  async getList(params?: RFQFilterCriteria): Promise<RFQListResponse> {
    logger.log('[MockRFQService] getList', params);
    await this.delay(300);

    // Apply filtering (mimicking server-side behavior)
    let filteredData = [...this.rfqs];

    if (params) {
      // Filter by RFQ number (partial match)
      if (params.rfq_no) {
        const searchTerm = params.rfq_no.toLowerCase();
        filteredData = filteredData.filter(r => 
          r.rfq_no.toLowerCase().includes(searchTerm)
        );
      }

      // Filter by status
      if (params.status && params.status !== 'ALL') {
        filteredData = filteredData.filter(r => r.status === params.status);
      }

      // Filter by date range
      if (params.date_from) {
        filteredData = filteredData.filter(r => r.rfq_date >= params.date_from!);
      }
      if (params.date_to) {
        filteredData = filteredData.filter(r => r.rfq_date <= params.date_to!);
      }

      // Filter by PR number (if provided)
      if (params.pr_no) {
        const prSearch = params.pr_no.toLowerCase();
        filteredData = filteredData.filter(r => 
          r.pr_no?.toLowerCase().includes(prSearch)
        );
      }

      // Filter by creator name (if provided)
      if (params.created_by_name) {
        const nameSearch = params.created_by_name.toLowerCase();
        filteredData = filteredData.filter(r => 
          r.created_by_name?.toLowerCase().includes(nameSearch)
        );
      }
    }

    return {
      data: filteredData,
      total: filteredData.length,
      page: 1,
      limit: 20
    };
  }

  async getById(id: string): Promise<RFQHeader | null> {
    logger.log('[MockRFQService] getById', id);
    await this.delay(200);
    const rfq = this.rfqs.find(r => r.rfq_id === id);
    if (!rfq) return null;
    
    // Simulate joining PR data if missing (though MOCK_RFQS usually has it)
    if (!rfq.pr_no && rfq.pr_id) {
        const pr = MOCK_PRS.find(p => p.pr_id === rfq.pr_id);
        if (pr) rfq.pr_no = pr.pr_no;
    }
    return rfq || null;
  }

  async create(data: RFQCreateData): Promise<{ success: boolean; data?: RFQHeader; message?: string }> {
    logger.log('[MockRFQService] create', data);
    await this.delay(500);
    
    const newId = `rfq-${Date.now()}`;
    const newRFQ: RFQHeader = {
        rfq_id: newId,
        rfq_no: `RFQ-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(this.rfqs.length + 1).padStart(4, '0')}`,
        pr_id: data.pr_id,
        branch_id: data.branch_id,
        rfq_date: data.rfq_date,
        quote_due_date: data.quote_due_date,
        terms_and_conditions: data.terms_and_conditions,
        status: 'DRAFT',
        created_by_user_id: 'current-user', // Mock user
        created_by_name: data.created_by_name || 'Current User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vendor_count: data.vendor_ids?.length ?? 0,
        vendor_responded: 0,
        // Optional fields
        currency: data.currency,
        exchange_rate: data.exchange_rate,
        delivery_location: data.delivery_location,
        payment_terms: data.payment_terms,
        incoterm: data.incoterm,
        remarks: data.remarks
    };

    this.rfqs = [newRFQ, ...this.rfqs];
    return { success: true, data: newRFQ };
  }

  async update(id: string, data: Partial<RFQCreateData>): Promise<{ success: boolean; message?: string }> {
    logger.log('[MockRFQService] update', id, data);
    await this.delay(300);
    const index = this.rfqs.findIndex(r => r.rfq_id === id);
    if (index === -1) return { success: false, message: 'RFQ not found' };

    this.rfqs[index] = { ...this.rfqs[index], ...data, updated_at: new Date().toISOString() };
    return { success: true };
  }

  async delete(id: string): Promise<boolean> {
    logger.log('[MockRFQService] delete', id);
    await this.delay(300);
    const initialLen = this.rfqs.length;
    this.rfqs = this.rfqs.filter(r => r.rfq_id !== id);
    return this.rfqs.length < initialLen;
  }

  async sendToVendors(rfqId: string, vendorIds: string[]): Promise<{ success: boolean; message?: string }> {
    logger.log('[MockRFQService] sendToVendors', rfqId, vendorIds);
    await this.delay(500);
    const rfq = this.rfqs.find(r => r.rfq_id === rfqId);
    if (rfq) {
        rfq.status = 'SENT';
        rfq.vendor_count = vendorIds.length;
    }
    return { success: true };
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
