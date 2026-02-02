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
export { prService } from './PRService';
export { vendorService } from './VendorService';
export { rfqService } from './RFQService';
export { qtService } from './QTService';
export { qcService } from './QCService';

// Master Data Services
export { branchService } from './BranchService';
export { warehouseService } from './WarehouseService';
export { unitService } from './UnitService';
export { productCategoryService } from './ProductCategoryService';
export { itemTypeService } from './ItemTypeService';
export { masterDataService } from './MasterDataService';