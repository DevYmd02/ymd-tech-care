/**
 * @file rfqService.ts
 * @description Service Entry Point for RFQ Module
 * Uses Factory Pattern to switch between Mock and Real API implementations
 *
 * @usage
 * ```typescript
 * import rfqService from '@/services/rfqService';
 *
 * // The service automatically uses Mock or Real API based on VITE_USE_MOCK env variable
 * const rfqs = await rfqService.getList();
 * ```
 */

import { USE_MOCK } from './api';
import type { IRFQService } from './interfaces/IRFQService';
import { MockRFQService } from './implementations/MockRFQService';
import { RFQServiceImpl } from './implementations/RFQServiceImpl';

/**
 * Factory function to select the appropriate RFQ service implementation
 * @returns IRFQService instance (Mock or Real API)
 */
const getRFQService = (): IRFQService => {
  if (USE_MOCK) {

    return new MockRFQService();
  }

  return new RFQServiceImpl();
};

/**
 * RFQ Service Instance
 * Automatically switches between Mock and Real API based on environment configuration
 */
export const rfqService = getRFQService();

export default rfqService;
