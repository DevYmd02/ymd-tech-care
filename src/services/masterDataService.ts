/**
 * @file masterDataService.ts
 * @description Service Entry Point for Master Data Module
 * Uses Factory Pattern to switch between Mock and Real API implementations
 */

import { USE_MOCK } from './api';
import type { IMasterDataService } from './interfaces/IMasterDataService';
import { MockMasterDataService } from './implementations/MockMasterDataService';
import { MasterDataServiceImpl } from './implementations/MasterDataServiceImpl';

const getMasterDataService = (): IMasterDataService => {
    if (USE_MOCK) {

        return new MockMasterDataService();
    }

    return new MasterDataServiceImpl();
};

export const masterDataService = getMasterDataService();

export default masterDataService;
