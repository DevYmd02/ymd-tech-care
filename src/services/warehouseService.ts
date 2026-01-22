/**
 * @file warehouseService.ts
 * @description Service Entry Point for Warehouse Module
 * Uses Factory Pattern to switch between Mock and Real API implementations
 */

import { USE_MOCK } from './api';
import type { IWarehouseService } from './interfaces/IWarehouseService';
import { MockWarehouseService } from './implementations/MockWarehouseService';
import { WarehouseServiceImpl } from './implementations/WarehouseServiceImpl';

const getWarehouseService = (): IWarehouseService => {
  if (USE_MOCK) {
    console.log('🔧 [Warehouse Service] Using Mock Implementation');
    return new MockWarehouseService();
  }
  console.log('🔧 [Warehouse Service] Using Real API Implementation');
  return new WarehouseServiceImpl();
};

export const warehouseService = getWarehouseService();

export default warehouseService;

export type { WarehouseCreateRequest, WarehouseUpdateRequest } from './interfaces/IWarehouseService';
