/**
 * @file poService.ts
 * @description Service Entry Point for Purchase Order (PO) Module
 * Uses Factory Pattern to switch between Mock and Real API implementations
 */

import { USE_MOCK } from './api';
import type { IPOService } from './interfaces/IPOService';
import { MockPOService } from './implementations/MockPOService';
import { POServiceImpl } from './implementations/POServiceImpl';

const getPOService = (): IPOService => {
  if (USE_MOCK) {

    return new MockPOService();
  }

  return new POServiceImpl();
};

export const poService = getPOService();

export default poService;

export type {
  POListParams,
  POListResponse,
  POListItem,
  POStatus,
} from '../types/po-types';
