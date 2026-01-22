/**
 * @file prService.ts
 * @description Service Entry Point for PR Module
 * Uses Factory Pattern to switch between Mock and Real API implementations
 */

import { USE_MOCK } from './api';
import type { IPRService } from './interfaces/IPRService';
import { MockPRService } from './implementations/MockPRService';
import { PRServiceImpl } from './implementations/PRServiceImpl';

const getPRService = (): IPRService => {
  if (USE_MOCK) {
    console.log('🔧 [PR Service] Using Mock Implementation');
    return new MockPRService();
  }
  console.log('🔧 [PR Service] Using Real API Implementation');
  return new PRServiceImpl();
};

export const prService = getPRService();

export default prService;

export type {
  PRListParams,
  PRListResponse,
  SubmitPRRequest,
  ApprovalRequest,
  ApprovalResponse,
  ConvertPRRequest,
} from './interfaces/IPRService';
