/**
 * @file index.ts
 * @description Barrel export สำหรับ Services
 * 
 * @note Services รองรับทั้ง Mock Data และ Real API
 * ควบคุมโดย VITE_USE_MOCK ใน .env
 */

// =============================================================================
// API & CONFIG
// =============================================================================

export { default as api, USE_MOCK, API_BASE_URL, logApiMode } from './api';

// =============================================================================
// SERVICES
// =============================================================================

// Core Services
export { prService } from './prService';
export { vendorService } from './vendorService';
export { rfqService } from './rfqService';

// Master Data Services
export { branchService } from './branchService';
export { warehouseService } from './warehouseService';
export { unitService } from './unitService';
export { productCategoryService } from './productCategoryService';
export { itemTypeService } from './itemTypeService';

// =============================================================================
// TYPES RE-EXPORT
// =============================================================================

// PR Types
export type { PRHeader, PRLine, PRFormData, PRStatus } from '../types/pr-types';

// Vendor Types
export type { VendorMaster, VendorListItem, VendorFormData } from '../types/vendor-types';

// RFQ Types
export type { RFQHeader, RFQLine, RFQVendor, RFQStatus } from '../types/rfq-types';

// Master Data Types
export type {
  BranchListItem,
  BranchDropdownItem,
  WarehouseListItem,
  ProductCategoryListItem,
  ItemTypeListItem,
  UnitListItem,
} from '../types/master-data-types';
