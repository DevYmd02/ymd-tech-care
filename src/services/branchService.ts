/**
 * @file branchService.ts
 * @description Service Entry Point for Branch Module
 * Uses Factory Pattern to switch between Mock and Real API implementations
 */

import { USE_MOCK } from './api';
import type { IBranchService } from './interfaces/IBranchService';
import { MockBranchService } from './implementations/MockBranchService';
import { BranchServiceImpl } from './implementations/BranchServiceImpl';

const getBranchService = (): IBranchService => {
  if (USE_MOCK) {
    console.log('🔧 [Branch Service] Using Mock Implementation');
    return new MockBranchService();
  }
  console.log('🔧 [Branch Service] Using Real API Implementation');
  return new BranchServiceImpl();
};

export const branchService = getBranchService();

export default branchService;

export type { BranchCreateRequest, BranchUpdateRequest } from './interfaces/IBranchService';
