/**
 * @file MockQCService.ts
 * @description Mock implementation for QC Service
 */

import type { IQCService, QCListParams, QCListResponse, QCCreateData } from '../interfaces/IQCService';
import { MOCK_QCS } from '../../__mocks__/procurementMocks';
import { logger } from '../../utils/logger';

export class MockQCService implements IQCService {
  async getList(params?: QCListParams): Promise<QCListResponse> {
    logger.log('[MockQCService] getList', params);
    await this.delay(500);

    let data = [...MOCK_QCS];

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

    return {
      data,
      total: data.length,
      page: 1,
      limit: 20,
    };
  }

  async create(data: QCCreateData): Promise<{ success: boolean; qc_id?: string; message?: string }> {
    logger.log('[MockQCService] create', data);
    await this.delay(800);

    // Simulate successful creation
    const newQCId = `qc-${Date.now()}`;
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
