/**
 * @file MockItemTypeService.ts
 * @description Mock implementation for Item Type Service
 */

import type { IItemTypeService, ItemTypeCreateRequest, ItemTypeUpdateRequest } from '../interfaces/IItemTypeService';
import { mockItemTypes } from '@/__mocks__/masterDataMocks';
import type { ItemTypeListItem } from '@project-types/master-data-types';
import { logger } from '@utils/logger';

export class MockItemTypeService implements IItemTypeService {
  async getList(): Promise<ItemTypeListItem[]> {
    logger.log('[MockItemTypeService] getList');
    await this.delay(200);
    return mockItemTypes;
  }

  async getById(id: string): Promise<ItemTypeListItem | null> {
    return mockItemTypes.find(t => t.item_type_id === id) || null;
  }

  async create(data: ItemTypeCreateRequest): Promise<{ success: boolean; message?: string }> {
    logger.log('[MockItemTypeService] create', data);
    await this.delay(200);
    return { success: true, message: 'Created (mock)' };
  }

  async update(data: ItemTypeUpdateRequest): Promise<{ success: boolean; message?: string }> {
    logger.log('[MockItemTypeService] update', data);
    await this.delay(200);
    return { success: true, message: 'Updated (mock)' };
  }

  async delete(id: string): Promise<boolean> {
    logger.log('[MockItemTypeService] delete', id);
    await this.delay(150);
    return true;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
