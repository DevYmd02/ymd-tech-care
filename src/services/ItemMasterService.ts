/**
 * @file ItemMasterService.ts
 * @description Service Entry Point for Item Master Module
 * Uses Factory Pattern to switch between Mock and Real API implementations
 */

import { USE_MOCK } from './api';
import type { IItemMasterService } from './interfaces/IItemMasterService';
import { MockItemMasterService } from './implementations/MockItemMasterService';
import { ItemMasterServiceImpl } from './implementations/ItemMasterServiceImpl';

const getItemMasterService = (): IItemMasterService => {
    if (USE_MOCK) {
        return new MockItemMasterService();
    }
    return new ItemMasterServiceImpl();
};

export const ItemMasterService = getItemMasterService();
