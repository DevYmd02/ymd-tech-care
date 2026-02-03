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

    return new MockItemTypeService();
  }

  return new ItemTypeServiceImpl();
};

export const itemTypeService = getItemTypeService();

export default itemTypeService;

export type { ItemTypeCreateRequest, ItemTypeUpdateRequest } from './interfaces/IItemTypeService';
