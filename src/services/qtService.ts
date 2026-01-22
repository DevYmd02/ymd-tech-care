/**
 * @file qtService.ts
 * @description Service Entry Point for QT Module
 * Uses Factory Pattern to switch between Mock and Real API implementations
 */

import { USE_MOCK } from './api';
import type { IQTService } from './interfaces/IQTService';
import { MockQTService } from './implementations/MockQTService';
import { QTServiceImpl } from './implementations/QTServiceImpl';

const getQTService = (): IQTService => {
    if (USE_MOCK) {
        console.log('🔧 [QT Service] Using Mock Implementation');
        return new MockQTService();
    }
    console.log('🔧 [QT Service] Using Real API Implementation');
    return new QTServiceImpl();
};

export const qtService = getQTService();

export default qtService;

export type { QTListParams, QTListResponse, QTCreateData } from './interfaces/IQTService';
