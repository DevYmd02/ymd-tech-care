/**
 * @file master-data/index.ts
 * @description Central export for all Master Data modules
 */

// Dashboard
export { default as MasterDataDashboard } from './MasterDataDashboard';

// Vendor Module
export * from './vendor';

// Branch Module
export * from './branch';

// Warehouse Module
export * from './warehouse';

// Product Category Module
export * from './product-category';

// Item Type Module
export * from './item-type';

// Unit Module
export * from './unit';

// Item Master Module
export * from './item-master';

// UOM Conversion Module
export * from './uom-conversion';

// Item Barcode Module
export * from './item-barcode';