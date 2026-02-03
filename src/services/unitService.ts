/**
 * @file unitService.ts
 * @description Service Entry Point for Unit Module
 * Uses Factory Pattern to switch between Mock and Real API implementations
 */

import { USE_MOCK } from './api';
import type { IUnitService } from './interfaces/IUnitService';
import { MockUnitService } from './implementations/MockUnitService';
import { UnitServiceImpl } from './implementations/UnitServiceImpl';

const getUnitService = (): IUnitService => {
  if (USE_MOCK) {

    return new MockUnitService();
  }

  return new UnitServiceImpl();
};

export const unitService = getUnitService();

export default unitService;

export type { UnitCreateRequest, UnitUpdateRequest } from './interfaces/IUnitService';
