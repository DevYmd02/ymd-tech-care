import MockAdapter from 'axios-mock-adapter';
import type { AxiosInstance } from 'axios';
import { logger } from '@/shared/utils/logger';

// Import Modular Handlers
import { setupAuthHandlers } from '@/modules/auth/mocks/handlers/auth.handler';
import { setupMasterDataHandlers } from '@/modules/master-data/mocks/handlers/masterData.handler';
import { setupPRHandlers } from '@/modules/procurement/mocks/handlers/pr.handler';
import { setupRFQHandlers } from '@/modules/procurement/mocks/handlers/rfq.handler';
import { setupPOHandlers } from '@/modules/procurement/mocks/handlers/po.handler';
import { setupPRTHandlers } from '@/modules/procurement/mocks/handlers/prt.handler';
import { setupVQHandlers } from '@/modules/procurement/mocks/handlers/vq.handler';
import { setupQCHandlers } from '@/modules/procurement/mocks/handlers/qc.handler';
import { setupGRNHandlers } from '@/modules/procurement/mocks/handlers/grn.handler';
import { setupCustomerHandlers } from '@/modules/master-data/customer/mocks/handlers/customer.handler';

/**
 * Setup Centralized Mocks Registry
 * This file acts as a dispatcher, loading domain-specific handlers.
 */
export const setupMocks = (axiosInstance: AxiosInstance) => {
  // 1. The Master Toggle: Check environment variable
  const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

  if (!USE_MOCK) {
    logger.info('🚫 [MockAdapter] Mocks are DISABLED via VITE_USE_MOCK');
    return;
  }

  logger.info('🎭 [MockAdapter] Initializing Modular Mock System...');

  const mock = new MockAdapter(axiosInstance, { 
    delayResponse: 500,
    onNoMatch: 'passthrough' // Allow real API calls if mock not found
  });

  // 2. Initialize Domain Handlers
  try {
    setupAuthHandlers(mock);
    setupMasterDataHandlers(mock);
    setupPRHandlers(mock);
    setupRFQHandlers(mock);
    setupVQHandlers(mock);
    setupQCHandlers(mock);
    setupPOHandlers(mock);
    setupGRNHandlers(mock);
    setupPRTHandlers(mock);
    setupCustomerHandlers(mock);

    logger.info('✅ [MockAdapter] All Modular Handlers Registered Successfully');
  } catch (error) {
    logger.error('❌ [MockAdapter] Failed to initialize modular mocks:', error);
  }
};
