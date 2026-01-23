/**
 * @file itemTypeService.ts
 * @description Service Entry Point for Item Type Module
 * Uses Factory Pattern to switch between Mock and Real API implementations
 */

import { USE_MOCK } from './api';
import type { IItemTypeService } from './interfaces/IItemTypeService';
import { MockItemTypeService } from './implementations/MockItemTypeService';
import { ItemTypeServiceImpl } from './implementations/ItemTypeServiceImpl';

const getItemTypeService = (): IItemTypeService => {
  if (USE_MOCK) {
    console.log('🔧 [ItemType Service] Using Mock Implementation');
    return new MockItemTypeService();
  }
  console.log('🔧 [ItemType Service] Using Real API Implementation');
  return new ItemTypeServiceImpl();
};

export const itemTypeService = getItemTypeService();

export default itemTypeService;

export type { ItemTypeCreateRequest, ItemTypeUpdateRequest } from './interfaces/IItemTypeService';
