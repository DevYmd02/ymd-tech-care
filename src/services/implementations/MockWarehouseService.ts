/**
 * @file MockWarehouseService.ts
 * @description Mock implementation for Warehouse Service
 */

import type { IWarehouseService, WarehouseCreateRequest, WarehouseUpdateRequest } from '../interfaces/IWarehouseService';
import { mockWarehouses } from '@/__mocks__/masterDataMocks';
import type { WarehouseListItem } from '@project-types/master-data-types';
import { logger } from '@utils/logger';

export class MockWarehouseService implements IWarehouseService {
  async getList(): Promise<WarehouseListItem[]> {
    logger.log('[MockWarehouseService] getList');
    await this.delay(200);
    return mockWarehouses;
  }

  async getById(id: string): Promise<WarehouseListItem | null> {
    logger.log('[MockWarehouseService] getById', id);
    await this.delay(150);
    return mockWarehouses.find(w => w.warehouse_id === id) || null;
  }

  async create(data: WarehouseCreateRequest): Promise<{ success: boolean; message?: string }> {
    logger.log('[MockWarehouseService] create', data);
    await this.delay(200);
    return { success: true, message: 'Created (mock)' };
  }

  async update(data: WarehouseUpdateRequest): Promise<{ success: boolean; message?: string }> {
    logger.log('[MockWarehouseService] update', data);
    await this.delay(200);
    return { success: true, message: 'Updated (mock)' };
  }

  async delete(id: string): Promise<boolean> {
    logger.log('[MockWarehouseService] delete', id);
    await this.delay(150);
    return true;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
