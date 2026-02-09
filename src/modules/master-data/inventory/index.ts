/**
 * @file inventory/index.ts
 * @description Inventory Module - Centralized exports
 * @module inventory
 */

// Services
export { WarehouseService } from './services/warehouse.service';
export { ItemMasterService } from './services/item-master.service';
export { UnitService } from './services/unit.service';
export { ProductCategoryService } from './services/product-category.service';
export { ItemTypeService } from './services/item-type.service';

// Pages are lazy loaded in App.tsx, not exported here
