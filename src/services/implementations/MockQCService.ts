/**
 * @file MockQCService.ts
 * @description Mock implementation for QC Service
 * @refactored Enforce immutable state management with structuredClone
 */

import type { IQCService, QCListParams, QCListResponse, QCCreateData } from '../interfaces/IQCService';
import { MOCK_QCS } from '../../__mocks__/procurementMocks';
import { logger } from '../../utils/logger';
import type { QCListItem } from '../../types/qc-types';

export class MockQCService implements IQCService {
  private qcs: QCListItem[]; 

  constructor() {
    this.qcs = structuredClone(MOCK_QCS) as unknown as QCListItem[];
  }

  async getList(params?: QCListParams): Promise<QCListResponse> {
    logger.log('[MockQCService] getList', params);
    await this.delay(500);

    let data = this.qcs;

    if (params) {
      if (params.qc_no) {
        data = data.filter(item => item.qc_no.toLowerCase().includes(params.qc_no!.toLowerCase()));
      }
      if (params.pr_no) {
        data = data.filter(item => item.pr_no?.toLowerCase().includes(params.pr_no!.toLowerCase()));
      }
      if (params.status && params.status !== 'ALL') {
        data = data.filter(item => item.status.toLowerCase() === params.status!.toLowerCase());
      }
      if (params.date_from) {
        data = data.filter(item => item.created_at >= params.date_from!);
      }
      if (params.date_to) {
        data = data.filter(item => item.created_at <= params.date_to!);
      }
    }

    // Pagination logic
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      data: structuredClone(paginatedData),
      total: data.length,
      page,
      limit,
    };
  }

  async create(data: QCCreateData): Promise<{ success: boolean; qc_id?: string; message?: string }> {
    logger.log('[MockQCService] create', data);
    await this.delay(800);

    const newQCId = `qc-${Date.now()}`;
    const newQC = {
        qc_id: newQCId,
        qc_no: `QC-${new Date().getFullYear()}-${String(this.qcs.length + 1).padStart(4, '0')}`,
        pr_id: 'pr-temp-id', // Placeholder as create data doesn't have it
        vendor_count: data.vendor_lines?.length || 0,
        ...data,
        status: 'WAITING_FOR_PO' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // Cast to QCListItem to allow excess properties (like vendor_lines) to persist in runtime mock store
    this.qcs.unshift(structuredClone(newQC) as unknown as QCListItem);

    return {
      success: true,
      qc_id: newQCId,
      message: 'บันทึกใบเปรียบเทียบราคาสำเร็จ',
    };
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
