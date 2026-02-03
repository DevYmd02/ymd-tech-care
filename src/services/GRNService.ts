/**
 * @file GRNService.ts
 * @description Service Entry Point for GRN Module
 */

import { USE_MOCK } from './api';
import type { IGRNService } from './interfaces/IGRNService';
import { MockGRNService } from './implementations/MockGRNService';
import { GRNServiceImpl } from './implementations/GRNServiceImpl';

const getGRNService = (): IGRNService => {
  if (USE_MOCK) {
    return new MockGRNService();
  }

  return new GRNServiceImpl();
};

export const grnService = getGRNService();

export default grnService;
