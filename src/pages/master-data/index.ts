/**
 * @file master-data/index.ts
 * @description Central export for all Master Data modules
 */

// Dashboard
export { default as MasterDataDashboard } from './MasterDataDashboard';

// Vendor Module
export * from './vendor/management';

// Group 1: Company
export * from './company/branch';

// Group 3: Inventory
export * from './inventory/warehouse';
export * from './inventory/category';
export * from './inventory/item-type';
export * from './inventory/unit';
export * from './inventory/item-master';
export * from './inventory/uom-conversion';
export * from './inventory/item-barcode';