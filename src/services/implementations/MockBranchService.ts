/**
 * @file MockBranchService.ts
 * @description Mock implementation for Branch Service
 */

import type { IBranchService, BranchCreateRequest, BranchUpdateRequest } from '../interfaces/IBranchService';
import { mockBranches, mockBranchDropdown } from '../../__mocks__/masterDataMocks';
import type { BranchListItem, BranchDropdownItem } from '../../types/master-data-types';
import { logger } from '../../utils/logger';

export class MockBranchService implements IBranchService {
  async getList(): Promise<BranchListItem[]> {
    logger.log('[MockBranchService] getList');
    await this.delay(200);
    return mockBranches;
  }

  async getDropdown(): Promise<BranchDropdownItem[]> {
    logger.log('[MockBranchService] getDropdown');
    await this.delay(150);
    return mockBranchDropdown;
  }

  async getById(id: string): Promise<BranchListItem | null> {
    logger.log('[MockBranchService] getById', id);
    await this.delay(150);
    return mockBranches.find(b => b.branch_id === id) || null;
  }

  async create(data: BranchCreateRequest): Promise<{ success: boolean; message?: string }> {
    logger.log('[MockBranchService] create', data);
    await this.delay(200);
    return { success: true, message: 'Created (mock)' };
  }

  async update(data: BranchUpdateRequest): Promise<{ success: boolean; message?: string }> {
    logger.log('[MockBranchService] update', data);
    await this.delay(200);
    return { success: true, message: 'Updated (mock)' };
  }

  async delete(id: string): Promise<boolean> {
    logger.log('[MockBranchService] delete', id);
    await this.delay(150);
    return true;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
