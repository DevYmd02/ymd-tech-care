/**
 * @file vendorService.ts
 * @description Service Entry Point for Vendor Module
 * Uses Factory Pattern to switch between Mock and Real API implementations
 */

import { USE_MOCK } from './api';
import type { IVendorService } from './interfaces/IVendorService';
import { MockVendorService } from './implementations/MockVendorService';
import { VendorServiceImpl } from './implementations/VendorServiceImpl';

const getVendorService = (): IVendorService => {
    if (USE_MOCK) {
        console.log('🔧 [Vendor Service] Using Mock Implementation');
        return new MockVendorService();
    }
    console.log('🔧 [Vendor Service] Using Real API Implementation');
    return new VendorServiceImpl();
};

export const vendorService = getVendorService();

export default vendorService;

export type {
    VendorListParams,
    VendorListResponse,
    VendorCreateRequest,
    VendorResponse,
    VendorDropdownItem,
} from '../types/vendor-types';
