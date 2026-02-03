/**
 * @file qcService.ts
 * @description Service Entry Point for QC Module
 * Uses Factory Pattern to switch between Mock and Real API implementations
 */

import { USE_MOCK } from './api';
import type { IQCService } from './interfaces/IQCService';
import { MockQCService } from './implementations/MockQCService';
import { QCServiceImpl } from './implementations/QCServiceImpl';

const getQCService = (): IQCService => {
    if (USE_MOCK) {

        return new MockQCService();
    }

    return new QCServiceImpl();
};

export const qcService = getQCService();

export default qcService;

export type { QCListParams, QCListResponse } from './interfaces/IQCService';