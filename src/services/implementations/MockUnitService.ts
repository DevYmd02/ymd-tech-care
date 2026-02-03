/**
 * @file MockUnitService.ts
 * @description Mock implementation for Unit Service
 */

import type { IUnitService, UnitCreateRequest, UnitUpdateRequest } from '../interfaces/IUnitService';
import { mockUnits } from '@/__mocks__/masterDataMocks';
import type { UnitListItem } from '@project-types/master-data-types';
import { logger } from '@utils/logger';

export class MockUnitService implements IUnitService {
  async getList(): Promise<UnitListItem[]> {
    logger.log('[MockUnitService] getList');
    await this.delay(200);
    return mockUnits;
  }

  async getById(id: string): Promise<UnitListItem | null> {
    logger.log('[MockUnitService] getById', id);
    await this.delay(150);
    return mockUnits.find(u => u.unit_id === id) || null;
  }

  async create(data: UnitCreateRequest): Promise<{ success: boolean; message?: string }> {
    logger.log('[MockUnitService] create', data);
    await this.delay(200);
    return { success: true, message: 'Created (mock)' };
  }

  async update(data: UnitUpdateRequest): Promise<{ success: boolean; message?: string }> {
    logger.log('[MockUnitService] update', data);
    await this.delay(200);
    return { success: true, message: 'Updated (mock)' };
  }

  async delete(id: string): Promise<boolean> {
    logger.log('[MockUnitService] delete', id);
    await this.delay(150);
    return true;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
