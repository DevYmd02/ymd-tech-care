/**
 * @file MockQTService.ts
 * @description Mock implementation for QT Service
 */

import type { IQTService, QTListParams, QTListResponse, QTCreateData } from '../interfaces/IQTService';
import { MOCK_QTS } from '../../__mocks__/procurementMocks';
import type { QTListItem } from '../../types/qt-types';
import { logger } from '../../utils/logger';

export class MockQTService implements IQTService {
  private qts: QTListItem[] = [...MOCK_QTS];

  async getList(params?: QTListParams): Promise<QTListResponse> {
    logger.log('[MockQTService] getList', params);
    await this.delay(500);

    let data = [...this.qts];

    if (params) {
      if (params.quotation_no) {
        data = data.filter(item => item.quotation_no.toLowerCase().includes(params.quotation_no!.toLowerCase()));
      }
      if (params.vendor_name) {
        data = data.filter(item =>
          (item.vendor_name || '').toLowerCase().includes(params.vendor_name!.toLowerCase()) ||
          (item.vendor_code || '').toLowerCase().includes(params.vendor_name!.toLowerCase())
        );
      }
      if (params.rfq_no) {
        data = data.filter(item => (item.rfq_no || '').toLowerCase().includes(params.rfq_no!.toLowerCase()));
      }
      if (params.status && params.status !== 'ALL') {
        data = data.filter(item => item.status === params.status);
      }
      if (params.date_from) {
        data = data.filter(item => item.quotation_date >= params.date_from!);
      }
      if (params.date_to) {
        data = data.filter(item => item.quotation_date <= params.date_to!);
      }
    }

    return {
      data,
      total: data.length,
      page: 1,
      limit: 20,
    };
  }

  async create(data: QTCreateData): Promise<void> {
    logger.log('[MockQTService] create', data);
    await this.delay(800);

    const newItem = {
      ...data,
      quotation_id: `qt-${Date.now()}`,
      vendor_code: 'V-MOCK',
      vendor_name: 'Vendor Mock',
      status: 'SUBMITTED',
    } as QTListItem;
    this.qts = [newItem, ...this.qts];
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
