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